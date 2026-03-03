"""Fetch pitch data from MLB Statcast via pybaseball."""

import pandas as pd
from pybaseball import statcast_pitcher, playerid_lookup, statcast

# Columns needed for trajectory reconstruction
TRAJECTORY_COLS = [
    "pitch_type", "release_speed", "release_spin_rate", "spin_axis",
    "release_pos_x", "release_pos_y", "release_pos_z",
    "vx0", "vy0", "vz0",
    "ax", "ay", "az",
    "plate_x", "plate_z",
    "pfx_x", "pfx_z",
    "pitcher", "batter", "game_date", "at_bat_number", "pitch_number",
    "description", "zone",
]


def fetch_pitcher_pitches(
    first_name: str,
    last_name: str,
    start_dt: str,
    end_dt: str,
) -> pd.DataFrame:
    """Fetch all pitches for a pitcher in a date range.

    Args:
        first_name: Pitcher's first name (e.g. "gerrit")
        last_name: Pitcher's last name (e.g. "cole")
        start_dt: Start date as "YYYY-MM-DD"
        end_dt: End date as "YYYY-MM-DD"

    Returns:
        DataFrame with Statcast pitch data, filtered to trajectory-relevant columns
    """
    lookup = playerid_lookup(last_name, first_name)
    if lookup.empty:
        raise ValueError(f"Player not found: {first_name} {last_name}")

    player_id = int(lookup.iloc[0]["key_mlbam"])
    data = statcast_pitcher(start_dt, end_dt, player_id=player_id)

    return _clean_pitch_data(data)


def fetch_pitcher_pitches_by_id(
    mlbam_id: int,
    start_dt: str,
    end_dt: str,
) -> pd.DataFrame:
    """Fetch all pitches for a pitcher by their MLB AM ID.

    Args:
        mlbam_id: The pitcher's MLB Advanced Media player ID
        start_dt: Start date as "YYYY-MM-DD"
        end_dt: End date as "YYYY-MM-DD"

    Returns:
        DataFrame with Statcast pitch data, filtered to trajectory-relevant columns
    """
    data = statcast_pitcher(start_dt, end_dt, player_id=mlbam_id)
    return _clean_pitch_data(data)


def fetch_game_pitches(start_dt: str, end_dt: str) -> pd.DataFrame:
    """Fetch all pitches for a date range.

    Args:
        start_dt: Start date as "YYYY-MM-DD"
        end_dt: End date as "YYYY-MM-DD"

    Returns:
        DataFrame with Statcast pitch data
    """
    data = statcast(start_dt=start_dt, end_dt=end_dt)
    return _clean_pitch_data(data)


def _clean_pitch_data(data: pd.DataFrame) -> pd.DataFrame:
    """Filter to relevant columns and drop rows missing trajectory data."""
    available_cols = [c for c in TRAJECTORY_COLS if c in data.columns]
    data = data[available_cols].copy()

    # Drop pitches missing the 9 trajectory parameters
    required = ["vx0", "vy0", "vz0", "ax", "ay", "az",
                 "release_pos_x", "release_pos_y", "release_pos_z"]
    data = data.dropna(subset=required)

    data = data.sort_values(["game_date", "at_bat_number", "pitch_number"])
    data = data.reset_index(drop=True)

    return data
