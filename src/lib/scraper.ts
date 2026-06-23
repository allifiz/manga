import axios, { AxiosInstance } from "axios";

const API_BASE_URL = "https://komiku-rest-api.vercel.app";
const KOMIKU_BASE_URL = "https://komiku.org";
const PAGE_SIZE = 10;
const MAX_SOURCE_PAGES = 80;

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
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
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

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstString(record: ApiRecord, keys: string[]): string {
  for (const key of keys) {
    const value = asString(record[key]);
    if (value) return value;
  }
  return "";
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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

function looksLikeMangaRecord(record: ApiRecord): boolean {
  const title = firstString(record, ["title", "name"]);
  if (!title) return false;

  return Boolean(
    firstString(record, [
      "mangaSlug",
      "slug",
      "apiDetailLink",
      "detailUrl",
      "href",
      "originalLink",
      "url",
      "thumbnail",
      "cover",
      "image",
      "latestChapterTitle",
    ])
  );
}

function collectMangaLikeRecords(value: unknown, depth = 0): unknown[] {
  if (depth > 8) return [];

  if (Array.isArray(value)) {
    const direct = value.filter((item) => isRecord(item) && looksLikeMangaRecord(item));
    if (direct.length > 0) return direct;
    return value.flatMap((item) => collectMangaLikeRecords(item, depth + 1));
  }

  if (!isRecord(value)) return [];
  if (looksLikeMangaRecord(value)) return [value];

  const priorityKeys = [
    "results",
    "data",
    "items",
    "manga",
    "manhwa",
    "manhua",
    "updates",
    "latest",
    "terbaru",
    "recommendations",
    "popular",
    "komik",
    "comics",
    "list",
  ];

  const records: unknown[] = [];
  const visited = new Set<string>();

  for (const key of priorityKeys) {
    if (key in value) {
      visited.add(key);
      records.push(...collectMangaLikeRecords(value[key], depth + 1));
    }
  }

  for (const [key, nested] of Object.entries(value)) {
    if (visited.has(key)) continue;
    records.push(...collectMangaLikeRecords(nested, depth + 1));
  }

  return records;
}

function pickItems(payload: unknown): unknown[] {
  return collectMangaLikeRecords(payload);
}

async function apiGet<T = unknown>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const { data } = await api.get<T>(path, { params });
  return data;
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
  if (firstObject && !chapters.some((chapter) => chapter.url === firstObject.url)) chapters.push(firstObject);

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

function mapApiItems(payload: unknown, limit = PAGE_SIZE): MangaItem[] {
  return uniqueById(pickItems(payload).map(mangaItemFromApi).filter(isPresent)).slice(0, limit);
}

async function getPustakaItemsForPage(page: number, limit = PAGE_SIZE): Promise<MangaItem[]> {
  const path = page > 1 ? `/pustaka/page/${page}` : "/pustaka";
  const payload = await apiGet(path);
  return mapApiItems(payload, limit);
}

async function collectPagedItems(
  pageBuilder: (page: number) => string,
  resultPage = 1,
  perPage = PAGE_SIZE,
  maxSourcePages = MAX_SOURCE_PAGES,
): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
  const wanted = resultPage * perPage + 1;
  const collected: MangaItem[] = [];

  for (let sourcePage = 1; sourcePage <= maxSourcePages && collected.length < wanted; sourcePage += 1) {
    try {
      const payload = await apiGet(pageBuilder(sourcePage));
      const pageItems = mapApiItems(payload, Math.max(perPage, 50));
      if (pageItems.length === 0) break;
      collected.push(...pageItems);
    } catch (error) {
      console.error("Error fetching paged Komiku API data:", error);
      break;
    }
  }

  const unique = uniqueById(collected);
  const start = (resultPage - 1) * perPage;
  return {
    items: unique.slice(start, start + perPage),
    hasNextPage: unique.length > start + perPage,
  };
}

async function collectFilteredPagedItems(
  filters: MangaListFilters,
  resultPage = 1,
  perPage = PAGE_SIZE,
): Promise<{ items: MangaItem[]; hasNextPage: boolean }> {
  const wanted = resultPage * perPage + 1;
  const matched: MangaItem[] = [];

  for (let sourcePage = 1; sourcePage <= MAX_SOURCE_PAGES && matched.length < wanted; sourcePage += 1) {
    const sourceItems = await getPustakaItemsForPage(sourcePage, 50);
    if (sourceItems.length === 0) break;
    matched.push(...sourceItems.filter((item) => itemMatchesFilters(item, filters)));
  }

  const uniqueMatched = uniqueById(matched);
  const start = (resultPage - 1) * perPage;
  return {
    items: uniqueMatched.slice(start, start + perPage),
    hasNextPage: uniqueMatched.length > start + perPage,
  };
}

function getFallbackData(): HomePageData {
  return {
    featured: [],
    recommendations: [],
    updates: [],
    popular: [],
  };
}

function flattenPopular(payload: unknown): MangaItem[] {
  if (!isRecord(payload)) return mapApiItems(payload, 12);
  const groups = [payload.manga, payload.manhwa, payload.manhua];
  const groupedItems = groups.flatMap((group) => mapApiItems(group, 12));
  const recursiveItems = mapApiItems(payload, 36);
  return uniqueById([...groupedItems, ...recursiveItems]).slice(0, 12);
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const [terbaru, rekomendasi, populer, pustakaPages] = await Promise.allSettled([
      apiGet("/terbaru"),
      apiGet("/rekomendasi"),
      apiGet("/komik-populer"),
      collectPagedItems((page) => (page > 1 ? `/pustaka/page/${page}` : "/pustaka"), 1, 12, 40),
    ]);

    const pustakaItems = pustakaPages.status === "fulfilled" ? pustakaPages.value.items : [];
    const updatesFromApi = terbaru.status === "fulfilled" ? mapApiItems(terbaru.value, 10) : [];
    const updates = uniqueById([...updatesFromApi, ...pustakaItems]).slice(0, 10);
    const recommendationsFromApi = rekomendasi.status === "fulfilled" ? mapApiItems(rekomendasi.value, 6) : [];
    const popularFromApi = populer.status === "fulfilled" ? flattenPopular(populer.value) : [];
    const recommendations = uniqueById([...recommendationsFromApi, ...updates, ...pustakaItems]).slice(0, 6);
    const popular = uniqueById([...popularFromApi, ...pustakaItems, ...updates]).slice(0, 12);
    const featured = recommendations.length > 0 ? recommendations.slice(0, 3) : popular.slice(0, 3);

    const result = { featured, recommendations, updates, popular };
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

  const found = Object.entries(info).find(([key]) => labels.some((label) => key.toLowerCase().includes(label.toLowerCase())));
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
    .filter(isPresent);
}

function detailChapters(payload: ApiRecord): MangaDetail["chapters"] {
  const chapters: DetailChapter[] = asArray(payload.chapters)
    .map((chapter, index): DetailChapter | null => {
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
    .filter(isPresent);

  return chapters;
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
      .filter((image): image is string => Boolean(image));

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

  if (tipe) {
    const itemType = normalizeFilterValue(item.type);
    if (!itemType || itemType !== tipe) return false;
  }

  if (status) {
    const itemStatus = normalizeFilterValue(item.status);
    if (!itemStatus || itemStatus !== status) return false;
  }

  if (genre) {
    const itemGenres = item.genres?.map(normalizeGenreText) || [];
    if (itemGenres.length === 0 || !itemGenres.includes(genre)) return false;
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
  if (!isRecord(payload)) return items.length >= PAGE_SIZE;
  if (typeof payload.hasNextPage === "boolean") return payload.hasNextPage;
  if (asString(payload.nextPageUrl)) return true;
  if (isRecord(payload.data)) {
    if (typeof payload.data.hasNextPage === "boolean") return payload.data.hasNextPage;
    if (asString(payload.data.nextPageUrl)) return true;
  }
  return items.length >= PAGE_SIZE && currentPage < 999;
}

async function getGenrePage(genre: string, page: number): Promise<MangaListResponse> {
  const collected = await collectPagedItems(
    (sourcePage) => (sourcePage > 1 ? `/genre/${genre}/page/${sourcePage}` : `/genre/${genre}`),
    page,
  );

  return {
    manga: collected.items,
    pagination: {
      currentPage: page,
      totalPages: collected.hasNextPage ? page + 1 : page,
      hasNextPage: collected.hasNextPage,
      hasPrevPage: page > 1,
    },
  };
}

async function getBerwarnaPage(page: number): Promise<MangaListResponse> {
  const collected = await collectPagedItems((sourcePage) => (sourcePage > 1 ? `/berwarna/${sourcePage}` : "/berwarna"), page);

  return {
    manga: collected.items,
    pagination: {
      currentPage: page,
      totalPages: collected.hasNextPage ? page + 1 : page,
      hasNextPage: collected.hasNextPage,
      hasPrevPage: page > 1,
    },
  };
}

function hasActivePustakaFilter(filters: MangaListFilters): boolean {
  return Boolean(normalizeFilterValue(filters.tipe) || normalizeFilterValue(filters.status) || filters.orderby);
}

async function getFilteredPustakaPage(filters: MangaListFilters, resultPage: number): Promise<MangaListResponse> {
  const collected = await collectFilteredPagedItems(filters, resultPage);

  return {
    manga: collected.items,
    pagination: {
      currentPage: resultPage,
      totalPages: collected.hasNextPage ? resultPage + 1 : resultPage,
      hasNextPage: collected.hasNextPage,
      hasPrevPage: resultPage > 1,
    },
  };
}

async function getPustakaPage(filters: MangaListFilters, page: number): Promise<MangaListResponse> {
  if (hasActivePustakaFilter(filters)) return getFilteredPustakaPage(filters, page);

  const collected = await collectPagedItems((sourcePage) => (sourcePage > 1 ? `/pustaka/page/${sourcePage}` : "/pustaka"), page);

  return {
    manga: collected.items,
    pagination: {
      currentPage: page,
      totalPages: collected.hasNextPage ? page + 1 : page,
      hasNextPage: collected.hasNextPage,
      hasPrevPage: page > 1,
    },
  };
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const payload = await apiGet("/search", { q: query });
  const all = mapApiItems(payload, 50);
  const start = Math.max(0, (page - 1) * PAGE_SIZE);

  return all.slice(start, start + PAGE_SIZE).map((item) => ({
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
          totalPages: results.length >= PAGE_SIZE ? currentPage + 1 : currentPage,
          hasNextPage: results.length >= PAGE_SIZE,
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

function collectGenreRecords(value: unknown, depth = 0): ApiRecord[] {
  if (depth > 6) return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectGenreRecords(item, depth + 1));
  if (!isRecord(value)) return [];

  const name = firstString(value, ["title", "name"]);
  const slug = normalizeSlug(value.slug) || normalizeFilterValue(firstString(value, ["apiGenreLink", "originalLink", "readLink", "href", "url"])) || normalizeGenreText(name);
  if (name && slug) return [value];

  return Object.values(value).flatMap((nested) => collectGenreRecords(nested, depth + 1));
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const payload = await apiGet("/genre-all");
    return collectGenreRecords(payload)
      .map((item) => {
        const name = firstString(item, ["title", "name"]);
        const slug = normalizeSlug(item.slug) || normalizeFilterValue(firstString(item, ["apiGenreLink", "originalLink", "readLink", "href", "url"])) || normalizeGenreText(name);
        return name && slug ? { name, slug } : null;
      })
      .filter(isPresent);
  } catch (error: unknown) {
    console.error("Error fetching genre list from Komiku API:", error);
    return [];
  }
}
