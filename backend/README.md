# AeroGuard AI Backend

AeroGuard is a local Edge AI backend for aircraft maintenance verification. It captures camera frames, detects and tracks tools, remembers tool accountability state, escalates missing-tool alerts, updates a maintenance checklist, and exposes dashboard-ready REST APIs.

## Features

- Local camera capture with reconnect, resize, lighting enhancement, and 30 FPS target.
- Detector abstraction for YOLOv11 through ONNX Runtime or Ultralytics `.pt` weights.
- Mock detector mode for frontend development without trained aircraft footage.
- ByteTrack-style stable ID tracking with occlusion tolerance.
- Tool accountability engine with entry time, last seen, current position, movement history, status, and missing timers.
- Yellow alerts after configurable missing duration, red alerts when maintenance must be blocked.
- SQLite tables for detected tools, tracking history, maintenance logs, alerts, and reports.
- FastAPI endpoints for live UI integration.
- Synthetic video generation utility for demos and testing.

## Folder Structure

```text
backend/
  api/             FastAPI app and runtime orchestration
  alerts/          Alert creation and active alert state
  camera/          Camera capture, reconnect, frame preprocessing
  configs/         Runtime JSON configuration
  database/        SQLite schema and repository methods
  models/          Shared schemas and detector backends
  synthetic/       Mock video generation utilities
  tests/           Smoke tests
  tracking/        ByteTrack-style tracking
  verification/    Checklist and tool accountability engine
  weights/         Place YOLOv11 ONNX/PT weights here
```

## Quick Start

## Quick Start

```bash
git clone https://github.com/Jasmeen07/Tata-Innovent-Project.git
cd Tata-Innovent-Project

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

python -m backend.run
```

Open:

- `GET http://localhost:8000/live`
- `GET http://localhost:8000/live?include_frame=true`
- `GET http://localhost:8000/tools`
- `GET http://localhost:8000/checklist`
- `GET http://localhost:8000/alerts`
- `GET http://localhost:8000/report`

## Detector Modes

Default mode is `mock`, which allows the backend to run immediately.
Real YOLO weights can be added later by placing a trained .onnx or .pt model inside backend/weights and updating the backend setting in configs/settings.json.

To use YOLOv11 ONNX:

1. Export or place your model at `backend/weights/yolov11_aeroguard.onnx`.
2. Edit `backend/configs/settings.json`.
3. Set `"backend": "onnx"`.

To use Ultralytics YOLO weights:

1. Place a `.pt` model in `backend/weights/`.
2. Set `"weights_path"` to that file.
3. Set `"backend": "ultralytics"`.

## Synthetic Footage

```bash
python -m backend.synthetic.generate_mock_video --output backend/synthetic/mock_maintenance.mp4 --seconds 20
```

Then set the camera source in `backend/configs/settings.json`:

```json
"sources": ["synthetic/mock_maintenance.mp4"]
```

## Jetson Nano Notes

- Prefer ONNX Runtime or TensorRT-optimized exports for deployment.
- Use a smaller YOLOv11 model variant and `input_size` 416 or 640 depending on latency.
- Replace `opencv-python` with the Jetson system OpenCV build when using CSI cameras.
- Keep `mock` mode for dashboard integration and CI checks, then switch to `onnx` for production.

## Alert Logic

- Green: all tools returned or maintenance is in progress without active alerts.
- Yellow: a tool has been missing longer than `missing_warning_seconds`.
- Red: a tool has been missing longer than `critical_missing_seconds`, or a tool is left in the workspace after the return-tools step.

## API Contract

All endpoints return JSON and are frontend-ready. `/live` includes detections, tool records, active alerts, checklist state, workspace-left-behind records, and optionally a base64 JPEG overlay frame.

