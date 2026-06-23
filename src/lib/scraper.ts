import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://komiku.org";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: BASE_URL + "/",
};

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers,
    timeout: 15000,
    maxRedirects: 5,
  });
}

const api = createClient(BASE_URL);

export interface MangaItem {
  id: string;
  title: string;
  cover: string;
  chapters?: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
  type?: string;
  status?: string;
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

function extractSlug(href: string): string {
  if (!href) return "";
  const mangaMatch = href.match(/\/manga\/([^/]+)/);
  if (mangaMatch) return mangaMatch[1];
  const chapterMatch = href.match(/\/([^/]+)-chapter-/);
  if (chapterMatch) return chapterMatch[1];
  const seriesMatch = href.match(/\/series\/([^/]+)/);
  if (seriesMatch) return seriesMatch[1];
  return href.replace(BASE_URL, "").replace(/^\//, "").replace(/\/$/, "");
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return BASE_URL + url;
  return `${BASE_URL}/${url}`;
}

function fixImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("lazy.jpg")) return "";
  return resolveUrl(url);
}

function getImageSrc($: cheerio.CheerioAPI, el: any): string {
  if (!el) return "";
  const $el = $(el);
  return $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("src") || "";
}

function parseMangaItem($: cheerio.CheerioAPI, el: any): MangaItem | null {
  const $el = $(el);

  let title = "";
  let href = "";

  const link = $el.find("h3 a, h4 a, .ls2v a, a[href*='/manga/']").first();
  if (link.length) {
    href = link.attr("href") || "";
    title = link.text().trim();
  }

  if (!title) title = $el.find("h3, h4").first().text().trim();
  if (!href) href = $el.find("a").first().attr("href") || "";

  if (!href) return null;

  const id = extractSlug(href);
  if (!id) return null;

  const imgEl = $el.find("img").first().get(0) as any;
  const cover = getImageSrc($, imgEl);

  const chapters: MangaItem["chapters"] = [];
  $el.find(".ls2w a, .ls2j a, .new1 a, a.ls24, .chapters a, .ls2l").each((_, ch) => {
    const chUrl = $(ch).attr("href") || "";
    if (!chUrl.includes("-chapter-")) return;
    chapters.push({
      number: $(ch).text().replace(/\s+/g, " ").trim(),
      time: "",
      url: resolveUrl(chUrl),
    });
  });

  const stats = $el.find(".ls4s, .meta, .ls2s, .ls5s, .ls2t").text().trim();
  const ratingMatch = stats.match(/\d+\.\d+/);
  const rating = ratingMatch ? ratingMatch[0] : undefined;

  return {
    id,
    title: title || slugToTitle(id),
    cover: fixImageUrl(cover),
    chapters: chapters.slice(0, 3),
    rating,
    type: stats.split(/[•·]/)[0]?.trim() || $el.attr("data-tipe"),
    status: stats.includes("Status:") ? stats.split("Status:")[1]?.trim() : undefined,
    isNew: $el.find(".up, .new, .ls2n").length > 0
  };
}

export async function getHomePage(): Promise<HomePageData> {
  try {
    const { data: html } = await api.get("/");
    const $ = cheerio.load(html);

    const featured: MangaItem[] = [];
    const recommendations: MangaItem[] = [];
    const updates: MangaItem[] = [];
    const popular: MangaItem[] = [];

    $("#Rekomendasi_Komik .ls4, #Rekomendasi_Komik .ls4v").each((_, el) => {
      const item = parseMangaItem($, el as any);
      if (item) featured.push(item);
    });

    $("#Komik_Populer .ls2").each((_, el) => {
      const item = parseMangaItem($, el as any);
      if (item) popular.push(item);
    });

    $("#Terbaru .ls2, #Baru_Ditambahkan .ls2").each((_, el) => {
      const item = parseMangaItem($, el as any);
      if (item) updates.push(item);
    });

    recommendations.push(...featured.slice(3, 9));

    return {
      featured: featured.slice(0, 3),
      recommendations: recommendations.length ? recommendations : popular.slice(0, 6),
      updates,
      popular
    };
  } catch (error: unknown) {
    if (error instanceof Error) console.error("Error scraping homepage:", error.message);
    return { featured: [], recommendations: [], updates: [], popular: [] };
  }
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  try {
    const { data: html } = await api.get(`/manga/${slug}/`);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim().replace(/^Komik\s+/i, "") || slugToTitle(slug);
    const altTitle = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Alternatif")).find("td").last().text().trim() || "";
    const imgEl = $(".ims img").first().get(0) as any;
    const cover = getImageSrc($, imgEl);
    const synopsis = $("p.desc[itemprop='description'], p.desc").first().text().trim() || "";
    const rating = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Rating")).find("td").last().text().trim() || "";
    const views = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Pembaca")).find("td").last().text().trim() || "";

    const genres: { name: string; slug: string }[] = [];
    $("ul.genre a, .genre a").each((_, el) => {
      const name = $(el).text().trim();
      if (name) {
        genres.push({
          name,
          slug: ($(el).attr("href") || "").split("/").filter(Boolean).pop() || "",
        });
      }
    });

    const author = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Author")).find("td").last().text().trim() || "";
    const format = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Tipe")).find("td").last().text().trim() || "";
    const type = $(".inftable tr").filter((_, el) => $(el).find("td").first().text().includes("Status")).find("td").last().text().trim() || "";

    const chapters: MangaDetail["chapters"] = [];
    $("#daftarChapter tr").each((_, el) => {
      const $el = $(el);
      const chLink = $el.find("td.judulseries a");
      const chUrl = chLink.attr("href") || "";
      const chNum = chLink.find("span").text().trim() || chLink.text().trim() || "";
      const chTime = $el.find("td.tanggalseries").text().trim() || "";

      if (chUrl.includes("-chapter-")) {
        chapters.push({
          number: chNum || `Chapter ${chapters.length + 1}`,
          time: chTime,
          url: resolveUrl(chUrl),
          isNew: chapters.length < 3,
        });
      }
    });

    return { id: slug, title, altTitle, cover: fixImageUrl(cover), rating, views, chapters_count: chapters.length.toString(), synopsis, genres, author, artist: "", format, type, chapters };
  } catch (error: unknown) {
    if (error instanceof Error) console.error("Error scraping manga detail:", error.message);
    return null;
  }
}

export async function getChapterPages(url: string): Promise<ChapterPage | null> {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url.startsWith("/") ? url : `/${url}`;
    const { data: html } = await api.get(path);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim() || $(".judulbaca").first().text().trim() || "";
    const chapter = title.match(/chapter\s*([\d.]+)/i)?.[1] || title.match(/ch\s*([\d.]+)/i)?.[1] || "";

    const images: string[] = [];
    $("#Baca_Komik img, #readerarea img, .reader-area img").each((_, el) => {
      const src = getImageSrc($, el as any);
      if (src && !src.includes("lazy.jpg") && /\.(jpg|jpeg|png|webp)/i.test(src)) {
        images.push(fixImageUrl(src));
      }
    });

    const chapterNav = $(".nxpr a.rl").map((_, el) => $(el).attr("href") || "").get().filter((href) => href.includes("-chapter-"));
    const seriesSlug = extractSlug(path || url);

    return { title, chapter, images, prevChapter: chapterNav[0] ? resolveUrl(chapterNav[0]) : undefined, nextChapter: chapterNav[1] ? resolveUrl(chapterNav[1]) : undefined, mangaSlug: seriesSlug };
  } catch (error: unknown) {
    if (error instanceof Error) console.error("Error scraping chapter pages:", error.message);
    return null;
  }
}

export async function searchManga(query: string): Promise<SearchResult[]> {
  try {
    const { data: html } = await api.get("/", { params: { s: query, post_type: "manga" } });
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    $(".bge, .manga-card, .ls2, .ls4").each((_, el) => {
      const item = parseMangaItem($, el as any);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        results.push({
          id: item.id,
          title: item.title,
          cover: item.cover,
          type: item.type,
          rating: item.rating,
          latestChapter: item.chapters?.[0]?.number
        });
      }
    });
    return results;
  } catch (error: unknown) {
    if (error instanceof Error) console.error("Error searching manga:", error.message);
    return [];
  }
}

export async function getMangaList(filters: MangaListFilters): Promise<MangaListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.tipe) params.append("tipe", filters.tipe);
    if (filters.status) params.append("status", filters.status);
    if (filters.halaman) params.append("halaman", filters.halaman.toString());
    if (filters.orderby) params.append("orderby", filters.orderby);
    if (filters.s) {
      params.append("s", filters.s);
      params.append("post_type", "manga");
    }

    let finalUrl = `/daftar-komik/?${params.toString()}`;

    if (filters.s) {
      finalUrl = `/?${params.toString()}`;
    } else if (filters.genre) {
      finalUrl = `/genre/${filters.genre}/?${params.toString()}`;
    }

    const { data: html } = await api.get(finalUrl);
    const $ = cheerio.load(html);

    const manga: MangaItem[] = [];
    const seen = new Set<string>();

    $(".manga-card, .bge, .ls2, .ls4, .ls4v, .ls2j, .ls5").each((_, el) => {
      const item = parseMangaItem($, el as any);
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        manga.push(item);
      }
    });

    const pagination = {
      currentPage: filters.halaman || 1,
      totalPages: filters.halaman || 1,
      hasNextPage: false,
      hasPrevPage: (filters.halaman || 1) > 1,
    };

    const nextLink = $(".pagination a:contains('Next'), .pagination a:contains('→'), .pagination .next").attr("href");
    if (nextLink) pagination.hasNextPage = true;

    const pages = $(".pagination a, .pagination span").map((_, el) => $(el).text()).get().map((t) => parseInt(t)).filter((n) => !isNaN(n));
    if (pages.length > 0) pagination.totalPages = Math.max(...pages);

    const pageInfoText = $(".page-info").text();
    const totalPagesMatch = pageInfoText.match(/dari\s+(\d+)/i);
    if (totalPagesMatch) pagination.totalPages = parseInt(totalPagesMatch[1]);

    return { manga, pagination };
  } catch (error: unknown) {
    if (error instanceof Error) console.error("Error fetching manga list:", error.message);
    return { manga: [], pagination: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false } };
  }
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const { data: html } = await api.get("/pustaka/");
    const $ = cheerio.load(html);
    const genres: { name: string; slug: string }[] = [];
    const seen = new Set<string>();

    $("select[name='genre'] option").each((_, el) => {
      const name = $(el).text().replace(/\(\d+\)/, "").trim();
      const value = $(el).attr("value") || "";
      if (name && value && !seen.has(name) && name !== "Genre 1") {
        seen.add(name);
        genres.push({ name, slug: value });
      }
    });
    return genres;
  } catch {
    return [];
  }
}
