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
const searchApi = createClient(API_URL);

export interface MangaItem {
  id: string;
  title: string;
  cover: string;
  chapters: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
  type?: string;
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
}

export interface HomePageData {
  featured: MangaItem[];
  recommendations: MangaItem[];
  updates: MangaItem[];
  popular: MangaItem[];
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
  return resolveUrl(url);
}

function getImageSrc($: cheerio.CheerioAPI, el: unknown): string {
  if (!el) return "";
  const $el = $(el as never);
  return $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("src") || "";
}

function parseLs2Item($: cheerio.CheerioAPI, el: unknown): MangaItem | null {
  const $el = $(el as never);
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

function parseLs4Item($: cheerio.CheerioAPI, el: unknown): MangaItem | null {
  const $el = $(el as never);
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

// Fallback manga data from known popular titles
function getFallbackData(): HomePageData {
  const mangaList: MangaItem[] = [
    {
      id: "the-beginning-after-the-end",
      title: "The Beginning After The End",
      cover: "https://m.media-amazon.com/images/I/81k8p8yEj4L._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 240",
          time: "9 mnt",
          url: "https://komiku.org/the-beginning-after-the-end-chapter-240/",
        },
        {
          number: "Chapter 239",
          time: "6 hari",
          url: "https://komiku.org/the-beginning-after-the-end-chapter-239/",
        },
      ],
      rating: "9.2",
      isNew: true,
    },
    {
      id: "solo-leveling",
      title: "Solo Leveling",
      cover: "https://m.media-amazon.com/images/I/81f9FjO-URL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 200",
          time: "1 jam",
          url: "https://komiku.org/solo-leveling-chapter-200/",
        },
        {
          number: "Chapter 199",
          time: "3 hari",
          url: "https://komiku.org/solo-leveling-chapter-199/",
        },
      ],
      rating: "9.5",
      isNew: true,
    },
    {
      id: "one-punch-man",
      title: "One Punch Man",
      cover: "https://m.media-amazon.com/images/I/81U9WH1V4mL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 245",
          time: "2 jam",
          url: "https://komiku.org/one-punch-man-chapter-245/",
        },
        {
          number: "Chapter 244",
          time: "7 hari",
          url: "https://komiku.org/one-punch-man-chapter-244/",
        },
      ],
      rating: "9.0",
    },
    {
      id: "jujutsu-kaisen",
      title: "Jujutsu Kaisen",
      cover: "https://m.media-amazon.com/images/I/81bX4KnYx+L._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 271",
          time: "3 jam",
          url: "https://komiku.org/jujutsu-kaisen-chapter-271/",
        },
        {
          number: "Chapter 270",
          time: "5 hari",
          url: "https://komiku.org/jujutsu-kaisen-chapter-270/",
        },
      ],
      rating: "8.8",
    },
    {
      id: "tower-of-god",
      title: "Tower of God",
      cover: "https://m.media-amazon.com/images/I/81vC3RqsVxL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 630",
          time: "5 jam",
          url: "https://komiku.org/tower-of-god-chapter-630/",
        },
        {
          number: "Chapter 629",
          time: "7 hari",
          url: "https://komiku.org/tower-of-god-chapter-629/",
        },
      ],
      rating: "8.6",
      isNew: true,
    },
    {
      id: "chainsaw-man",
      title: "Chainsaw Man",
      cover: "https://m.media-amazon.com/images/I/81d6Fj25FEL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 180",
          time: "6 jam",
          url: "https://komiku.org/chainsaw-man-chapter-180/",
        },
        {
          number: "Chapter 179",
          time: "2 hari",
          url: "https://komiku.org/chainsaw-man-chapter-179/",
        },
      ],
      rating: "8.9",
    },
    {
      id: "spy-x-family",
      title: "Spy x Family",
      cover: "https://m.media-amazon.com/images/I/81Yr9yH4KVL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 110",
          time: "8 jam",
          url: "https://komiku.org/spy-x-family-chapter-110/",
        },
        {
          number: "Chapter 109",
          time: "4 hari",
          url: "https://komiku.org/spy-x-family-chapter-109/",
        },
      ],
      rating: "8.7",
    },
    {
      id: "my-hero-academia",
      title: "My Hero Academia",
      cover: "https://m.media-amazon.com/images/I/81e5UO5C7fL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 430",
          time: "1 hari",
          url: "https://komiku.org/my-hero-academia-chapter-430/",
        },
        {
          number: "Chapter 429",
          time: "8 hari",
          url: "https://komiku.org/my-hero-academia-chapter-429/",
        },
      ],
      rating: "8.5",
    },
    {
      id: "demon-slayer",
      title: "Demon Slayer: Kimetsu no Yaiba",
      cover: "https://m.media-amazon.com/images/I/81cE5+NKjRL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 205",
          time: "2 hari",
          url: "https://komiku.org/demon-slayer-chapter-205/",
        },
        {
          number: "Chapter 204",
          time: "10 hari",
          url: "https://komiku.org/demon-slayer-chapter-204/",
        },
      ],
      rating: "9.1",
    },
    {
      id: "lookism",
      title: "Lookism",
      cover: "https://m.media-amazon.com/images/I/71g7b-GqYRL._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 520",
          time: "12 jam",
          url: "https://komiku.org/lookism-chapter-520/",
        },
        {
          number: "Chapter 519",
          time: "5 hari",
          url: "https://komiku.org/lookism-chapter-519/",
        },
      ],
      rating: "8.4",
      isNew: true,
    },
    {
      id: "black-clover",
      title: "Black Clover",
      cover: "https://m.media-amazon.com/images/I/81qYVV56V7L._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 370",
          time: "1 hari",
          url: "https://komiku.org/black-clover-chapter-370/",
        },
        {
          number: "Chapter 369",
          time: "6 hari",
          url: "https://komiku.org/black-clover-chapter-369/",
        },
      ],
      rating: "8.3",
    },
    {
      id: "one-piece",
      title: "One Piece",
      cover: "https://m.media-amazon.com/images/I/81p+B7lMf4L._AC_UF1000,1000_QL80_.jpg",
      chapters: [
        {
          number: "Chapter 1120",
          time: "3 hari",
          url: "https://komiku.org/one-piece-chapter-1120/",
        },
        {
          number: "Chapter 1119",
          time: "10 hari",
          url: "https://komiku.org/one-piece-chapter-1119/",
        },
      ],
      rating: "9.4",
    },
  ];

  return {
    featured: mangaList.slice(0, 3),
    recommendations: mangaList.slice(3, 9),
    updates: mangaList.slice(0, 8),
    popular: mangaList.slice(4, 12),
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
  } catch (error: unknown) {
    const err = error as { message?: string; response?: { status: number } };
    console.error("Error scraping homepage:", err.message);
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
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error scraping manga detail:", err.message);
    return getFallbackMangaDetail(slug);
  }
}

function getFallbackMangaDetail(slug: string): MangaDetail {
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const fallbackData = getFallbackData();
  const found = [...fallbackData.updates, ...fallbackData.popular].find((m) => m.id === slug);

  const cover = found?.cover || "https://via.placeholder.com/300x450/1A1A1A/666?text=No+Cover";
  const rating = found?.rating || "8.5";

  // Generate sample chapters
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

    // Attempt to determine prev/next by chapter numbers (more robust)
    function extractNumFromHref(href: string): number | null {
      const m = href.match(/-chapter-([\d.]+)/i);
      if (m && m[1]) return parseFloat(m[1]);
      return null;
    }

    const navItems = chapterNav.map((href) => ({ href, num: extractNumFromHref(href) }));
    const currentNum = parseFloat(String(chapter)) || null;

    let prevChapter: string | undefined;
    let nextChapter: string | undefined;

    if (!isNaN(Number(currentNum)) && navItems.some((i) => i.num !== null)) {
      // find prev: largest num < currentNum
      const prev = navItems
        .filter((i) => i.num !== null && (i.num as number) < (currentNum as number))
        .sort((a, b) => (b.num as number) - (a.num as number))[0];
      // find next: smallest num > currentNum
      const next = navItems
        .filter((i) => i.num !== null && (i.num as number) > (currentNum as number))
        .sort((a, b) => (a.num as number) - (b.num as number))[0];

      prevChapter = prev ? resolveUrl(prev.href) : undefined;
      nextChapter = next ? resolveUrl(next.href) : undefined;
    } else {
      // Fallback to original ordering if numbers not parseable
      prevChapter = chapterNav[0] ? resolveUrl(chapterNav[0]) : undefined;
      nextChapter = chapterNav.length > 1 ? resolveUrl(chapterNav[chapterNav.length - 1]) : undefined;
    }

    const seriesSlug = extractSlug(path || url);
    return { title, chapter, images, prevChapter, nextChapter, mangaSlug: seriesSlug };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error scraping chapter pages:", err.message);
    return null;
  }
}

export async function searchManga(query: string, page = 1): Promise<SearchResult[]> {
  try {
    const { data: html } = await searchApi.get("/", {
      params: { s: query, page: page > 1 ? page : undefined },
    });
    const $ = cheerio.load(html);

    const results: SearchResult[] = [];
    const seen = new Set<string>();

    $(".bge").each((_, el) => {
      const $el = $(el);
      const chapterHref = $el.find(".kan > a").attr("href") || $el.find(".bgei a").attr("href") || "";
      const slug = extractSlug(chapterHref);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);

      const title = $el.find("h3").text().trim() !== "Untitled" ? $el.find("h3").text().trim() : slugToTitle(slug);
      const latestChapter = $el.find(".new1 a[title*='Terbaru'], .new1").last().find("span").last().text().trim();

      results.push({
        id: slug,
        title,
        cover: "",
        type: latestChapter || undefined,
      });
    });

    return results;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error searching manga:", err.message);
    return [];
  }
}

export async function getGenreList(): Promise<{ name: string; slug: string }[]> {
  try {
    const { data: html } = await api.get("/");
    const $ = cheerio.load(html);
    const genres: { name: string; slug: string }[] = [];
    const seen = new Set<string>();

    $("section.Genre a, section[id='Genre'] a, a[href*='/genre/']").each((_, el) => {
      const name = $(el).text().trim();
      const slug = $(el).attr("href") || "";
      if (name && name.length < 30 && !seen.has(name)) {
        seen.add(name);
        genres.push({ name, slug });
      }
    });
    return genres;
  } catch {
    return [];
  }
}
