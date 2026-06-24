export interface ReadingHistoryItem {
  mangaSlug: string;
  mangaTitle?: string;
  cover?: string;
  chapterSlug: string;
  chapterTitle?: string;
  chapterUrl: string;
  nextChapterSlug?: string | null;
  prevChapterSlug?: string | null;
  updatedAt: string;
  totalPages?: number;
}

export interface MangaBookmarkItem {
  id: string;
  title: string;
  cover: string;
  type?: string;
  savedAt: string;
  lastRead?: string;
}

const HISTORY_KEY = "manga_reading_history";
const BOOKMARK_KEY = "manga_bookmarks";
const LEGACY_READ_KEY = "manga_reads";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getBookmarks(): MangaBookmarkItem[] {
  if (!canUseStorage()) return [];
  return safeParse<MangaBookmarkItem[]>(localStorage.getItem(BOOKMARK_KEY), []);
}

export function saveBookmarks(items: MangaBookmarkItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(items));
}

export function getReadingHistory(): ReadingHistoryItem[] {
  if (!canUseStorage()) return [];
  return safeParse<ReadingHistoryItem[]>(localStorage.getItem(HISTORY_KEY), []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveReadingHistory(items: ReadingHistoryItem[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function upsertReadingHistory(item: ReadingHistoryItem) {
  if (!canUseStorage()) return;
  const history = getReadingHistory().filter((entry) => entry.mangaSlug !== item.mangaSlug);
  saveReadingHistory([item, ...history].slice(0, 80));
}

export function clearReadingHistory() {
  if (!canUseStorage()) return;
  localStorage.removeItem(HISTORY_KEY);
}

export function getLegacyReadMap(): Record<string, string[]> {
  if (!canUseStorage()) return {};
  return safeParse<Record<string, string[]>>(localStorage.getItem(LEGACY_READ_KEY), {});
}

export function getLastLegacyRead(mangaSlug: string): string | null {
  const map = getLegacyReadMap();
  const reads = Array.isArray(map[mangaSlug]) ? map[mangaSlug] : [];
  return reads[reads.length - 1] || null;
}

export function prettyDate(value?: string) {
  if (!value) return "Baru saja";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Baru saja";
  const diff = Date.now() - time;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
