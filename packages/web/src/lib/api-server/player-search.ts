export interface PlayerSearchResult {
  mlbam_id: number;
  first_name: string;
  last_name: string;
  played_first: number | null;
  played_last: number | null;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function searchPlayers(
  query: string,
  limit = 10
): Promise<PlayerSearchResult[]> {
  const q = normalize(query);
  if (!q) return [];

  // Use MLB Stats API for player search
  const url = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(q)}&sportIds=1&hydrate=currentTeam&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MLB Stats API returned ${res.status}`);
  }

  const data = await res.json();
  const people: {
    id: number;
    firstName: string;
    lastName: string;
    mlbDebutDate?: string;
    lastPlayedDate?: string;
  }[] = data.people || [];

  return people.slice(0, limit).map((p) => ({
    mlbam_id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    played_first: p.mlbDebutDate ? parseInt(p.mlbDebutDate.substring(0, 4)) : null,
    played_last: p.lastPlayedDate ? parseInt(p.lastPlayedDate.substring(0, 4)) : null,
  }));
}
