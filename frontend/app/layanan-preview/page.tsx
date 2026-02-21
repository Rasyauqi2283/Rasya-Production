"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PREVIEW_LANE_TAGS,
  FITUR_PREVIEW,
  THEME_PREVIEWS,
  getPreviewsByTag,
  getFiturDemoOptionsByCategory,
  type PreviewMeta,
} from "@/lib/layananPreviewConfig";

function PreviewCard({ item }: { item: PreviewMeta }) {
  return (
    <Link
      href={`/layanan-preview/${item.slug}`}
      className="group rounded-2xl border border-rasya-border bg-rasya-surface p-6 transition hover:border-rasya-accent/50"
    >
      <h2 className="mb-2 text-lg font-semibold text-white group-hover:text-rasya-accent">
        {item.title}
      </h2>
      <p className="mb-4 line-clamp-2 text-sm text-zinc-400">{item.description}</p>
      <span className="text-xs font-medium text-rasya-accent">Buka preview →</span>
    </Link>
  );
}

export default function LayananPreviewIndexPage() {
  const router = useRouter();
  const [laneId, setLaneId] = useState<string>(PREVIEW_LANE_TAGS[0]);
  const [fiturDemoOpen, setFiturDemoOpen] = useState(false);
  const [fiturKategori, setFiturKategori] = useState<string>("");
  const [fiturPreview, setFiturPreview] = useState<string>("");

  const webDigitalServices = getPreviewsByTag("Web & Digital");
  const designPreviews = getPreviewsByTag("Design");
  const kontenPreviews = getPreviewsByTag("Konten & Kreatif");
  const lainPreviews = getPreviewsByTag("Lain-lain");

  const fiturDemoOptions = getFiturDemoOptionsByCategory(fiturKategori);

  const handleFiturDemoGo = () => {
    if (fiturPreview) {
      router.push(`/layanan-preview/${fiturPreview}`);
    }
  };

  return (
    <main className="min-h-screen bg-rasya-dark px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-zinc-400 transition hover:text-rasya-accent"
        >
          ← Kembali ke laman utama
        </Link>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-rasya-accent">
          Layanan Preview
        </p>
        <h1 className="mb-2 text-4xl font-bold text-white">Preview template layanan</h1>
        <p className="mb-8 max-w-2xl text-zinc-400">
          Pilih kategori lalu pilih tema atau layanan untuk melihat preview.
        </p>

        {/* 4 lane — sama seperti krusial */}
        <nav
          aria-label="Kategori preview"
          className="mb-8 flex flex-wrap gap-2"
        >
          {PREVIEW_LANE_TAGS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setLaneId(label)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                laneId === label
                  ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                  : "border-rasya-border text-zinc-400 hover:border-rasya-accent/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Konten per lane */}
        {laneId === "Web & Digital" && (
          <div className="space-y-10">
            {/* Paling atas: Fitur & Demo — klik buka panel dropdown (kategori → preview) */}
            <section aria-label="Fitur & Demo">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-rasya-accent">
                Fitur & Demo
              </h2>
              <div className="rounded-2xl border-2 border-rasya-accent/40 bg-rasya-surface p-6">
                <button
                  type="button"
                  onClick={() => setFiturDemoOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {FITUR_PREVIEW.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">{FITUR_PREVIEW.description}</p>
                  </div>
                  <span className="text-rasya-accent" aria-hidden>
                    {fiturDemoOpen ? "▼" : "▶"}
                  </span>
                </button>

                {fiturDemoOpen && (
                  <div className="mt-6 space-y-4 border-t border-rasya-border pt-6">
                    <p className="text-xs text-zinc-500">
                      Pilih kategori lalu pilih preview. Web & Digital: Fitur & Demo slide, 4 theme, dan 7 layanan. Kategori lain menyusul.
                    </p>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="min-w-[180px]">
                        <label htmlFor="fitur-kategori" className="mb-1 block text-xs text-zinc-400">
                          Kategori
                        </label>
                        <select
                          id="fitur-kategori"
                          value={fiturKategori}
                          onChange={(e) => {
                            setFiturKategori(e.target.value);
                            setFiturPreview("");
                          }}
                          className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-sm text-white focus:border-rasya-accent focus:outline-none"
                        >
                          <option value="">Pilih kategori</option>
                          {PREVIEW_LANE_TAGS.map((tag) => (
                            <option key={tag} value={tag}>
                              {tag}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-[220px]">
                        <label htmlFor="fitur-preview" className="mb-1 block text-xs text-zinc-400">
                          Preview
                        </label>
                        <select
                          id="fitur-preview"
                          value={fiturPreview}
                          onChange={(e) => setFiturPreview(e.target.value)}
                          disabled={!fiturKategori}
                          className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-sm text-white focus:border-rasya-accent focus:outline-none disabled:opacity-50"
                        >
                          <option value="">
                            {fiturKategori === "Web & Digital"
                              ? "Pilih preview"
                              : fiturKategori
                                ? "Segera hadir"
                                : "Pilih kategori dulu"}
                          </option>
                          {fiturDemoOptions.map((opt) => (
                            <option key={opt.slug} value={opt.slug}>
                              {opt.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleFiturDemoGo}
                        disabled={!fiturPreview}
                        className="rounded-lg bg-rasya-accent px-4 py-2 text-sm font-medium text-rasya-dark transition hover:bg-rasya-accent/90 disabled:opacity-50"
                      >
                        Buka preview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Badge: 4 theme */}
            <section aria-label="Template / Theme">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-rasya-accent">
                Template / Theme
              </h2>
              <div className="flex flex-wrap gap-2">
                {THEME_PREVIEWS.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/layanan-preview/${item.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-rasya-border bg-rasya-surface px-4 py-2 text-sm transition hover:border-rasya-accent/50 hover:text-rasya-accent"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {THEME_PREVIEWS.map((item) => (
                  <PreviewCard key={item.slug} item={item} />
                ))}
              </div>
            </section>

            {/* Layanan Web & Digital (7 layanan) */}
            <section aria-label="Layanan Web & Digital">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-rasya-accent">
                Layanan Web & Digital
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {webDigitalServices.map((item) => (
                  <PreviewCard key={item.slug} item={item} />
                ))}
              </div>
            </section>
          </div>
        )}

        {laneId === "Design" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designPreviews.map((item) => (
              <PreviewCard key={item.slug} item={item} />
            ))}
          </div>
        )}

        {laneId === "Konten & Kreatif" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kontenPreviews.map((item) => (
              <PreviewCard key={item.slug} item={item} />
            ))}
          </div>
        )}

        {laneId === "Lain-lain" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lainPreviews.map((item) => (
              <PreviewCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
