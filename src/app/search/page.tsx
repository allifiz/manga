"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MangaCard from "@/components/MangaCard";

interface SearchResult {
  id: string;
  title: string;
  cover: string;
  type?: string;
  rating?: string;
}

const RECENT_SEARCHES_KEY = "manga_recent_searches";

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(keyword: string) {
  if (typeof window === "undefined") return;
  const clean = keyword.trim();
  if (!clean) return;
  const current = loadRecentSearches();
  const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const runSearch = useCallback((keyword: string) => {
    const clean = keyword.trim();
    if (!clean) return;
    saveRecentSearch(clean);
    setRecentSearches(loadRecentSearches());
    setSearchInput(clean);
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  }, [router]);

  const performSearch = useCallback((q: string) => {
    const keyword = q.trim();
    if (!keyword) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
      .then((res) => res.json())
      .then((d) => {
        setResults(d.results || d.manga || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSearchInput(query);
    if (query) {
      saveRecentSearch(query);
      setRecentSearches(loadRecentSearches());
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchInput);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const genres = [
    "Action", "Romance", "Comedy", "Fantasy", "Drama", "Horror",
    "Isekai", "Shounen", "Adventure", "Martial Arts"
  ];

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-32 px-4">
      <div className="py-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/15 text-[10px] font-black uppercase tracking-widest mb-4">
          Search Center
        </div>
        <h1 className="text-white font-black text-3xl mb-2 tracking-tight">Cari Manga</h1>
        <p className="text-muted text-sm">Temukan judul manga, manhwa, dan manhua favoritmu</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative group">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ketik judul manga, manhwa..."
            className="w-full bg-card-bg/40 text-white px-6 py-4 pr-20 rounded-[24px] text-base outline-none border border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder-muted/40 backdrop-blur-md"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-16 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-muted hover:text-white hover:bg-white/8 transition-all"
              aria-label="Bersihkan pencarian"
            >
              ×
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {recentSearches.length > 0 && !query && (
        <section className="mb-8 glass-card rounded-[1.5rem] p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-white font-black text-[11px] uppercase tracking-[0.18em]">Terakhir Dicari</h3>
            <button onClick={clearRecentSearches} className="text-muted hover:text-white text-[11px] font-bold transition-colors">Bersihkan</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                key={item}
                onClick={() => runSearch(item)}
                className="px-4 py-2 rounded-xl bg-white/6 hover:bg-primary hover:text-white text-muted text-xs font-bold border border-white/8 transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      )}

      {!query && results.length === 0 && (
        <div className="animate-fade-in">
          <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-4 text-center opacity-50">Genre Populer</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => runSearch(genre)}
                className="px-5 py-2.5 bg-white/5 text-muted text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all duration-300 border border-white/5 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-2">
                <div className="skeleton w-22 h-30 shrink-0" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between px-2 mb-4">
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">Hasil Pencarian ({results.length})</p>
              <span className="text-primary text-[10px] font-black uppercase tracking-widest">{query}</span>
            </div>
            {results.map((result) => (
              <MangaCard key={result.id} {...result} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-16 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Tidak Ditemukan</h3>
            <p className="text-muted text-sm px-10 mb-6">Tidak ada hasil untuk &ldquo;{query}&rdquo;. Coba judul yang lebih pendek atau pakai genre populer.</p>
            <div className="flex flex-wrap justify-center gap-2 px-6">
              {genres.slice(0, 5).map((genre) => (
                <button key={genre} onClick={() => runSearch(genre)} className="px-4 py-2 rounded-xl bg-white/6 hover:bg-primary text-muted hover:text-white text-xs font-bold transition-all">
                  {genre}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-2xl mx-auto w-full pb-32 px-4">
          <div className="py-20 text-center">
            <div className="skeleton h-12 w-full max-w-md mx-auto rounded-3xl" />
          </div>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
