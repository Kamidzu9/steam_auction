import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ClientHelpers from "../components/ClientHelpers";
import BottomNav from "../components/BottomNav";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steam Auction MVP",
  description: "Compare Steam libraries and pick a random co-op game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning={true}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0f14" />
      </head>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>

        <main
          id="main"
          className="min-h-[60vh] mx-auto max-w-6xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]"
        >
          {children}

          <footer className="surface mt-12 rounded-2xl p-4 text-sm text-slate-300">
            <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
              <div className="flex items-center gap-4">
                <a href="/help" className="hover:text-white">Hilfe</a>
                <a href="/privacy" className="hover:text-white">Datenschutz</a>
                <a href="/contact" className="hover:text-white">Kontakt</a>
              </div>
              <div>(c) {new Date().getFullYear()} Steam Auction</div>
            </div>
          </footer>
        </main>

        <BottomNav />

        {/* Client-only helpers (service worker, install prompt, tutorial) */}
        <ClientHelpers />
      </body>
    </html>
  );
}
