import { NextRequest, NextResponse } from "next/server";
import { getMangaList } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      tipe: searchParams.get("tipe") || undefined,
      genre: searchParams.get("genre") || undefined,
      genre2: searchParams.get("genre2") || undefined,
      status: searchParams.get("status") || undefined,
      orderby: searchParams.get("orderby") || undefined,
      halaman: parseInt(searchParams.get("page") || "1"),
      s: searchParams.get("s") || undefined,
    };

    const data = await getMangaList(filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch manga list" },
      { status: 500 },
    );
  }
}
