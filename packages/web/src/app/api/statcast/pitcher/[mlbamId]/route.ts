import { NextRequest, NextResponse } from "next/server";
import { fetchPitcherPitchesById } from "@/lib/api-server/statcast-loader";
import { reconstructFromStatcast } from "@/lib/api-server/reconstruct";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlbamId: string }> }
) {
  const { mlbamId: mlbamIdStr } = await params;
  const mlbamId = parseInt(mlbamIdStr);
  if (isNaN(mlbamId)) {
    return NextResponse.json({ detail: "Invalid mlbamId" }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const startDt = searchParams.get("start_dt");
  const endDt = searchParams.get("end_dt");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20"), 1), 200);

  if (!startDt || !endDt) {
    return NextResponse.json(
      { detail: "Missing required parameters: start_dt, end_dt" },
      { status: 400 }
    );
  }

  try {
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
