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
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (url) {
      setLoading(true);
      fetch(`/api/read?u=${encodeURIComponent(btoa(url))}`)
        .then((res) => res.json())
        .then((d) => {
          setData(d);
          // mark chapter as read for this manga
          try {
            if (d?.mangaSlug && url) {
              const key = "manga_reads";
              const raw = localStorage.getItem(key);
              const map = raw ? JSON.parse(raw) : {};
              const arr = Array.isArray(map[d.mangaSlug]) ? map[d.mangaSlug] : [];
              if (!arr.includes(url)) {
                arr.push(url);
                map[d.mangaSlug] = arr;
                localStorage.setItem(key, JSON.stringify(map));
              }
            }
          } catch (e) {}
          setLoading(false);
          window.scrollTo(0, 0);
        })
        .catch(() => setLoading(false));
    }
  }, [url]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!showControls) return;
    const t = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(t);
  }, [showControls]);

  const handleImgError = (idx: number) => {
    setImgErrors((prev) => new Set(prev).add(idx));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Memuat chapter...</p>
        </div>
      </div>
    );
  }

  if (!data || data.images.length === 0) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-4">
        <svg className="w-16 h-16 text-muted/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <h3 className="text-white font-semibold text-lg mb-2">Chapter Tidak Ditemukan</h3>
        <p className="text-muted text-sm mb-4 text-center">
          Halaman chapter tidak dapat dimuat. Kemungkinan situs sumber sedang down.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-foreground pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#050508]/85 backdrop-blur-md border-b border-border">
        {/* Scroll Progress Bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
        <div className="max-w-3xl mx-auto flex items-center h-14 px-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-muted hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-white text-sm font-bold truncate">{data.title}</h1>
              {data.chapter && <p className="text-primary text-xs font-medium">Ch {data.chapter}</p>}
            </div>
          </div>
          <Link href="/" className="text-muted hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors">
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

      {/* Manga Images */}
      <div className="max-w-3xl mx-auto py-2 space-y-1" onClick={() => setShowControls((s) => !s)}>
        {data.images.map((img, idx) => (
          <div key={idx} className="relative select-none">
            {!imgErrors.has(idx) ? (
              <img
                src={`/api/image?url=${encodeURIComponent(img)}`}
                alt={`Page ${idx + 1}`}
                className="w-full block"
                onError={() => handleImgError(idx)}
                loading="lazy"
                style={{ minHeight: "300px", backgroundColor: "#0b0b12" }}
              />
            ) : (
              <div className="w-full h-80 bg-card-bg flex items-center justify-center border border-border">
                <div className="text-center">
                  <svg
                    className="w-10 h-10 text-muted/40 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-muted text-xs">Halaman {idx + 1} gagal dimuat</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Navigation Pill */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 rounded-2xl glass shadow-[0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-200 ${
          showControls ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {data.prevChapter ? (
          <Link
            href={`/read?u=${encodeURIComponent(btoa(String(data.prevChapter)))}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-transparent text-muted/30 cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Sebelumnya</span>
            <span className="sm:hidden">Prev</span>
          </button>
        )}

        {data.mangaSlug ? (
          <Link
            href={`/manga/${data.mangaSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.35)] active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Daftar</span>
          </Link>
        ) : (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_4px_15px_rgba(139,92,246,0.35)] active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Daftar</span>
          </button>
        )}

        {data.nextChapter ? (
          <Link
            href={`/read?u=${encodeURIComponent(btoa(String(data.nextChapter)))}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/5"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <span className="sm:hidden">Next</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-transparent text-muted/30 cursor-not-allowed"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <span className="sm:hidden">Next</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Memuat chapter...</p>
          </div>
        </div>
      }
    >
      <ReadContent />
    </Suspense>
  );
}
