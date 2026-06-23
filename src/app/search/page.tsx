"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
// Header and BottomNav moved to AppShell

interface SearchResult {
  id: string;
  title: string;
  cover: string;
  type?: string;
  rating?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query);
    }
  }, [query]);

  const performSearch = (q: string) => {
    setLoading(true);
    fetch(`/api/manga?s=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((d) => {
        setResults(d.manga || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.history.pushState(null, "", `/search?q=${encodeURIComponent(searchInput.trim())}`);
      performSearch(searchInput.trim());
    }
  };

  return (
    <>
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20 px-4">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari manga, manhwa, manhua..."
              className="flex-1 bg-[#1A1A1A] text-white px-4 py-3 rounded-xl text-sm outline-none border border-[#2A2A2A] focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Genre Quick Links */}
        {!query && results.length === 0 && (
          <div className="mb-6">
            <h3 className="text-white font-semibold text-sm mb-3">Genre Populer</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Action",
                "Romance",
                "Comedy",
                "Fantasy",
                "Drama",
                "Horror",
                "Slice of Life",
                "Adventure",
                "Martial Arts",
                "Isekai",
                "Shounen",
                "Shoujo",
              ].map((genre) => (
                <button
                  key={genre}
                  onClick={() => {
                    setSearchInput(genre);
                    window.history.pushState(null, "", `/search?q=${encodeURIComponent(genre)}`);
                    performSearch(genre);
                  }}
                  className="px-3 py-1.5 bg-[#1A1A1A] text-gray-300 text-xs rounded-full hover:bg-purple-600 hover:text-white transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton w-20 h-28 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-1">
            {results.map((result, idx) => (
              <SearchResultCard key={idx} result={result} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 text-sm">Ketik judul manga untuk mencari</p>
          </div>
        )}
      </main>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <main className="flex-1 max-w-2xl mx-auto w-full pb-20 px-4">
            <div className="py-4">
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="skeleton w-20 h-28 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/manga/${result.id}`}
      className="flex gap-3 py-3 px-2 rounded-lg hover:bg-[#1A1A1A] transition-colors group"
    >
      <div className="w-16 h-22 rounded-lg overflow-hidden flex-shrink-0">
        {!imgError ? (
          <img
            src={result.cover}
            alt={result.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
            <span className="text-gray-500 text-xs">No Image</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-purple-400 transition-colors">
          {result.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {result.type && (
            <span className="text-[10px] bg-[#2A2A2A] text-gray-400 px-2 py-0.5 rounded">{result.type}</span>
          )}
          {result.rating && (
            <span className="text-[10px] text-yellow-400 flex items-center gap-0.5">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {result.rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
