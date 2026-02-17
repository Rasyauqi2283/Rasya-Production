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

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AnalitikOverlay({ open, onClose }: Props) {
  const { t } = useLanguage();
  const [layer, setLayer] = useState<1 | 2>(1);

  useEffect(() => {
    if (!open) {
      setLayer(1);
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
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-lg border border-rasya-border bg-rasya-dark/60 px-3 py-2"
                  >
                    <span className="truncate text-sm text-zinc-200" title={s.name}>
                      {s.name}
                    </span>
                    <span className="ml-2 shrink-0 text-xs font-medium text-rasya-accent">
                      {s.rating}/{s.max ?? 5}
                    </span>
                  </div>
                ))}
              </div>
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
