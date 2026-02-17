"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const STEPS = [
  "cara_kerja_step1",
  "cara_kerja_step2",
  "cara_kerja_step3",
  "cara_kerja_step4",
  "cara_kerja_step5",
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CaraKerjaOverlay({ open, onClose }: Props) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
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
      aria-labelledby="cara-kerja-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-rasya-border bg-rasya-card p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id="cara-kerja-title"
            className="font-display text-2xl font-bold text-white sm:text-3xl"
          >
            {t("cara_kerja_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-rasya-border hover:text-white"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ol className="mb-8 space-y-4">
          {STEPS.map((key, i) => (
            <li key={key} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rasya-accent/20 font-mono text-sm font-semibold text-rasya-accent">
                {i + 1}
              </span>
              <span className="pt-0.5 text-zinc-200">{t(key)}</span>
            </li>
          ))}
        </ol>

        <p className="rounded-lg border border-rasya-accent/30 bg-rasya-accent/10 px-4 py-3 text-sm italic text-rasya-accent">
          👉 {t("cara_kerja_quote")}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-rasya-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          {t("cara_kerja_close")}
        </button>
      </div>
    </div>
  );
}
