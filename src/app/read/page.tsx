"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ChapterData {
  title: string;
  chapter: string;
  images: string[];
  prevChapter?: string;
  nextChapter?: string;
  mangaSlug?: string;
}

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

function canonicalChapterUrl(mangaSlug: string | undefined, input: string): string {
  const chapterSlug = chapterSlugFromInput(input);
  const cleanMangaSlug = mangaSlug || mangaSlugFromChapter(chapterSlug);
  return `/komik/${cleanMangaSlug}/${chapterSlug}`;
}

function makeReadHref(mangaSlug: string | undefined, chapter: string): string {
  return `/read?u=${encodeURIComponent(btoa(canonicalChapterUrl(mangaSlug, chapter)))}`;
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
    } catch (e) {
      url = "";
    }
  }

  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setImgErrors(new Set());
    fetch(`/api/read?u=${encodeURIComponent(btoa(url))}`)
      .then((res) => res.json())
      .then((d) => {
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
        } catch (e) {}

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
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 4200);
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleImgError = (idx: number) => {
    setImgErrors((prev) => new Set(prev).add(idx));
  };

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

  const currentPage = Math.max(1, Math.ceil((scrollProgress / 100) * data.images.length));

  return (
    <div className="min-h-screen reader-surface text-foreground pb-28" onClick={() => setShowControls((state) => !state)}>
      <div className="sticky top-0 z-40 bg-[#050508]/78 backdrop-blur-2xl border-b border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary to-indigo-500 transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
        <div className="max-w-4xl mx-auto flex items-center h-16 px-4 justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-muted hover:text-white p-2.5 hover:bg-white/8 rounded-2xl transition-all active:scale-95" aria-label="Kembali">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
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
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-muted text-[11px] font-black">
              {currentPage}/{data.images.length}
            </span>
            <Link href="/" className="text-muted hover:text-white p-2.5 hover:bg-white/8 rounded-2xl transition-all active:scale-95" aria-label="Beranda">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-0 sm:px-4 py-3 sm:py-5 space-y-2 sm:space-y-3">
        {data.images.map((img, idx) => (
          <div key={idx} className="relative select-none bg-[#08080e] sm:rounded-2xl sm:overflow-hidden border-y sm:border border-white/5 shadow-[0_16px_45px_-35px_rgba(0,0,0,0.9)]">
            <div className="absolute left-3 top-3 z-10 px-2 py-1 rounded-full bg-black/45 backdrop-blur-md text-white/70 text-[10px] font-black border border-white/10">
              {idx + 1}
            </div>
            {!imgErrors.has(idx) ? (
              <img
                src={`/api/image?url=${encodeURIComponent(img)}`}
                alt={`Page ${idx + 1}`}
                className="w-full block mx-auto"
                onError={() => handleImgError(idx)}
                loading={idx < 2 ? "eager" : "lazy"}
                style={{ minHeight: idx < 2 ? "420px" : "240px", backgroundColor: "#0b0b12" }}
              />
            ) : (
              <div className="w-full h-80 bg-card-bg flex items-center justify-center border border-border">
                <div className="text-center">
                  <svg className="w-10 h-10 text-muted/40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-muted text-xs">Halaman {idx + 1} gagal dimuat</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 rounded-[1.35rem] glass shadow-[0_20px_70px_rgba(0,0,0,0.65)] transition-all duration-250 ${
          showControls ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-7 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {data.prevChapter ? (
          <Link
            href={makeReadHref(data.mangaSlug, data.prevChapter)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-white/7 hover:bg-white/12 text-white transition-all active:scale-95 border border-white/8"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </Link>
        ) : (
          <button disabled className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-transparent text-muted/30 cursor-not-allowed">
            <span>Prev</span>
          </button>
        )}

        {data.mangaSlug ? (
          <Link
            href={`/manga/${data.mangaSlug}`}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_8px_24px_rgba(139,92,246,0.35)] active:scale-95"
          >
            <span>Daftar</span>
          </Link>
        ) : (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_8px_24px_rgba(139,92,246,0.35)] active:scale-95"
          >
            <span>Daftar</span>
          </button>
        )}

        {data.nextChapter ? (
          <Link
            href={makeReadHref(data.mangaSlug, data.nextChapter)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-white/7 hover:bg-white/12 text-white transition-all active:scale-95 border border-white/8"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <span className="sm:hidden">Next</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <button disabled className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs font-black bg-transparent text-muted/30 cursor-not-allowed">
            <span>Next</span>
          </button>
        )}
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
