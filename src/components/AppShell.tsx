"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideShell = pathname?.startsWith("/read") || pathname?.startsWith("/manga");

  return (
    <>
      {!hideShell && <Header />}
      <div className="flex-1">{children}</div>
      {!hideShell && <BottomNav />}
    </>
  );
}
