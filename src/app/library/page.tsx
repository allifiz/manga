"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MangaCard from "@/components/MangaCard";

interface Bookmark {
  id: string;
  title: string;
  cover: string;
  lastRead?: string;
  savedAt: string;
  type?: string;
}

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("manga_bookmarks");
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("manga_bookmarks", JSON.stringify(updated));
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full pb-32 px-4">
      <div className="py-8">
        <div className="flex items-center justify-between mb-8 px-1">
          <h1 className="text-white font-black text-3xl tracking-tight">Library</h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted bg-white/5 px-3 py-1.5 rounded-lg">
            {bookmarks.length} Judul Tersimpan
          </span>
        </div>

        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 animate-fade-in">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="relative group">
                <MangaCard
                  id={bm.id}
                  title={bm.title}
                  cover={bm.cover}
                  type={bm.type}
                  variant="vertical"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeBookmark(bm.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-accent-red text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-accent-red/40 translate-y-2 group-hover:translate-y-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
              <svg
                className="w-12 h-12 text-muted/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
            <h3 className="text-white font-black text-xl mb-3">Pustaka Anda Kosong</h3>
            <p className="text-muted text-sm max-w-xs mx-auto mb-10">
              Mulai jelajahi ribuan manga dan simpan ke library untuk dibaca nanti.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              Cari Manga Sekarang
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
