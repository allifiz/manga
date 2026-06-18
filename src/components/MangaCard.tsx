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
  variant?: "horizontal" | "vertical" | "featured";
}

export default function MangaCard({
  id,
  title,
  cover,
  chapters = [],
  rating,
  isNew,
  variant = "horizontal",
}: MangaCardProps) {
  const [imgError, setImgError] = useState(false);

  if (variant === "featured") {
    return (
      <Link
        href={`/manga/${id}`}
        className="block relative rounded-2xl overflow-hidden group transition-all duration-300"
      >
        <div className="aspect-[16/9] relative">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-sm">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

          {/* Floating Rating Pill */}
          {rating && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-yellow-400 text-xs font-extrabold flex items-center gap-1 border border-white/10 shadow-lg">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{rating}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-extrabold text-base md:text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
            {isNew && (
              <span className="inline-block bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                NEW CHAPTER
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "vertical") {
    return (
      <Link href={`/manga/${id}`} className="block group">
        <div className="aspect-[3/4.2] rounded-xl overflow-hidden relative mb-2 border border-white/5 shadow-md">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-xs">No Cover</span>
            </div>
          )}
          {isNew && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-md">
              NEW
            </span>
          )}
          {rating && (
            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 border border-white/10 shadow-lg">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </span>
          )}
        </div>
        <h3 className="text-white text-xs font-bold line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug">
          {title}
        </h3>
      </Link>
    );
  }

  // Horizontal (default)
  return (
    <div className="flex gap-4 py-3.5 animate-fade-in group">
      <Link href={`/manga/${id}`} className="flex-shrink-0">
        <div className="w-20 h-26 rounded-xl overflow-hidden relative border border-white/5 shadow-md">
          {!imgError ? (
            <img
              src={cover}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-card-bg flex items-center justify-center">
              <span className="text-muted text-[10px]">No Image</span>
            </div>
          )}
          {isNew && (
            <span className="absolute top-1 left-1 bg-red-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded shadow">
              UP
            </span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link href={`/manga/${id}`}>
          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
        </Link>
        {rating && (
          <div className="flex items-center gap-1 text-yellow-500 text-[11px] font-semibold mt-0.5 mb-1.5">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{rating}</span>
          </div>
        )}
        {chapters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {chapters.slice(0, 2).map((ch, idx) => (
              <Link
                key={idx}
                href={ch.url ? `/read?u=${encodeURIComponent(btoa(ch.url))}` : "#"}
                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/5 hover:bg-primary/20 text-muted hover:text-white text-[10px] font-semibold transition-all duration-200 border border-white/5 hover:border-primary/30"
              >
                <span className="truncate mr-1.5">{ch.number}</span>
                {ch.time && <span className="text-[9px] text-muted/60">{ch.time}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
