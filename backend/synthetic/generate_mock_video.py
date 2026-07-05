"""Generate mock AeroGuard maintenance footage for dashboard and pipeline tests."""

from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np


def generate_video(output_path: Path, seconds: int = 12, fps: int = 30, width: int = 960, height: int = 540) -> None:
    """Write a synthetic maintenance video with moving tool-like boxes."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )
    labels = ["screwdriver", "spanner", "toolbox", "human_hand"]
    colors = [(40, 180, 255), (120, 220, 80), (220, 160, 80), (255, 210, 120)]
    for frame_index in range(seconds * fps):
        frame = np.full((height, width, 3), 38, dtype=np.uint8)
        cv2.rectangle(frame, (80, 90), (width - 80, height - 60), (75, 75, 75), 2)
        cv2.putText(frame, "AeroGuard Mock Maintenance Bay", (90, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (230, 230, 230), 2)
        for index, label in enumerate(labels):
            x = 120 + ((frame_index * (2 + index) + index * 120) % (width - 300))
            y = 150 + index * 70
            cv2.rectangle(frame, (x, y), (x + 105, y + 44), colors[index], -1)
            cv2.putText(frame, label, (x + 5, y + 29), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (20, 20, 20), 1)
        writer.write(frame)
    writer.release()


def main() -> None:
    """Parse CLI arguments and generate a mock video file."""

    parser = argparse.ArgumentParser(description="Generate AeroGuard synthetic maintenance footage.")
    parser.add_argument("--output", default="mock_maintenance.mp4", help="Output video path.")
    parser.add_argument("--seconds", type=int, default=12, help="Video duration in seconds.")
    args = parser.parse_args()
    generate_video(Path(args.output), seconds=args.seconds)


if __name__ == "__main__":
    main()

