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
    <header className="sticky top-0 z-50 bg-[#050508]/80 backdrop-blur-md border-b border-border/80">
      <div className="max-w-2xl mx-auto flex items-center justify-between h-14 px-4">
        {showSearch ? (
          <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center gap-2 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-muted hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari manga, manhwa, manhua..."
              className="flex-1 bg-white/5 text-white px-4 py-2 rounded-xl text-sm outline-none border border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder-muted/50"
              autoFocus
            />
            <button
              type="submit"
              className="text-primary hover:text-primary-hover p-1 hover:bg-white/5 rounded-lg transition-colors"
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
          </form>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-tr from-primary to-purple-500 rounded-lg flex items-center justify-center shadow-[0_2px_10px_rgba(139,92,246,0.3)] group-hover:shadow-[0_2px_15px_rgba(139,92,246,0.5)] transition-all duration-300">
                <span className="text-white font-extrabold text-sm tracking-wide">M</span>
              </div>
              <span className="text-white font-black text-base tracking-tight group-hover:text-primary transition-colors duration-200">
                Manga<span className="text-primary font-medium">Reader</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(true)}
                className="text-muted hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all"
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
