"use client";

import { useEffect, useMemo, useState } from "react";
import MangaCard from "@/components/MangaCard";
import ContinueReadingSection from "@/components/ContinueReadingSection";

interface MangaItem {
  id: string;
  title: string;
  cover: string;
  type?: string;
  chapters: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
}

interface HomeData {
  featured: MangaItem[];
  recommendations: MangaItem[];
  updates: MangaItem[];
  popular: MangaItem[];
}

function uniqueManga(items: MangaItem[] = []) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestManga, setLatestManga] = useState<MangaItem[]>([]);
  const [latestPage, setLatestPage] = useState(1);
  const [latestTotalPages, setLatestTotalPages] = useState(1);
  const [latestHasNextPage, setLatestHasNextPage] = useState(false);
  const [activeTab, setActiveTab] = useState<"project" | "mirror">("project");
  const [popularTab, setPopularTab] = useState<"daily" | "weekly" | "all">("daily");

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLatestLoading(true);
    const params = new URLSearchParams({
      halaman: latestPage.toString(),
    });

    fetch(`/api/manga?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch latest manga");
        return res.json();
      })
      .then((d) => {
        const manga = uniqueManga(d.manga || []).slice(0, 10);
        const pagination = d.pagination || {};
        const totalPages = pagination.totalPages || latestPage;

        setLatestManga(manga);
        setLatestTotalPages(Math.max(1, totalPages));
        setLatestHasNextPage(Boolean(pagination.hasNextPage) || latestPage < totalPages);
        setLatestLoading(false);
      })
      .catch((error) => {
        console.error("Home latest fetch error:", error);
        setLatestManga([]);
        setLatestTotalPages(1);
        setLatestHasNextPage(false);
        setLatestLoading(false);
      });
  }, [latestPage]);

  const safeData = useMemo<HomeData | null>(() => {
    if (!data) return null;

    return {
      featured: uniqueManga(data.featured).slice(0, 3),
      recommendations: uniqueManga(data.recommendations).slice(0, 6),
      updates: uniqueManga(data.updates).slice(0, 10),
      popular: uniqueManga(data.popular).slice(0, 12),
    };
  }, [data]);

  const visibleUpdates = latestManga.length > 0 ? latestManga : safeData?.updates || [];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" />

      <main className="flex-1 max-w-2xl mx-auto w-full pb-32 z-10">
        {loading ? (
          <LoadingSkeleton />
        ) : safeData ? (
          <div className="animate-fade-in">
            {safeData.featured.length > 0 && (
              <section className="px-4 py-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-white font-black text-xl tracking-tight">Eksklusif Hari Ini</h2>
                </div>
                <div className="space-y-6">
                  {safeData.featured.slice(0, 2).map((manga, idx) => (
                    <div key={manga.id} className="animate-fade-in" style={{ animationDelay: `${idx * 150}ms` }}>
                      <MangaCard {...manga} variant="featured" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <ContinueReadingSection />

            {safeData.recommendations.length > 0 && (
              <section className="py-6">
                <div className="px-5 flex items-center justify-between mb-5">
                  <h2 className="section-title">Rekomendasi Pilihan</h2>
                  <a href="/explore" className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors">
                    Lihat Semua
                  </a>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
                  {safeData.recommendations.map((manga) => (
                    <div key={manga.id} className="w-32 flex-shrink-0">
                      <MangaCard {...manga} variant="vertical" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="px-4 py-6">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="section-title">Update Terbaru</h2>
                <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
                  <button
                    onClick={() => setActiveTab("project")}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                      activeTab === "project"
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    Project
                  </button>
                  <button
                    onClick={() => setActiveTab("mirror")}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                      activeTab === "mirror"
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    Mirror
                  </button>
                </div>
              </div>

              <div className="bg-card-bg/40 rounded-3xl border border-white/5 p-2 backdrop-blur-sm divide-y divide-white/5">
                {latestLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3">
                      <div className="skeleton w-20 h-28 shrink-0" />
                      <div className="flex-1 space-y-3 py-2">
                        <div className="skeleton h-4 w-3/4" />
                        <div className="skeleton h-3 w-1/2" />
                        <div className="skeleton h-6 w-24" />
                      </div>
                    </div>
                  ))
                ) : visibleUpdates.length > 0 ? (
                  visibleUpdates.slice(0, 10).map((manga) => (
                    <MangaCard key={manga.id} {...manga} />
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted text-sm italic">Tidak ada data update tersedia</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  disabled={latestPage === 1 || latestLoading}
                  onClick={() => setLatestPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-3 rounded-2xl border border-white/5 bg-white/5 text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
                >
                  Prev
                </button>
                <div className="flex flex-col items-center min-w-16">
                  <span className="text-white font-black text-sm italic">{latestPage}</span>
                  {latestTotalPages > 1 && <span className="text-muted text-[10px] font-bold uppercase tracking-tighter">dari {latestTotalPages}</span>}
                </div>
                <button
                  disabled={!latestHasNextPage || latestLoading}
                  onClick={() => setLatestPage((p) => p + 1)}
                  className="px-5 py-3 rounded-2xl bg-primary text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary-hover text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                >
                  Next
                </button>
              </div>
            </section>

            <section className="py-6">
              <div className="px-5 flex items-center justify-between mb-6">
                <h2 className="section-title">Populer Hari Ini</h2>
                <div className="flex gap-1.5">
                  {["daily", "weekly", "all"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPopularTab(tab as typeof popularTab)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                        popularTab === tab
                          ? "bg-white/10 text-primary"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      {tab === "daily" ? "Hari" : tab === "weekly" ? "Minggu" : "Semua"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 px-5">
                {safeData.popular.length > 0 ? (
                  safeData.popular.slice(0, 9).map((manga) => (
                    <MangaCard key={manga.id} {...manga} variant="vertical" />
                  ))
                ) : (
                  <div className="col-span-3 py-10 text-center bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-muted text-sm italic">Data tidak ditemukan</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <ErrorState />
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-8 space-y-8">
      <div className="skeleton h-64 w-full" />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-32 space-y-2 shrink-0">
              <div className="skeleton aspect-[3/4.5] w-full" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="skeleton h-6 w-40" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton w-22 h-30 shrink-0" />
            <div className="flex-1 space-y-2 py-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16" />
                <div className="skeleton h-6 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-20 h-20 bg-accent-red/10 rounded-full flex items-center justify-center mb-6 border border-accent-red/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <svg className="w-10 h-10 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-white font-black text-xl mb-3">Gagal Memuat Data</h3>
      <p className="text-muted text-sm max-w-xs mx-auto mb-8">
        Terjadi kesalahan saat menghubungi server. Periksa koneksi internet Anda.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
      >
        Coba Lagi
      </button>
    </div>
  );
}
