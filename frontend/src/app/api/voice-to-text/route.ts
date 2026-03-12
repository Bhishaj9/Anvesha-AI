import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const language = formData.get("language") as string || "en-IN";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Forward as multipart to backend
    const backendForm = new FormData();
    backendForm.append("file", file);

    const response = await fetch(
      `${BACKEND_URL}/voice-to-text?language=${encodeURIComponent(language)}`,
      {
        method: "POST",
        body: backendForm,
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Voice-to-text proxy error:", error);
    return NextResponse.json(
      { error: "Failed to reach the voice service." },
      { status: 502 }
    );
  }
}
