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

## Backend Reference

The dashboard was built against the FastAPI backend extracted from:

`C:\Users\jk082\Downloads\TATA INNOVENT PROJECT.zip`

Reference files were copied to:

`work/backend-reference`

The backend exposes:

- `GET /live`
- `GET /live?include_frame=true`
- `GET /tools`
- `GET /checklist`
- `GET /alerts`
- `GET /report`
- `GET /health`

## Setup

Install dependencies:

```bash
npm install
```

Start the dashboard:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## FastAPI Configuration

By default the dashboard calls:

```text
http://localhost:8000
```

Override it with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

Run the backend from the referenced project:

```bash
python -m backend.run
```

## Production Build

```bash
npm run build
```

The app is typed and production-build verified.
