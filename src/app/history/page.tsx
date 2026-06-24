"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearReadingHistory, getReadingHistory, prettyDate, type ReadingHistoryItem } from "@/lib/readingStorage";

function readHref(item: ReadingHistoryItem) {
  const target = item.nextChapterSlug ? `/komik/${item.mangaSlug}/${item.nextChapterSlug}` : item.chapterUrl;
  return `/read?u=${encodeURIComponent(btoa(target))}`;
}

export default function HistoryPage() {
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    setItems(getReadingHistory());
  }, []);

  const clearAll = () => {
    clearReadingHistory();
    setItems([]);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 pb-32 pt-8">
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.24em] mb-2">Reading log</p>
          <h1 className="text-white font-black text-3xl tracking-tight">Riwayat Baca</h1>
          <p className="text-muted text-sm mt-2">Lanjutkan dari chapter terakhir yang kamu buka.</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearAll} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-accent-red/15 border border-white/10 hover:border-accent-red/25 text-muted hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">
            Bersihkan
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 animate-fade-in">
          {items.map((item, index) => (
            <Link
              key={`${item.mangaSlug}-${item.chapterSlug}`}
              href={readHref(item)}
              className="group relative overflow-hidden flex gap-4 rounded-[1.6rem] border border-white/8 bg-white/[0.04] hover:bg-white/[0.07] hover:border-primary/30 p-3 transition-all active:scale-[0.99]"
            >
              <div className="absolute right-4 top-4 text-white/5 text-5xl font-black tabular-nums">{String(index + 1).padStart(2, "0")}</div>
              <div className="w-20 h-28 rounded-2xl bg-card-bg border border-white/10 overflow-hidden shrink-0 relative z-10">
                {item.cover ? <img src={item.cover} alt={item.mangaTitle || item.mangaSlug} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />}
              </div>
              <div className="min-w-0 flex-1 py-1 relative z-10">
                <h3 className="text-white font-black text-base line-clamp-2 group-hover:text-primary transition-colors">{item.mangaTitle || item.mangaSlug.replace(/-/g, " ")}</h3>
                <p className="text-muted text-xs font-bold mt-2 line-clamp-1">Terakhir: {item.chapterTitle || item.chapterSlug.replace(/-/g, " ")}</p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-[10px] text-primary font-black rounded-full bg-primary/10 border border-primary/15 px-2.5 py-1">
                    {item.nextChapterSlug ? "Lanjut chapter berikutnya" : "Baca lagi"}
                  </span>
                  <span className="text-[10px] text-muted/60 font-bold rounded-full bg-white/5 border border-white/8 px-2.5 py-1">{prettyDate(item.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-28 bg-card-bg/20 rounded-[40px] border border-white/5 backdrop-blur-sm">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
            <svg className="w-12 h-12 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-white font-black text-xl mb-3">Belum Ada Riwayat</h3>
          <p className="text-muted text-sm max-w-xs mx-auto mb-10">Buka chapter mana pun, nanti progress baca kamu muncul di sini.</p>
          <Link href="/explore" className="inline-flex items-center px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95">
            Cari Bacaan
          </Link>
        </div>
      )}
    </main>
  );
}
