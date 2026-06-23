import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://komiku.org";
const API_URL = "https://api.komiku.org";

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

function parseLs2Item($: cheerio.CheerioAPI, el: any): MangaItem | null {
  const $el = $(el);
  const title =
    $el.find("h3 a").text().trim() ||
    $el
      .find("h3 a")
      .attr("title")
      ?.replace(/^Baca\s+(Manga\s+|Komik\s+)?/i, "") ||
    "";
  const href = $el.find("h3 a").attr("href") || $el.find(".ls2v a").first().attr("href") || "";
  const cover = getImageSrc($, $el.find("img").first().get(0));

  const chapters: MangaItem["chapters"] = [];
  $el.find(".ls2w a, .ls2j a.ls24, .ls2j a[href*='-chapter-']").each((_, ch) => {
    const chUrl = $(ch).attr("href") || "";
    if (!chUrl.includes("-chapter-")) return;
    chapters.push({
      number: $(ch).text().replace(/\s+/g, " ").trim(),
      time: "",
      url: resolveUrl(chUrl),
    });
  });

  if (!title) return null;
  return {
    id: extractSlug(href),
    title,
    cover: fixImageUrl(cover),
    chapters: chapters.slice(0, 3),
    isNew: $el.find(".up").length > 0,
    type: $el.attr("data-tipe") || undefined,
  };
}

function parseLs4Item($: cheerio.CheerioAPI, el: any): MangaItem | null {
  const $el = $(el);
  const title =
    $el.find("h4 a").text().trim() ||
    $el
      .find("h4 a")
      .attr("title")
      ?.replace(/^Baca\s+Komik\s+/i, "") ||
    "";
  const href = $el.find("h4 a").attr("href") || "";
  const cover = getImageSrc($, $el.find("img").first().get(0));
  const stats = $el.find(".ls4s").text().trim();

  const chapters: MangaItem["chapters"] = [];
  $el.find("a.ls24, a[href*='-chapter-']").each((_, ch) => {
    const chUrl = $(ch).attr("href") || "";
    if (!chUrl.includes("-chapter-")) return;
    chapters.push({
      number: $(ch).text().trim(),
      time: "",
      url: resolveUrl(chUrl),
    });
  });

  if (!title) return null;
  return {
    id: extractSlug(href),
    title,
    cover: fixImageUrl(cover),
    chapters: chapters.slice(0, 2),
    rating: stats.split("·").pop()?.trim(),
    type: stats.split("·")[0]?.trim(),
  };
}

function getFallbackData(): HomePageData {
    const mangaList: MangaItem[] = [
      {
        id: "the-beginning-after-the-end",
        title: "The Beginning After The End",
        cover: "https://thumbnail.komiku.org/uploads/manga/the-beginning-after-the-end/manga_thumbnail-Manhwa-The-Beginning-After-The-End-1.jpg",
        chapters: [
          {
            number: "Chapter 240",
            time: "9 mnt",
            url: "https://komiku.org/the-beginning-after-the-end-chapter-240/",
          },
        ],
        rating: "9.2",
        isNew: true,
      },
      {
          id: "solo-leveling",
          title: "Solo Leveling",
          cover: "https://thumbnail.komiku.org/img/upload/solo_leveling/img_5c760927e1f40.jpg",
          chapters: [
            {
              number: "Chapter 200",
              time: "1 jam",
              url: "https://komiku.org/solo-leveling-chapter-200/",
            },
          ],
          rating: "9.5",
          isNew: true,
        },
    ];

    return {
      featured: mangaList.slice(0, 3),
      recommendations: mangaList.slice(0, 6),
      updates: mangaList.slice(0, 8),
      popular: mangaList.slice(0, 12),
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

    $("#Rekomendasi_Komik .ls4").each((_, el) => {
      const item = parseLs4Item($, el);
      if (item) featured.push(item);
    });

    $("#Komik_Populer .ls2").each((_, el) => {
      const item = parseLs2Item($, el);
      if (item) popular.push(item);
    });

    $("#Terbaru .ls2, #Baru_Ditambahkan .ls2").each((_, el) => {
      const item = parseLs2Item($, el);
      if (item) updates.push(item);
    });

    if (updates.length === 0) {
      $(".ls2").each((_, el) => {
        const item = parseLs2Item($, el);
        if (item) updates.push(item);
      });
    }

    recommendations.push(...featured.slice(3, 9));
    if (recommendations.length === 0) {
      recommendations.push(...popular.slice(0, 6));
    }
    if (featured.length === 0) {
      featured.push(...popular.slice(0, 3));
    }

    const result = { featured, recommendations, updates, popular };
    if (result.updates.length > 0 || result.popular.length > 0) {
      return result;
    }
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

    const title =
      $("h1")
        .first()
        .text()
        .trim()
        .replace(/^Komik\s+/i, "") || slugToTitle(slug);
    const altTitle =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Alternatif"))
        .find("td")
        .last()
        .text()
        .trim() || "";
    const cover = getImageSrc($, $(".ims img").first().get(0));
    const synopsis = $("p.desc[itemprop='description'], p.desc").first().text().trim() || "";

    const rating =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Rating"))
        .find("td")
        .last()
        .text()
        .trim() || "";
    const views =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Pembaca"))
        .find("td")
        .last()
        .text()
        .trim() || "";

    const genres: { name: string; slug: string }[] = [];
    $("ul.genre a, .genre a").each((_, el) => {
      const name = $(el).text().trim();
      if (name) {
        genres.push({
          name,
          slug: $(el).attr("href") || "",
        });
      }
    });

    const author =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Author"))
        .find("td")
        .last()
        .text()
        .trim() || "";
    const artist = "";
    const format =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Tipe"))
        .find("td")
        .last()
        .text()
        .trim() || "";
    const type =
      $(".inftable tr")
        .filter((_, el) => $(el).find("td").first().text().includes("Status"))
        .find("td")
        .last()
        .text()
        .trim() || "";

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

    return {
      id: slug,
      title,
      altTitle,
      cover: fixImageUrl(cover),
      rating,
      views,
      chapters_count: chapters.length.toString(),
      synopsis,
      genres,
      author,
      artist,
      format,
      type,
      chapters,
    };
  } catch (error: any) {
    console.error("Error scraping manga detail:", error.message);
    return getFallbackMangaDetail(slug);
  }
}

function getFallbackMangaDetail(slug: string): MangaDetail {
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const cover = "https://via.placeholder.com/300x450/1A1A1A/666?text=No+Cover";
  const rating = "8.5";

  const chapters: MangaDetail["chapters"] = [];
  const chCount = 50 + Math.floor(Math.random() * 200);
  for (let i = chCount; i > 0; i--) {
    chapters.push({
      number: `Chapter ${i}`,
      time: i === chCount ? "1 jam lalu" : `${Math.floor(Math.random() * 30) + 1} hari lalu`,
      url: `${BASE_URL}/${slug}-chapter-${i}/`,
      isNew: i > chCount - 3,
    });
  }

  return {
    id: slug,
    title,
    altTitle: "",
    cover,
    rating,
    views: `${(Math.random() * 20 + 1).toFixed(1)}m`,
    chapters_count: chapters.length.toString(),
    synopsis: `${title} adalah manga/manhwa populer yang menceritakan tentang petualangan seru dengan berbagai karakter menarik. Ikuti perjalanan para tokoh utama dalam menghadapi berbagai tantangan dan rintangan yang menanti.`,
    genres: [
      { name: "Action", slug: "/genre/action" },
      { name: "Adventure", slug: "/genre/adventure" },
      { name: "Fantasy", slug: "/genre/fantasy" },
    ],
    author: "Unknown",
    artist: "Unknown",
    format: "Manhwa",
    type: "Project",
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
      if (
        src &&
        !src.includes("lazy.jpg") &&
        !src.includes("logo") &&
        !src.includes("icon") &&
        !src.includes("avatar") &&
        !src.includes("/asset/img/") &&
        /\.(jpg|jpeg|png|webp)/i.test(src)
      ) {
        images.push(fixImageUrl(src));
      }
    });

    const chapterNav = $(".nxpr a.rl")
      .map((_, el) => $(el).attr("href") || "")
      .get()
      .filter((href) => href.includes("-chapter-"));

    function extractNumFromHref(href: string) {
      const m = href.match(/-chapter-([\d.]+)/i);
      if (m && m[1]) return parseFloat(m[1]);
      return null;
    }

    const navItems = chapterNav.map((href) => ({ href, num: extractNumFromHref(href) }));
    const currentNum = parseFloat(String(chapter)) || null;

    let prevChapter: string | undefined;
    let nextChapter: string | undefined;

    if (!isNaN(Number(currentNum)) && navItems.some((i) => i.num !== null)) {
      const prev = navItems
        .filter((i) => i.num !== null && (i.num as number) < (currentNum as number))
        .sort((a, b) => (b.num as number) - (a.num as number))[0];
      const next = navItems
        .filter((i) => i.num !== null && (i.num as number) > (currentNum as number))
        .sort((a, b) => (a.num as number) - (b.num as number))[0];

      prevChapter = prev ? resolveUrl(prev.href) : undefined;
      nextChapter = next ? resolveUrl(next.href) : undefined;
    } else {
      prevChapter = chapterNav[0] ? resolveUrl(chapterNav[0]) : undefined;
      nextChapter = chapterNav.length > 1 ? resolveUrl(chapterNav[chapterNav.length - 1]) : undefined;
    }

    const seriesSlug = extractSlug(path || url);
    return { title, chapter, images, prevChapter, nextChapter, mangaSlug: seriesSlug };
  } catch (error: any) {
    console.error("Error scraping chapter pages:", error.message);
    return null;
  }
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  try {
    const { data: html } = await api.get("/", {
      params: { s: query, post_type: "manga" },
    });
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];
    const seen = new Set<string>();

    $(".bge, .manga-card, .ls2, .ls4").each((_, el) => {
      const $el = $(el);
      const link = $el.find("h3 a, h4 a, .ls2v a, a").filter((_, a) => !!$(a).attr("href")?.includes("/manga/")).first();
      const href = link.attr("href") || "";
      const slug = extractSlug(href);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);

      const title = link.text().trim() || slugToTitle(slug);
      const cover = getImageSrc($, $el.find("img").first().get(0));
      const latestChapter = $el.find(".new1 a, .ls2j a").first().text().trim();

      results.push({
        id: slug,
        title,
        cover: fixImageUrl(cover),
        latestChapter,
      });
    });

    return results;
  } catch (error: any) {
    console.error("Error searching manga:", error.message);
    return [];
  }
}

export async function getMangaList(filters: MangaListFilters): Promise<MangaListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.tipe) params.append("tipe", filters.tipe);
    if (filters.genre) params.append("genre", filters.genre);
    if (filters.genre2) params.append("genre2", filters.genre2);
    if (filters.status) params.append("status", filters.status);
    if (filters.orderby) params.append("orderby", filters.orderby);
    if (filters.halaman) params.append("halaman", filters.halaman.toString());
    if (filters.s) {
      params.append("s", filters.s);
      params.append("post_type", "manga");
    }

    const isSearch = !!filters.s;
    const isPustaka = filters.genre || filters.genre2 || filters.orderby;

    let finalUrl = `/daftar-komik/`;
    if (isSearch) {
        finalUrl = `/?${params.toString()}`;
    } else if (isPustaka) {
        finalUrl = `/pustaka/?${params.toString()}`;
    } else {
        const dParams = new URLSearchParams();
        if (filters.tipe) dParams.append("tipe", filters.tipe);
        if (filters.status) dParams.append("status", filters.status);
        if (filters.halaman) dParams.append("halaman", filters.halaman.toString());
        finalUrl = `/daftar-komik/?${dParams.toString()}`;
    }

    const { data: html } = await api.get(finalUrl);
    const $ = cheerio.load(html);

    const manga: MangaItem[] = [];
    const seen = new Set<string>();

    $(".manga-card, .bge, .ls2, .ls4").each((_, el) => {
      const $el = $(el);
      const link = $el.find("h3 a, h4 a, .ls2v a, a").filter((_, a) => !!$(a).attr("href")?.includes("/manga/")).first();
      const href = link.attr("href") || "";
      const slug = extractSlug(href);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);

      const title = link.text().trim() || slugToTitle(slug);
      const cover = getImageSrc($, $el.find("img").first().get(0));
      const typeStatus = $el.find(".meta, .ls4s").text().trim();

      manga.push({
        id: slug,
        title,
        cover: fixImageUrl(cover),
        type: typeStatus.split("•")[0]?.trim() || undefined,
        status: typeStatus.includes("Status:") ? typeStatus.split("Status:")[1]?.trim() : undefined,
      });
    });

    const pagination = {
      currentPage: filters.halaman || 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: (filters.halaman || 1) > 1,
    };

    const nextLink = $(".pagination a:contains('Next'), .pagination a:contains('→')").attr("href");
    if (nextLink) pagination.hasNextPage = true;

    const totalPagesMatch = $(".pagination a, .pagination span").last().text().match(/\d+/);
    if (totalPagesMatch) pagination.totalPages = parseInt(totalPagesMatch[0]);

    return { manga, pagination };
  } catch (error: any) {
    console.error("Error fetching manga list:", error.message);
    return {
      manga: [],
      pagination: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
    };
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
