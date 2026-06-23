import axios, { AxiosInstance } from "axios";

const API_BASE_URL = (process.env.KOMIKCAST_API_BASE_URL || "https://komikcast-api-six.vercel.app/api").replace(/\/+$/, "");
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

interface ApiEnvelope<T> {
  status?: number;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    lastPage?: number;
    take?: number;
  };
}

interface KomikcastGenre {
  id: number;
  data?: {
    name?: string;
    description?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface KomikcastChapter {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  chapterIndex?: number;
  data?: {
    index?: number;
    slug?: string | null;
    title?: string | null;
    images?: string[];
  };
}

interface KomikcastSeriesItem {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  data?: {
    slug?: string;
    type?: string;
    isHot?: boolean;
    title?: string;
    author?: string;
    format?: string;
    rating?: number | string;
    status?: string;
    synopsis?: string;
    coverImage?: string;
    backgroundImage?: string;
    nativeTitle?: string;
    releaseDate?: string;
    isRecommended?: boolean;
    totalChapters?: string;
    animeAdaptation?: boolean;
    genreIds?: number[];
    genres?: KomikcastGenre[];
  };
  dataMetadata?: ApiRecord;
  metadata?: ApiRecord;
  chapters?: KomikcastChapter[];
}

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

async function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiEnvelope<T>> {
  const { data } = await api.get<ApiEnvelope<T>>(path, { params });
  return data;
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  if (["end", "ended", "complete", "completed", "tamat"].includes(clean)) return "completed";
  if (["on-going", "ongoing"].includes(clean)) return "ongoing";
  return clean;
}

function normalizeFormat(value?: string | null): string | undefined {
  const clean = normalizeFilterValue(value);
  if (!clean) return undefined;
  if (["manga", "manhwa", "manhua"].includes(clean)) return clean;
  return clean;
}

function normalizeStatusForApi(value?: string | null): string | undefined {
  const clean = normalizeFilterValue(value);
  if (!clean) return undefined;
  if (clean === "completed") return "Completed";
  if (clean === "ongoing") return "Ongoing";
  return clean;
}

function normalizeSort(value?: string | null): string {
  const clean = normalizeFilterValue(value);
  if (!clean || ["date", "latest", "newest", "terbaru"].includes(clean)) return "latest";
  if (["popular", "populer"].includes(clean)) return "popular";
  if (["rating", "score"].includes(clean)) return "rating";
  if (["title", "judul"].includes(clean)) return "title";
  return clean;
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

function chapterUrl(mangaSlug: string, chapterIndex: number | string): string {
  return `/series/${mangaSlug}/chapters/${chapterIndex}`;
}

function chapterPreviewFromApi(mangaSlug: string, chapter: KomikcastChapter): { number: string; time: string; url: string } | null {
  const index = chapter.data?.index ?? chapter.chapterIndex;
  if (index === undefined || index === null) return null;

  return {
    number: chapter.data?.title || `Chapter ${index}`,
    time: chapter.updatedAt || chapter.createdAt || "",
    url: chapterUrl(mangaSlug, index),
  };
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function genresFromSeries(item: KomikcastSeriesItem): string[] {
  return (item.data?.genres || [])
    .map((genre) => genre.data?.name || "")
    .filter(Boolean);
}

function mangaItemFromSeries(item: KomikcastSeriesItem): MangaItem | null {
  const data = item.data;
  if (!data) return null;

  const slug = data.slug || (data.title ? slugify(data.title) : "");
  const title = data.title || slugToTitle(slug);
  if (!slug || !title) return null;

  const chapters = (item.chapters || [])
    .map((chapter) => chapterPreviewFromApi(slug, chapter))
    .filter(isPresent)
    .slice(0, 3);

  return {
    id: slug,
    title,
    cover: data.coverImage || data.backgroundImage || PLACEHOLDER_COVER,
    chapters,
    rating: data.rating !== undefined && data.rating !== null ? String(data.rating) : undefined,
    isNew: chapters.length > 0,
    type: data.format || data.type,
    status: data.status,
    genres: genresFromSeries(item),
  };
}

function mapSeriesItems(items: unknown, limit = PAGE_SIZE): MangaItem[] {
  if (!Array.isArray(items)) return [];
  return uniqueById(
    items
      .map((item) => (isRecord(item) ? mangaItemFromSeries(item as unknown as KomikcastSeriesItem) : null))
      .filter(isPresent),
  ).slice(0, limit);
}

function hasNext(meta: ApiEnvelope<unknown>["meta"], itemsLength: number, currentPage: number): boolean {
  if (meta?.lastPage) return currentPage < meta.lastPage;
  return itemsLength >= PAGE_SIZE;
}

async function fetchSeriesList(
  params: Record<string, string | number | boolean | undefined>,
  limit = PAGE_SIZE,
): Promise<{ items: MangaItem[]; meta?: ApiEnvelope<unknown>["meta"] }> {
  const response = await apiGet<KomikcastSeriesItem[]>("/series", params);
  return {
    items: mapSeriesItems(response.data, limit),
    meta: response.meta,
  };
}

async function getGenreIdFromSlug(slug?: string): Promise<number | undefined> {
  const wanted = normalizeFilterValue(slug);
  if (!wanted) return undefined;

  try {
    const response = await apiGet<KomikcastGenre[]>("/genres");
    const genres = Array.isArray(response.data) ? response.data : [];
    const match = genres.find((genre) => {
      const name = genre.data?.name || "";
      return slugify(name) === wanted || String(genre.id) === wanted;
    });
    return match?.id;
  } catch (error) {
    console.error("Error fetching Komikcast genres:", error);
    return undefined;
  }
}

function buildSeriesParams(filters: MangaListFilters, page: number): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {
    page,
    take: PAGE_SIZE,
    takeChapter: 3,
    includeMeta: true,
    sort: normalizeSort(filters.orderby),
    sortOrder: "desc",
  };

  const format = normalizeFormat(filters.tipe);
  const status = normalizeStatusForApi(filters.status);
  if (format) params.format = format;
  if (status) params.status = status;

  return params;
}

function fallbackHome(): HomePageData {
  return { featured: [], recommendations: [], updates: [], popular: [] };
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const [banner, popular, latest] = await Promise.allSettled([
      fetchSeriesList({ preset: "banner", includeMeta: true, take: 6 }, 6),
      fetchSeriesList({ preset: "popular_all", take: 12, takeChapter: 2, includeMeta: true }, 12),
      fetchSeriesList({ preset: "rilisan_terbaru", take: 20, takeChapter: 3, page: 1 }, 20),
    ]);

    const featured = banner.status === "fulfilled" ? banner.value.items : [];
    const popularItems = popular.status === "fulfilled" ? popular.value.items : [];
    const latestItems = latest.status === "fulfilled" ? latest.value.items : [];

    return {
      featured: uniqueById([...featured, ...popularItems, ...latestItems]).slice(0, 5),
      recommendations: uniqueById([...popularItems, ...latestItems]).slice(0, 6),
      updates: latestItems.slice(0, 10),
      popular: popularItems.slice(0, 12),
    };
  } catch (error) {
    console.error("Error fetching homepage from Komikcast API:", error);
    return fallbackHome();
  }
}

function genreObjects(item: KomikcastSeriesItem): { name: string; slug: string }[] {
  return (item.data?.genres || [])
    .map((genre) => {
      const name = genre.data?.name || "";
      return name ? { name, slug: slugify(name) } : null;
    })
    .filter(isPresent);
}

function detailChapters(slug: string, chapters: KomikcastChapter[]): MangaDetail["chapters"] {
  return chapters
    .slice()
    .sort((a, b) => (b.data?.index ?? b.chapterIndex ?? 0) - (a.data?.index ?? a.chapterIndex ?? 0))
    .map<DetailChapter | null>((chapter, index) => {
      const chapterIndex = chapter.data?.index ?? chapter.chapterIndex;
      if (chapterIndex === undefined || chapterIndex === null) return null;

      return {
        number: chapter.data?.title || `Chapter ${chapterIndex}`,
        time: chapter.updatedAt || chapter.createdAt || "",
        url: chapterUrl(slug, chapterIndex),
        isNew: index < 3,
      };
    })
    .filter(isPresent);
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  try {
    const [detailResponse, chapterResponse] = await Promise.all([
      apiGet<KomikcastSeriesItem>(`/series/${slug}`, { includeMeta: true }),
      apiGet<KomikcastChapter[]>(`/series/${slug}/chapters`),
    ]);

    const item = detailResponse.data;
    if (!item?.data) return null;

    const data = item.data;
    const chapters = detailChapters(slug, Array.isArray(chapterResponse.data) ? chapterResponse.data : []);

    return {
      id: data.slug || slug,
      title: data.title || slugToTitle(slug),
      altTitle: data.nativeTitle || "",
      cover: data.coverImage || data.backgroundImage || PLACEHOLDER_COVER,
      rating: data.rating !== undefined && data.rating !== null ? String(data.rating) : "",
      views: asString(item.dataMetadata?.totalViews) || asString(item.metadata?.views) || "0",
      chapters_count: data.totalChapters || String(chapters.length),
      synopsis: data.synopsis || "",
      genres: genreObjects(item),
      author: data.author || "Unknown",
      artist: "Unknown",
      format: data.format || "",
      type: data.status || "",
      chapters,
    };
  } catch (error) {
    console.error("Error fetching manga detail from Komikcast API:", error);
    return null;
  }
}

function parseChapterInput(input: string): { slug: string; chapter: string } | null {
  const clean = input.trim();
  const seriesMatch = clean.match(/\/series\/([^/]+)\/chapters\/([^/?#]+)/);
  if (seriesMatch) return { slug: seriesMatch[1], chapter: seriesMatch[2] };

  const legacyMatch = clean.match(/\/komik\/([^/]+)\/([^/?#]+)/);
  if (legacyMatch) return { slug: legacyMatch[1], chapter: legacyMatch[2] };

  const komikuMatch = clean.match(/\/([^/]+)-chapter-([\d.]+)/i);
  if (komikuMatch) return { slug: komikuMatch[1], chapter: komikuMatch[2] };

  return null;
}

function proxiedImage(url: string): string {
  if (!url) return "";
  return `${API_BASE_URL}/proxy?url=${encodeURIComponent(url)}`;
}

export async function getChapterPages(url: string): Promise<ChapterPage | null> {
  const parsed = parseChapterInput(url);
  if (!parsed) return null;

  try {
    const [contentResponse, detailResponse, chapterListResponse] = await Promise.all([
      apiGet<KomikcastChapter>(`/series/${parsed.slug}/chapters/${parsed.chapter}`),
      apiGet<KomikcastSeriesItem>(`/series/${parsed.slug}`, { includeMeta: true }),
      apiGet<KomikcastChapter[]>(`/series/${parsed.slug}/chapters`),
    ]);

    const content = contentResponse.data;
    if (!content?.data) return null;

    const chapters = Array.isArray(chapterListResponse.data) ? chapterListResponse.data : [];
    const sorted = chapters.slice().sort((a, b) => (a.data?.index ?? a.chapterIndex ?? 0) - (b.data?.index ?? b.chapterIndex ?? 0));
    const current = Number(parsed.chapter);
    const currentIndex = sorted.findIndex((chapter) => (chapter.data?.index ?? chapter.chapterIndex) === current);
    const prevIndex = currentIndex > 0 ? sorted[currentIndex - 1].data?.index ?? sorted[currentIndex - 1].chapterIndex : undefined;
    const nextIndex = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1].data?.index ?? sorted[currentIndex + 1].chapterIndex : undefined;

    return {
      title: detailResponse.data?.data?.title || parsed.slug,
      chapter: String(content.data.index ?? content.chapterIndex ?? parsed.chapter),
      images: (content.data.images || []).map(proxiedImage).filter(Boolean),
      prevChapter: prevIndex !== undefined ? chapterUrl(parsed.slug, prevIndex) : undefined,
      nextChapter: nextIndex !== undefined ? chapterUrl(parsed.slug, nextIndex) : undefined,
      mangaSlug: parsed.slug,
    };
  } catch (error) {
    console.error("Error fetching chapter pages from Komikcast API:", error);
    return null;
  }
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const filter = `title=like="${query}",nativeTitle=like="${query}"`;
  const response = await fetchSeriesList(
    {
      filter,
      page,
      take: PAGE_SIZE,
      takeChapter: 3,
      includeMeta: false,
      sort: "latest",
      sortOrder: "desc",
    },
    PAGE_SIZE,
  );

  return response.items.map((item) => ({
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

    const params = buildSeriesParams(filters, currentPage);
    const genre = normalizeFilterValue(filters.genre || filters.genre2);
    if (genre) {
      const genreId = await getGenreIdFromSlug(genre);
      if (genreId) params.genreIds = genreId;
    }

    const { items, meta } = await fetchSeriesList(params, PAGE_SIZE);
    const next = hasNext(meta, items.length, currentPage);

    return {
      manga: items,
      pagination: {
        currentPage,
        totalPages: meta?.lastPage || (next ? currentPage + 1 : currentPage),
        hasNextPage: next,
        hasPrevPage: currentPage > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching manga list from Komikcast API:", error);
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
    const response = await apiGet<KomikcastGenre[]>("/genres");
    const genres = Array.isArray(response.data) ? response.data : [];
    return genres
      .map((genre) => {
        const name = genre.data?.name || "";
        return name ? { name, slug: slugify(name) } : null;
      })
      .filter(isPresent);
  } catch (error) {
    console.error("Error fetching genre list from Komikcast API:", error);
    return [];
  }
}
