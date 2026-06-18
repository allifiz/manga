import { NextRequest, NextResponse } from "next/server";
import { getChapterPages } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");
    const uParam = searchParams.get("u");

    let url = urlParam || "";
    if (!url && uParam) {
      try {
        const decoded = decodeURIComponent(uParam);
        url = Buffer.from(decoded, "base64").toString("utf8");
      } catch (e) {
        return NextResponse.json({ error: "Invalid encoded url" }, { status: 400 });
      }
    }

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    const data = await getChapterPages(url);
    if (!data) {
      return NextResponse.json({ error: "Failed to load chapter" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch chapter pages" }, { status: 500 });
  }
}
