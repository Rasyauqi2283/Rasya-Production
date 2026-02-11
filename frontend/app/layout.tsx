import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rasya Production",
  description:
    "Rasya Production — Layanan jasa perorangan: creative production, musik, dan pengalaman digital.",
  openGraph: {
    title: "Rasya Production",
    description: "Layanan jasa perorangan — creative production, musik, dan digital.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-display">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-rasya-border/50 bg-rasya-dark/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <a
              href="#hero"
              className="text-xl font-semibold tracking-tight text-white"
            >
              Rasya<span className="text-rasya-accent">.</span>Production
            </a>
            <nav className="hidden gap-8 md:flex" aria-label="Main">
              <a
                href="#about"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                Tentang
              </a>
              <a
                href="#services"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                Layanan
              </a>
              <a
                href="#porto"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                Porto
              </a>
              <a
                href="#contact"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                Kontak
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-rasya-border bg-rasya-surface py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} Rasya Production. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
