"""Fuzzy player search using the Chadwick baseball register."""

import unicodedata
from functools import lru_cache

import pandas as pd
from pybaseball import chadwick_register


def _normalize(text: str) -> str:
    """Strip diacritics and lowercase for accent-insensitive matching.

    Uses NFD decomposition then strips combining marks (category 'Mn').
    Example: 'Díaz' -> 'diaz'
    """
    nfkd = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in nfkd if unicodedata.category(c) != "Mn")
    return stripped.lower().strip()


@lru_cache(maxsize=1)
def _get_player_registry() -> pd.DataFrame:
    """Load and cache the Chadwick register with a normalized search column.

    Called once per process lifetime thanks to lru_cache.
    Filtered to rows with a valid MLB AM ID.
    """
    df = chadwick_register()
    df = df[df["key_mlbam"].notna() & (df["key_mlbam"] > 0)].copy()
    first_norm = df["name_first"].fillna("").apply(_normalize)
    last_norm = df["name_last"].fillna("").apply(_normalize)
    df["name_normalized"] = first_norm + " " + last_norm
    return df


def search_players(query: str, limit: int = 10) -> list[dict]:
    """Search for players matching a free-text query.

    Normalises the query (strips accents, lowercases), then requires every
    token to appear as a substring of the player's normalised full name.
    Results are sorted so recently-active players appear first.

    Args:
        query: Free-text search string, e.g. "diaz", "Edwin Diaz", "oht"
        limit: Maximum results to return (default 10)

    Returns:
        List of dicts with keys: mlbam_id, first_name, last_name,
        played_first, played_last
    """
    registry = _get_player_registry()
    q = _normalize(query)
    if not q:
        return []

    tokens = q.split()

    mask = pd.Series(True, index=registry.index)
    for token in tokens:
        mask &= registry["name_normalized"].str.contains(token, na=False)

    matches = registry[mask].copy()
    matches = matches.sort_values(
        "mlb_played_last", ascending=False, na_position="last"
    )
    matches = matches.head(limit)

    results = []
    for _, row in matches.iterrows():
        results.append(
            {
                "mlbam_id": int(row["key_mlbam"]),
                "first_name": str(row["name_first"]),
                "last_name": str(row["name_last"]),
                "played_first": (
                    int(row["mlb_played_first"])
                    if pd.notna(row["mlb_played_first"])
                    else None
                ),
                "played_last": (
                    int(row["mlb_played_last"])
                    if pd.notna(row["mlb_played_last"])
                    else None
                ),
            }
        )

    return results
