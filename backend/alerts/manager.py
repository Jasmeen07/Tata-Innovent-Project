"""Alert state management for AeroGuard."""

from __future__ import annotations

from backend.database.db import Database
from backend.models.schemas import Alert, AlertLevel


class AlertManager:
    """Create, persist, and expose live dashboard alerts."""

    def __init__(self, database: Database) -> None:
        """Initialize the alert manager."""

        self.database = database
        self.active: dict[str, Alert] = {}

    def raise_alert(
        self,
        key: str,
        level: AlertLevel,
        message: str,
        tool_id: int | None = None,
        tool_name: str | None = None,
    ) -> Alert:
        """Create an alert once per key and return the active alert."""

        if key in self.active:
            return self.active[key]
        alert = Alert(level=level, message=message, tool_id=tool_id, tool_name=tool_name)
        alert.id = self.database.insert_alert(alert)
        self.active[key] = alert
        return alert

    def resolve(self, key: str) -> None:
        """Resolve an in-memory alert key."""

        self.active.pop(key, None)

    def health_alert(self, all_tools_returned: bool) -> Alert:
        """Return a green system health alert when no warning is active."""

        if self.active:
            return list(self.active.values())[0]
        message = "All tools returned" if all_tools_returned else "Maintenance in progress"
        return Alert(level=AlertLevel.GREEN, message=message)

    def list_active(self) -> list[Alert]:
        """Return active alerts for API responses."""

        return list(self.active.values())

