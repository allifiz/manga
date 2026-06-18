"use client";

import { useEffect, useState } from "react";
import MangaCard from "@/components/MangaCard";

interface MangaItem {
  id: string;
  title: string;
  cover: string;
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

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="relative min-h-screen bg-[#050508] overflow-hidden flex flex-col">
      {/* Background Neon Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-2xl mx-auto w-full pb-24 z-10">
        {loading ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            {/* Featured Carousel */}
            {data.featured.length > 0 && (
              <section className="px-4 py-6">
                <div className="space-y-4">
                  {data.featured.slice(0, 3).map((manga, idx) => (
                    <div key={idx} className="glass-card rounded-2xl overflow-hidden shadow-lg border border-border/50">
                      <MangaCard {...manga} variant="featured" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <section className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-base relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-primary before:rounded-full">
                    Rekomendasi Pilihan
                  </h2>
                  <div className="flex gap-1.5">
                    {["Manhwa", "Manga", "Manhua"].map((tab) => (
                      <button
                        key={tab}
                        className="px-3 py-1 text-[11px] rounded-full bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-all duration-200"
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3">
                  {data.recommendations.map((manga, idx) => (
                    <div
                      key={idx}
                      className="w-32 flex-shrink-0 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <MangaCard {...manga} variant="vertical" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Update Section */}
            <section className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-base relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-primary before:rounded-full">
                  Update Terbaru
                </h2>
                <div className="flex p-0.5 rounded-full bg-white/5 border border-white/5">
                  <button
                    onClick={() => setActiveTab("project")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                      activeTab === "project"
                        ? "bg-primary text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    Project
                  </button>
                  <button
                    onClick={() => setActiveTab("mirror")}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                      activeTab === "mirror"
                        ? "bg-primary text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    Mirror
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border/60">
                {data.updates.length > 0 ? (
                  data.updates.map((manga, idx) => (
                    <div key={idx} className="hover:bg-white/[0.01] px-1 transition-all duration-150">
                      <MangaCard {...manga} />
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm py-8 text-center bg-card-bg/40 rounded-2xl border border-border">
                    Tidak ada data update
                  </p>
                )}
              </div>
            </section>

            {/* Popular Section */}
            <section className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-base relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-4 before:bg-primary before:rounded-full">
                  Populer Hari Ini
                </h2>
                <div className="flex p-0.5 rounded-full bg-white/5 border border-white/5">
                  {[
                    { key: "daily", label: "Hari" },
                    { key: "weekly", label: "Minggu" },
                    { key: "all", label: "Semua" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setPopularTab(tab.key as typeof popularTab)}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all duration-200 ${
                        popularTab === tab.key
                          ? "bg-primary text-white shadow-[0_2px_10px_rgba(139,92,246,0.3)]"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3">
                {data.popular.length > 0 ? (
                  data.popular.map((manga, idx) => (
                    <div
                      key={idx}
                      className="w-32 flex-shrink-0 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <MangaCard {...manga} variant="vertical" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm py-8 text-center bg-card-bg/40 rounded-2xl border border-border w-full">
                    Tidak ada data populer
                  </p>
                )}
              </div>
            </section>
          </>
        ) : (
          <ErrorState />
        )}
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="skeleton h-40 w-full" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-20 h-28 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <h3 className="text-white font-semibold text-lg mb-2">Gagal Memuat Data</h3>
      <p className="text-gray-500 text-sm text-center mb-4">
        Terjadi kesalahan saat memuat data. Pastikan server berjalan.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-purple-600 text-white rounded-full text-sm hover:bg-purple-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
