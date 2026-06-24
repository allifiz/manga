import axios, { AxiosInstance } from "axios";

const API_BASE_URL = (
  process.env.SANKA_API_BASE_URL ||
  process.env.COMIC_API_BASE_URL ||
  "https://www.sankavollerei.web.id"
).replace(/\/+$/, "");

const API_PREFIX = "/comic/bacakomik";
const PAGE_SIZE = 10;
const PLACEHOLDER_COVER = "https://via.placeholder.com/300x450/1A1A1A/666?text=No+Cover";

export interface MangaItem {
  id: string;
  title: string;
  cover: string;
  chapters?: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
  type?: string;
  status?: string;
  genres?: string[];
}

export interface MangaDetail {
  id: string;
  title: string;
  altTitle: string;
  cover: string;
  rating: string;
  views: string;
  chapters_count: string;
  synopsis: string;
  genres: { name: string; slug: string }[];
  author: string;
  artist: string;
  format: string;
  type: string;
  chapters: { number: string; time: string; url: string; isNew?: boolean }[];
}

export interface ChapterPage {
  title: string;
  chapter: string;
  images: string[];
  prevChapter?: string;
  nextChapter?: string;
  mangaSlug?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  cover: string;
  type?: string;
  rating?: string;
  latestChapter?: string;
}

export interface HomePageData {
  featured: MangaItem[];
  recommendations: MangaItem[];
  updates: MangaItem[];
  popular: MangaItem[];
}

export interface MangaListFilters {
  tipe?: string;
  genre?: string;
  genre2?: string;
  status?: string;
  orderby?: string;
  halaman?: number;
  s?: string;
}

export interface MangaListResponse {
  manga: MangaItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type ApiRecord = Record<string, unknown>;
type DetailChapter = MangaDetail["chapters"][number];

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
    validateStatus: (status) => status >= 200 && status < 500,
  });
}

const api = createClient(API_BASE_URL);

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function asString(value: unknown): string {
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

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function firstString(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    const text = asString(value);
    if (text) return text;
  }
  return "";
}

function firstArray(record: ApiRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeFilterValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value
    .replace(/^\/+|\/+$/g, "")
    .replace(/^genre\//, "")
    .toLowerCase()
    .trim();

  if (!clean || clean === "all" || clean === "semua") return undefined;
  if (["manga", "manhwa", "manhua"].includes(clean)) return clean;
  if (["end", "ended", "complete", "completed", "tamat"].includes(clean)) return "completed";
  if (["on-going", "ongoing", "berjalan"].includes(clean)) return "ongoing";
  return clean;
}

function slugFromUrl(value: string): string {
  const clean = value.split("?")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  return slugify(parts[parts.length - 1] || value);
}

function itemSlug(record: ApiRecord): string {
  const direct = firstString(record, ["slug", "endpoint", "id", "comicId", "mangaId"]);
  if (direct && !direct.startsWith("http")) return slugify(direct);
  const url = firstString(record, ["url", "link", "href", "path"]);
  if (url) return slugFromUrl(url);
  return slugify(firstString(record, ["title", "name", "judul", "comicTitle", "mangaTitle"]));
}

function extractChapterSlug(value: string, mangaSlug: string): string {
  const clean = value.trim();
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean) || clean.includes("/")) return slugFromUrl(clean);
  const slug = slugify(clean);
  if (slug.includes("chapter")) return slug;

  const numberMatch = clean.match(/(?:ch\.?|chapter)?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (numberMatch?.[1]) return `${mangaSlug}-chapter-${numberMatch[1].replace(/\./g, "-")}`;
  return slug;
}

function chapterUrl(mangaSlug: string, chapterSlug: string): string {
  return `/komik/${mangaSlug}/${chapterSlug}`;
}

function unwrapPayload(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  if (Array.isArray(payload.komikList)) return payload.komikList;
  if (Array.isArray(payload.images)) return payload.images;
  if (isRecord(payload.data)) return payload.data;
  if (isRecord(payload.result)) return payload.result;
  return payload;
}

function getList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const direct = firstArray(payload, ["komikList", "mangaList", "comicList", "results", "items", "data", "list"]);
  if (direct.length) return direct;
  const unwrapped = unwrapPayload(payload);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

function uniqueById<T extends { id: string; title?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || item.title || "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeGenres(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (isRecord(item)) return firstString(item, ["name", "title", "genre", "slug"]);
      return "";
    })
    .filter(Boolean);
}

function normalizeChapters(value: unknown, mangaSlug: string): { number: string; time: string; url: string }[] {
  const raw = Array.isArray(value) ? value : isRecord(value) ? getList(value) : [];

  return raw
    .map((chapter) => {
      if (!isRecord(chapter)) {
        const text = asString(chapter);
        const slug = extractChapterSlug(text, mangaSlug);
        return slug ? { number: text || slugToTitle(slug), time: "", url: chapterUrl(mangaSlug, slug) } : null;
      }

      const title = firstString(chapter, ["title", "name", "chapter", "chapterTitle", "number"]);
      const slugSource = firstString(chapter, ["slug", "endpoint", "url", "link", "href", "id"]) || title;
      const slug = extractChapterSlug(slugSource, mangaSlug);
      if (!title && !slug) return null;

      return {
        number: title || slugToTitle(slug),
        time: firstString(chapter, ["time", "date", "updatedAt", "createdAt", "releaseDate"]),
        url: chapterUrl(mangaSlug, slug),
      };
    })
    .filter(isPresent);
}

function mangaItemFromRecord(record: ApiRecord): MangaItem | null {
  const slug = itemSlug(record);
  const title = firstString(record, ["title", "name", "judul", "comicTitle", "mangaTitle"]) || slugToTitle(slug);
  if (!slug || !title) return null;

  const cover = firstString(record, ["cover", "thumbnail", "image", "imageUrl", "poster", "coverImage", "thumb", "img"]) || PLACEHOLDER_COVER;
  const latestChapter = firstString(record, ["chapter", "latestChapter", "latest_chapter", "lastChapter"]);
  const chapterSlug = latestChapter ? extractChapterSlug(latestChapter, slug) : "";
  const chapters = chapterSlug
    ? [{ number: latestChapter, time: firstString(record, ["date", "time", "updatedAt"]), url: chapterUrl(slug, chapterSlug) }]
    : normalizeChapters(record.chapters || record.chapterList || record.episodes, slug).slice(0, 3);

  return {
    id: slug,
    title,
    cover,
    chapters,
    rating: firstString(record, ["rating", "score"]),
    isNew: Boolean(latestChapter || chapters.length),
    type: firstString(record, ["type", "format", "tipe"]),
    status: firstString(record, ["status"]),
    genres: normalizeGenres(record.genres || record.genre),
  };
}

function mapItems(payload: unknown, limit = PAGE_SIZE): MangaItem[] {
  return uniqueById(
    getList(payload)
      .map((item) => (isRecord(item) ? mangaItemFromRecord(item) : null))
      .filter(isPresent),
  ).slice(0, limit);
}

function paginateItems<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const start = Math.max(0, page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

async function getJson(path: string): Promise<unknown | null> {
  try {
    const { data, status, headers } = await api.get(path, {
      params: { _: Date.now() },
    });
    const contentType = String(headers["content-type"] || "");
    if (status >= 200 && status < 300 && (contentType.includes("json") || typeof data === "object")) return data;
  } catch (error) {
    console.error(`BacaKomik API failed: ${path}`, error);
  }
  return null;
}

function fallbackHome(): HomePageData {
  return { featured: [], recommendations: [], updates: [], popular: [] };
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const [latest, popular, recommended, top] = await Promise.all([
      getJson(`${API_PREFIX}/latest`),
      getJson(`${API_PREFIX}/populer`),
      getJson(`${API_PREFIX}/recomen`),
      getJson(`${API_PREFIX}/top`),
    ]);

    const latestItems = mapItems(latest, 24);
    const popularItems = mapItems(popular, 24);
    const recommendedItems = mapItems(recommended, 24);
    const topItems = mapItems(top, 24);

    return {
      featured: uniqueById([...popularItems, ...topItems, ...latestItems]).slice(0, 5),
      recommendations: uniqueById([...recommendedItems, ...topItems, ...popularItems]).slice(0, 10),
      updates: latestItems.slice(0, 10),
      popular: uniqueById([...popularItems, ...topItems]).slice(0, 12),
    };
  } catch (error) {
    console.error("Error fetching homepage from BacaKomik API:", error);
    return fallbackHome();
  }
}

function detailChapters(payload: unknown, mangaSlug: string): MangaDetail["chapters"] {
  const source = isRecord(payload)
    ? payload.chapters || payload.chapterList || payload.episodes || payload.chapter || payload.komikList || payload.data
    : payload;
  return normalizeChapters(source, mangaSlug).map<DetailChapter>((chapter, index) => ({ ...chapter, isNew: index < 3 }));
}

function detailFromPayload(payload: unknown, slug: string): MangaDetail | null {
  if (!payload || !isRecord(payload)) return null;
  const data = isRecord(payload.data) ? payload.data : isRecord(payload.detail) ? payload.detail : payload;
  const id = itemSlug(data) || slug;
  const title = firstString(data, ["title", "name", "judul", "comicTitle", "mangaTitle"]) || slugToTitle(slug);
  const cover = firstString(data, ["cover", "thumbnail", "image", "imageUrl", "poster", "coverImage", "thumb", "img"]) || PLACEHOLDER_COVER;
  const genreNames = normalizeGenres(data.genres || data.genre).map((name) => ({ name, slug: slugify(name) }));
  const chapters = detailChapters(data, id);

  return {
    id,
    title,
    altTitle: firstString(data, ["alternativeTitle", "altTitle", "nativeTitle", "otherTitle"]),
    cover,
    rating: firstString(data, ["rating", "score"]),
    views: firstString(data, ["views", "view"]),
    chapters_count: String(chapters.length || firstString(data, ["chapters_count", "totalChapters"])),
    synopsis: firstString(data, ["synopsis", "description", "summary", "sinopsis"]),
    genres: genreNames,
    author: firstString(data, ["author"]),
    artist: firstString(data, ["artist"]),
    format: firstString(data, ["format", "type", "tipe"]),
    type: firstString(data, ["status"]),
    chapters,
  };
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  const cleanSlug = slugify(slug);
  const payload = await getJson(`${API_PREFIX}/detail/${cleanSlug}`);
  return detailFromPayload(payload, cleanSlug);
}

function parseChapterInput(input: string): string | null {
  const clean = input.trim();
  const legacyMatch = clean.match(/\/komik\/[^/]+\/([^/?#]+)/);
  if (legacyMatch) return legacyMatch[1];
  const chapterMatch = clean.match(/\/chapter\/([^/?#]+)/);
  if (chapterMatch) return chapterMatch[1];
  const slugMatch = clean.match(/([^/]+-chapter-[^/?#]+)/i);
  if (slugMatch) return slugMatch[1];
  return slugify(clean);
}

export async function getChapterPages(url: string): Promise<ChapterPage | null> {
  const chapterSlug = parseChapterInput(url);
  if (!chapterSlug) return null;

  try {
    const payload = await getJson(`${API_PREFIX}/chapter/${chapterSlug}`);
    if (!payload || !isRecord(payload)) return null;

    const rawImages = Array.isArray(payload.images) ? payload.images : Array.isArray(payload.data) ? payload.data : [];
    const images = rawImages.map(asString).filter((image) => /^https?:\/\//i.test(image));
    const navigation = isRecord(payload.navigation) ? payload.navigation : {};

    return {
      title: firstString(payload, ["title", "comicTitle", "mangaTitle", "name"]) || slugToTitle(chapterSlug.replace(/-chapter-.+$/i, "")),
      chapter: firstString(payload, ["chapter", "chapterTitle", "title", "name"]) || slugToTitle(chapterSlug),
      images,
      prevChapter: asString(navigation.prev) || undefined,
      nextChapter: asString(navigation.next) || undefined,
      mangaSlug: chapterSlug.replace(/-chapter-.+$/i, ""),
    };
  } catch (error) {
    console.error("Error fetching chapter pages from BacaKomik API:", error);
    return null;
  }
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];
  const payload = await getJson(`${API_PREFIX}/search/${encodeURIComponent(cleanQuery)}`);
  const pageItems = paginateItems(mapItems(payload, 100), page);

  return pageItems.map((item) => ({
    id: item.id,
    title: item.title,
    cover: item.cover,
    type: item.type,
    rating: item.rating,
    latestChapter: item.chapters?.[0]?.number,
  }));
}

export async function getMangaList(filters: MangaListFilters): Promise<MangaListResponse> {
  const currentPage = Math.max(1, filters.halaman || 1);
  const search = filters.s?.trim();
  const type = normalizeFilterValue(filters.tipe);
  const genre = normalizeFilterValue(filters.genre || filters.genre2);
  const orderby = normalizeFilterValue(filters.orderby);

  try {
    let payload: unknown | null;

    if (search) {
      payload = await getJson(`${API_PREFIX}/search/${encodeURIComponent(search)}`);
    } else if (genre === "berwarna" || genre === "komikberwarna") {
      payload = await getJson(`${API_PREFIX}/komikberwarna/${currentPage}`);
    } else if (genre) {
      payload = await getJson(`${API_PREFIX}/genre/${encodeURIComponent(genre)}`);
    } else if (type && ["manga", "manhwa", "manhua"].includes(type)) {
      payload = await getJson(`${API_PREFIX}/only/${type}`);
    } else if (orderby === "popular" || orderby === "populer") {
      payload = await getJson(`${API_PREFIX}/populer`);
    } else if (orderby === "top") {
      payload = await getJson(`${API_PREFIX}/top`);
    } else {
      payload = await getJson(`${API_PREFIX}/latest`);
    }

    const allItems = mapItems(payload, 200);
    const manga = genre === "berwarna" || genre === "komikberwarna" ? allItems.slice(0, PAGE_SIZE) : paginateItems(allItems, currentPage);
    const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));

    return {
      manga,
      pagination: {
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching manga list from BacaKomik API:", error);
    return {
      manga: [],
      pagination: {
        currentPage,
        totalPages: currentPage,
        hasNextPage: false,
        hasPrevPage: currentPage > 1,
      },
    };
  }
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const payload = await getJson(`${API_PREFIX}/genres`);
    const raw = Array.isArray(payload) ? payload : isRecord(payload) ? firstArray(payload, ["genres", "genre", "data", "results", "items"]) : [];
    return raw
      .map((genre) => {
        const name = typeof genre === "string" ? genre : isRecord(genre) ? firstString(genre, ["name", "title", "genre", "slug"]) : "";
        const slug = isRecord(genre) ? firstString(genre, ["slug", "id", "endpoint", "value"]) || slugify(name) : slugify(name);
        return name ? { name, slug } : null;
      })
      .filter(isPresent);
  } catch (error) {
    console.error("Error fetching genre list from BacaKomik API:", error);
    return [];
  }
}
