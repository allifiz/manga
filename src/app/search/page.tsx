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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

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
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = searchInput.trim();
    if (!keyword) return;
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    performSearch(keyword);
  };

  const genres = [
    "Action", "Romance", "Comedy", "Fantasy", "Drama", "Horror",
    "Isekai", "Shounen", "Adventure", "Martial Arts"
  ];

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-32 px-4">
      <div className="py-8 text-center">
        <h1 className="text-white font-black text-3xl mb-2 tracking-tight">Cari Manga</h1>
        <p className="text-muted text-sm">Temukan ribuan judul manga favoritmu</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-10">
        <div className="relative group">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Ketik judul manga, manhwa..."
            className="w-full bg-card-bg/40 text-white px-6 py-4 rounded-[24px] text-base outline-none border border-white/5 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder-muted/40 backdrop-blur-md"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary hover:bg-primary-hover text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/20"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {!query && results.length === 0 && (
        <div className="animate-fade-in">
          <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-4 text-center opacity-50">Genre Populer</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  setSearchInput(genre);
                  router.push(`/search?q=${encodeURIComponent(genre)}`);
                  performSearch(genre);
                }}
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
            <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-4 px-2">Hasil Pencarian ({results.length})</p>
            {results.map((result) => (
              <MangaCard key={result.id} {...result} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-20 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Tidak Ditemukan</h3>
            <p className="text-muted text-sm px-10">Maaf, kami tidak dapat menemukan hasil untuk &ldquo;{query}&rdquo;</p>
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
