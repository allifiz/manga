"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MangaCard from "@/components/MangaCard";
import { getBookmarks, getReadingHistory, prettyDate, saveBookmarks, type MangaBookmarkItem, type ReadingHistoryItem } from "@/lib/readingStorage";

type DetailChapter = {
  number?: string;
  title?: string;
  chapter?: string;
  url?: string;
};

type MangaDetailResponse = {
  chapters?: DetailChapter[];
};

function readHref(item: ReadingHistoryItem) {
  const target = item.nextChapterSlug ? `/komik/${item.mangaSlug}/${item.nextChapterSlug}` : item.chapterUrl;
  return `/read?u=${encodeURIComponent(btoa(target))}`;
}

function chapterSlugFromUrl(value?: string) {
  if (!value) return "";
  const clean = value.split("?")[0].replace(/\/$/, "");
  return clean.split("/").filter(Boolean).pop() || "";
}

function sortBookmarksByUpdate(items: MangaBookmarkItem[]) {
  return [...items].sort((a, b) => {
    if (a.unreadUpdate && !b.unreadUpdate) return -1;
    if (!a.unreadUpdate && b.unreadUpdate) return 1;

    const aTime = new Date(a.updatedAt || a.savedAt).getTime();
    const bTime = new Date(b.updatedAt || b.savedAt).getTime();
    return bTime - aTime;
  });
}

async function checkBookmarkUpdates(items: MangaBookmarkItem[]) {
  if (items.length === 0) return items;

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const res = await fetch(`/api/manga/${item.id}`);
      if (!res.ok) return item;

      const detail = (await res.json()) as MangaDetailResponse;
      const latest = detail.chapters?.[0];
      const latestChapter = latest?.number || latest?.chapter || latest?.title || "";
      const latestChapterSlug = chapterSlugFromUrl(latest?.url) || latestChapter;
      const previousChapterSlug = item.lastKnownChapterSlug || item.latestChapterSlug;
      const hasUpdate = Boolean(previousChapterSlug && latestChapterSlug && previousChapterSlug !== latestChapterSlug);
      const now = new Date().toISOString();

      return {
        ...item,
        latestChapter: latestChapter || item.latestChapter,
        latestChapterSlug: latestChapterSlug || item.latestChapterSlug,
        lastKnownChapterSlug: previousChapterSlug || latestChapterSlug || item.lastKnownChapterSlug,
        unreadUpdate: hasUpdate ? true : item.unreadUpdate,
        updatedAt: hasUpdate ? now : item.updatedAt,
        updateCheckedAt: now,
      } satisfies MangaBookmarkItem;
    })
  );

  return sortBookmarksByUpdate(
    results.map((result, index) => (result.status === "fulfilled" ? result.value : items[index]))
  );
}

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<MangaBookmarkItem[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [tab, setTab] = useState<"bookmarks" | "history">("bookmarks");

  useEffect(() => {
    let ignore = false;
    const storedBookmarks = sortBookmarksByUpdate(getBookmarks());

    setBookmarks(storedBookmarks);
    setHistory(getReadingHistory());

    checkBookmarkUpdates(storedBookmarks).then((updated) => {
      if (ignore) return;
      setBookmarks(updated);
      saveBookmarks(updated);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const clearUpdateBadge = (id: string) => {
    const updated = bookmarks.map((item) => {
      if (item.id !== id || !item.unreadUpdate) return item;

      return {
        ...item,
        unreadUpdate: false,
        lastKnownChapterSlug: item.latestChapterSlug || item.lastKnownChapterSlug,
        lastRead: new Date().toISOString(),
      };
    });

    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const stats = useMemo(
    () => [
      { label: "Tersimpan", value: bookmarks.length },
      { label: "Update", value: bookmarks.filter((item) => item.unreadUpdate).length },
      { label: "Terakhir", value: history[0] ? prettyDate(history[0].updatedAt) : "Belum ada" },
    ],
    [bookmarks, history]
  );

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full pb-32 px-4">
      <div className="py-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 mb-7 shadow-[0_24px_80px_-45px_rgba(168,85,247,0.8)]">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.24em] mb-2">Personal shelf</p>
          <h1 className="text-white font-black text-3xl tracking-tight mb-3">Library</h1>
          <p className="text-muted text-sm max-w-xl leading-relaxed">Tempat buat judul yang kamu simpan dan chapter yang terakhir kamu baca. Manga yang punya update baru akan naik ke atas dan ditandai badge U.</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-black/20 border border-white/10 p-3">
                <p className="text-white font-black text-sm truncate">{item.value}</p>
                <p className="text-muted text-[10px] font-black uppercase tracking-widest mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 mb-6 w-full sm:w-fit">
          <button
            onClick={() => setTab("bookmarks")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === "bookmarks" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted hover:text-white"}`}
          >
            Favorit
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === "history" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted hover:text-white"}`}
          >
            Riwayat
          </button>
        </div>

        {tab === "bookmarks" ? (
          bookmarks.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 animate-fade-in">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="relative group" onClick={() => clearUpdateBadge(bm.id)}>
                  <MangaCard id={bm.id} title={bm.title} cover={bm.cover} type={bm.type} variant="vertical" hasUnreadUpdate={bm.unreadUpdate} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeBookmark(bm.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-accent-red text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-accent-red/40 translate-y-2 group-hover:translate-y-0"
                    aria-label="Hapus bookmark"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Pustaka Kamu Kosong" description="Simpan manga dari halaman detail supaya gampang ditemukan lagi." href="/explore" cta="Jelajahi Manga" />
          )
        ) : history.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            {history.map((item) => (
              <Link key={`${item.mangaSlug}-${item.chapterSlug}`} href={readHref(item)} className="group flex gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.04] hover:bg-white/[0.07] hover:border-primary/30 p-3 transition-all active:scale-[0.99]">
                <div className="w-18 h-26 rounded-2xl bg-card-bg border border-white/10 overflow-hidden shrink-0">
                  {item.cover ? <img src={item.cover} alt={item.mangaTitle || item.mangaSlug} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <h3 className="text-white font-black line-clamp-2 group-hover:text-primary transition-colors">{item.mangaTitle || item.mangaSlug.replace(/-/g, " ")}</h3>
                  <p className="text-muted text-xs font-bold mt-2 line-clamp-1">Terakhir baca: {item.chapterTitle || item.chapterSlug.replace(/-/g, " ")}</p>
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <span className="text-[10px] text-primary font-black rounded-full bg-primary/10 border border-primary/15 px-2.5 py-1">{item.nextChapterSlug ? "Lanjut chapter berikutnya" : "Baca lagi"}</span>
                    <span className="text-[10px] text-muted/60 font-bold">{prettyDate(item.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum Ada Riwayat" description="Riwayat akan muncul otomatis setelah kamu membuka chapter." href="/explore" cta="Mulai Membaca" />
        )}
      </div>
    </main>
  );
}

function EmptyState({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <div className="text-center py-28 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
        <svg className="w-12 h-12 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <h3 className="text-white font-black text-xl mb-3">{title}</h3>
      <p className="text-muted text-sm max-w-xs mx-auto mb-10">{description}</p>
      <Link href={href} className="inline-flex items-center px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95">
        {cta}
      </Link>
    </div>
  );
}
