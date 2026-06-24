"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getReadingHistory, prettyDate, type ReadingHistoryItem } from "@/lib/readingStorage";

function readHref(item: ReadingHistoryItem) {
  const url = item.nextChapterSlug
    ? `/komik/${item.mangaSlug}/${item.nextChapterSlug}`
    : item.chapterUrl;
  return `/read?u=${encodeURIComponent(btoa(url))}`;
}

export default function ContinueReadingSection({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<ReadingHistoryItem[]>([]);

  useEffect(() => {
    setItems(getReadingHistory().slice(0, compact ? 3 : 6));
  }, [compact]);

  if (items.length === 0) return null;

  return (
    <section className={compact ? "px-4 py-4" : "px-4 py-6"}>
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.22em] mb-1">Progress</p>
          <h2 className="section-title">Lanjutkan Membaca</h2>
        </div>
        <Link href="/history" className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors">
          Riwayat
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {items.map((item) => (
          <Link
            key={`${item.mangaSlug}-${item.chapterSlug}`}
            href={readHref(item)}
            className="group min-w-[260px] max-w-[280px] flex-1 rounded-[1.55rem] glass-card p-3 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex gap-3">
              <div className="w-16 h-22 rounded-2xl overflow-hidden bg-card-bg border border-white/10 shrink-0">
                {item.cover ? (
                  <img src={item.cover} alt={item.mangaTitle || item.mangaSlug} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
              </div>
              <div className="min-w-0 flex-1 py-1">
                <h3 className="text-white font-black text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {item.mangaTitle || item.mangaSlug.replace(/-/g, " ")}
                </h3>
                <p className="text-muted text-[11px] font-bold mt-2 line-clamp-1">Terakhir: {item.chapterTitle || item.chapterSlug.replace(/-/g, " ")}</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/15 rounded-full px-2 py-1">
                    {item.nextChapterSlug ? "Lanjut next" : "Baca lagi"}
                  </span>
                  <span className="text-[10px] text-muted/60 font-bold">{prettyDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
