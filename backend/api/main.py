"""FastAPI application for the AeroGuard AI backend."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.api.service import AeroGuardService
from backend.utils.config import load_settings

settings = load_settings()
service = AeroGuardService(settings)

app = FastAPI(title=settings.app.name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    """Start the AeroGuard processing service."""

    service.start()


@app.on_event("shutdown")
def shutdown() -> None:
    """Stop cameras and background processing."""

    service.stop()


@app.get("/live")
def live(include_frame: bool = Query(default=False)) -> dict[str, Any]:
    """Return live dashboard state and optionally the latest JPEG frame."""

    return service.live_state(include_frame=include_frame)


@app.get("/tools")
def tools() -> dict[str, Any]:
    """Return all known tool accountability records."""

    return {"tools": service.accountability.as_dicts(history_limit=100), "database": service.database.fetch_tools()}


@app.get("/checklist")
def checklist() -> dict[str, Any]:
    """Return the current digital maintenance checklist."""

    return {"checklist": service.checklist.as_dicts()}


@app.get("/alerts")
def alerts(include_resolved: bool = Query(default=False)) -> dict[str, Any]:
    """Return active in-memory alerts and persisted alerts."""

    return {
        "active": [alert.model_dump(mode="json") for alert in service.alerts.list_active()],
        "database": service.database.fetch_alerts(include_resolved=include_resolved),
    }


@app.get("/report")
def report() -> dict[str, Any]:
    """Generate a maintenance verification report."""

    return service.report()


@app.get("/health")
def health() -> dict[str, str]:
    """Return a simple health probe for deployment checks."""

    return {"status": "ok", "service": settings.app.name}
