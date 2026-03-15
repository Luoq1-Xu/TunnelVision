import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/api-server/player-search";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10"), 1), 25);

  if (!q || q.length < 2) {
    return NextResponse.json(
      { detail: "Query parameter 'q' must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const results = await searchPlayers(q, limit);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json(
      { detail: `Player search failed: ${e instanceof Error ? e.message : e}` },
      { status: 502 }
    );
  }
}
