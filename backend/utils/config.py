"""Configuration helpers for AeroGuard."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any
import os

from pydantic import BaseModel, Field


class AppConfig(BaseModel):
    name: str = "AeroGuard AI"
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))


class CameraConfig(BaseModel):
    """Camera capture configuration."""

    sources: list[int | str] = Field(default_factory=lambda: [0])
    width: int = 960
    height: int = 540
    fps: int = 30
    auto_reconnect_seconds: int = 2
    lighting_enhancement: bool = True


class DetectionConfig(BaseModel):
    """Detector model configuration."""

    backend: str = "mock"
    weights_path: str = "weights/yolov11_aeroguard.onnx"
    confidence_threshold: float = 0.35
    input_size: int = 640
    classes: list[str]


class TrackingConfig(BaseModel):
    """Object tracker configuration."""

    max_disappeared_frames: int = 45
    iou_threshold: float = 0.25
    history_limit: int = 300


class VerificationConfig(BaseModel):
    """Tool accountability and maintenance verification thresholds."""

    missing_warning_seconds: int = 10
    critical_missing_seconds: int = 30
    workspace_bounds: tuple[int, int, int, int] = (0, 0, 960, 540)


class DatabaseConfig(BaseModel):
    """SQLite database configuration."""

    path: str = "aeroguard.db"


class Settings(BaseModel):
    """Typed settings loaded from configs/settings.json."""

    app: AppConfig
    camera: CameraConfig
    detection: DetectionConfig
    tracking: TrackingConfig
    verification: VerificationConfig
    database: DatabaseConfig


def project_root() -> Path:
    """Return the backend package root directory."""

    return Path(__file__).resolve().parents[1]


@lru_cache(maxsize=1)
def load_settings(config_path: str | Path | None = None) -> Settings:
    """Load and validate AeroGuard settings from JSON."""

    path = Path(config_path) if config_path else project_root() / "configs" / "settings.json"
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return Settings.model_validate(data)

