import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "MangaReader - Baca Manga, Manhwa, dan Manhua Online";
const siteDescription =
  "Baca manga, manhwa, dan manhua dari BacaKomik dengan tampilan bersih, reader nyaman, bookmark, riwayat baca, dan pencarian cepat.";

export const metadata: Metadata = {
  metadataBase: new URL("https://manga-reader.vercel.app"),
  title: {
    default: siteTitle,
    template: "%s | MangaReader",
  },
  description: siteDescription,
  applicationName: "MangaReader",
  keywords: ["manga", "manhwa", "manhua", "bacakomik", "komik online", "reader manga"],
  authors: [{ name: "allif izz" }],
  creator: "allif izz",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MangaReader",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
