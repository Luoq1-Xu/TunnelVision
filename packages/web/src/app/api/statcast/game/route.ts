import { NextRequest, NextResponse } from "next/server";
import { fetchGamePitches } from "@/lib/api-server/statcast-loader";
import { reconstructFromStatcast } from "@/lib/api-server/reconstruct";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 500);

  if (!date) {
    return NextResponse.json(
      { detail: "Missing required parameter: date" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchGamePitches(date, date);
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
