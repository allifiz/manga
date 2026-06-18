"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MangaCard from "@/components/MangaCard";

interface MangaItem {
  id: string;
  title: string;
  cover: string;
  type?: string; 
  chapters: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
}

export default function ExplorePage() {
  const [manga, setManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("All");

  const genres = [
    "All",
    "Action",
    "Romance",
    "Comedy",
    "Fantasy",
    "Drama",
    "Horror",
    "Adventure",
    "Martial Arts",
    "Isekai",
  ];

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((d) => {
        const all = [...(d.updates || []), ...(d.popular || []), ...(d.recommendations || [])];
        setManga(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20 px-4">
        <div className="py-4">
          <h1 className="text-white font-bold text-xl mb-4">Explore</h1>

          {/* Genre Filter */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-4 py-2 text-xs rounded-full whitespace-nowrap transition-colors ${
                  activeGenre === genre ? "bg-purple-600 text-white" : "bg-[#1A1A1A] text-gray-400 hover:text-white"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Manga Grid */}
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton aspect-[3/4] rounded-lg mb-2" />
                  <div className="skeleton h-3 w-full" />
                </div>
              ))}
            </div>
          ) : manga.length > 0 ? (
            (() => {
              const filtered = manga.filter((item) => {
                if (activeGenre === "All") return true;
                const g = activeGenre.toLowerCase();
                if (item.type && item.type.toLowerCase().includes(g)) return true;
                if (item.title && item.title.toLowerCase().includes(g)) return true;
                return false;
              });
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filtered.map((item, idx) => (
                    <MangaCard key={idx} {...item} variant="vertical" />
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Tidak ada manga tersedia</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
