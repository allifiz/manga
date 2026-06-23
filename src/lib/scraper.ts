import axios, { AxiosInstance } from "axios";

const API_BASE_URL = "https://komiku-rest-api.vercel.app";
const KOMIKU_BASE_URL = "https://komiku.org";

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  });
}

const api = createClient(API_BASE_URL);

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

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveKomikuUrl(url?: string): string {
  const clean = asString(url);
  if (!clean) return "";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("/")) return `${KOMIKU_BASE_URL}${clean}`;
  return `${KOMIKU_BASE_URL}/${clean}`;
}

function resolveApiPath(path?: string): string {
  const clean = asString(path);
  if (!clean) return "";
  if (clean.startsWith(API_BASE_URL)) return clean.replace(API_BASE_URL, "");
  if (clean.startsWith("http")) {
    try {
      return new URL(clean).pathname;
    } catch {
      return clean;
    }
  }
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSlug(value?: unknown): string {
  const raw = asString(value);
  if (!raw) return "";
  const withoutDomain = raw.replace(KOMIKU_BASE_URL, "").replace(API_BASE_URL, "");
  const clean = withoutDomain.split("?")[0].replace(/\/$/, "");
  const detailMatch = clean.match(/\/detail-komik\/([^/]+)/);
  if (detailMatch) return detailMatch[1];
  const mangaMatch = clean.match(/\/manga\/([^/]+)/);
  if (mangaMatch) return mangaMatch[1];
  const chapterMatch = clean.match(/\/([^/]+)-chapter-/);
  if (chapterMatch) return chapterMatch[1];
  return clean.split("/").filter(Boolean).pop() || raw;
}

function normalizeFilterValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value
    .replace(KOMIKU_BASE_URL, "")
    .replace(API_BASE_URL, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^genre\//, "")
    .toLowerCase();

  if (!clean || clean === "all" || clean === "semua") return undefined;
  if (["end", "ended", "complete", "completed", "tamat"].includes(clean)) return "tamat";
  if (["on-going", "ongoing"].includes(clean)) return "ongoing";
  return clean;
}

function normalizeGenreText(value?: string | null): string {
  return normalizeFilterValue(value)?.replace(/\s+/g, "-") || "";
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

function firstString(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return "";
}

function pickItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const directKeys = ["data", "results", "items", "manga"];
  for (const key of directKeys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = pickItems(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function chapterFromApi(value: unknown): { number: string; time: string; url: string } | null {
  if (!isRecord(value)) return null;
  const title = firstString(value, ["title", "chapterTitle", "latestChapterTitle", "name", "text"]);
  const url = firstString(value, ["apiLink", "apiChapterLink", "apiUrl", "url", "href", "link", "latestChapterLink"]);
  if (!title && !url) return null;

  return {
    number: title || "Chapter",
    time: firstString(value, ["time", "date", "updateTime", "updatedAt"]),
    url: resolveApiPath(url) || resolveKomikuUrl(url),
  };
}

function chaptersFromApi(record: ApiRecord): { number: string; time: string; url: string }[] {
  const chapters: { number: string; time: string; url: string }[] = [];
  const latestObject = chapterFromApi(record.latestChapter);
  if (latestObject) chapters.push(latestObject);

  const firstObject = chapterFromApi(record.firstChapter);
  if (firstObject && !chapters.some((chapter) => chapter.url === firstObject.url)) {
    chapters.push(firstObject);
  }

  const latestTitle = firstString(record, ["latestChapterTitle", "latestChapter", "chapter"]);
  const latestUrl = firstString(record, ["apiChapterLink", "latestChapterLink", "chapterLink"]);
  if ((latestTitle || latestUrl) && !chapters.some((chapter) => chapter.url === latestUrl || chapter.number === latestTitle)) {
    chapters.unshift({
      number: latestTitle || "Chapter",
      time: firstString(record, ["updateTime", "time", "date"]),
      url: resolveApiPath(latestUrl) || resolveKomikuUrl(latestUrl),
    });
  }

  return chapters.filter((chapter) => chapter.number || chapter.url).slice(0, 3);
}

function mangaItemFromApi(value: unknown): MangaItem | null {
  if (!isRecord(value)) return null;

  const slug =
    normalizeSlug(value.mangaSlug) ||
    normalizeSlug(value.slug) ||
    normalizeSlug(value.apiDetailLink) ||
    normalizeSlug(value.detailUrl) ||
    normalizeSlug(value.href) ||
    normalizeSlug(value.originalLink) ||
    normalizeSlug(value.url);

  const title = firstString(value, ["title", "name"]);
  if (!slug && !title) return null;

  const rawGenres = asArray(value.genres).map((genre) => asString(genre)).filter(Boolean);
  const singleGenre = firstString(value, ["genre", "category"]);
  const genres = rawGenres.length > 0 ? rawGenres : singleGenre ? [singleGenre] : [];

  return {
    id: slug || title.toLowerCase().replace(/\s+/g, "-"),
    title: title || slugToTitle(slug),
    cover: firstString(value, ["thumbnail", "cover", "image", "imageUrl", "img"]),
    chapters: chaptersFromApi(value),
    rating: firstString(value, ["rating", "score"]),
    isNew: Boolean(value.isNew || value.isColored || firstString(value, ["updateCountText", "updateTime"])),
    type: firstString(value, ["type", "format", "tipe"]),
    status: firstString(value, ["status"]),
    genres,
  };
}

function mapApiItems(payload: unknown, limit = 10): MangaItem[] {
  return uniqueById(pickItems(payload).map(mangaItemFromApi).filter((item): item is MangaItem => Boolean(item))).slice(0, limit);
}

async function apiGet<T = unknown>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const { data } = await api.get<T>(path, { params });
  return data;
}

function getFallbackData(): HomePageData {
  const mangaList: MangaItem[] = [
    {
      id: "the-beginning-after-the-end",
      title: "The Beginning After The End",
      cover: "https://thumbnail.komiku.org/uploads/manga/the-beginning-after-the-end/manga_thumbnail-Manhwa-The-Beginning-After-The-End-1.jpg",
      chapters: [{ number: "Chapter 240", time: "", url: "/baca-chapter/the-beginning-after-the-end/240" }],
      rating: "9.2",
      isNew: true,
      type: "Manhwa",
    },
  ];

  return {
    featured: mangaList.slice(0, 3),
    recommendations: mangaList.slice(0, 6),
    updates: mangaList.slice(0, 10),
    popular: mangaList.slice(0, 12),
  };
}

function flattenPopular(payload: unknown): MangaItem[] {
  if (!isRecord(payload)) return mapApiItems(payload, 12);
  const groups = [payload.manga, payload.manhwa, payload.manhua];
  const items = groups.flatMap((group) => mapApiItems(group, 12));
  return uniqueById(items).slice(0, 12);
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const [terbaru, rekomendasi, populer] = await Promise.allSettled([
      apiGet("/terbaru"),
      apiGet("/rekomendasi"),
      apiGet("/komik-populer"),
    ]);

    const updates = terbaru.status === "fulfilled" ? mapApiItems(terbaru.value) : [];
    const recommendations = rekomendasi.status === "fulfilled" ? mapApiItems(rekomendasi.value, 6) : [];
    const popular = populer.status === "fulfilled" ? flattenPopular(populer.value) : [];
    const featured = recommendations.length > 0 ? recommendations.slice(0, 3) : popular.slice(0, 3);

    const result = {
      featured,
      recommendations: recommendations.length > 0 ? recommendations.slice(0, 6) : popular.slice(0, 6),
      updates,
      popular,
    };

    if (result.updates.length > 0 || result.popular.length > 0 || result.recommendations.length > 0) return result;
    return getFallbackData();
  } catch (error: unknown) {
    console.error("Error fetching homepage from Komiku API:", error);
    return getFallbackData();
  }
}

function detailInfoValue(info: unknown, labels: string[]): string {
  if (!isRecord(info)) return "";
  for (const label of labels) {
    const direct = asString(info[label]);
    if (direct) return direct;
  }

  const entries = Object.entries(info);
  const found = entries.find(([key]) => labels.some((label) => key.toLowerCase().includes(label.toLowerCase())));
  return found ? asString(found[1]) : "";
}

function detailGenres(payload: ApiRecord): { name: string; slug: string }[] {
  return asArray(payload.genres)
    .map((genre) => {
      if (typeof genre === "string") return { name: genre, slug: normalizeGenreText(genre) };
      if (isRecord(genre)) {
        const name = firstString(genre, ["name", "title"]);
        const slug = normalizeSlug(genre.slug) || normalizeFilterValue(firstString(genre, ["href", "url", "apiGenreLink"])) || normalizeGenreText(name);
        return name ? { name, slug } : null;
      }
      return null;
    })
    .filter((genre): genre is { name: string; slug: string } => Boolean(genre));
}

function detailChapters(payload: ApiRecord): MangaDetail["chapters"] {
  return asArray(payload.chapters)
    .map((chapter, index) => {
      if (!isRecord(chapter)) return null;
      const title = firstString(chapter, ["title", "name", "chapterTitle"]);
      const url = firstString(chapter, ["apiLink", "apiChapterLink", "url", "href", "link"]);
      return {
        number: title || `Chapter ${index + 1}`,
        time: firstString(chapter, ["date", "time", "updateTime"]),
        url: resolveApiPath(url) || resolveKomikuUrl(url),
        isNew: index < 3,
      };
    })
    .filter((chapter): chapter is MangaDetail["chapters"][number] => Boolean(chapter));
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  try {
    const payload = await apiGet<ApiRecord>(`/detail-komik/${slug}`);
    const info = payload.info;
    const chapters = detailChapters(payload);
    const genres = detailGenres(payload);
    const title = firstString(payload, ["title", "name"]) || slugToTitle(slug);

    return {
      id: normalizeSlug(payload.slug) || slug,
      title,
      altTitle: firstString(payload, ["alternativeTitle", "altTitle"]) || detailInfoValue(info, ["Alternatif", "Alternative"]),
      cover: firstString(payload, ["thumbnail", "cover", "image"]),
      rating: detailInfoValue(info, ["Rating", "score"]) || firstString(payload, ["rating", "score"]),
      views: detailInfoValue(info, ["Pembaca", "views", "view"]),
      chapters_count: chapters.length.toString(),
      synopsis: firstString(payload, ["sinopsis", "description", "synopsis"]),
      genres,
      author: detailInfoValue(info, ["Author", "Penulis"]),
      artist: detailInfoValue(info, ["Artist", "Ilustrator"]),
      format: detailInfoValue(info, ["Tipe", "Type", "Format"]),
      type: detailInfoValue(info, ["Status"]),
      chapters,
    };
  } catch (error: unknown) {
    console.error("Error fetching manga detail from Komiku API:", error);
    return getFallbackMangaDetail(slug);
  }
}

function getFallbackMangaDetail(slug: string): MangaDetail {
  const title = slugToTitle(slug);
  return {
    id: slug,
    title,
    altTitle: "",
    cover: "https://via.placeholder.com/300x450/1A1A1A/666?text=No+Cover",
    rating: "",
    views: "0",
    chapters_count: "0",
    synopsis: `${title} adalah komik yang tersedia di Komiku.`,
    genres: [],
    author: "Unknown",
    artist: "Unknown",
    format: "",
    type: "",
    chapters: [],
  };
}

function parseChapterInput(input: string): { slug: string; chapter: string } | null {
  const clean = input.trim();
  const apiMatch = clean.match(/\/baca-chapter\/([^/]+)\/([^/?#]+)/);
  if (apiMatch) return { slug: apiMatch[1], chapter: apiMatch[2] };

  const komikuMatch = clean.match(/\/([^/]+)-chapter-([\d.]+)/i);
  if (komikuMatch) return { slug: komikuMatch[1], chapter: komikuMatch[2] };

  return null;
}

export async function getChapterPages(url: string): Promise<ChapterPage | null> {
  const parsed = parseChapterInput(url);
  if (!parsed) return null;

  try {
    const payload = await apiGet<ApiRecord>(`/baca-chapter/${parsed.slug}/${parsed.chapter}`);
    const images = asArray(payload.images)
      .map((image) => {
        if (typeof image === "string") return image;
        if (isRecord(image)) return firstString(image, ["src", "url", "image", "fallbackSrc"]);
        return "";
      })
      .filter(Boolean);

    const navigation: ApiRecord = isRecord(payload.navigation) ? payload.navigation : {};
    const mangaInfo: ApiRecord = isRecord(payload.mangaInfo) ? payload.mangaInfo : {};

    return {
      title: firstString(payload, ["title", "chapterTitle"]),
      chapter: parsed.chapter,
      images: Array.from(new Set(images)),
      prevChapter: resolveApiPath(firstString(navigation, ["prevChapter", "prev", "previous"])),
      nextChapter: resolveApiPath(firstString(navigation, ["nextChapter", "next"])),
      mangaSlug: normalizeSlug(mangaInfo.slug) || parsed.slug,
    };
  } catch (error: unknown) {
    console.error("Error fetching chapter pages from Komiku API:", error);
    return null;
  }
}

function itemMatchesFilters(item: MangaItem, filters: MangaListFilters): boolean {
  const tipe = normalizeFilterValue(filters.tipe);
  const status = normalizeFilterValue(filters.status);
  const genre = normalizeFilterValue(filters.genre || filters.genre2);

  if (tipe && item.type) {
    const itemType = normalizeFilterValue(item.type);
    if (itemType !== tipe) return false;
  }

  if (status && item.status) {
    const itemStatus = normalizeFilterValue(item.status);
    if (itemStatus !== status) return false;
  }

  if (genre && item.genres?.length) {
    const itemGenres = item.genres.map(normalizeGenreText);
    if (!itemGenres.includes(genre)) return false;
  }

  return true;
}

function pageFromPayload(payload: unknown, fallback: number): number {
  if (!isRecord(payload)) return fallback;
  const direct = Number(payload.currentPage || payload.page);
  if (Number.isFinite(direct) && direct > 0) return direct;
  if (isRecord(payload.data)) {
    const nested = Number(payload.data.page || payload.data.currentPage);
    if (Number.isFinite(nested) && nested > 0) return nested;
  }
  return fallback;
}

function hasNextFromPayload(payload: unknown, currentPage: number, items: MangaItem[]): boolean {
  if (!isRecord(payload)) return items.length >= 10;
  if (typeof payload.hasNextPage === "boolean") return payload.hasNextPage;
  if (asString(payload.nextPageUrl)) return true;
  if (isRecord(payload.data)) {
    if (typeof payload.data.hasNextPage === "boolean") return payload.data.hasNextPage;
    if (asString(payload.data.nextPageUrl)) return true;
  }
  return items.length >= 10 && currentPage < 999;
}

async function getGenrePage(genre: string, page: number): Promise<MangaListResponse> {
  const path = page > 1 ? `/genre/${genre}/page/${page}` : `/genre/${genre}`;
  const payload = await apiGet(path);
  const manga = mapApiItems(payload);
  const currentPage = pageFromPayload(payload, page);
  const hasNextPage = hasNextFromPayload(payload, currentPage, manga);

  return {
    manga,
    pagination: {
      currentPage,
      totalPages: hasNextPage ? currentPage + 1 : currentPage,
      hasNextPage,
      hasPrevPage: currentPage > 1,
    },
  };
}

async function getBerwarnaPage(page: number): Promise<MangaListResponse> {
  const path = page > 1 ? `/berwarna/${page}` : "/berwarna";
  const payload = await apiGet(path);
  const manga = mapApiItems(payload);
  const currentPage = pageFromPayload(payload, page);
  const hasNextPage = hasNextFromPayload(payload, currentPage, manga);

  return {
    manga,
    pagination: {
      currentPage,
      totalPages: hasNextPage ? currentPage + 1 : currentPage,
      hasNextPage,
      hasPrevPage: currentPage > 1,
    },
  };
}

async function getPustakaPage(filters: MangaListFilters, page: number): Promise<MangaListResponse> {
  const path = page > 1 ? `/pustaka/page/${page}` : "/pustaka";
  const payload = await apiGet(path);
  const parsed = mapApiItems(payload);
  const manga = uniqueById(parsed.filter((item) => itemMatchesFilters(item, filters))).slice(0, 10);
  const currentPage = pageFromPayload(payload, page);
  const hasNextPage = hasNextFromPayload(payload, currentPage, parsed);

  return {
    manga,
    pagination: {
      currentPage,
      totalPages: hasNextPage ? currentPage + 1 : currentPage,
      hasNextPage,
      hasPrevPage: currentPage > 1,
    },
  };
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const payload = await apiGet("/search", { q: query });
  const all = mapApiItems(payload, 50);
  const start = Math.max(0, (page - 1) * 10);

  return all.slice(start, start + 10).map((item) => ({
    id: item.id,
    title: item.title,
    cover: item.cover,
    type: item.type,
    rating: item.rating,
    latestChapter: item.chapters?.[0]?.number,
  }));
}

export async function getMangaList(filters: MangaListFilters): Promise<MangaListResponse> {
  const currentPage = filters.halaman || 1;
  const search = filters.s?.trim();
  const genre = normalizeFilterValue(filters.genre || filters.genre2);

  try {
    if (search) {
      const results = await searchManga(search, currentPage);
      return {
        manga: results.map((item) => ({
          id: item.id,
          title: item.title,
          cover: item.cover,
          type: item.type,
          rating: item.rating,
          chapters: item.latestChapter ? [{ number: item.latestChapter, time: "", url: "" }] : [],
        })),
        pagination: {
          currentPage,
          totalPages: results.length >= 10 ? currentPage + 1 : currentPage,
          hasNextPage: results.length >= 10,
          hasPrevPage: currentPage > 1,
        },
      };
    }

    if (genre === "berwarna") return getBerwarnaPage(currentPage);
    if (genre) return getGenrePage(genre, currentPage);

    return getPustakaPage(filters, currentPage);
  } catch (error: unknown) {
    console.error("Error fetching manga list from Komiku API:", error);
    return {
      manga: [],
      pagination: { currentPage, totalPages: currentPage, hasNextPage: false, hasPrevPage: currentPage > 1 },
    };
  }
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const payload = await apiGet("/genre-all");
    return pickItems(payload)
      .map((item) => {
        if (!isRecord(item)) return null;
        const name = firstString(item, ["title", "name"]);
        const slug = normalizeSlug(item.slug) || normalizeFilterValue(firstString(item, ["apiGenreLink", "originalLink", "readLink"])) || normalizeGenreText(name);
        return name && slug ? { name, slug } : null;
      })
      .filter((genre): genre is { name: string; slug: string } => Boolean(genre));
  } catch (error: unknown) {
    console.error("Error fetching genre list from Komiku API:", error);
    return [];
  }
}
