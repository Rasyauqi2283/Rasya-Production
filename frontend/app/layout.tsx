import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://raspro.co.id"),
  title: {
    default: "Rasya Production",
    template: "%s | Rasya Production",
  },
  description:
    "Rasya Production — layanan desain, konten kreatif, website, dan solusi digital untuk personal maupun bisnis.",
  keywords: [
    "Rasya Production",
    "jasa desain",
    "jasa website",
    "content creator",
    "creative production",
    "jasa digital",
    "jasa konten",
    "freelance digital",
  ],
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Rasya Production" }],
  creator: "Rasya Production",
  publisher: "Rasya Production",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Rasya Production",
    description:
      "Layanan desain, konten kreatif, website, dan solusi digital untuk personal maupun bisnis.",
    url: "/",
    siteName: "Rasya Production",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/Logo_contoh.png",
        width: 512,
        height: 512,
        alt: "Logo Rasya Production",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rasya Production",
    description:
      "Layanan desain, konten kreatif, website, dan solusi digital untuk personal maupun bisnis.",
    images: ["/Logo_contoh.png"],
  },
  icons: {
    icon: "/Logo_contoh.png",
    shortcut: "/Logo_contoh.png",
    apple: "/Logo_contoh.png",
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
        <LanguageProvider>
          <Header />
          <main>{children}</main>
          <footer className="border-t border-rasya-border bg-rasya-surface py-8">
            <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
              © {new Date().getFullYear()} Rasya Production. All rights reserved.
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
