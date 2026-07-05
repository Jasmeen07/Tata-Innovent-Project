"""Smoke tests for AeroGuard core pipeline."""

from __future__ import annotations

import numpy as np

from backend.api.service import AeroGuardService
from backend.utils.config import load_settings


def test_service_processes_synthetic_frame() -> None:
    """Verify mock detection, tracking, and accountability update together."""

    settings = load_settings()
    service = AeroGuardService(settings)
    frame = np.zeros((settings.camera.height, settings.camera.width, 3), dtype=np.uint8)
    tracked = service.process_frame(frame)
    assert tracked
    assert service.accountability.as_dicts()

