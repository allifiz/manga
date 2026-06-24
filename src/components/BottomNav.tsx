"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Beranda", icon: HomeIcon },
    { href: "/explore", label: "Explore", icon: ExploreIcon },
    { href: "/library", label: "Library", icon: LibraryIcon },
    { href: "/search", label: "Cari", icon: SearchIcon },
  ];

  if (pathname?.startsWith("/read") || pathname?.startsWith("/manga")) return null;

  return (
    <div className="fixed bottom-5 left-0 right-0 z-40 px-4 pointer-events-none">
      <nav className="max-w-md mx-auto glass rounded-[1.75rem] shadow-[0_22px_70px_rgba(0,0,0,0.55)] border border-white/10 p-1.5 pointer-events-auto">
        <div className="flex justify-around items-center h-15">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center gap-1 w-full h-full rounded-2xl transition-all duration-300 relative overflow-hidden ${
                  isActive ? "text-white" : "text-muted hover:text-white"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/22 to-primary/8 rounded-2xl animate-fade-in border border-primary/15" />
                )}
                <item.icon className={`relative w-5.5 h-5.5 transition-all duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(168,85,247,0.65)]" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"}`} />
                <span className={`relative text-[9px] tracking-tight font-black uppercase ${isActive ? "text-primary" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
    </svg>
  );
}
