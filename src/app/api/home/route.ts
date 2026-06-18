import { NextResponse } from "next/server";
import { getHomePage } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomePage();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage data" },
      { status: 500 },
    );
  }
}
