"""YOLOv11/ONNX detector abstraction with a mock fallback for development."""

from __future__ import annotations

import math
import time
from pathlib import Path
from typing import Protocol

import cv2
import numpy as np

from backend.models.schemas import BoundingBox, Detection
from backend.utils.config import DetectionConfig, project_root


class Detector(Protocol):
    """Protocol implemented by all detector backends."""

    def infer(self, frame: np.ndarray) -> list[Detection]:
        """Run detection on a BGR frame."""


class MockDetector:
    """Synthetic detector that makes the backend usable without trained weights."""

    def __init__(self, config: DetectionConfig) -> None:
        """Create deterministic moving mock detections."""

        self.config = config
        self.start_time = time.time()
        self.mock_classes = ["screwdriver", "spanner", "toolbox", "human_hand"]

    def infer(self, frame: np.ndarray) -> list[Detection]:
        """Return synthetic moving tools for smoke tests and UI development."""

        height, width = frame.shape[:2]
        elapsed = time.time() - self.start_time
        detections: list[Detection] = []
        for index, class_name in enumerate(self.mock_classes):
            phase = elapsed + index * 1.7
            x = int((width * 0.15) + (math.sin(phase) + 1) * width * 0.25 + index * 35)
            y = int((height * 0.18) + (math.cos(phase * 0.8) + 1) * height * 0.18 + index * 18)
            box_w, box_h = 90, 55
            detections.append(
                Detection(
                    bbox=BoundingBox(
                        x1=max(0, x),
                        y1=max(0, y),
                        x2=min(width - 1, x + box_w),
                        y2=min(height - 1, y + box_h),
                    ),
                    class_name=class_name,
                    confidence=0.82,
                )
            )
        return detections


class OnnxYoloDetector:
    """ONNX Runtime detector for exported YOLOv11 models."""

    def __init__(self, config: DetectionConfig) -> None:
        """Load an ONNX model and prepare runtime metadata."""

        import onnxruntime as ort

        self.config = config
        model_path = Path(config.weights_path)
        if not model_path.is_absolute():
            model_path = project_root() / model_path
        self.session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

    def infer(self, frame: np.ndarray) -> list[Detection]:
        """Run ONNX YOLO inference and convert outputs to Detection objects."""

        original_h, original_w = frame.shape[:2]
        image = cv2.resize(frame, (self.config.input_size, self.config.input_size))
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        tensor = np.transpose(image, (2, 0, 1))[None, ...]
        outputs = self.session.run(None, {self.input_name: tensor})[0]
        return self._parse_yolo_output(outputs, original_w, original_h)

    def _parse_yolo_output(self, output: np.ndarray, width: int, height: int) -> list[Detection]:
        """Parse common YOLO export format [x, y, w, h, class_scores...]."""

        predictions = np.squeeze(output)
        if predictions.ndim == 2 and predictions.shape[0] < predictions.shape[1]:
            predictions = predictions.T
        detections: list[Detection] = []
        scale_x = width / self.config.input_size
        scale_y = height / self.config.input_size
        for row in predictions:
            if len(row) < 5:
                continue
            scores = row[4:]
            class_id = int(np.argmax(scores))
            confidence = float(scores[class_id])
            if confidence < self.config.confidence_threshold:
                continue
            cx, cy, bw, bh = row[:4]
            x1 = int((cx - bw / 2) * scale_x)
            y1 = int((cy - bh / 2) * scale_y)
            x2 = int((cx + bw / 2) * scale_x)
            y2 = int((cy + bh / 2) * scale_y)
            class_name = self.config.classes[class_id] if class_id < len(self.config.classes) else str(class_id)
            detections.append(
                Detection(
                    bbox=BoundingBox(x1=max(0, x1), y1=max(0, y1), x2=min(width - 1, x2), y2=min(height - 1, y2)),
                    class_name=class_name,
                    confidence=confidence,
                )
            )
        return detections


class UltralyticsYoloDetector:
    """Ultralytics YOLO detector for .pt weights."""

    def __init__(self, config: DetectionConfig) -> None:
        """Load a YOLO model through the Ultralytics package."""

        from ultralytics import YOLO

        self.config = config
        model_path = Path(config.weights_path)
        if not model_path.is_absolute():
            model_path = project_root() / model_path
        self.model = YOLO(str(model_path))

    def infer(self, frame: np.ndarray) -> list[Detection]:
        """Run Ultralytics inference and convert results to Detection objects."""

        results = self.model.predict(frame, conf=self.config.confidence_threshold, verbose=False)
        detections: list[Detection] = []
        for result in results:
            names = result.names
            for box in result.boxes:
                x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
                class_id = int(box.cls[0].item())
                detections.append(
                    Detection(
                        bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                        class_name=names.get(class_id, str(class_id)),
                        confidence=float(box.conf[0].item()),
                    )
                )
        return detections


def create_detector(config: DetectionConfig) -> Detector:
    """Create the configured detection backend."""

    backend = config.backend.lower()
    if backend == "onnx":
        return OnnxYoloDetector(config)
    if backend in {"ultralytics", "yolo", "yolov11"}:
        return UltralyticsYoloDetector(config)
    return MockDetector(config)

