"""Camera capture and frame preprocessing for edge deployment."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

import cv2
import numpy as np

from backend.utils.config import CameraConfig
from backend.utils.config import project_root


@dataclass
class FramePacket:
    """Container for a captured frame and camera metadata."""

    camera_id: str
    frame: np.ndarray
    timestamp: float


class CameraStream:
    """Continuously capture frames from one camera or video source."""

    def __init__(self, source: int | str, config: CameraConfig, camera_id: str | None = None) -> None:
        """Initialize a camera stream without opening it yet."""

        self.source = source
        self.config = config
        self.camera_id = camera_id or str(source)
        self.capture: cv2.VideoCapture | None = None
        self.latest: FramePacket | None = None
        self.running = False
        self.lock = threading.Lock()
        self.thread: threading.Thread | None = None

    def start(self) -> None:
        """Start capture in a background thread."""

        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        """Stop capture and release the camera."""

        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.capture:
            self.capture.release()

    def read(self) -> FramePacket | None:
        """Return the latest captured frame packet."""

        with self.lock:
            return self.latest

    def _open(self) -> None:
        """Open the configured camera source."""

        self.capture = cv2.VideoCapture(self.source)
        self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.config.width)
        self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config.height)
        self.capture.set(cv2.CAP_PROP_FPS, self.config.fps)

    def _loop(self) -> None:
        """Capture frames forever, reconnecting when the source drops."""

        self._open()
        target_delay = 1.0 / max(self.config.fps, 1)
        while self.running:
            if self.capture is None or not self.capture.isOpened():
                time.sleep(self.config.auto_reconnect_seconds)
                self._open()
                continue

            ok, frame = self.capture.read()
            if not ok:
                self.capture.release()
                time.sleep(self.config.auto_reconnect_seconds)
                self._open()
                continue

            processed = self._preprocess(frame)
            with self.lock:
                self.latest = FramePacket(self.camera_id, processed, time.time())
            time.sleep(target_delay)

    def _preprocess(self, frame: np.ndarray) -> np.ndarray:
        """Resize frames and optionally improve low-light visibility."""

        frame = cv2.resize(frame, (self.config.width, self.config.height))
        if not self.config.lighting_enhancement:
            return frame
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        lightness, a_channel, b_channel = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(lightness)
        return cv2.cvtColor(cv2.merge((enhanced, a_channel, b_channel)), cv2.COLOR_LAB2BGR)


class CameraManager:
    """Manage multiple camera streams."""

    def __init__(self, config: CameraConfig) -> None:
        """Create streams for every configured source."""

        self.streams = [
            CameraStream(self._resolve_source(source), config, camera_id=f"camera_{index}")
            for index, source in enumerate(config.sources)
        ]

    def start_all(self) -> None:
        """Start every configured camera stream."""

        for stream in self.streams:
            stream.start()

    def stop_all(self) -> None:
        """Stop every configured camera stream."""

        for stream in self.streams:
            stream.stop()

    def latest_frames(self) -> list[FramePacket]:
        """Return the latest available frame from every camera."""

        return [packet for stream in self.streams if (packet := stream.read()) is not None]

    def _resolve_source(self, source: int | str) -> int | str:
        """Resolve relative video paths against the backend package root."""

        if isinstance(source, int):
            return source
        path = project_root() / source
        return str(path) if not source.startswith(("rtsp://", "http://", "https://", "/")) else source

