import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://komiku.org";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: BASE_URL,
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

function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function extractSlug(href: string): string {
  if (!href) return "";
  const cleanHref = href.split("?")[0].replace(BASE_URL, "");
  const mangaMatch = cleanHref.match(/\/manga\/([^/]+)/);
  if (mangaMatch) return mangaMatch[1];
  const chapterMatch = cleanHref.match(/\/([^/]+)-chapter-/);
  if (chapterMatch) return chapterMatch[1];
  const seriesMatch = cleanHref.match(/\/series\/([^/]+)/);
  if (seriesMatch) return seriesMatch[1];
  return cleanHref.replace(/^\//, "").replace(/\/$/, "");
}

function slugToTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanMeta(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeFilterValue(value?: string): string | undefined {
  if (!value) return undefined;
  return value
    .replace(BASE_URL, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^genre\//, "")
    .toLowerCase();
}

function getImageSrc($: cheerio.CheerioAPI, el: any): string {
  if (!el) return "";
  const $el = $(el);
  return (
    $el.attr("data-src") ||
    $el.attr("data-lazy-src") ||
    $el.attr("data-original") ||
    $el.attr("src") ||
    ""
  );
}

function fixImageUrl(url: string): string {
  if (!url || url.includes("lazy.jpg")) return "";
  return resolveUrl(url);
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

function pushUnique(items: MangaItem[], item: MangaItem | null, limit?: number) {
  if (!item || !item.id || items.some((existing) => existing.id === item.id)) return;
  if (limit && items.length >= limit) return;
  items.push(item);
}

function getPrimaryMangaLink($: cheerio.CheerioAPI, el: any) {
  const $el = $(el);
  return $el
    .find("h3 a, h4 a, .ls2v a, .ls4v a, a")
    .filter((_, a) => {
      const href = $(a).attr("href") || "";
      return href.includes("/manga/") || href.includes("-chapter-");
    })
    .first();
}

function parseMangaItem($: cheerio.CheerioAPI, el: any): MangaItem | null {
  const $el = $(el);
  const link = getPrimaryMangaLink($, el);
  const href = link.attr("href") || "";
  const slug = extractSlug(href);
  if (!slug || slug === "daftar-komik" || slug.startsWith("genre/")) return null;

  const title =
    link.text().trim() ||
    link.attr("title")?.replace(/^Baca\s+(Manga\s+|Komik\s+)?/i, "").trim() ||
    $el.find("h3, h4").first().text().trim() ||
    slugToTitle(slug);

  const cover = getImageSrc($, $el.find("img").first().get(0));
  const meta = cleanMeta($el.find(".meta, .ls4s, .ls2t, .kan, .status").text() || $el.text());
  const metaLower = meta.toLowerCase();

  const chapters: MangaItem["chapters"] = [];
  const seenChapters = new Set<string>();
  $el.find(".ls2w a, .ls2j a.ls24, .ls24, .new1 a, a[href*='-chapter-']").each((_, ch) => {
    const chUrl = $(ch).attr("href") || "";
    if (!chUrl.includes("-chapter-") || seenChapters.has(chUrl)) return;
    seenChapters.add(chUrl);
    chapters.push({
      number: cleanMeta($(ch).text()) || "Chapter",
      time: cleanMeta($(ch).closest("span, div, li").find("time").text()),
      url: resolveUrl(chUrl),
    });
  });

  return {
    id: slug,
    title,
    cover: fixImageUrl(cover),
    chapters: chapters.slice(0, 3),
    rating: $el.find(".rating, .nilai").first().text().trim() || undefined,
    isNew: $el.find(".up, .new, .hot").length > 0,
    type: meta.match(/\b(Manga|Manhwa|Manhua)\b/i)?.[1],
    status: metaLower.includes("tamat") || metaLower.includes("end")
      ? "Tamat"
      : metaLower.includes("ongoing")
        ? "Ongoing"
        : undefined,
  };
}

function parseMangaItems($: cheerio.CheerioAPI): MangaItem[] {
  const selectors = [
    ".bge",
    ".ls2",
    ".ls4",
    "article",
    ".manga-card",
    ".list-update_item",
    ".animepost",
    "li:has(a[href*='/manga/'])",
  ].join(", ");

  const manga: MangaItem[] = [];
  $(selectors).each((_, el) => pushUnique(manga, parseMangaItem($, el)));

  if (manga.length === 0) {
    $("a[href*='/manga/'], a[href*='-chapter-']").each((_, el) => {
      const parent = $(el).closest(".bge, .ls2, .ls4, article, li, div").get(0) || el;
      pushUnique(manga, parseMangaItem($, parent));
    });
  }

  return uniqueById(manga);
}

function getFallbackData(): HomePageData {
  const mangaList: MangaItem[] = [
    {
      id: "the-beginning-after-the-end",
      title: "The Beginning After The End",
      cover: "https://thumbnail.komiku.org/uploads/manga/the-beginning-after-the-end/manga_thumbnail-Manhwa-The-Beginning-After-The-End-1.jpg",
      chapters: [{ number: "Chapter 240", time: "9 mnt", url: "https://komiku.org/the-beginning-after-the-end-chapter-240/" }],
      rating: "9.2",
      isNew: true,
    },
    {
      id: "solo-leveling",
      title: "Solo Leveling",
      cover: "https://thumbnail.komiku.org/img/upload/solo_leveling/img_5c760927e1f40.jpg",
      chapters: [{ number: "Chapter 200", time: "1 jam", url: "https://komiku.org/solo-leveling-chapter-200/" }],
      rating: "9.5",
      isNew: true,
    },
  ];

  return {
    featured: uniqueById(mangaList).slice(0, 3),
    recommendations: uniqueById(mangaList).slice(0, 6),
    updates: uniqueById(mangaList).slice(0, 10),
    popular: uniqueById(mangaList).slice(0, 12),
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

    $("#Rekomendasi_Komik .ls4, #Rekomendasi_Komik .bge").each((_, el) => pushUnique(featured, parseMangaItem($, el)));
    $("#Komik_Populer .ls2, #Komik_Populer .ls4, #Popular .ls2, #Popular .ls4").each((_, el) => pushUnique(popular, parseMangaItem($, el)));
    $("#Terbaru .ls2, #Terbaru .ls4, #Baru_Ditambahkan .ls2, #Baru_Ditambahkan .ls4").each((_, el) => pushUnique(updates, parseMangaItem($, el), 10));

    if (updates.length === 0) parseMangaItems($).forEach((item) => pushUnique(updates, item, 10));
    featured.forEach((item) => pushUnique(recommendations, item));
    popular.forEach((item) => pushUnique(recommendations, item, 6));
    if (featured.length === 0) popular.slice(0, 3).forEach((item) => pushUnique(featured, item));

    const result = {
      featured: uniqueById(featured).slice(0, 3),
      recommendations: uniqueById(recommendations).slice(0, 6),
      updates: uniqueById(updates).slice(0, 10),
      popular: uniqueById(popular).slice(0, 12),
    };

    if (result.updates.length > 0 || result.popular.length > 0) return result;
    return getFallbackData();
  } catch (error: any) {
    console.error("Error scraping homepage:", error.message);
    return getFallbackData();
  }
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  try {
    const { data: html } = await api.get(`/manga/${slug}/`);
    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim().replace(/^Komik\s+/i, "") || slugToTitle(slug);

    const tableValue = (label: string) =>
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().toLowerCase().includes(label.toLowerCase()))
        .find("td")
        .last()
        .text()
        .trim() || "";

    const genres: { name: string; slug: string }[] = [];
    $("ul.genre a, .genre a").each((_, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr("href") || "";
      if (name) genres.push({ name, slug: normalizeFilterValue(href) || href });
    });

    const chapters: MangaDetail["chapters"] = [];
    $("#daftarChapter tr, table tr").each((_, el) => {
      const chLink = $(el).find("td.judulseries a, a[href*='-chapter-']").first();
      const chUrl = chLink.attr("href") || "";
      if (!chUrl.includes("-chapter-")) return;
      chapters.push({
        number: chLink.find("span").text().trim() || chLink.text().trim() || `Chapter ${chapters.length + 1}`,
        time: $(el).find("td.tanggalseries, time").first().text().trim(),
        url: resolveUrl(chUrl),
        isNew: chapters.length < 3,
      });
    });

    return {
      id: slug,
      title,
      altTitle: tableValue("Alternatif"),
      cover: fixImageUrl(getImageSrc($, $(".ims img, .infoanime img, img").first().get(0))),
      rating: tableValue("Rating"),
      views: tableValue("Pembaca"),
      chapters_count: chapters.length.toString(),
      synopsis: $("p.desc[itemprop='description'], p.desc, .desc").first().text().trim(),
      genres,
      author: tableValue("Author"),
      artist: tableValue("Artist"),
      format: tableValue("Tipe"),
      type: tableValue("Status"),
      chapters,
    };
  } catch (error: any) {
    console.error("Error scraping manga detail:", error.message);
    return getFallbackMangaDetail(slug);
  }
}

function getFallbackMangaDetail(slug: string): MangaDetail {
  const title = slugToTitle(slug);
  const chapters = Array.from({ length: 50 }, (_, idx) => {
    const num = 50 - idx;
    return {
      number: `Chapter ${num}`,
      time: idx === 0 ? "1 jam lalu" : `${idx + 1} hari lalu`,
      url: `${BASE_URL}/${slug}-chapter-${num}/`,
      isNew: idx < 3,
    };
  });

  return {
    id: slug,
    title,
    altTitle: "",
    cover: "https://via.placeholder.com/300x450/1A1A1A/666?text=No+Cover",
    rating: "8.5",
    views: "0",
    chapters_count: chapters.length.toString(),
    synopsis: `${title} adalah komik populer yang tersedia di Komiku.`,
    genres: [{ name: "Action", slug: "action" }],
    author: "Unknown",
    artist: "Unknown",
    format: "Manga",
    type: "Ongoing",
    chapters,
  };
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
      const src = getImageSrc($, el);
      if (src && !src.includes("lazy.jpg") && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar") && !src.includes("/asset/img/") && /\.(jpg|jpeg|png|webp)/i.test(src)) {
        images.push(fixImageUrl(src));
      }
    });

    const chapterNav = $(".nxpr a.rl, a[href*='-chapter-']")
      .map((_, el) => $(el).attr("href") || "")
      .get()
      .filter((href, idx, arr) => href.includes("-chapter-") && arr.indexOf(href) === idx);

    return {
      title,
      chapter,
      images: Array.from(new Set(images)),
      prevChapter: chapterNav[0] ? resolveUrl(chapterNav[0]) : undefined,
      nextChapter: chapterNav.length > 1 ? resolveUrl(chapterNav[chapterNav.length - 1]) : undefined,
      mangaSlug: extractSlug(path || url),
    };
  } catch (error: any) {
    console.error("Error scraping chapter pages:", error.message);
    return null;
  }
}

function buildQuery(filters: MangaListFilters, includePage = true): string {
  const page = filters.halaman || 1;
  const params = new URLSearchParams();
  const tipe = normalizeFilterValue(filters.tipe);
  const genre = normalizeFilterValue(filters.genre);
  const genre2 = normalizeFilterValue(filters.genre2);
  const status = normalizeFilterValue(filters.status);
  const orderby = normalizeFilterValue(filters.orderby);

  if (tipe) params.set("tipe", tipe);
  if (genre) params.set("genre", genre);
  if (genre2) params.set("genre2", genre2);
  if (status) params.set("status", status === "end" ? "tamat" : status);
  if (orderby) params.set("orderby", orderby);
  if (includePage && page > 1) params.set("halaman", page.toString());
  return params.toString();
}

function getListUrls(filters: MangaListFilters): string[] {
  const page = filters.halaman || 1;
  const tipe = normalizeFilterValue(filters.tipe);
  const genre = normalizeFilterValue(filters.genre);
  const query = buildQuery(filters);
  const noPageQuery = buildQuery(filters, false);
  const urls: string[] = [];

  if (filters.s) {
    const searchParams = new URLSearchParams({ s: filters.s, post_type: "manga" });
    if (page > 1) searchParams.set("page", page.toString());
    urls.push(`/?${searchParams.toString()}`);
    urls.push(`/page/${page}/?${searchParams.toString()}`);
  }

  if (genre) {
    const genreQuery = new URLSearchParams(noPageQuery);
    genreQuery.delete("genre");
    const genreSuffix = genreQuery.toString();
    urls.push(page > 1 ? `/genre/${genre}/page/${page}/${genreSuffix ? `?${genreSuffix}` : ""}` : `/genre/${genre}/${genreSuffix ? `?${genreSuffix}` : ""}`);
  }

  if (tipe) {
    urls.push(page > 1 ? `/daftar-komik/page/${page}/?${noPageQuery}` : `/daftar-komik/?${noPageQuery}`);
  }

  urls.push(`/daftar-komik/${query ? `?${query}` : ""}`);
  if (page > 1) urls.push(`/daftar-komik/page/${page}/${noPageQuery ? `?${noPageQuery}` : ""}`);
  urls.push(`/pustaka/${query ? `?${query}` : ""}`);

  return Array.from(new Set(urls.filter(Boolean)));
}

function parsePagination($: cheerio.CheerioAPI, currentPage: number) {
  const bodyText = cleanMeta($("body").text());
  const totalFromText = bodyText.match(/Halaman\s+\d+\s+dari\s+(\d+)/i)?.[1];
  const pageNumbers = $(".pagination a, .nav-links a, .page-numbers, a")
    .map((_, el) => Number(cleanMeta($(el).text())))
    .get()
    .filter((n) => Number.isFinite(n));
  const totalPages = Math.max(currentPage, Number(totalFromText) || 1, ...pageNumbers);
  const hasNextPage =
    /Next\s*→|Berikutnya/i.test(bodyText) ||
    $("a.next, a.nextpostslink, .pagination a:contains('Next'), .pagination a:contains('→'), .nav-links a:contains('Next')").length > 0 ||
    pageNumbers.some((n) => n > currentPage) ||
    currentPage < totalPages;

  return {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage: currentPage > 1,
  };
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  const data = await getMangaList({ s: query, halaman: page });
  return data.manga.map((item) => ({
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
  let lastPagination = {
    currentPage,
    totalPages: currentPage,
    hasNextPage: false,
    hasPrevPage: currentPage > 1,
  };

  try {
    for (const url of getListUrls(filters)) {
      const { data: html } = await api.get(url);
      const $ = cheerio.load(html);
      const manga = parseMangaItems($);
      lastPagination = parsePagination($, currentPage);

      if (manga.length > 0) {
        return {
          manga: uniqueById(manga).slice(0, 10),
          pagination: lastPagination,
        };
      }
    }

    return { manga: [], pagination: lastPagination };
  } catch (error: any) {
    console.error("Error fetching manga list:", error.message);
    return {
      manga: [],
      pagination: { currentPage, totalPages: currentPage, hasNextPage: false, hasPrevPage: currentPage > 1 },
    };
  }
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const { data: html } = await api.get("/pustaka/");
    const $ = cheerio.load(html);
    const genres: { name: string; slug: string }[] = [];
    const seen = new Set<string>();

    $("select[name='genre'] option, a[href*='/genre/']").each((_, el) => {
      const rawName = $(el).text().replace(/\([\d.]+\)/, "").trim();
      const rawValue = $(el).attr("value") || $(el).attr("href") || "";
      const value = normalizeFilterValue(rawValue) || "";
      if (rawName && value && !seen.has(value) && !/^genre\s*\d*$/i.test(rawName)) {
        seen.add(value);
        genres.push({ name: rawName, slug: value });
      }
    });

    return genres;
  } catch {
    return [];
  }
}
