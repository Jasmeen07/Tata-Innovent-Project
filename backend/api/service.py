"""Runtime orchestration service for AeroGuard."""

from __future__ import annotations

import base64
import threading
import time
from datetime import datetime, timezone
from typing import Any
import os

import cv2
import numpy as np

from backend.alerts.manager import AlertManager
from backend.camera.capture import CameraManager
from backend.database.db import Database
from backend.models.detector import Detector, create_detector
from backend.models.schemas import AlertLevel, TrackedObject
from backend.tracking.bytetrack import SimpleByteTracker
from backend.utils.config import Settings
from backend.verification.accountability import ToolAccountabilityEngine
from backend.verification.checklist import MaintenanceChecklist


class AeroGuardService:
    """Coordinate camera capture, detection, tracking, verification, and persistence."""

    def __init__(self, settings: Settings) -> None:
        """Build all backend components from settings."""

        self.settings = settings
        self.database = Database(settings.database.path)
        self.camera_manager = CameraManager(settings.camera)
        self.detector: Detector = create_detector(settings.detection)
        self.tracker = SimpleByteTracker(settings.tracking)
        self.alerts = AlertManager(self.database)
        self.checklist = MaintenanceChecklist()
        self.accountability = ToolAccountabilityEngine(
            settings.verification,
            self.database,
            self.alerts,
            self.checklist,
        )
        self.running = False
        self.thread: threading.Thread | None = None
        self.latest_frame: np.ndarray | None = None
        self.latest_tracked: list[TrackedObject] = []
        self.last_update: datetime | None = None

    def start(self) -> None:
        """Start cameras and the background AI processing loop."""

        if self.running:
            return
        self.running = True
        self.camera_manager.start_all()
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        """Stop the AI processing loop and release cameras."""

        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        #self.camera_manager.stop_all()
    if os.getenv("RENDER") != "true":
    self.camera_manager.start_all()

    def live_state(self, include_frame: bool = False) -> dict[str, Any]:
        """Return a snapshot of the live system state."""

        health = self.alerts.health_alert(self.accountability.all_tools_returned())
        payload: dict[str, Any] = {
            "system": self.settings.app.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_update": self.last_update.isoformat() if self.last_update else None,
            "status": health.level.value,
            "message": health.message,
            "detections": [item.model_dump(mode="json") for item in self.latest_tracked],
            "tools": self.accountability.as_dicts(history_limit=20),
            "alerts": [alert.model_dump(mode="json") for alert in self.alerts.list_active()],
            "checklist": self.checklist.as_dicts(),
            "workspace_left_behind": [
                item.model_dump(mode="json") for item in self.accountability.workspace_left_behind()
            ],
        }
        if include_frame:
            payload["frame_jpeg_base64"] = self._encoded_frame()
        return payload

    def report(self) -> dict[str, Any]:
        """Generate and persist a PDF-ready maintenance report structure."""

        tools = self.accountability.as_dicts(history_limit=100)
        missing_tools = [tool for tool in tools if tool["status"] == "missing"]
        status = "blocked" if missing_tools else "verified"
        report = {
            "title": "AeroGuard Maintenance Verification Report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "maintenance_summary": {
                "verification_status": status,
                "total_tools_detected": len(tools),
                "missing_tool_count": len(missing_tools),
                "active_alert_count": len(self.alerts.list_active()),
            },
            "missing_tool_report": missing_tools,
            "tool_usage": tools,
            "checklist": self.checklist.as_dicts(),
            "time_taken": self._estimate_time_taken(tools),
            "pdf_ready_sections": [
                "maintenance_summary",
                "missing_tool_report",
                "tool_usage",
                "checklist",
            ],
        }
        report["report_id"] = self.database.insert_report(report)
        return report

    def process_frame(self, frame: np.ndarray) -> list[TrackedObject]:
        """Run one frame through detection, tracking, and accountability."""

        detections = self.detector.infer(frame)
        tracked = self.tracker.update(detections)
        self.accountability.update(tracked)
        self.latest_frame = self._draw_overlay(frame.copy(), tracked)
        self.latest_tracked = tracked
        self.last_update = datetime.now(timezone.utc)
        if self.accountability.workspace_left_behind() and self._return_tools_completed():
            self.alerts.raise_alert(
                key="workspace:left-behind",
                level=AlertLevel.RED,
                message="Maintenance cannot finish. Tool left inside work area.",
            )
        return tracked

    def _loop(self) -> None:
        """Run continuous AI processing at the configured camera FPS."""

        delay = 1.0 / max(self.settings.camera.fps, 1)
        while self.running:
            frames = self.camera_manager.latest_frames()
            if frames:
                self.process_frame(frames[0].frame)
            else:
                self.process_frame(self._synthetic_frame())
            time.sleep(delay)

    def _draw_overlay(self, frame: np.ndarray, tracked: list[TrackedObject]) -> np.ndarray:
        """Draw tracked detections on a frame for dashboard preview."""

        for item in tracked:
            color = (0, 180, 0) if item.class_name != "human_hand" else (255, 180, 0)
            cv2.rectangle(frame, (item.bbox.x1, item.bbox.y1), (item.bbox.x2, item.bbox.y2), color, 2)
            label = f"#{item.object_id} {item.class_name} {item.confidence:.2f}"
            cv2.putText(frame, label, (item.bbox.x1, max(20, item.bbox.y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        return frame

    def _encoded_frame(self) -> str | None:
        """Return the latest overlay frame as base64 JPEG."""

        if self.latest_frame is None:
            return None
        ok, buffer = cv2.imencode(".jpg", self.latest_frame)
        if not ok:
            return None
        return base64.b64encode(buffer.tobytes()).decode("ascii")

    def _synthetic_frame(self) -> np.ndarray:
        """Create a fallback frame when no camera is available."""

        frame = np.full((self.settings.camera.height, self.settings.camera.width, 3), 34, dtype=np.uint8)
        cv2.putText(frame, "AeroGuard synthetic camera", (32, 52), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (220, 220, 220), 2)
        return frame

    def _return_tools_completed(self) -> bool:
        """Return true when the Return Tools checklist step is complete."""

        return any(item.name == "Return Tools" and item.completed for item in self.checklist.items)

    def _estimate_time_taken(self, tools: list[dict[str, Any]]) -> dict[str, Any]:
        """Estimate operation duration from first tool entry to report time."""

        if not tools:
            return {"seconds": 0, "started_at": None, "ended_at": None}
        started_at = min(tool["entry_time"] for tool in tools)
        ended_at = datetime.now(timezone.utc).isoformat()
        return {"started_at": started_at, "ended_at": ended_at}
