"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MangaCard from "@/components/MangaCard";

interface Genre {
  name: string;
  slug: string;
}

interface MangaItem {
  id: string;
  title: string;
  cover: string;
  type?: string;
  rating?: string;
  chapters?: any[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const activeGenre = searchParams.get("genre") || "";
  const activeType = searchParams.get("tipe") || "";
  const activeStatus = searchParams.get("status") || "";
  const activeOrder = searchParams.get("orderby") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [results, setResults] = useState<MangaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const performSearch = useCallback(() => {
    let isMounted = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.append("s", query);
    if (activeGenre) params.append("genre", activeGenre);
    if (activeType) params.append("tipe", activeType);
    if (activeStatus) params.append("status", activeStatus);
    if (activeOrder) params.append("orderby", activeOrder);
    params.append("halaman", page.toString());

    fetch(`/api/manga?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (isMounted) {
          setResults(d.manga || []);
          if (d.pagination) {
            setTotalPages(d.pagination.totalPages);
            setHasNextPage(d.pagination.hasNextPage);
          }
          setLoading(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [query, activeGenre, activeType, activeStatus, activeOrder, page]);

  useEffect(() => {
    fetch("/api/genres")
      .then((res) => res.json())
      .then((d) => setGenres(d.genres || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const updateFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
      else params.delete(key);
    });
    if (!newParams.page) params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim(), page: 1 });
  };

  const types = [
    { label: "Semua", value: "" },
    { label: "Manga", value: "manga" },
    { label: "Manhwa", value: "manhwa" },
    { label: "Manhua", value: "manhua" },
  ];

  const statuses = [
    { label: "Semua", value: "" },
    { label: "Ongoing", value: "ongoing" },
    { label: "Tamat", value: "end" },
  ];

  const orders = [
    { label: "Default", value: "" },
    { label: "Terbaru", value: "modified" },
    { label: "Populer", value: "meta_value_num" },
    { label: "A-Z", value: "title" },
  ];

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full pb-32 px-4">
      {/* Search Header */}
      <div className="py-8 text-center">
        <h1 className="text-white font-black text-3xl mb-2 tracking-tight">Cari Manga</h1>
        <p className="text-muted text-sm">Temukan ribuan judul manga favoritmu</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8">
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

      {/* Filter Controls */}
      <div className="space-y-6 mb-10 bg-card-bg/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          {/* Tipe Filter */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Tipe</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateFilters({ tipe: t.value })}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                    activeType === t.value
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateFilters({ status: s.value })}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                    activeStatus === s.value
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Order Filter */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Urutkan</p>
            <div className="flex flex-wrap gap-2">
              {orders.map((o) => (
                <button
                  key={o.value}
                  onClick={() => updateFilters({ orderby: o.value })}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                    activeOrder === o.value
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Genre</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => updateFilters({ genre: "" })}
                className={`px-5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  activeGenre === "" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-muted hover:text-white"
                }`}
              >
                Semua Genre
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => updateFilters({ genre: genre.slug })}
                  className={`px-5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                    activeGenre === genre.slug ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-muted hover:text-white"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* Results */}
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
          <>
            <div className="space-y-2 animate-fade-in">
              <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-4 px-2">Hasil Pencarian ({results.length})</p>
              {results.map((result, idx) => (
                <MangaCard key={idx} {...result} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-6 mt-16 pt-10 border-t border-white/5">
              <button
                disabled={page === 1}
                onClick={() => updateFilters({ page: page - 1 })}
                className="px-6 py-3 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 transition-all border border-white/5"
              >
                Prev
              </button>
              <div className="flex flex-col items-center">
                <span className="text-white font-black text-base italic">{page}</span>
                {totalPages > 1 && <span className="text-muted text-[10px] font-bold uppercase tracking-tighter">dari {totalPages}</span>}
              </div>
              <button
                disabled={!hasNextPage}
                onClick={() => updateFilters({ page: page + 1 })}
                className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
              >
                Next
              </button>
            </div>
          </>
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
