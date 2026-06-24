import { NextRequest, NextResponse } from "next/server";
import { getChapterPages, ChapterPage } from "@/lib/scraper";

export const dynamic = "force-dynamic";

const USE_PROXY_API = Boolean(process.env.COMIC_API_BASE_URL && !process.env.SANKA_API_BASE_URL);
const API_BASE_URL = (
  process.env.SANKA_API_BASE_URL ||
  process.env.COMIC_API_BASE_URL ||
  "https://www.sankavollerei.web.id"
).replace(/\/+$/, "");

function chapterEndpoint(chapterSlug: string): string {
  if (USE_PROXY_API) return `${API_BASE_URL}/comic/chapter/${encodeURIComponent(chapterSlug)}?_=${Date.now()}`;
  return `${API_BASE_URL}/comic/bacakomik/chapter/${encodeURIComponent(chapterSlug)}?_=${Date.now()}`;
}

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function firstString(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function slugFromUrl(value: string): string {
  const clean = safeDecode(value).split("?")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  return slugify(parts[parts.length - 1] || value);
}

function parseChapterCandidates(input: string): string[] {
  const clean = safeDecode(input.trim());
  const candidates = new Set<string>();

  const legacyMatch = clean.match(/\/komik\/[^/]+\/([^/?#]+)/);
  if (legacyMatch?.[1]) candidates.add(legacyMatch[1]);

  const chapterMatch = clean.match(/\/chapter\/([^/?#]+)/);
  if (chapterMatch?.[1]) candidates.add(chapterMatch[1]);

  const slugMatch = clean.match(/([^/]+-chapter-[^/?#]+)/i);
  if (slugMatch?.[1]) candidates.add(slugMatch[1]);

  if (/^https?:\/\//i.test(clean)) candidates.add(slugFromUrl(clean));
  candidates.add(slugify(clean));

  return Array.from(candidates).filter(Boolean);
}

function isProbablyImageUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  if (/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(value)) return true;
  return /(blogspot|bp\.blogspot|googleusercontent|wp-content|uploads|cdn|img|image|manga|komik|chapter|himmga|gaimgame|imageainewgeneration)/i.test(value);
}

function collectImageUrls(value: unknown, depth = 0): string[] {
  if (depth > 10) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectImageUrls(item, depth + 1));
  if (typeof value === "string") return isProbablyImageUrl(value) ? [value] : [];
  if (!isRecord(value)) return [];

  const preferredKeys = [
    "images",
    "imageUrls",
    "image_urls",
    "chapterImages",
    "chapter_images",
    "pages",
    "pageImages",
    "page_images",
    "url",
    "image",
    "imageUrl",
    "image_url",
    "src",
    "link",
  ];

  const preferred = preferredKeys.flatMap((key) => collectImageUrls(value[key], depth + 1));
  const nested = Object.entries(value)
    .filter(([key]) => !preferredKeys.includes(key))
    .flatMap(([, child]) => collectImageUrls(child, depth + 1));

  return [...preferred, ...nested];
}

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

async function getDirectChapterFallback(url: string): Promise<ChapterPage | null> {
  const candidates = parseChapterCandidates(url);

  for (const chapterSlug of candidates) {
    try {
      const response = await fetch(chapterEndpoint(chapterSlug), {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          "User-Agent": USE_PROXY_API
            ? "manga-frontend/1.0"
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) continue;
      const payload = await response.json();
      const images = uniqueStrings(collectImageUrls(payload));
      if (!images.length) continue;

      const navigation = isRecord(payload.navigation) ? payload.navigation : {};
      const title = isRecord(payload) ? firstString(payload, ["title", "comicTitle", "mangaTitle", "name"]) : "";
      const chapter = isRecord(payload) ? firstString(payload, ["chapter", "chapterTitle", "title", "name"]) : "";

      return {
        title: title || slugToTitle(chapterSlug.replace(/-chapter-.+$/i, "")),
        chapter: chapter || slugToTitle(chapterSlug),
        images,
        prevChapter: firstString(navigation, ["prev"]) || undefined,
        nextChapter: firstString(navigation, ["next"]) || undefined,
        mangaSlug: chapterSlug.replace(/-chapter-.+$/i, ""),
      };
    } catch (error) {
      console.error(`${USE_PROXY_API ? "Direct apimanga" : "Direct BacaKomik"} chapter fallback failed:`, error);
    }
  }

  return null;
}

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
      } catch {
        return NextResponse.json({ error: "Invalid encoded url" }, { status: 400 });
      }
    }

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
    }

    const scraperData = await getChapterPages(url);
    const data = scraperData?.images?.length ? scraperData : await getDirectChapterFallback(url);

    if (!data) {
      return NextResponse.json({ error: "Failed to load chapter" }, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch chapter pages" }, { status: 500 });
  }
}
