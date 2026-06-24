import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ApiComic = {
  title?: string;
  slug?: string;
  cover?: string;
  type?: string;
  rating?: string;
  chapter?: string;
  latestChapter?: string;
};

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSearchUrl(baseUrl: string, keyword: string): string {
  const useProxyApi = Boolean(process.env.COMIC_API_BASE_URL && !process.env.SANKA_API_BASE_URL);
  if (useProxyApi) {
    const url = new URL(`${baseUrl}/comic/search`);
    url.searchParams.set("q", keyword);
    url.searchParams.set("_", String(Date.now()));
    return url.toString();
  }

  return `${baseUrl}/comic/bacakomik/search/${encodeURIComponent(keyword)}?_=${Date.now()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("s") || "";
    const keyword = query.trim();

    if (!keyword) {
      return NextResponse.json({ results: [], manga: [] });
    }

    const baseUrl = (
      process.env.SANKA_API_BASE_URL ||
      process.env.COMIC_API_BASE_URL ||
      "https://www.sankavollerei.web.id"
    ).replace(/\/+$/, "");

    const response = await fetch(getSearchUrl(baseUrl, keyword), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "User-Agent": process.env.COMIC_API_BASE_URL
          ? "manga-frontend/1.0"
          : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [], manga: [] });
    }

    const payload = await response.json();
    const komikList: ApiComic[] = Array.isArray(payload?.komikList)
      ? payload.komikList
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const seen = new Set<string>();
    const results = komikList
      .map((comic) => {
        const title = asText(comic.title);
        const id = asText(comic.slug) || slugify(title);
        if (!title || !id) return null;

        return {
          id,
          title,
          cover: asText(comic.cover),
          type: asText(comic.type),
          rating: asText(comic.rating),
          latestChapter: asText(comic.chapter || comic.latestChapter),
        };
      })
      .filter((comic): comic is NonNullable<typeof comic> => {
        if (!comic || seen.has(comic.id)) return false;
        seen.add(comic.id);
        return true;
      });

    return NextResponse.json({ results, manga: results });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to search manga" },
      { status: 500 },
    );
  }
}
