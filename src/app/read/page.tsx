"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { upsertReadingHistory } from "@/lib/readingStorage";

interface ChapterData {
  title: string;
  chapter: string;
  images: string[];
  prevChapter?: string;
  nextChapter?: string;
  mangaSlug?: string;
}

type ReaderWidth = "fit" | "compact" | "original";
type ReaderTheme = "dark" | "black" | "sepia";
type ReaderGap = "normal" | "tight" | "wide";

interface ReaderSettings {
  width: ReaderWidth;
  theme: ReaderTheme;
  gap: ReaderGap;
}

const DEFAULT_SETTINGS: ReaderSettings = { width: "fit", theme: "dark", gap: "normal" };
const SETTINGS_KEY = "manga_reader_settings";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chapterSlugFromInput(value: string): string {
  const clean = value.trim();
  const legacyMatch = clean.match(/\/komik\/[^/]+\/([^/?#]+)/);
  if (legacyMatch?.[1]) return legacyMatch[1];
  const chapterMatch = clean.match(/\/chapter\/([^/?#]+)/);
  if (chapterMatch?.[1]) return chapterMatch[1];
  const slugMatch = clean.match(/([^/]+-chapter-[^/?#]+)/i);
  if (slugMatch?.[1]) return slugMatch[1];
  return slugify(clean);
}

function mangaSlugFromChapter(chapterSlug: string): string {
  return chapterSlug.replace(/-chapter-.+$/i, "");
}

function titleFromSlug(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function canonicalChapterUrl(mangaSlug: string | undefined, input: string): string {
  const chapterSlug = chapterSlugFromInput(input);
  const cleanMangaSlug = mangaSlug || mangaSlugFromChapter(chapterSlug);
  return `/komik/${cleanMangaSlug}/${chapterSlug}`;
}

function makeReadHref(mangaSlug: string | undefined, chapter: string): string {
  return `/read?u=${encodeURIComponent(btoa(canonicalChapterUrl(mangaSlug, chapter)))}`;
}

function loadReaderSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function ReaderLoading() {
  return (
    <div className="min-h-screen reader-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center glass-card rounded-[2rem] p-8">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <h2 className="text-white font-black text-lg mb-1">Menyiapkan chapter</h2>
        <p className="text-muted text-sm">Sebentar, gambar sedang dimuat...</p>
      </div>
    </div>
  );
}

function ReadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawUrlParam = searchParams.get("url");
  const encodedParam = searchParams.get("u");
  let url = "";
  if (rawUrlParam) url = rawUrlParam;
  else if (encodedParam) {
    try {
      url = atob(decodeURIComponent(encodedParam));
    } catch {
      url = "";
    }
  }

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [retryNonce, setRetryNonce] = useState<Record<number, number>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadReaderSettings());
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setImgErrors(new Set());
    setRetryNonce({});
    fetch(`/api/read?u=${encodeURIComponent(btoa(url))}`)
      .then((res) => res.json())
      .then((d: ChapterData) => {
        setData(d);

        try {
          const chapterSlug = chapterSlugFromInput(url);
          const mangaSlug = d?.mangaSlug || mangaSlugFromChapter(chapterSlug);
          const canonicalUrl = canonicalChapterUrl(mangaSlug, chapterSlug);
          const key = "manga_reads";
          const raw = localStorage.getItem(key);
          const map = raw ? JSON.parse(raw) : {};
          const arr = Array.isArray(map[mangaSlug]) ? map[mangaSlug].filter((item: string) => item !== canonicalUrl) : [];
          arr.push(canonicalUrl);
          map[mangaSlug] = arr;
          localStorage.setItem(key, JSON.stringify(map));

          upsertReadingHistory({
            mangaSlug,
            mangaTitle: titleFromSlug(mangaSlug),
            chapterSlug,
            chapterTitle: d?.chapter || d?.title || titleFromSlug(chapterSlug),
            chapterUrl: canonicalUrl,
            nextChapterSlug: d?.nextChapter || null,
            prevChapterSlug: d?.prevChapter || null,
            totalPages: d?.images?.length || 0,
            updatedAt: new Date().toISOString(),
          });
        } catch {}

        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setScrollProgress((window.scrollY / totalHeight) * 100);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data]);

  useEffect(() => {
    if (!showControls || showSettings) return;
    const timer = setTimeout(() => setShowControls(false), 4200);
    return () => clearTimeout(timer);
  }, [showControls, showSettings]);

  const handleImgError = (idx: number) => setImgErrors((prev) => new Set(prev).add(idx));

  const retryImage = (idx: number) => {
    setImgErrors((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    setRetryNonce((prev) => ({ ...prev, [idx]: Date.now() }));
  };

  const imageSrc = (img: string, idx: number) => {
    const nonce = retryNonce[idx];
    const proxied = `/api/image?url=${encodeURIComponent(img)}`;
    return nonce ? `${proxied}&retry=${nonce}` : proxied;
  };

  const themeClass = settings.theme === "black" ? "bg-black text-white" : settings.theme === "sepia" ? "bg-[#1d1711] text-[#f4ead7]" : "reader-surface text-foreground";
  const imageWrapClass = settings.width === "compact" ? "max-w-2xl" : settings.width === "original" ? "max-w-none" : "max-w-4xl";
  const imageClass = settings.width === "original" ? "w-auto max-w-full block mx-auto" : "w-full block mx-auto";
  const gapClass = settings.gap === "tight" ? "space-y-0" : settings.gap === "wide" ? "space-y-5 sm:space-y-7" : "space-y-2 sm:space-y-3";

  const currentPage = useMemo(() => {
    if (!data?.images.length) return 1;
    return Math.max(1, Math.ceil((scrollProgress / 100) * data.images.length));
  }, [data?.images.length, scrollProgress]);

  if (loading) return <ReaderLoading />;

  if (!data || data.images.length === 0) {
    return (
      <div className="min-h-screen reader-surface flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md glass-card rounded-[2rem] p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/6 border border-white/10 flex items-center justify-center text-muted/60 mb-5">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-white font-black text-xl mb-2">Chapter belum bisa dimuat</h3>
          <p className="text-muted text-sm mb-6 leading-relaxed">Gambar chapter tidak ditemukan dari sumber. Coba kembali ke detail, lalu buka chapter lain.</p>
          <button onClick={() => router.back()} className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg shadow-primary/25">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClass} pb-28`} onClick={() => setShowControls((state) => !state)}>
      <div className="sticky top-0 z-40 bg-[#050508]/78 backdrop-blur-2xl border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary to-indigo-500 transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
        <div className="max-w-4xl mx-auto flex items-center h-16 px-4 justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-muted hover:text-white p-2.5 hover:bg-white/8 rounded-2xl transition-all active:scale-95" aria-label="Kembali">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-white text-sm md:text-base font-black truncate leading-tight">{data.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                {data.chapter && <p className="text-primary text-[11px] font-black uppercase tracking-wide">{data.chapter}</p>}
                <span className="text-muted/60 text-[11px] font-bold">{data.images.length} halaman</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-muted text-[11px] font-black">{currentPage}/{data.images.length}</span>
            <button onClick={() => setShowSettings((value) => !value)} className="text-muted hover:text-white p-2.5 hover:bg-white/8 rounded-2xl transition-all active:scale-95" aria-label="Reader settings">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="sticky top-16 z-30 max-w-4xl mx-auto px-4 pt-3" onClick={(e) => e.stopPropagation()}>
          <div className="glass rounded-[1.5rem] p-4 grid gap-3 sm:grid-cols-3">
            <SettingGroup label="Lebar" value={settings.width} options={["fit", "compact", "original"]} onChange={(width) => setSettings((s) => ({ ...s, width: width as ReaderWidth }))} />
            <SettingGroup label="Tema" value={settings.theme} options={["dark", "black", "sepia"]} onChange={(theme) => setSettings((s) => ({ ...s, theme: theme as ReaderTheme }))} />
            <SettingGroup label="Jarak" value={settings.gap} options={["normal", "tight", "wide"]} onChange={(gap) => setSettings((s) => ({ ...s, gap: gap as ReaderGap }))} />
          </div>
        </div>
      )}

      <div className={`${imageWrapClass} mx-auto px-0 sm:px-4 py-3 sm:py-5 ${gapClass}`}>
        {data.images.map((img, idx) => (
          <div key={`${idx}-${retryNonce[idx] || 0}`} className="relative select-none bg-[#08080e] sm:rounded-2xl sm:overflow-hidden border-y sm:border border-white/5 shadow-[0_16px_45px_-35px_rgba(0,0,0,0.9)]">
            <div className="absolute left-3 top-3 z-10 px-2 py-1 rounded-full bg-black/45 backdrop-blur-md text-white/70 text-[10px] font-black border border-white/10">{idx + 1}</div>
            {!imgErrors.has(idx) ? (
              <img src={imageSrc(img, idx)} alt={`Page ${idx + 1}`} className={imageClass} onError={() => handleImgError(idx)} loading={idx < 2 ? "eager" : "lazy"} decoding="async" fetchPriority={idx < 2 ? "high" : "auto"} style={{ minHeight: idx < 2 ? "420px" : "240px", backgroundColor: "#0b0b12" }} />
            ) : (
              <div className="w-full min-h-80 bg-card-bg flex flex-col items-center justify-center border border-border px-6 text-center">
                <p className="text-white font-black text-sm mb-2">Halaman {idx + 1} gagal dimuat</p>
                <p className="text-muted text-xs mb-4 max-w-sm">CDN gambar kadang lambat atau menolak request pertama. Coba muat ulang halaman ini saja.</p>
                <button onClick={(e) => { e.stopPropagation(); retryImage(idx); }} className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all active:scale-95">
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="px-4 sm:px-0 pt-6" onClick={(e) => e.stopPropagation()}>
          <div className="glass-card rounded-[2rem] p-6 sm:p-8 text-center border border-primary/20">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-2">Chapter selesai</p>
            <h2 className="text-white text-xl sm:text-2xl font-black mb-2">Mau lanjut baca?</h2>
            <p className="text-muted text-sm mb-6">Kamu sudah sampai halaman terakhir chapter ini.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {data.nextChapter ? (
                <Link href={makeReadHref(data.mangaSlug, data.nextChapter)} className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-black shadow-lg shadow-primary/25 transition-all active:scale-95">
                  Lanjut Chapter Berikutnya
                </Link>
              ) : (
                <span className="px-5 py-3 rounded-2xl bg-white/6 text-muted text-sm font-black border border-white/8">Belum ada chapter berikutnya</span>
              )}
              {data.mangaSlug && (
                <Link href={`/manga/${data.mangaSlug}`} className="px-5 py-3 rounded-2xl bg-white/7 hover:bg-white/12 text-white text-sm font-black border border-white/10 transition-all active:scale-95">
                  Kembali ke Detail
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 rounded-[1.35rem] glass shadow-[0_20px_70px_rgba(0,0,0,0.65)] transition-all duration-250 ${showControls ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-7 pointer-events-none"}`} onClick={(e) => e.stopPropagation()}>
        {data.prevChapter ? <Link href={makeReadHref(data.mangaSlug, data.prevChapter)} className="px-4 py-3 rounded-2xl text-xs font-black bg-white/7 hover:bg-white/12 text-white border border-white/8">Prev</Link> : <button disabled className="px-4 py-3 rounded-2xl text-xs font-black text-muted/30">Prev</button>}
        {data.mangaSlug ? <Link href={`/manga/${data.mangaSlug}`} className="px-4 py-3 rounded-2xl text-xs font-black bg-primary hover:bg-primary-hover text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)]">Daftar</Link> : <button onClick={() => router.back()} className="px-4 py-3 rounded-2xl text-xs font-black bg-primary hover:bg-primary-hover text-white">Daftar</button>}
        {data.nextChapter ? <Link href={makeReadHref(data.mangaSlug, data.nextChapter)} className="px-4 py-3 rounded-2xl text-xs font-black bg-white/7 hover:bg-white/12 text-white border border-white/8">Next</Link> : <button disabled className="px-4 py-3 rounded-2xl text-xs font-black text-muted/30">Next</button>}
      </div>
    </div>
  );
}

function SettingGroup({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
      <div className="flex p-1 rounded-xl bg-black/20 border border-white/8">
        {options.map((option) => (
          <button key={option} onClick={() => onChange(option)} className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${value === option ? "bg-primary text-white" : "text-muted hover:text-white"}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense fallback={<ReaderLoading />}>
      <ReadContent />
    </Suspense>
  );
}
