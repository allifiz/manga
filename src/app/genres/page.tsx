"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface GenreItem {
  name: string;
  slug: string;
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

  return (
    <main className="max-w-4xl mx-auto px-4 pb-32 pt-8">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.22),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 mb-7">
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.24em] mb-2">Discovery</p>
        <h1 className="text-white font-black text-3xl tracking-tight">Jelajah Genre</h1>
        <p className="text-muted text-sm mt-2 max-w-xl leading-relaxed">Pilih genre favoritmu dan langsung lihat komik BacaKomik yang sesuai.</p>
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
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 20 }).map((_, index) => <div key={index} className="skeleton h-14 rounded-2xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fade-in">
          {filtered.map((genre) => (
            <Link
              key={genre.slug}
              href={`/explore?genre=${genre.slug}`}
              className="group rounded-2xl border border-white/8 bg-white/[0.04] hover:bg-primary/12 hover:border-primary/30 p-4 transition-all active:scale-[0.98]"
            >
              <p className="text-white font-black text-sm group-hover:text-primary transition-colors line-clamp-1">{genre.name}</p>
              <p className="text-muted/60 text-[10px] font-bold mt-1">/{genre.slug}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 rounded-[2rem] border border-white/8 bg-white/[0.03]">
          <h3 className="text-white font-black text-lg">Genre tidak ditemukan</h3>
          <p className="text-muted text-sm mt-2">Coba kata kunci lain.</p>
        </div>
      )}
    </main>
  );
}
