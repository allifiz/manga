import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchManga(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to search manga" },
      { status: 500 },
    );
  }
}
