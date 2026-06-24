"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface GenreItem {
  name: string;
  slug: string;
}

const POPULAR_GENRES = ["action", "romance", "fantasy", "adventure", "comedy", "isekai", "martial-arts", "school-life"];

function groupGenres(genres: GenreItem[]) {
  return genres.reduce<Record<string, GenreItem[]>>((acc, genre) => {
    const key = (genre.name[0] || "#").toUpperCase();
    const groupKey = /[A-Z]/.test(key) ? key : "#";
    acc[groupKey] = [...(acc[groupKey] || []), genre];
    return acc;
  }, {});
}

function GenreChip({ genre, featured = false }: { genre: GenreItem; featured?: boolean }) {
  return (
    <Link
      href={`/explore?genre=${genre.slug}`}
      className={
        featured
          ? "group rounded-2xl border border-primary/25 bg-primary/12 hover:bg-primary/20 p-4 transition-all active:scale-[0.98] shadow-[0_16px_40px_-30px_rgba(168,85,247,0.9)]"
          : "group rounded-2xl border border-white/8 bg-white/[0.04] hover:bg-primary/12 hover:border-primary/30 p-4 transition-all active:scale-[0.98]"
      }
    >
      <p className="text-white font-black text-sm group-hover:text-primary transition-colors line-clamp-1">{genre.name}</p>
      <p className="text-muted/60 text-[10px] font-bold mt-1">/{genre.slug}</p>
    </Link>
  );
}

export default function GenresPage() {
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/genres")
      .then((res) => res.json())
      .then((data) => setGenres(Array.isArray(data.genres) ? data.genres : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return genres;
    return genres.filter((genre) => genre.name.toLowerCase().includes(keyword) || genre.slug.toLowerCase().includes(keyword));
  }, [genres, query]);

  const popularGenres = useMemo(() => {
    const lookup = new Map(genres.map((genre) => [genre.slug, genre]));
    return POPULAR_GENRES.map((slug) => lookup.get(slug)).filter((genre): genre is GenreItem => Boolean(genre));
  }, [genres]);

  const grouped = useMemo(() => groupGenres(filtered), [filtered]);
  const groupKeys = Object.keys(grouped).sort();

  return (
    <main className="max-w-5xl mx-auto px-4 pb-32 pt-8">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.24),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-5 md:p-7 mb-7 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.24em] mb-2">Discovery</p>
          <h1 className="text-white font-black text-3xl md:text-5xl tracking-tight">Jelajah Genre</h1>
          <p className="text-muted text-sm mt-3 max-w-xl leading-relaxed">Pilih genre favoritmu dan langsung lihat komik BacaKomik yang sesuai. Gunakan pencarian untuk menemukan genre spesifik.</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-white text-[11px] font-black">{genres.length || "..."} genre</span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-muted text-[11px] font-black">Filter cepat</span>
          </div>
        </div>
      </div>

      <div className="sticky top-3 z-20 glass rounded-2xl p-2 mb-6">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-black/20 border border-white/8">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari genre, misal action, romance..."
            className="w-full bg-transparent text-white placeholder:text-muted/60 outline-none text-sm font-bold"
          />
          {query && (
            <button onClick={() => setQuery("")} className="px-3 py-1.5 rounded-xl bg-white/7 hover:bg-white/12 text-muted hover:text-white text-[11px] font-black transition-all">
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => <div key={index} className="skeleton h-20 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 20 }).map((_, index) => <div key={index} className="skeleton h-16 rounded-2xl" />)}
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-8 animate-fade-in">
          {!query && popularGenres.length > 0 && (
            <section>
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Populer</p>
                  <h2 className="text-white font-black text-xl">Genre Favorit</h2>
                </div>
                <span className="text-muted text-xs font-bold">{popularGenres.length} pilihan</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {popularGenres.map((genre) => <GenreChip key={genre.slug} genre={genre} featured />)}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">A-Z</p>
                <h2 className="text-white font-black text-xl">{query ? `Hasil untuk “${query}”` : "Semua Genre"}</h2>
              </div>
              <span className="text-muted text-xs font-bold">{filtered.length} genre</span>
            </div>

            <div className="space-y-5">
              {groupKeys.map((letter) => (
                <div key={letter} className="rounded-[1.75rem] border border-white/8 bg-white/[0.025] p-3 sm:p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-white font-black">{letter}</span>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {grouped[letter].map((genre) => <GenreChip key={genre.slug} genre={genre} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="text-center py-24 rounded-[2rem] border border-white/8 bg-white/[0.03]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-white/6 border border-white/10 flex items-center justify-center text-muted/60">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-white font-black text-lg">Genre tidak ditemukan</h3>
          <p className="text-muted text-sm mt-2">Coba kata kunci lain atau hapus filter pencarian.</p>
          <button onClick={() => setQuery("")} className="mt-5 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-sm font-black transition-all active:scale-95">
            Reset Pencarian
          </button>
        </div>
      )}
    </main>
  );
}
