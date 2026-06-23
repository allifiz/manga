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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-2xl mx-auto flex items-center justify-between h-16 px-4">
        {showSearch ? (
          <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center gap-3 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-muted hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1 relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul manga..."
                className="w-full bg-white/5 text-white px-4 py-2.5 rounded-2xl text-sm outline-none border border-white/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder-muted/40"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(168,85,247,0.6)] group-hover:shadow-[0_8px_25px_-4px_rgba(168,85,247,0.8)] group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-black text-lg tracking-tighter">M</span>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-white font-black text-lg tracking-tight group-hover:text-primary transition-colors duration-200">
                  Manga<span className="text-primary italic">Reader</span>
                </span>
                <span className="text-[10px] text-muted font-medium tracking-widest uppercase opacity-70">Digital Library</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 flex items-center justify-center text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
