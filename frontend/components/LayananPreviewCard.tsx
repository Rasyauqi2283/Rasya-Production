"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const ITEMS = [
  { slug: "cafe", labelId: "Cafe", labelEn: "Cafe" },
  { slug: "kostel", labelId: "Kostel", labelEn: "Boarding House" },
  { slug: "game-store", labelId: "Game Store", labelEn: "Game Store" },
];

export default function LayananPreviewCard() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <div className="rounded-xl border border-rasya-border bg-rasya-card p-6 transition hover:border-rasya-accent/30">
      <h4 className="mb-2 text-lg font-semibold text-white">
        {isEn ? "Preview, Web & Digital" : "Preview, Web & Digital"}
      </h4>
      <p className="mb-4 text-sm text-zinc-400">
        {isEn
          ? "Open real preview pages for ready-made website themes."
          : "Buka halaman preview nyata untuk tema website siap pakai."}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link
            key={item.slug}
            href={`/layanan-preview/${item.slug}`}
            className="rounded-lg border border-rasya-border bg-rasya-dark/50 px-3 py-2 text-center text-xs font-medium text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
          >
            {isEn ? item.labelEn : item.labelId}
          </Link>
        ))}
      </div>
      <Link
        href="/layanan-preview"
        className="mt-4 inline-block text-xs font-medium text-rasya-accent hover:underline"
      >
        {isEn ? "See all previews" : "Lihat semua preview"}
      </Link>
    </div>
  );
}

