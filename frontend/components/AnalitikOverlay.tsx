"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

// Sama dengan admin: skill/tech rating skala 5 (sync manual jika diubah di admin).
const SKILL_RATINGS: { name: string; rating: number; max?: number }[] = [
  { name: "Go (Golang)", rating: 4 },
  { name: "Next.js", rating: 4 },
  { name: "React", rating: 4 },
  { name: "TypeScript", rating: 4 },
  { name: "PostgreSQL", rating: 4 },
  { name: "Node.js", rating: 3 },
  { name: "Figma / UI", rating: 4 },
  { name: "Video editing", rating: 3 },
  { name: "Content writing", rating: 4 },
].map((s) => ({ ...s, max: 5 }));

// Penjelasan singkat per skill (ID & EN). Klik kotak skill untuk tampilkan.
const SKILL_DESCRIPTIONS: Record<
  string,
  { id: string; en: string }
> = {
  "Go (Golang)": {
    id: "Bahasa pemrograman untuk backend, API, dan layanan yang mengutamakan performa dan konkurensi. Digunakan untuk membangun server, microservice, dan tooling.",
    en: "Programming language for backend, APIs, and high-performance concurrent services. Used to build servers, microservices, and tooling.",
  },
  "Next.js": {
    id: "Framework React untuk web dengan server-side rendering, routing terintegrasi, dan optimasi production. Cocok untuk website dan aplikasi web modern.",
    en: "React framework for the web with server-side rendering, built-in routing, and production optimizations. Suited for modern websites and web apps.",
  },
  React: {
    id: "Library JavaScript untuk membangun antarmuka pengguna (UI) yang interaktif dan berbasis komponen. Dipakai untuk single-page app dan antarmuka dinamis.",
    en: "JavaScript library for building interactive, component-based user interfaces. Used for single-page apps and dynamic UIs.",
  },
  TypeScript: {
    id: "Superset JavaScript dengan tipe data statis. Memudahkan pemeliharaan kode dan mengurangi error di pengembangan aplikasi berskala.",
    en: "JavaScript superset with static types. Improves code maintainability and reduces errors in larger codebases.",
  },
  PostgreSQL: {
    id: "Basis data relasional open-source. Digunakan untuk menyimpan dan mengolah data aplikasi dengan transaksi andal dan dukungan query kompleks.",
    en: "Open-source relational database. Used to store and query application data with reliable transactions and complex queries.",
  },
  "Node.js": {
    id: "Runtime JavaScript di sisi server. Dipakai untuk membangun API, tooling, dan aplikasi backend yang memakai ekosistem npm.",
    en: "JavaScript runtime on the server. Used to build APIs, tooling, and backend applications using the npm ecosystem.",
  },
  "Figma / UI": {
    id: "Tool desain antarmuka dan prototyping untuk UI/UX. Digunakan untuk wireframe, mockup, dan design system sebelum development.",
    en: "Design and prototyping tool for UI/UX. Used for wireframes, mockups, and design systems before development.",
  },
  "Video editing": {
    id: "Pengeditan video untuk konten promosi, media sosial, dan presentasi. Meliputi cutting, color grading, dan motion grafis.",
    en: "Video editing for promo content, social media, and presentations. Includes cutting, color grading, and motion graphics.",
  },
  "Content writing": {
    id: "Penulisan konten untuk web, copy, dan naskah yang selaras dengan brand dan SEO. Artikel, landing page, dan script video.",
    en: "Writing for web, copy, and scripts aligned with brand and SEO. Articles, landing pages, and video scripts.",
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AnalitikOverlay({ open, onClose }: Props) {
  const { t, lang } = useLanguage();
  const [layer, setLayer] = useState<1 | 2>(1);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLayer(1);
      setSelectedSkill(null);
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analitik-overlay-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-rasya-border bg-rasya-card shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-rasya-border px-4 py-3">
          <h2
            id="analitik-overlay-title"
            className="font-display text-lg font-semibold text-white"
          >
            {layer === 1 ? t("analitik_layer1_title") : t("analitik_layer2_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-rasya-border hover:text-white"
            aria-label={t("analitik_close")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {layer === 1 ? (
            <>
              <p className="mb-4 text-sm text-zinc-400">
                {t("analitik_layer1_desc")}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SKILL_RATINGS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedSkill(selectedSkill === s.name ? null : s.name)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                      selectedSkill === s.name
                        ? "border-rasya-accent bg-rasya-accent/10"
                        : "border-rasya-border bg-rasya-dark/60 hover:border-rasya-accent/50"
                    }`}
                  >
                    <span className="truncate text-sm text-zinc-200" title={s.name}>
                      {s.name}
                    </span>
                    <span className="ml-2 shrink-0 text-xs font-medium text-rasya-accent">
                      {s.rating}/{s.max ?? 5}
                    </span>
                  </button>
                ))}
              </div>
              {selectedSkill && SKILL_DESCRIPTIONS[selectedSkill] && (
                <div className="mt-4 rounded-lg border border-rasya-accent/30 bg-rasya-accent/5 p-4">
                  <p className="mb-2 text-sm font-medium text-white">{selectedSkill}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {lang === "en"
                      ? SKILL_DESCRIPTIONS[selectedSkill].en
                      : SKILL_DESCRIPTIONS[selectedSkill].id}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedSkill(null)}
                    className="mt-3 text-xs font-medium text-rasya-accent hover:underline"
                  >
                    {t("analitik_close_desc")}
                  </button>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLayer(2)}
                  className="rounded-lg bg-rasya-accent px-4 py-2 text-sm font-medium text-rasya-dark transition hover:opacity-90"
                >
                  {t("analitik_next")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-zinc-300 leading-relaxed">
                {t("analitik_layer2_text")}
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLayer(1)}
                  className="rounded-lg border border-rasya-border px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-rasya-border hover:text-white"
                >
                  {t("analitik_back")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-rasya-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {t("analitik_close")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
