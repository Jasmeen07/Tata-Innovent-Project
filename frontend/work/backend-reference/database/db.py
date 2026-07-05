"""SQLite persistence for AeroGuard."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.models.schemas import Alert, Detection, ToolRecord
from backend.utils.config import project_root


def utc_now_iso() -> str:
    """Return the current UTC timestamp in ISO-8601 format."""

    return datetime.now(timezone.utc).isoformat()


class Database:
    """Small SQLite repository layer used by the runtime service."""

    def __init__(self, db_path: str) -> None:
        """Create a database handle and ensure the schema exists."""

        path = Path(db_path)
        if not path.is_absolute():
            path = project_root() / path
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.initialize()

    def initialize(self) -> None:
        """Create all required AeroGuard tables."""

        cursor = self.connection.cursor()
        cursor.executescript(
            """
            CREATE TABLE IF NOT EXISTS detected_tools (
                unique_id INTEGER PRIMARY KEY,
                tool_name TEXT NOT NULL,
                entry_time TEXT NOT NULL,
                exit_time TEXT,
                current_position TEXT,
                status TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                missing_since TEXT
            );

            CREATE TABLE IF NOT EXISTS tracking_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                object_id INTEGER NOT NULL,
                tool_name TEXT NOT NULL,
                bbox TEXT NOT NULL,
                center TEXT NOT NULL,
                confidence REAL NOT NULL,
                timestamp TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS maintenance_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                payload TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                tool_id INTEGER,
                tool_name TEXT,
                created_at TEXT NOT NULL,
                resolved INTEGER NOT NULL DEFAULT 0,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        self.connection.commit()

    def upsert_tool(self, record: ToolRecord) -> None:
        """Insert or update a tool accountability record."""

        self.connection.execute(
            """
            INSERT INTO detected_tools (
                unique_id, tool_name, entry_time, exit_time, current_position,
                status, last_seen, missing_since
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(unique_id) DO UPDATE SET
                tool_name=excluded.tool_name,
                exit_time=excluded.exit_time,
                current_position=excluded.current_position,
                status=excluded.status,
                last_seen=excluded.last_seen,
                missing_since=excluded.missing_since
            """,
            (
                record.unique_id,
                record.tool_name,
                record.entry_time.isoformat(),
                record.exit_time.isoformat() if record.exit_time else None,
                json.dumps(record.current_position),
                record.status.value,
                record.last_seen.isoformat(),
                record.missing_since.isoformat() if record.missing_since else None,
            ),
        )
        self.connection.commit()

    def insert_tracking(self, detection: Detection) -> None:
        """Persist a single tracking-history point."""

        if detection.object_id is None:
            return
        self.connection.execute(
            """
            INSERT INTO tracking_history (
                object_id, tool_name, bbox, center, confidence, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                detection.object_id,
                detection.class_name,
                detection.bbox.model_dump_json(),
                json.dumps(detection.bbox.center()),
                detection.confidence,
                detection.timestamp.isoformat(),
            ),
        )
        self.connection.commit()

    def insert_alert(self, alert: Alert) -> int:
        """Persist an alert and return its generated ID."""

        cursor = self.connection.execute(
            """
            INSERT INTO alerts (
                level, message, tool_id, tool_name, created_at, resolved, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                alert.level.value,
                alert.message,
                alert.tool_id,
                alert.tool_name,
                alert.created_at.isoformat(),
                int(alert.resolved),
                json.dumps(alert.metadata),
            ),
        )
        self.connection.commit()
        return int(cursor.lastrowid)

    def log_event(self, event_type: str, message: str, payload: dict[str, Any] | None = None) -> None:
        """Persist an operational maintenance log entry."""

        self.connection.execute(
            "INSERT INTO maintenance_logs (event_type, message, payload, created_at) VALUES (?, ?, ?, ?)",
            (event_type, message, json.dumps(payload or {}), utc_now_iso()),
        )
        self.connection.commit()

    def insert_report(self, report: dict[str, Any]) -> int:
        """Persist a generated report JSON document."""

        cursor = self.connection.execute(
            "INSERT INTO reports (report_json, created_at) VALUES (?, ?)",
            (json.dumps(report, default=str), utc_now_iso()),
        )
        self.connection.commit()
        return int(cursor.lastrowid)

    def fetch_tools(self) -> list[dict[str, Any]]:
        """Return all detected tools as dashboard-ready dictionaries."""

        rows = self.connection.execute("SELECT * FROM detected_tools ORDER BY entry_time").fetchall()
        return [dict(row) for row in rows]

    def fetch_alerts(self, include_resolved: bool = False) -> list[dict[str, Any]]:
        """Return current alerts, newest first."""

        query = "SELECT * FROM alerts"
        if not include_resolved:
            query += " WHERE resolved = 0"
        query += " ORDER BY created_at DESC"
        return [dict(row) for row in self.connection.execute(query).fetchall()]
