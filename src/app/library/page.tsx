"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Bookmark {
  id: string;
  title: string;
  cover: string;
  lastRead?: string;
  savedAt: string;
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
    <>
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20 px-4">
        <div className="py-4">
          <h1 className="text-white font-bold text-xl mb-4">Library</h1>

          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="relative group">
                  <Link href={`/manga/${bm.id}`} className="block">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 relative">
                      <img
                        src={bm.cover}
                        alt={bm.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 140'%3E%3Crect fill='%231A1A1A' width='100' height='140'/%3E%3Ctext x='50' y='70' fill='%23666' text-anchor='middle' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <p className="text-white text-xs font-medium line-clamp-2">{bm.title}</p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeBookmark(bm.id);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      className="w-3 h-3 text-white"
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
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 text-gray-600 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <h3 className="text-white font-semibold text-lg mb-2">Library Kosong</h3>
              <p className="text-gray-500 text-sm mb-4">Simpan manga favoritmu dengan menekan tombol Bookmark</p>
              <Link
                href="/explore"
                className="inline-block px-6 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
              >
                Jelajahi Manga
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
