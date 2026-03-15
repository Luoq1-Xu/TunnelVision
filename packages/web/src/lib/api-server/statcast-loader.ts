import { StatcastRow } from "./reconstruct";

const TRAJECTORY_COLS = [
  "pitch_type", "release_speed", "release_spin_rate", "spin_axis",
  "release_pos_x", "release_pos_y", "release_pos_z",
  "vx0", "vy0", "vz0",
  "ax", "ay", "az",
  "plate_x", "plate_z",
  "pfx_x", "pfx_z",
  "pitcher", "batter", "game_date", "at_bat_number", "pitch_number",
  "description", "zone",
];

const REQUIRED_COLS = [
  "vx0", "vy0", "vz0", "ax", "ay", "az",
  "release_pos_x", "release_pos_y", "release_pos_z",
];

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row);
  }
  return rows;
}

function cleanPitchData(rawRows: Record<string, string>[]): StatcastRow[] {
  return rawRows
    .filter((row) =>
      REQUIRED_COLS.every((col) => row[col] && row[col] !== "" && row[col] !== "null")
    )
    .map((row) => {
      const cleaned: Record<string, string | number | null> = {};
      for (const col of TRAJECTORY_COLS) {
        if (col in row) {
          const val = row[col];
          const numCols = [
            "release_speed", "release_spin_rate", "spin_axis",
            "release_pos_x", "release_pos_y", "release_pos_z",
            "vx0", "vy0", "vz0", "ax", "ay", "az",
            "plate_x", "plate_z", "pfx_x", "pfx_z",
            "pitcher", "batter", "at_bat_number", "pitch_number", "zone",
          ];
          if (numCols.includes(col)) {
            const n = parseFloat(val);
            cleaned[col] = isNaN(n) ? null : n;
          } else {
            cleaned[col] = val;
          }
        }
      }
      return cleaned as unknown as StatcastRow;
    })
    .sort((a, b) => {
      const dateCompare = String(a.game_date).localeCompare(String(b.game_date));
      if (dateCompare !== 0) return dateCompare;
      const abCompare = Number(a.at_bat_number) - Number(b.at_bat_number);
      if (abCompare !== 0) return abCompare;
      return Number(a.pitch_number) - Number(b.pitch_number);
    });
}

async function fetchStatcastCSV(params: URLSearchParams): Promise<StatcastRow[]> {
  params.set("type", "detail");
  params.set("csv", "true");

  const url = `https://baseballsavant.mlb.com/statcast_search/csv?${params}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "TunnelVision/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Baseball Savant returned ${res.status}`);
  }

  const csv = await res.text();
  const rawRows = parseCSV(csv);
  return cleanPitchData(rawRows);
}

export async function fetchPitcherPitchesById(
  mlbamId: number,
  startDt: string,
  endDt: string
): Promise<StatcastRow[]> {
  const params = new URLSearchParams({
    hfPT: "",
    hfAB: "",
    hfGT: "R|",
    hfPR: "",
    hfZ: "",
    hfStadium: "",
    hfBBL: "",
    hfNewZones: "",
    hfPull: "",
    hfC: "",
    hfSea: "",
    hfSit: "",
    hfOuts: "",
    hfOpponent: "",
    hfSA: "",
    player_type: "pitcher",
    pitchers_lookup: String(mlbamId),
    game_date_gt: startDt,
    game_date_lt: endDt,
    group_by: "name",
    sort_col: "pitches",
    sort_order: "desc",
    min_pitches: "0",
    min_results: "0",
    min_abs: "0",
  });
  return fetchStatcastCSV(params);
}

export async function fetchGamePitches(
  startDt: string,
  endDt: string
): Promise<StatcastRow[]> {
  const params = new URLSearchParams({
    hfPT: "",
    hfAB: "",
    hfGT: "R|",
    hfPR: "",
    hfZ: "",
    hfStadium: "",
    hfBBL: "",
    hfNewZones: "",
    hfPull: "",
    hfC: "",
    hfSea: "",
    hfSit: "",
    hfOuts: "",
    hfOpponent: "",
    hfSA: "",
    player_type: "pitcher",
    game_date_gt: startDt,
    game_date_lt: endDt,
    group_by: "name",
    sort_col: "pitches",
    sort_order: "desc",
    min_pitches: "0",
    min_results: "0",
    min_abs: "0",
  });
  return fetchStatcastCSV(params);
}
