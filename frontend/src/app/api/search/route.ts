import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const region = searchParams.get("region") || "in-en";

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const backendUrl = `${BACKEND_URL}/search?q=${encodeURIComponent(q)}&region=${encodeURIComponent(region)}`;
    const response = await fetch(backendUrl, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search proxy error:", error);
    return NextResponse.json(
      { error: "Failed to reach the backend search service. Is it running?" },
      { status: 502 }
    );
  }
}
