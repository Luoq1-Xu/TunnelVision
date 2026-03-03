import { Pitch } from "@/types/pitch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window === "undefined" ? "http://localhost:8000" : "");

export interface PlayerSearchResult {
  mlbam_id: number;
  first_name: string;
  last_name: string;
  played_first: number | null;
  played_last: number | null;
}

export async function searchPlayers(
  query: string,
  limit: number = 10
): Promise<PlayerSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/statcast/players/search?${params}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchPitcherPitchesById(
  mlbamId: number,
  startDt: string,
  endDt: string,
  limit: number = 20
): Promise<Pitch[]> {
  const params = new URLSearchParams({
    start_dt: startDt,
    end_dt: endDt,
    limit: limit.toString(),
  });

  const res = await fetch(
    `${API_BASE}/api/statcast/pitcher/${mlbamId}?${params}`
  );
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchPitcherPitches(
  firstName: string,
  lastName: string,
  startDt: string,
  endDt: string,
  limit: number = 20
): Promise<Pitch[]> {
  const params = new URLSearchParams({
    first_name: firstName,
    last_name: lastName,
    start_dt: startDt,
    end_dt: endDt,
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/statcast/pitcher?${params}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchGamePitches(
  date: string,
  limit: number = 50
): Promise<Pitch[]> {
  const params = new URLSearchParams({
    date,
    limit: limit.toString(),
  });

  const res = await fetch(`${API_BASE}/api/statcast/game?${params}`);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `API error: ${res.status}`);
  }
  return res.json();
}
