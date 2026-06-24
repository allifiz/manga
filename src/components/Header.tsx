"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050508]/72 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050508]/55">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="max-w-3xl mx-auto flex items-center justify-between h-16 px-4">
        {showSearch ? (
          <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center gap-3 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-muted hover:text-white p-2.5 hover:bg-white/8 rounded-2xl transition-all active:scale-95"
              aria-label="Tutup pencarian"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari manga, manhwa, manhua..."
                className="w-full bg-white/[0.07] text-white pl-11 pr-24 py-3 rounded-2xl text-sm outline-none border border-white/10 focus:border-primary/60 focus:ring-4 focus:ring-primary/15 transition-all placeholder-muted/45 shadow-inner shadow-black/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Cari
              </button>
            </div>
          </form>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-3 group min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-fuchsia-500 to-indigo-600 flex items-center justify-center shadow-[0_14px_30px_-12px_rgba(168,85,247,0.9)] group-hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-white/15 translate-y-[-60%] rotate-12" />
                <span className="relative text-white font-black text-lg tracking-tighter">M</span>
              </div>
              <div className="flex flex-col -space-y-0.5 min-w-0">
                <span className="text-white font-black text-lg tracking-tight leading-tight group-hover:text-primary transition-colors duration-200">
                  Manga<span className="text-gradient italic">Reader</span>
                </span>
                <span className="text-[10px] text-muted font-bold tracking-[0.22em] uppercase opacity-75 truncate">Baca cepat, nyaman</span>
              </div>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-white/[0.045] border border-white/10 p-1">
              <Link href="/explore" className="px-3 py-1.5 rounded-xl text-[11px] font-black text-muted hover:text-white hover:bg-white/8 transition-all">
                Explore
              </Link>
              <Link href="/library" className="px-3 py-1.5 rounded-xl text-[11px] font-black text-muted hover:text-white hover:bg-white/8 transition-all">
                Library
              </Link>
            </div>

            <button
              onClick={() => setShowSearch(true)}
              className="w-11 h-11 flex items-center justify-center text-muted hover:text-white hover:bg-white/8 rounded-2xl border border-white/0 hover:border-white/10 transition-all active:scale-95"
              aria-label="Cari komik"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
