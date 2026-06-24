import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_HOSTS = [
  "komiku.org",
  "img.komiku.org",
  "thumbnail.komiku.org",
  "bacakomik.my",
  "i0.wp.com",
  "i1.wp.com",
  "i2.wp.com",
  "i3.wp.com",
  "imageainewgeneration.lol",
  "himmga.lat",
  "gaimgame.pics",
];

function isAllowedImageHost(hostname: string): boolean {
  return ALLOWED_IMAGE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!isAllowedImageHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "Forbidden host", host: parsedUrl.hostname },
        { status: 403 },
      );
    }

    const response = await axios.get(imageUrl, {
      headers: {
        Referer: "https://bacakomik.my/",
        Origin: "https://bacakomik.my",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      responseType: "arraybuffer",
      timeout: 20000,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const rawContentType = response.headers["content-type"];
    const contentType = typeof rawContentType === "string" ? rawContentType : "image/jpeg";

    return new Response(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("Image proxy error:", error.message);
    return NextResponse.json({ error: "Failed to load image via proxy" }, { status: 500 });
  }
}
