# AeroGuard Aircraft Maintenance Dashboard

Modern aircraft maintenance dashboard built with React, Next.js, TailwindCSS, TypeScript, Chart.js, Socket.io client, and FastAPI REST integration.

## Features

- Dark aviation operations UI with blue highlights.
- Live camera feed from `GET /live?include_frame=true`.
- Current aircraft, technician, task, status, completion, and realtime counters.
- Live tool monitoring with status colors:
  - Green: available
  - Blue: in use
  - Yellow: searching
  - Red: missing
- Backend-updated maintenance checklist.
- Animated critical alert panel.
- Analytics for tool usage, maintenance duration, and alert frequency.
- Maintenance report generation from `GET /report`.
- PDF export with aircraft ID, technician, duration, tools, alerts, verification result, and timestamp.
- Local report history with search and aircraft filtering.
- Optional Socket.io client support with REST polling every second as the reliable fallback.
- Offline demo data when the FastAPI backend is not running.

## Backend 

The dashboard was built against the FastAPI backend.

The backend exposes:

- `GET /live`
- `GET /live?include_frame=true`
- `GET /tools`
- `GET /checklist`
- `GET /alerts`
- `GET /report`
- `GET /health`

The app is typed and production-build verified.
