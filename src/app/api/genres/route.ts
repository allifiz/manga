import { NextResponse } from "next/server";
import { getGenreList } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const genres = await getGenreList();
    return NextResponse.json({ genres });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 },
    );
  }
}
