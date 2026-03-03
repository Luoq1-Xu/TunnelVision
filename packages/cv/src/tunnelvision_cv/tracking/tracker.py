"""Multi-frame ball tracking using ByteTrack via supervision."""

from dataclasses import dataclass

import numpy as np


@dataclass
class Track:
    """A tracked ball trajectory across frames."""

    track_id: int
    positions: list[tuple[int, float, float, float]]  # (frame_idx, x, y, confidence)


class BallTracker:
    """Associate per-frame detections into continuous ball tracks.

    Uses ByteTrack from the supervision library.
    """

    def __init__(self):
        self._tracker = None

    def _init_tracker(self):
        import supervision as sv

        self._tracker = sv.ByteTrack()

    def update(
        self,
        detections_xyxy: np.ndarray,
        confidences: np.ndarray,
    ) -> np.ndarray:
        """Update tracker with new frame detections.

        Args:
            detections_xyxy: (N, 4) array of bounding boxes
            confidences: (N,) array of confidence scores

        Returns:
            Array of tracker IDs for each detection
        """
        if self._tracker is None:
            self._init_tracker()

        import supervision as sv

        sv_detections = sv.Detections(
            xyxy=detections_xyxy,
            confidence=confidences,
        )
        tracked = self._tracker.update_with_detections(sv_detections)
        return tracked.tracker_id if tracked.tracker_id is not None else np.array([])
