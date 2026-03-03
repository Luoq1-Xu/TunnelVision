"""Main CV pipeline: video in → pitch trajectories out."""

from pathlib import Path

import numpy as np


def process_video(video_path: str | Path) -> dict:
    """Run the full CV pipeline on a pitching video.

    Steps:
        1. Extract frames via PyAV
        2. Run YOLO11 detection on each frame
        3. Track ball across frames with ByteTrack
        4. Reconstruct 3D trajectory per pitch
        5. Compute tunnel metrics between consecutive pitches

    Args:
        video_path: Path to the input video file

    Returns:
        Dict with pitch trajectories and tunnel metrics
    """
    # TODO: Wire together detection → tracking → reconstruction → tunneling
    raise NotImplementedError("Full pipeline not yet implemented")


def extract_frames(video_path: str | Path, fps: int = 30) -> list[np.ndarray]:
    """Extract frames from video using PyAV.

    Args:
        video_path: Path to video file
        fps: Target frame rate for extraction

    Returns:
        List of frames as numpy arrays (H, W, 3) in BGR format
    """
    import av

    container = av.open(str(video_path))
    stream = container.streams.video[0]
    stream.codec_context.skip_frame = "NONKEY"

    frames = []
    for frame in container.decode(stream):
        img = frame.to_ndarray(format="bgr24")
        frames.append(img)

    container.close()
    return frames
