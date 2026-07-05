"""Tool accountability and missing-tool verification engine."""

from __future__ import annotations

from datetime import datetime, timezone

from backend.alerts.manager import AlertManager
from backend.database.db import Database
from backend.models.schemas import AlertLevel, ToolRecord, ToolStatus, TrackedObject
from backend.utils.config import VerificationConfig
from backend.verification.checklist import MaintenanceChecklist


NON_ACCOUNTABLE_CLASSES = {"human_hand", "aircraft_panel"}


class ToolAccountabilityEngine:
    """Remember every detected tool and escalate missing/left-behind tools."""

    def __init__(
        self,
        config: VerificationConfig,
        database: Database,
        alerts: AlertManager,
        checklist: MaintenanceChecklist,
    ) -> None:
        """Initialize accountability state."""

        self.config = config
        self.database = database
        self.alerts = alerts
        self.checklist = checklist
        self.tools: dict[int, ToolRecord] = {}

    def update(self, tracked_objects: list[TrackedObject]) -> list[ToolRecord]:
        """Update tool records from tracked detections and evaluate alerts."""

        now = datetime.now(timezone.utc)
        seen_ids = set()
        for obj in tracked_objects:
            if obj.class_name in NON_ACCOUNTABLE_CLASSES:
                continue
            seen_ids.add(obj.object_id)
            self._mark_seen(obj, now)

        for tool_id, record in list(self.tools.items()):
            if tool_id not in seen_ids:
                self._mark_disappeared(record, now)

        self.checklist.update(self.tools)
        return list(self.tools.values())

    def all_tools_returned(self) -> bool:
        """Return true when every known tool is accounted for."""

        return bool(self.tools) and all(
            record.status in {ToolStatus.RETURNED, ToolStatus.AVAILABLE}
            for record in self.tools.values()
        )

    def workspace_left_behind(self) -> list[ToolRecord]:
        """Return tools still visible inside the configured workspace."""

        x1, y1, x2, y2 = self.config.workspace_bounds
        left_behind: list[ToolRecord] = []
        for record in self.tools.values():
            if record.current_position is None or record.status not in {ToolStatus.IN_USE, ToolStatus.MISSING}:
                continue
            x, y = record.current_position
            if x1 <= x <= x2 and y1 <= y <= y2:
                left_behind.append(record)
        return left_behind

    def as_dicts(self, history_limit: int | None = None) -> list[dict]:
        """Return tool records as JSON-ready dictionaries."""

        records = []
        for record in self.tools.values():
            payload = record.model_dump(mode="json")
            if history_limit is not None:
                payload["movement_history"] = payload["movement_history"][-history_limit:]
            records.append(payload)
        return records

    def _mark_seen(self, obj: TrackedObject, now: datetime) -> None:
        """Create or update a tool when it is visible."""

        center = obj.bbox.center()
        record = self.tools.get(obj.object_id)
        if record is None:
            record = ToolRecord(
                unique_id=obj.object_id,
                tool_name=obj.class_name,
                entry_time=now,
                current_position=center,
                movement_history=[],
                status=ToolStatus.IN_USE,
                last_seen=now,
            )
            self.database.log_event("tool_detected", f"{obj.class_name} detected", {"tool_id": obj.object_id})
        else:
            record.current_position = center
            record.last_seen = now
            if record.status == ToolStatus.MISSING:
                record.status = ToolStatus.RETURNED
                record.exit_time = now
                self.alerts.resolve(f"missing:{record.unique_id}:warning")
                self.alerts.resolve(f"missing:{record.unique_id}:critical")
                self.database.log_event("tool_returned", f"{record.tool_name} returned", {"tool_id": record.unique_id})
            elif record.status == ToolStatus.RETURNED:
                record.status = ToolStatus.IN_USE
        record.missing_since = None
        record.movement_history.append((now, center))
        record.movement_history = record.movement_history[-300:]
        self.tools[obj.object_id] = record
        self.database.upsert_tool(record)
        self.database.insert_tracking(obj)

    def _mark_disappeared(self, record: ToolRecord, now: datetime) -> None:
        """Start or evaluate a missing timer for a tool that disappeared."""

        if record.status in {ToolStatus.RETURNED, ToolStatus.AVAILABLE}:
            return
        if record.missing_since is None:
            record.missing_since = now
            self.database.upsert_tool(record)
            return

        missing_seconds = (now - record.missing_since).total_seconds()
        if missing_seconds >= self.config.critical_missing_seconds:
            record.status = ToolStatus.MISSING
            self.alerts.raise_alert(
                key=f"missing:{record.unique_id}:critical",
                level=AlertLevel.RED,
                message=f"Maintenance cannot finish. Missing tool: {record.tool_name}. Return tool immediately.",
                tool_id=record.unique_id,
                tool_name=record.tool_name,
            )
        elif missing_seconds >= self.config.missing_warning_seconds:
            record.status = ToolStatus.MISSING
            self.alerts.raise_alert(
                key=f"missing:{record.unique_id}:warning",
                level=AlertLevel.YELLOW,
                message=f"{record.tool_name} missing for more than {self.config.missing_warning_seconds} seconds.",
                tool_id=record.unique_id,
                tool_name=record.tool_name,
            )
        self.database.upsert_tool(record)
