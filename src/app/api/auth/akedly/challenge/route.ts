import { NextResponse } from "next/server";
import { fetchAkedlyChallenge, isAkedlyConfigured } from "@/lib/akedly";

export async function GET() {
  try {
    if (!isAkedlyConfigured()) {
      return NextResponse.json({ error: "akedly_not_configured" }, { status: 503 });
    }

    const challenge = await fetchAkedlyChallenge();
    return NextResponse.json(challenge);
  } catch (err) {
    console.error("akedly challenge error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "challenge_failed" },
      { status: 502 },
    );
  }
}
