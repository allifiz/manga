import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Security check: Only proxy images from trusted domains
    try {
      const parsedUrl = new URL(imageUrl);
      const allowedHosts = ["komiku.org", "img.komiku.org", "thumbnail.komiku.org"];
      const isAllowed = allowedHosts.some(
        (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith("." + host)
      );

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Forbidden host" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch image from target
    const response = await axios.get(imageUrl, {
      headers: {
        "Referer": "https://komiku.org/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
      },
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const rawContentType = response.headers["content-type"];
    const contentType = typeof rawContentType === "string" ? rawContentType : "image/jpeg";

    return new Response(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Image proxy error:", error.message);
    return NextResponse.json(
      { error: "Failed to load image via proxy" },
      { status: 500 }
    );
  }
}
