import { NextRequest, NextResponse } from "next/server";
import { fetchPitcherPitchesById } from "@/lib/api-server/statcast-loader";
import { reconstructFromStatcast } from "@/lib/api-server/reconstruct";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const firstName = searchParams.get("first_name");
  const lastName = searchParams.get("last_name");
  const startDt = searchParams.get("start_dt");
  const endDt = searchParams.get("end_dt");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 200);

  if (!firstName || !lastName || !startDt || !endDt) {
    return NextResponse.json(
      { detail: "Missing required parameters: first_name, last_name, start_dt, end_dt" },
      { status: 400 }
    );
  }

  try {
    // Look up player ID via MLB Stats API
    const searchUrl = `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(firstName + " " + lastName)}&sportIds=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      return NextResponse.json({ detail: "Player lookup failed" }, { status: 502 });
    }
    const searchData = await searchRes.json();
    const people = searchData.people || [];
    if (people.length === 0) {
      return NextResponse.json(
        { detail: `Player not found: ${firstName} ${lastName}` },
        { status: 404 }
      );
    }
    const mlbamId = people[0].id;

    const data = await fetchPitcherPitchesById(mlbamId, startDt, endDt);
    if (data.length === 0) return NextResponse.json([]);

    const pitches = reconstructFromStatcast(data.slice(0, limit));
    return NextResponse.json(pitches);
  } catch (e) {
    return NextResponse.json(
      { detail: `Failed to fetch Statcast data: ${e instanceof Error ? e.message : e}` },
      { status: 502 }
    );
  }
}
