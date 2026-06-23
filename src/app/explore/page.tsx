"use client";

import { useCallback, useEffect, useState } from "react";
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

  const [activeGenre, setActiveGenre] = useState("");
  const [activeType, setActiveType] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [activeOrder, setActiveOrder] = useState("");

  const fetchManga = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (activeGenre) params.set("genre", activeGenre);
    if (activeType) params.set("tipe", activeType);
    if (activeStatus) params.set("status", activeStatus);
    if (activeOrder) params.set("orderby", activeOrder);
    params.set("halaman", page.toString());

    fetch(`/api/manga?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        const seen = new Set<string>();
        const uniqueManga = (d.manga || []).filter((item: MangaItem) => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        setManga(uniqueManga);
        if (d.pagination) {
          setTotalPages(d.pagination.totalPages || 1);
          setHasNextPage(Boolean(d.pagination.hasNextPage));
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
    { label: "Terbaru", value: "date" },
    { label: "Update", value: "modified" },
    { label: "Populer", value: "meta_value_num" },
    { label: "Acak", value: "rand" },
  ];

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full pb-32 px-4">
      <div className="py-6">
        <div className="flex items-center justify-between mb-8 px-1">
          <h1 className="text-white font-black text-3xl tracking-tight">Explore</h1>
          <button onClick={resetFilters} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors bg-primary/10 px-4 py-2 rounded-xl">
            Reset Filter
          </button>
        </div>

        <div className="space-y-6 mb-10 bg-card-bg/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Tipe</p>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setActiveType(t.value);
                    setPage(1);
                  }}
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

          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setActiveStatus(s.value);
                    setPage(1);
                  }}
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

          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Urutkan</p>
            <div className="flex flex-wrap gap-2">
              {orders.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    setActiveOrder(o.value);
                    setPage(1);
                  }}
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

          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest mb-3 font-black">Genre</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => {
                  setActiveGenre("");
                  setPage(1);
                }}
                className={`px-5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                  activeGenre === "" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-muted hover:text-white"
                }`}
              >
                Semua Genre
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.slug}
                  onClick={() => {
                    setActiveGenre(genre.slug);
                    setPage(1);
                  }}
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

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-[3/4.5] w-full shadow-2xl" />
                <div className="skeleton h-3.5 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : manga.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 animate-fade-in">
              {manga.map((item) => (
                <MangaCard
                  key={item.id}
                  {...item}
                  chapters={[]}
                  variant="vertical"
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-16 pt-10 border-t border-white/5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-32 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <svg className="w-12 h-12 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">Pustaka Kosong</p>
            <p className="text-muted text-sm mb-6">Tidak ada manga ditemukan dengan filter ini</p>
            <button onClick={resetFilters} className="text-primary font-black text-xs uppercase tracking-widest hover:underline underline-offset-8 transition-all">Reset semua filter</button>
          </div>
        )}
      </div>
    </main>
  );
}
