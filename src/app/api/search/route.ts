import { NextRequest, NextResponse } from "next/server";
import { searchManga } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("s") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);

    if (!query.trim()) {
      return NextResponse.json({ results: [], manga: [] });
    }

    const results = await searchManga(query.trim(), page);
    return NextResponse.json({ results, manga: results });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to search manga" },
      { status: 500 },
    );
  }
}
