"use client";

import Link from "next/link";
import { useState } from "react";

interface MangaCardProps {
  id: string;
  title: string;
  cover: string;
  chapters?: { number: string; time: string; url: string }[];
  rating?: string;
  isNew?: boolean;
  type?: string;
  variant?: "horizontal" | "vertical" | "featured";
}

function CoverFallback({ label = "No Cover", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className="w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.22),transparent_38%),linear-gradient(135deg,#11111c,#08080d)] flex items-center justify-center">
      <div className="text-center px-3">
        <div className={`${compact ? "w-9 h-9" : "w-12 h-12"} mx-auto mb-2 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-primary/80`}>
          <svg className={compact ? "w-4 h-4" : "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <span className={`${compact ? "text-[10px]" : "text-xs"} text-muted/75 font-bold`}>{label}</span>
      </div>
    </div>
  );
}

function RatingPill({ rating, compact = false }: { rating: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-accent-yellow font-black ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}>
      <svg className={compact ? "w-2.5 h-2.5 fill-current" : "w-3.5 h-3.5 fill-current"} viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {rating}
    </span>
  );
}

function typeLabel(value?: string) {
  if (!value) return "";
  return value.toUpperCase();
}

function typeBadgeClass(value?: string) {
  const clean = (value || "").toLowerCase();
  if (clean.includes("manhwa")) return "bg-sky-400/12 border-sky-300/20 text-sky-200";
  if (clean.includes("manhua")) return "bg-emerald-400/12 border-emerald-300/20 text-emerald-200";
  if (clean.includes("manga")) return "bg-fuchsia-400/12 border-fuchsia-300/20 text-fuchsia-200";
  return "bg-primary/10 border-primary/15 text-primary";
}

function formatChapterBadge(chapter?: { number: string; time: string; url: string }) {
  if (!chapter?.number) return null;
  return chapter.time ? `${chapter.number} • ${chapter.time}` : chapter.number;
}

export default function MangaCard({
  id,
  title,
  cover,
  chapters = [],
  rating,
  isNew,
  type,
  variant = "horizontal",
}: MangaCardProps) {
  const [imgError, setImgError] = useState(false);
  const latestChapter = chapters[0];

  if (variant === "featured") {
    return (
      <Link
        href={`/manga/${id}`}
        className="block relative rounded-[2rem] overflow-hidden group transition-all duration-500 border border-white/10 shadow-[0_28px_80px_-35px_rgba(0,0,0,0.9)] hover:border-primary/35 hover:shadow-[0_30px_90px_-38px_rgba(168,85,247,0.75)]"
      >
        <div className="aspect-[16/10] md:aspect-video relative bg-card-bg">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <CoverFallback />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/48 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/75 via-transparent to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            {type && (
              <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg border ${typeBadgeClass(type)}`}>
                {typeLabel(type)}
              </span>
            )}
            {isNew && (
              <span className="px-3 py-1.5 bg-accent-red text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-[0_8px_20px_rgba(239,68,68,0.3)]">
                Baru
              </span>
            )}
          </div>

          {rating && (
            <div className="absolute top-4 right-4 bg-black/45 backdrop-blur-md rounded-full shadow-lg">
              <RatingPill rating={rating} />
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <p className="text-primary text-[11px] font-black uppercase tracking-[0.24em] mb-2">Pilihan Untukmu</p>
            <h3 className="text-white font-black text-xl md:text-3xl line-clamp-2 mb-3 group-hover:text-primary transition-colors duration-300 leading-tight">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-bold">
              {latestChapter && <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">{formatChapterBadge(latestChapter)}</span>}
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">Buka detail</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "vertical") {
    return (
      <Link href={`/manga/${id}`} className="block group">
        <div className="aspect-[3/4.45] rounded-[1.4rem] overflow-hidden relative mb-3 border border-white/10 bg-card-bg shadow-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_20px_45px_-25px_rgba(168,85,247,0.8)]">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-107 transition-transform duration-500 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <CoverFallback compact />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/5 to-transparent opacity-80" />

          <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
            {isNew ? (
              <span className="bg-accent-red text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">UP</span>
            ) : (
              <span />
            )}
            {rating && <RatingPill rating={rating} compact />}
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
            {type && (
              <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-1 rounded-full backdrop-blur-md border ${typeBadgeClass(type)}`}>
                {typeLabel(type)}
              </span>
            )}
            {latestChapter?.number && (
              <span className="text-white/85 text-[9px] font-black px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 truncate">
                {latestChapter.number}
              </span>
            )}
          </div>
        </div>
        <h3 className="text-white text-[13px] font-black line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug px-0.5">
          {title}
        </h3>
      </Link>
    );
  }

  return (
    <article className="group rounded-[1.35rem] transition-all duration-300 hover:bg-white/[0.045] hover:shadow-[0_18px_55px_-35px_rgba(168,85,247,0.65)]">
      <div className="flex gap-4 p-3 animate-fade-in">
        <Link href={`/manga/${id}`} className="flex-shrink-0">
          <div className="w-22 h-30 rounded-2xl overflow-hidden relative border border-white/10 bg-card-bg shadow-lg group-hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-0.5">
            {!imgError ? (
              <img
                src={cover}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                onError={() => setImgError(true)}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <CoverFallback compact />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            {isNew && (
              <span className="absolute top-1.5 left-1.5 bg-accent-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg">
                NEW
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <Link href={`/manga/${id}`} className="flex-1 min-w-0">
              <h3 className="text-white font-black text-[15px] leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {title}
              </h3>
            </Link>
            {rating && <RatingPill rating={rating} compact />}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {type && (
              <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeBadgeClass(type)}`}>
                {typeLabel(type)}
              </span>
            )}
            {latestChapter?.time ? (
              <span className="text-[10px] text-muted/70 font-bold">Update {latestChapter.time}</span>
            ) : (
              <span className="text-[10px] text-muted/70 font-bold">Update terbaru</span>
            )}
          </div>

          {chapters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chapters.slice(0, 2).map((ch, idx) => (
                <Link
                  key={`${ch.number}-${idx}`}
                  href={ch.url ? `/read?u=${encodeURIComponent(btoa(ch.url))}` : "#"}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.055] hover:bg-primary/18 text-muted hover:text-white text-[11px] font-black transition-all duration-300 border border-white/8 hover:border-primary/30 active:scale-[0.98]"
                >
                  <span className="truncate">{ch.number}</span>
                  {ch.time && <span className="text-[9px] text-muted/50 font-bold shrink-0">{ch.time}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <Link href={`/manga/${id}`} className="inline-flex w-fit items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.055] hover:bg-white/10 text-muted hover:text-white text-[11px] font-black transition-all border border-white/8">
              Lihat detail
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
