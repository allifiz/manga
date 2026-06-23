"use client";

import { useEffect, useState, useCallback } from "react";
import MangaCard from "@/components/MangaCard";

interface MangaItem {
  id: string;
  title: string;
  cover: string;
  type?: string;
  status?: string;
}

interface Genre {
  name: string;
  slug: string;
}

export default function ExplorePage() {
  const [manga, setManga] = useState<MangaItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Filters
  const [activeGenre, setActiveGenre] = useState("");
  const [activeType, setActiveType] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [activeOrder, setActiveOrder] = useState("");

  const fetchManga = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeGenre) params.append("genre", activeGenre);
    if (activeType) params.append("tipe", activeType);
    if (activeStatus) params.append("status", activeStatus);
    if (activeOrder) params.append("orderby", activeOrder);
    params.append("page", page.toString());

    fetch(`/api/manga?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setManga(d.manga || []);
        if (d.pagination) {
          setTotalPages(d.pagination.totalPages);
          setHasNextPage(d.pagination.hasNextPage);
        }
        setLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(() => setLoading(false));
  }, [activeGenre, activeType, activeStatus, activeOrder, page]);

  useEffect(() => {
    fetch("/api/genres")
      .then((res) => res.json())
      .then((d) => setGenres(d.genres || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchManga();
  }, [fetchManga]);

  const resetFilters = () => {
    setActiveGenre("");
    setActiveType("");
    setActiveStatus("");
    setActiveOrder("");
    setPage(1);
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full pb-20 px-4">
      <div className="py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-bold text-2xl">Explore</h1>
          <button onClick={resetFilters} className="text-xs text-purple-400 hover:text-purple-300">
            Reset Filter
          </button>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8 bg-[#121212] p-4 rounded-xl border border-white/5">
          {/* Tipe & Status & Order */}
          <div className="grid grid-cols-3 gap-3">
            <select
              value={activeType}
              onChange={(e) => {
                setActiveType(e.target.value);
                setPage(1);
              }}
              className="bg-[#1A1A1A] text-gray-300 text-xs py-2 px-3 rounded-lg outline-none border border-white/5 focus:border-purple-600"
            >
              <option value="">Semua Tipe</option>
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>

            <select
              value={activeStatus}
              onChange={(e) => {
                setActiveStatus(e.target.value);
                setPage(1);
              }}
              className="bg-[#1A1A1A] text-gray-300 text-xs py-2 px-3 rounded-lg outline-none border border-white/5 focus:border-purple-600"
            >
              <option value="">Semua Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="end">Tamat</option>
            </select>

            <select
              value={activeOrder}
              onChange={(e) => {
                setActiveOrder(e.target.value);
                setPage(1);
              }}
              className="bg-[#1A1A1A] text-gray-300 text-xs py-2 px-3 rounded-lg outline-none border border-white/5 focus:border-purple-600"
            >
              <option value="">Default Order</option>
              <option value="date">Judul Baru</option>
              <option value="modified">Update Baru</option>
              <option value="meta_value_num">Populer</option>
              <option value="rand">Acak</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Genre</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              <button
                onClick={() => {
                  setActiveGenre("");
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeGenre === "" ? "bg-purple-600 text-white" : "bg-[#1A1A1A] text-gray-400 hover:text-white"
                }`}
              >
                Semua
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => {
                    setActiveGenre(genre.slug);
                    setPage(1);
                  }}
                  className={`px-4 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                    activeGenre === genre.slug ? "bg-purple-600 text-white" : "bg-[#1A1A1A] text-gray-400 hover:text-white"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manga Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[3/4] rounded-xl mb-2 shadow-lg" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : manga.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {manga.map((item, idx) => (
                <MangaCard
                  key={idx}
                  {...item}
                  chapters={[]} // getMangaList doesn't return chapters for simplicity
                  variant="vertical"
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-white/5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-6 py-2 bg-[#1A1A1A] text-white rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-600 transition-all border border-white/5 shadow-lg"
              >
                Sebelumnya
              </button>
              <div className="flex flex-col items-center">
                <span className="text-white font-bold text-sm">Halaman {page}</span>
                {totalPages > 1 && <span className="text-gray-500 text-[10px]">dari {totalPages}</span>}
              </div>
              <button
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-700 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              >
                Selanjutnya
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-24 bg-[#121212] rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Tidak ada manga ditemukan dengan filter ini</p>
            <button onClick={resetFilters} className="mt-4 text-purple-400 text-sm font-medium hover:underline">Reset semua filter</button>
          </div>
        )}
      </div>
    </main>
  );
}
