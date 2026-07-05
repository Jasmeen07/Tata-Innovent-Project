"""Lightweight ByteTrack-style IoU tracker for edge-friendly stable IDs."""

from __future__ import annotations

from dataclasses import dataclass, field

from backend.models.schemas import BoundingBox, Detection, TrackedObject
from backend.utils.config import TrackingConfig


def iou(left: BoundingBox, right: BoundingBox) -> float:
    """Compute intersection-over-union for two bounding boxes."""

    x_left = max(left.x1, right.x1)
    y_top = max(left.y1, right.y1)
    x_right = min(left.x2, right.x2)
    y_bottom = min(left.y2, right.y2)
    if x_right <= x_left or y_bottom <= y_top:
        return 0.0
    intersection = (x_right - x_left) * (y_bottom - y_top)
    left_area = (left.x2 - left.x1) * (left.y2 - left.y1)
    right_area = (right.x2 - right.x1) * (right.y2 - right.y1)
    return intersection / float(left_area + right_area - intersection)


@dataclass
class TrackState:
    """Internal state for one active or recently disappeared track."""

    object_id: int
    class_name: str
    bbox: BoundingBox
    confidence: float
    disappeared_frames: int = 0
    history: list[tuple[int, int]] = field(default_factory=list)


class SimpleByteTracker:
    """Assign stable object IDs using class-aware IoU matching."""

    def __init__(self, config: TrackingConfig) -> None:
        """Initialize tracker state and ID counters."""

        self.config = config
        self.next_id = 1
        self.tracks: dict[int, TrackState] = {}

    def update(self, detections: list[Detection]) -> list[TrackedObject]:
        """Match new detections to existing tracks and return tracked objects."""

        matched_tracks: set[int] = set()
        matched_detections: set[int] = set()
        tracked: list[TrackedObject] = []

        for detection_index, detection in enumerate(detections):
            best_track_id: int | None = None
            best_score = 0.0
            for track_id, track in self.tracks.items():
                if track_id in matched_tracks or track.class_name != detection.class_name:
                    continue
                score = iou(track.bbox, detection.bbox)
                if score > best_score:
                    best_score = score
                    best_track_id = track_id
            if best_track_id is None or best_score < self.config.iou_threshold:
                continue

            track = self.tracks[best_track_id]
            track.bbox = detection.bbox
            track.confidence = detection.confidence
            track.disappeared_frames = 0
            track.history.append(detection.bbox.center())
            track.history = track.history[-self.config.history_limit :]
            matched_tracks.add(best_track_id)
            matched_detections.add(detection_index)
            tracked.append(self._to_tracked(detection, track))

        for detection_index, detection in enumerate(detections):
            if detection_index in matched_detections:
                continue
            track = TrackState(
                object_id=self.next_id,
                class_name=detection.class_name,
                bbox=detection.bbox,
                confidence=detection.confidence,
                history=[detection.bbox.center()],
            )
            self.tracks[self.next_id] = track
            self.next_id += 1
            tracked.append(self._to_tracked(detection, track))

        for track_id in list(self.tracks):
            if track_id not in matched_tracks and all(item.object_id != track_id for item in tracked):
                self.tracks[track_id].disappeared_frames += 1
            if self.tracks[track_id].disappeared_frames > self.config.max_disappeared_frames:
                del self.tracks[track_id]

        return tracked

    def _to_tracked(self, detection: Detection, track: TrackState) -> TrackedObject:
        """Create a tracked object from a detection and track state."""

        return TrackedObject(
            bbox=detection.bbox,
            class_name=detection.class_name,
            confidence=detection.confidence,
            object_id=track.object_id,
            timestamp=detection.timestamp,
            disappeared_frames=track.disappeared_frames,
        )

