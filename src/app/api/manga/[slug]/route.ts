import { NextRequest, NextResponse } from "next/server";
import { getMangaDetail } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getMangaDetail(slug);
    if (!data) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga detail" },
      { status: 500 }
    );
  }
}
