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

  if (variant === "featured") {
    return (
      <Link
        href={`/manga/${id}`}
        className="block relative rounded-3xl overflow-hidden group transition-all duration-500"
      >
        <div className="aspect-[16/10] md:aspect-video relative">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-sm">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />

          {/* Type Badge */}
          {type && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-[0_4px_12px_rgba(168,85,247,0.4)]">
                {type}
              </span>
            </div>
          )}

          {/* Rating Pill */}
          {rating && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-accent-yellow text-xs font-bold flex items-center gap-1 border border-white/10 shadow-lg">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="text-white font-black text-xl md:text-2xl line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <div className="flex items-center gap-3">
              {isNew && (
                <span className="bg-accent-red text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-lg shadow-accent-red/20">
                  NEW CHAPTER
                </span>
              )}
              {chapters.length > 0 && (
                <span className="text-muted text-xs font-semibold">
                  {chapters[0].number}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "vertical") {
    return (
      <Link href={`/manga/${id}`} className="block group">
        <div className="aspect-[3/4.5] rounded-2xl overflow-hidden relative mb-3 border border-white/5 shadow-xl transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-primary/10">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-xs">No Cover</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

          {isNew && (
            <span className="absolute top-2 left-2 bg-accent-red text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-lg">
              UP
            </span>
          )}
          {rating && (
            <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-accent-yellow text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 border border-white/10">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </span>
          )}
          {type && (
            <span className="absolute bottom-2 left-2 text-white/50 text-[9px] font-bold uppercase tracking-tight">
              {type}
            </span>
          )}
        </div>
        <h3 className="text-white text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug px-0.5">
          {title}
        </h3>
      </Link>
    );
  }

  // Horizontal (default)
  return (
    <div className="flex gap-4 py-4 animate-fade-in group hover:bg-white/[0.02] -mx-2 px-2 rounded-2xl transition-all duration-300">
      <Link href={`/manga/${id}`} className="flex-shrink-0">
        <div className="w-22 h-30 rounded-2xl overflow-hidden relative border border-white/5 shadow-lg group-hover:border-primary/20 transition-colors duration-300">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-[10px]">No Image</span>
            </div>
          )}
          {isNew && (
            <span className="absolute top-1.5 left-1.5 bg-accent-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-lg">
              NEW
            </span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/manga/${id}`} className="flex-1 min-w-0">
            <h3 className="text-white font-black text-[15px] leading-tight line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
          </Link>
          {rating && (
            <div className="flex items-center gap-1 text-accent-yellow text-[11px] font-bold shrink-0">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          {type && (
            <span className="text-[10px] text-muted font-bold uppercase tracking-wide px-2 py-0.5 bg-white/5 rounded-md">
              {type}
            </span>
          )}
          <span className="text-[10px] text-muted/60 font-medium italic">Update Terbaru</span>
        </div>

        {chapters.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {chapters.slice(0, 2).map((ch, idx) => (
              <Link
                key={idx}
                href={ch.url ? `/read?u=${encodeURIComponent(btoa(ch.url))}` : "#"}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 hover:bg-primary/20 text-muted hover:text-white text-[11px] font-bold transition-all duration-300 border border-white/5 hover:border-primary/30"
              >
                <span className="truncate mr-1.5">{ch.number}</span>
                {ch.time && <span className="text-[9px] text-muted/50 font-normal shrink-0">{ch.time}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
