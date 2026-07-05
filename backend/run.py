"""Development entrypoint for running AeroGuard with uvicorn."""

from __future__ import annotations

import uvicorn

from backend.utils.config import load_settings


def main() -> None:
    """Start the AeroGuard FastAPI server."""

    settings = load_settings()
    uvicorn.run("backend.api.main:app", host=settings.app.host, port=settings.app.port, reload=False)


if __name__ == "__main__":
    main()

