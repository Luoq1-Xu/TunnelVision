"""YOLO-based baseball detector."""

from dataclasses import dataclass

import numpy as np


@dataclass
class Detection:
    """A single ball detection in a frame."""

    frame_idx: int
    x: float  # pixel x
    y: float  # pixel y
    confidence: float
    bbox: tuple[float, float, float, float]  # x1, y1, x2, y2


class BallDetector:
    """Detect baseballs in video frames using YOLO11.

    Uses Ultralytics YOLO with optional SAHI tiling for small-object detection.
    """

    def __init__(self, model_path: str = "yolo11n.pt", conf_threshold: float = 0.25):
        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self._model = None

    def load_model(self):
        from ultralytics import YOLO

        self._model = YOLO(self.model_path)

    def detect_frame(self, frame: np.ndarray) -> list[Detection]:
        """Run detection on a single frame."""
        if self._model is None:
            self.load_model()

        results = self._model(frame, conf=self.conf_threshold, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
                detections.append(
                    Detection(
                        frame_idx=0,  # set by caller
                        x=float(cx),
                        y=float(cy),
                        confidence=float(box.conf[0]),
                        bbox=(float(x1), float(y1), float(x2), float(y2)),
                    )
                )
        return detections
