import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Cinzel } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MaintenancePage from "@/components/MaintenancePage";
import RamadanAdOverlay from "@/components/RamadanAdOverlay";
import "./globals.css";

const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

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

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-gothic",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://raspro.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Raspro | Rasya Production — Desain, Konten & Website",
    template: "%s | Raspro — Rasya Production",
  },
  description:
    "Raspro (raspro.online) — Rasya Production. Layanan desain, konten kreatif, website, dan solusi digital untuk personal maupun bisnis.",
  keywords: [
    "raspro",
    "raspro.online",
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
  authors: [{ name: "Rasya Production" }, { name: "Raspro" }],
  creator: "Rasya Production",
  publisher: "Rasya Production",
  robots: isMaintenance
    ? { index: false, follow: false }
    : {
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
    title: "Raspro | Rasya Production — Desain, Konten & Website",
    description:
      "Raspro (raspro.online) — Rasya Production. Layanan desain, konten kreatif, website, dan solusi digital.",
    url: "/",
    siteName: "Raspro — Rasya Production",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/Logo_sebenarnya.png",
        width: 512,
        height: 512,
        alt: "Logo Raspro — Rasya Production",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raspro | Rasya Production — Desain, Konten & Website",
    description:
      "Raspro (raspro.online) — Rasya Production. Layanan desain, konten kreatif, website, dan solusi digital.",
    images: ["/Logo_sebenarnya.png"],
  },
  icons: {
    icon: "/Logo_sebenarnya.png",
    shortcut: "/Logo_sebenarnya.png",
    apple: "/Logo_sebenarnya.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Rasya Production",
  alternateName: ["Raspro", "raspro.online"],
  url: siteUrl,
  logo: `${siteUrl}/Logo_sebenarnya.png`,
  description:
    "Raspro — Rasya Production. Layanan desain, konten kreatif, website, dan solusi digital untuk personal maupun bisnis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${jetbrainsMono.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen font-display">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {isMaintenance ? (
          <MaintenancePage />
        ) : (
          <LanguageProvider>
            <RamadanAdOverlay />
            <Header />
            <main>{children}</main>
            <Footer />
            <CookieConsentBanner />
          </LanguageProvider>
        )}
      </body>
    </html>
  );
}
