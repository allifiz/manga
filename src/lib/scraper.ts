import axios, { AxiosInstance } from "axios";

const API_BASE_URL = (
  process.env.SANKA_API_BASE_URL ||
  process.env.COMIC_API_BASE_URL ||
  "https://www.sankavollerei.web.id"
).replace(/\/+$/, "");

const API_PREFIX = "/comic/komikindo";
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
type QueryValue = string | number | boolean | undefined;
type QueryParams = Record<string, QueryValue>;
type DetailChapter = MangaDetail["chapters"][number];

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      Accept: "application/json",
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

function normalizeFilterValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value
    .replace(/^\/+|\/+$/g, "")
    .replace(/^genre\//, "")
    .toLowerCase()
    .trim();

  if (!clean || clean === "all" || clean === "semua") return undefined;
  if (["end", "ended", "complete", "completed", "tamat"].includes(clean)) return "tamat";
  if (["on-going", "ongoing", "berjalan"].includes(clean)) return "ongoing";
  return clean;
}

function firstString(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function firstNestedString(record: ApiRecord, paths: string[][]): string {
  for (const path of paths) {
    let current: unknown = record;
    for (const key of path) {
      if (!isRecord(current)) {
        current = undefined;
        break;
      }
      current = current[key];
    }
    const value = asString(current);
    if (value) return value;
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

function unwrapData(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  for (const key of ["data", "result", "results", "items", "comics", "comic", "manga", "list"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = unwrapData(value);
      if (Array.isArray(nested)) return nested;
    }
  }
  return payload;
}

function slugFromUrl(value: string): string {
  const clean = value.split("?")[0].replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  return slugify(parts[parts.length - 1] || value);
}

function itemSlug(record: ApiRecord): string {
  const direct = firstString(record, ["slug", "endpoint", "id", "comicId", "mangaId"]);
  if (direct && !direct.startsWith("http")) return slugify(direct);
  const url = firstString(record, ["url", "link", "href", "path", "chapterUrl"]);
  if (url) return slugFromUrl(url);
  return slugify(firstString(record, ["title", "name", "judul", "comicTitle", "mangaTitle"]));
}

function chapterUrl(mangaSlug: string, chapterSlug: string): string {
  return `/komik/${mangaSlug}/${chapterSlug}`;
}

function collectComicRecords(value: unknown, depth = 0): ApiRecord[] {
  if (depth > 8) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectComicRecords(item, depth + 1));
  if (!isRecord(value)) return [];

  const nested = firstArray(value, ["data", "result", "results", "items", "comics", "comic", "manga", "list"]);
  if (nested.length) return collectComicRecords(nested, depth + 1);

  const title = firstString(value, ["title", "name", "judul", "comicTitle", "mangaTitle"]);
  if (title || itemSlug(value)) return [value];

  return Object.values(value).flatMap((child) => collectComicRecords(child, depth + 1));
}

function collectImageUrls(value: unknown, depth = 0): string[] {
  if (depth > 8) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectImageUrls(item, depth + 1));
  if (typeof value === "string") {
    return /^https?:\/\//i.test(value) && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(value) ? [value] : [];
  }
  if (!isRecord(value)) return [];

  const direct = firstString(value, ["url", "image", "imageUrl", "src", "link"]);
  const directImages = direct ? collectImageUrls(direct, depth + 1) : [];
  return [...directImages, ...Object.values(value).flatMap((child) => collectImageUrls(child, depth + 1))];
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
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return raw
    .map((chapter) => {
      if (!isRecord(chapter)) return null;
      const title = firstString(chapter, ["title", "name", "chapter", "chapterTitle", "number"]);
      const slug = itemSlug(chapter) || slugify(title);
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
  const data = isRecord(record.data) ? record.data : record;
  const slug = itemSlug(data) || itemSlug(record);
  const title = firstString(data, ["title", "name", "judul", "comicTitle", "mangaTitle"]) || slugToTitle(slug);
  if (!slug || !title) return null;

  const cover =
    firstNestedString(data, [["cover"], ["thumbnail"], ["image"], ["imageUrl"], ["poster"], ["coverImage"], ["thumb"], ["img"]]) ||
    firstNestedString(record, [["cover"], ["thumbnail"], ["image"], ["imageUrl"], ["poster"], ["coverImage"], ["thumb"], ["img"]]) ||
    PLACEHOLDER_COVER;

  const chapters = normalizeChapters(data.chapters || data.chapter || data.latestChapter || record.chapters || record.chapter, slug).slice(0, 3);

  return {
    id: slug,
    title,
    cover,
    chapters,
    rating: firstString(data, ["rating", "score"]),
    isNew: chapters.length > 0,
    type: firstString(data, ["type", "format", "tipe"]),
    status: firstString(data, ["status"]),
    genres: normalizeGenres(data.genres || data.genre || record.genres),
  };
}

function mapItems(payload: unknown, limit = PAGE_SIZE): MangaItem[] {
  return uniqueById(
    collectComicRecords(unwrapData(payload))
      .map(mangaItemFromRecord)
      .filter(isPresent),
  ).slice(0, limit);
}

function getTotalPages(payload: unknown, currentPage: number, itemCount: number): number {
  if (!isRecord(payload)) return itemCount >= PAGE_SIZE ? currentPage + 1 : currentPage;
  const candidates = [payload.totalPages, payload.lastPage, payload.total_page, payload.totalPage, payload.pages];
  if (isRecord(payload.pagination)) candidates.push(payload.pagination.totalPages, payload.pagination.lastPage, payload.pagination.total_page);
  if (isRecord(payload.meta)) candidates.push(payload.meta.totalPages, payload.meta.lastPage, payload.meta.total_page);
  const total = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0);
  return total || (itemCount >= PAGE_SIZE ? currentPage + 1 : currentPage);
}

async function getJson(path: string, params?: QueryParams): Promise<unknown | null> {
  try {
    const { data, status, headers } = await api.get(path, { params });
    const contentType = String(headers["content-type"] || "");
    if (status >= 200 && status < 300 && (contentType.includes("json") || typeof data === "object")) return data;
  } catch (error) {
    console.error(`Sankavollerei Komikindo API failed: ${path}`, error);
  }
  return null;
}

function buildLibraryParams(filters: MangaListFilters, page: number): QueryParams {
  const params: QueryParams = { page, limit: PAGE_SIZE };
  const type = normalizeFilterValue(filters.tipe);
  const status = normalizeFilterValue(filters.status);
  const genre = normalizeFilterValue(filters.genre || filters.genre2);
  const search = filters.s?.trim();
  if (type) params.type = type;
  if (status) params.status = status;
  if (genre) params.genre = genre;
  if (search) params.search = search;
  return params;
}

function fallbackHome(): HomePageData {
  return { featured: [], recommendations: [], updates: [], popular: [] };
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const [latestPage1, latestPage2, library] = await Promise.all([
      getJson(`${API_PREFIX}/latest/1`),
      getJson(`${API_PREFIX}/latest/2`),
      getJson(`${API_PREFIX}/library`, { page: 1, limit: 20 }),
    ]);

    const latestItems = uniqueById([...mapItems(latestPage1, 20), ...mapItems(latestPage2, 20), ...mapItems(library, 20)]);

    return {
      featured: latestItems.slice(0, 5),
      recommendations: latestItems.slice(5, 11),
      updates: latestItems.slice(0, 10),
      popular: latestItems.slice(0, 12),
    };
  } catch (error) {
    console.error("Error fetching homepage from Sankavollerei Komikindo API:", error);
    return fallbackHome();
  }
}

function detailChapters(payload: unknown, mangaSlug: string): MangaDetail["chapters"] {
  const chapters = normalizeChapters(
    isRecord(payload) ? payload.chapters || payload.chapterList || payload.episodes || payload.data : payload,
    mangaSlug,
  );

  return chapters.map<DetailChapter>((chapter, index) => ({ ...chapter, isNew: index < 3 }));
}

function detailFromPayload(payload: unknown, slug: string): MangaDetail | null {
  const records = collectComicRecords(payload);
  const record = records[0] || (isRecord(unwrapData(payload)) ? unwrapData(payload) : null);
  if (!record) return null;

  const data = isRecord(record.data) ? record.data : record;
  const id = itemSlug(data) || slug;
  const title = firstString(data, ["title", "name", "judul", "comicTitle", "mangaTitle"]) || slugToTitle(slug);
  const cover =
    firstNestedString(data, [["cover"], ["thumbnail"], ["image"], ["imageUrl"], ["poster"], ["coverImage"], ["thumb"], ["img"]]) || PLACEHOLDER_COVER;
  const genreNames = normalizeGenres(data.genres || data.genre).map((name) => ({ name, slug: slugify(name) }));
  const chapters = detailChapters(data.chapters || data.chapterList || data.episodes || unwrapData(payload), id);

  return {
    id,
    title,
    altTitle: firstString(data, ["alternativeTitle", "altTitle", "nativeTitle", "otherTitle"]),
    cover,
    rating: firstString(data, ["rating", "score"]),
    views: firstString(data, ["views", "view"]),
    chapters_count: String(chapters.length || firstString(data, ["chapters_count", "totalChapters"])),
    synopsis: firstString(data, ["synopsis", "description", "summary"]),
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
    if (!payload) return null;

    const data = unwrapData(payload);
    const images = uniqueById(collectImageUrls(data).map((image) => ({ id: image }))).map((item) => item.id);
    const title = isRecord(data) ? firstString(data, ["title", "comicTitle", "mangaTitle", "name"]) : "";
    const chapter = isRecord(data) ? firstString(data, ["chapter", "chapterTitle", "title", "name"]) : "";

    return {
      title: title || slugToTitle(chapterSlug.replace(/-chapter-.+$/i, "")),
      chapter: chapter || slugToTitle(chapterSlug),
      images,
      mangaSlug: chapterSlug.replace(/-chapter-.+$/i, ""),
    };
  } catch (error) {
    console.error("Error fetching chapter pages from Sankavollerei Komikindo API:", error);
    return null;
  }
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];
  const payload = await getJson(`${API_PREFIX}/search/${encodeURIComponent(cleanQuery)}/${page}`);

  return mapItems(payload, PAGE_SIZE).map((item) => ({
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

  try {
    const payload = search
      ? await getJson(`${API_PREFIX}/search/${encodeURIComponent(search)}/${currentPage}`)
      : await getJson(`${API_PREFIX}/library`, buildLibraryParams(filters, currentPage));

    const manga = mapItems(payload, PAGE_SIZE);
    const totalPages = getTotalPages(payload, currentPage, manga.length);

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
    console.error("Error fetching manga list from Sankavollerei Komikindo API:", error);
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
    const raw = Array.isArray(payload) ? payload : isRecord(payload) ? firstArray(payload, ["data", "results", "genres", "genre"]) : [];
    return raw
      .map((genre) => {
        const name = typeof genre === "string" ? genre : isRecord(genre) ? firstString(genre, ["name", "title", "genre", "slug"]) : "";
        const slug = isRecord(genre) ? firstString(genre, ["slug", "id", "endpoint"]) || slugify(name) : slugify(name);
        return name ? { name, slug } : null;
      })
      .filter(isPresent);
  } catch (error) {
    console.error("Error fetching genre list from Sankavollerei Komikindo API:", error);
    return [];
  }
}
