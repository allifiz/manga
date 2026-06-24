"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface MangaDetail {
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

function chapterNumber(value: string): number | null {
  const match = value.match(/(?:chapter|ch\.?|bab)?\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickStartChapter(manga: MangaDetail) {
  return manga.chapters[manga.chapters.length - 1] ?? manga.chapters[0] ?? null;
}

function pickContinueChapter(manga: MangaDetail, lastReadUrl: string | null) {
  if (!lastReadUrl) return pickStartChapter(manga);

  const currentIndex = manga.chapters.findIndex((chapter) => chapter.url === lastReadUrl);
  const current = currentIndex >= 0 ? manga.chapters[currentIndex] : null;
  if (!current) return pickStartChapter(manga);

  const currentNumber = chapterNumber(current.number) ?? chapterNumber(current.url);
  if (currentNumber !== null) {
    const nextByNumber = manga.chapters
      .map((chapter) => ({ chapter, number: chapterNumber(chapter.number) ?? chapterNumber(chapter.url) }))
      .filter((item): item is { chapter: MangaDetail["chapters"][number]; number: number } => item.number !== null && item.number > currentNumber)
      .sort((a, b) => a.number - b.number)[0]?.chapter;

    if (nextByNumber) return nextByNumber;
  }

  // Most chapter lists are newest-first. If the user just read chapter 20,
  // the chronological next chapter is usually one position before it.
  return manga.chapters[currentIndex - 1] ?? manga.chapters[currentIndex + 1] ?? current;
}

function isUsefulValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const clean = value.trim().toLowerCase();
  return Boolean(clean) && !["n/a", "na", "-", "unknown", "undefined", "null"].includes(clean);
}

export default function MangaDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [manga, setManga] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chapters" | "info">("chapters");
  const [imgError, setImgError] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [lastReadUrl, setLastReadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/manga/${slug}`)
        .then((res) => res.json())
        .then((d) => {
          setManga(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const saved = localStorage.getItem("manga_bookmarks");
      if (saved) {
        const arr = JSON.parse(saved) as { id: string }[];
        setBookmarked(arr.some((b) => b.id === slug));
      }
    } catch (e) {}
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    try {
      const raw = localStorage.getItem("manga_reads");
      const map = raw ? JSON.parse(raw) : {};
      const arr = Array.isArray(map[slug]) ? map[slug] : [];
      setReadSet(new Set(arr));
      setLastReadUrl(arr[arr.length - 1] ?? null);
    } catch (e) {
      setReadSet(new Set());
      setLastReadUrl(null);
    }
  }, [slug, manga]);

  const toggleChapterRead = (chapterUrl: string) => {
    if (!slug) return;
    try {
      const key = "manga_reads";
      const raw = localStorage.getItem(key);
      const map = raw ? JSON.parse(raw) : {};
      const arr = Array.isArray(map[slug]) ? map[slug] : [];
      const exists = arr.includes(chapterUrl);
      let updatedArr: string[];
      if (exists) {
        updatedArr = arr.filter((u: string) => u !== chapterUrl);
      } else {
        updatedArr = [...arr, chapterUrl];
      }
      map[slug] = updatedArr;
      localStorage.setItem(key, JSON.stringify(map));
      setReadSet(new Set(updatedArr));
      setLastReadUrl(updatedArr[updatedArr.length - 1] ?? null);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBookmark = () => {
    if (!manga) return;
    try {
      const key = "manga_bookmarks";
      const saved = localStorage.getItem(key);
      const arr = saved ? (JSON.parse(saved) as any[]) : [];
      const exists = arr.find((a) => a.id === manga.id);
      if (exists) {
        const updated = arr.filter((a) => a.id !== manga.id);
        localStorage.setItem(key, JSON.stringify(updated));
        setBookmarked(false);
      } else {
        const bm = { id: manga.id, title: manga.title, cover: manga.cover, savedAt: new Date().toISOString() };
        arr.unshift(bm);
        localStorage.setItem(key, JSON.stringify(arr));
        setBookmarked(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const continueChapter = manga ? pickContinueChapter(manga, lastReadUrl) : null;
  const hasStartedReading = Boolean(lastReadUrl) || (manga ? manga.chapters.some((ch) => readSet.has(ch.url)) : false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="skeleton h-8 w-32 mb-6" />
          <div className="flex flex-col items-center">
            <div className="skeleton w-48 h-72 mb-4" />
            <div className="skeleton h-6 w-2/3 mb-2" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-white font-semibold text-lg mb-2">Manga Tidak Ditemukan</h3>
        <Link href="/" className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700">
          Kembali ke Home
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Rating", value: manga.rating || "N/A", color: "text-yellow-400", show: true },
    { label: "Pembaca", value: manga.views || "", color: "text-blue-400", show: isUsefulValue(manga.views) },
    { label: "Chapters", value: manga.chapters_count || "0", color: "text-green-400", show: true },
    { label: "Tipe", value: manga.type || manga.format || "-", color: "text-primary", show: true },
  ].filter((stat) => stat.show);

  return (
    <div className="min-h-screen bg-[#050508] pb-24 relative overflow-hidden">
      <div className="sticky top-0 z-50 bg-[#050508]/80 backdrop-blur-md border-b border-border/80">
        <div className="max-w-2xl mx-auto flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => window.history.back()}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-all active:scale-95 border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10 px-4">
        <div className="absolute top-0 left-0 right-0 h-[280px] overflow-hidden -mx-4 pointer-events-none z-0">
          {!imgError ? <img src={manga.cover} alt="" className="w-full h-full object-cover blur-[50px] opacity-20 scale-110" /> : null}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/40 to-[#050508]" />
        </div>

        <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
          <div className="w-44 h-64 rounded-2xl overflow-hidden mb-5 relative shadow-[0_12px_36px_rgba(0,0,0,0.6)] border border-white/10">
            {!imgError ? (
              <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full bg-card-bg flex items-center justify-center">
                <span className="text-muted">No Cover</span>
              </div>
            )}
          </div>
          <h1 className="text-white font-black text-xl md:text-2xl text-center mb-1.5 tracking-tight px-4 leading-tight">{manga.title}</h1>
          {manga.altTitle && <p className="text-muted text-xs text-center mb-4 px-6 font-medium">{manga.altTitle}</p>}
        </div>

        <div className="relative z-10 space-y-3 mb-6">
          {continueChapter && (
            <Link
              href={`/read?u=${encodeURIComponent(btoa(continueChapter.url))}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm transition-all shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.5)] active:scale-[0.99]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {hasStartedReading ? "Lanjut Baca" : "Mulai Membaca"}
            </Link>
          )}
          <div className="flex gap-3">
            <button
              onClick={toggleBookmark}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                bookmarked ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white"
              }`}
            >
              <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Readlist
            </button>
          </div>
        </div>

        <div className={`grid ${stats.length === 4 ? "grid-cols-4" : "grid-cols-3"} gap-3 mb-6 relative z-10`}>
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 text-center shadow-sm">
              <p className={`font-black text-base md:text-lg ${stat.color}`}>{stat.value}</p>
              <p className="text-muted text-[10px] uppercase font-bold tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {manga.synopsis && (
          <div className="mb-6 relative z-10 bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-sm">
            <h3 className="text-white font-bold text-sm mb-2 relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-3.5 before:bg-primary before:rounded-full">
              Sinopsis
            </h3>
            <p className="text-muted text-xs leading-relaxed">{manga.synopsis}</p>
          </div>
        )}

        <div className="mb-6 relative z-10">
          {manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.genres.map((genre, idx) => (
                <Link
                  key={idx}
                  href={`/explore?genre=${genre.slug}`}
                  className="px-3 py-1 bg-white/5 border border-white/5 text-muted text-xs rounded-full hover:bg-primary hover:text-white hover:border-primary/50 cursor-pointer transition-all duration-200"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          )}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs space-y-2.5">
            {manga.author && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted font-medium">Author</span>
                <span className="text-primary font-bold">{manga.author}</span>
              </div>
            )}
            {manga.artist && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted font-medium">Artist</span>
                <span className="text-primary font-bold">{manga.artist}</span>
              </div>
            )}
            {manga.format && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-muted font-medium">Format</span>
                <span className="text-white font-bold">{manga.format}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-border/60 mb-4 relative z-10">
          <div className="flex p-0.5 rounded-full bg-white/5 border border-white/5 max-w-xs mb-3">
            {(["chapters", "info"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
                  activeTab === tab ? "bg-primary text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]" : "text-muted hover:text-white"
                }`}
              >
                {tab === "chapters" ? `Chapters (${manga.chapters.length})` : "Info Lengkap"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "chapters" && (
          <div className="relative z-10">
            {manga.chapters.length > 0 ? (
              <div className="space-y-1 bg-white/[0.01] border border-white/5 rounded-2xl p-2">
                {manga.chapters.map((ch, idx) => {
                  const isRead = readSet.has(ch.url);
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <Link
                        href={`/read?u=${encodeURIComponent(btoa(ch.url))}`}
                        className={`flex-1 flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-150 group active:scale-[0.99] border border-transparent hover:border-white/5 ${
                          isRead ? "opacity-50 hover:bg-white/3" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {ch.isNew && !isRead && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">UP</span>}
                          {isRead && (
                            <svg className="w-3 h-3 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          <span className={`text-xs font-bold transition-colors duration-150 ${isRead ? "text-muted/50" : "text-muted group-hover:text-primary"}`}>{ch.number}</span>
                        </div>
                        <span className="text-muted/50 text-[10px] font-medium">{ch.time}</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleChapterRead(ch.url);
                        }}
                        className={`p-2 rounded-lg transition-all active:scale-90 ${isRead ? "text-primary hover:text-muted/50" : "text-muted/30 hover:text-primary"}`}
                        title={isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted text-xs py-8 text-center bg-card-bg/40 rounded-2xl border border-border">Tidak ada chapter tersedia</p>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="relative z-10 space-y-3">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <h4 className="text-white font-bold text-sm mb-3">Detail Manga Lengkap</h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-muted font-medium">Judul Asli</span>
                  <span className="text-white font-bold text-right max-w-[65%] leading-tight">{manga.title}</span>
                </div>
                {manga.altTitle && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-muted font-medium">Nama Alternatif</span>
                    <span className="text-white font-bold text-right max-w-[65%] leading-tight">{manga.altTitle}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-muted font-medium">Penulis</span>
                  <span className="text-white font-bold">{manga.author || "-"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-muted font-medium">Tipe / Format</span>
                  <span className="text-white font-bold">{manga.type || manga.format || "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted font-medium">Skor Rating</span>
                  <span className="text-yellow-400 font-bold">{manga.rating || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
