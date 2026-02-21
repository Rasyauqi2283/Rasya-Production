"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Final draft deck: Fitur & Demo = keseluruhan slide yang didapat jika order layanan Web & Digital.
 * Struktur: Intro → Nilai jual → Bab 1 (Web & Digital) → Frontend → Backend → Fullstack → WordPress → Mobile apps. Tanpa penutup.
 */
const fiturSlides = [
  {
    title: "Yang Anda dapatkan jika order jasa saya",
    tagline: "Intro",
    desc: "Satu deck ini merangkum apa saja yang Anda dapat ketika mengambil layanan Web & Digital: dari nilai jual, struktur layanan (frontend, backend, fullstack, WordPress, mobile), hingga demo interaktif.",
  },
  {
    title: "Nilai jual utama",
    tagline: "Nilai jual",
    desc: "Website responsif (satu website, semua layar). ROI & efisiensi biaya. Siap konversi & monetisasi (CTA, form, WhatsApp). SEO & visibilitas. Analitik untuk keputusan bisnis. Export data ke Excel, PDF tinggal klik. Struktur organisasi lewat UI. Konten & copywriting. Revisi terstruktur. Hosting & domain. Source code & hak milik.",
  },
  {
    title: "Web & Digital",
    tagline: "Bab 1",
    desc: "Layanan pembangunan website dan aplikasi web. Berikut sekat layanan: Frontend, Backend, Fullstack, WordPress, Mobile apps.",
    isSekat: true,
  },
  {
    title: "Frontend",
    tagline: "Bab 1 — Web & Digital",
    desc: "Tampilan dan interaksi di browser: markup, styling, logic di sisi client. Website atau aplikasi web yang responsif dan aksesibel. Mulai dari landing page hingga antarmuka aplikasi.",
  },
  {
    title: "Backend",
    tagline: "Bab 1 — Web & Digital",
    desc: "Server, API, dan logika di belakang layar: REST/API, database, autentikasi, integrasi pihak ketiga. Fondasi yang aman dan skalabel.",
  },
  {
    title: "Fullstack",
    tagline: "Bab 1 — Web & Digital",
    desc: "Frontend dan backend dalam satu proyek: database, API, dan antarmuka pengguna dari awal sampai deploy. Satu tim, satu alur.",
  },
  {
    title: "WordPress",
    tagline: "Bab 1 — Web & Digital",
    desc: "Situs berbasis WordPress: setup tema, plugin, custom layout, integrasi konten. Cepat online dan mudah dikelola client.",
  },
  {
    title: "Mobile apps",
    tagline: "Bab 1 — Web & Digital",
    desc: "Aplikasi Android dan/atau iOS: UI, logic, integrasi API. Siap dipakai atau diunggah ke Play Store / App Store.",
  },
];

export type ExtraSlide = {
  title: string;
  tagline?: string;
  content: ReactNode;
};

type SlideItem = {
  title: string;
  tagline?: string;
  desc?: string;
  content?: ReactNode;
  isSekat?: boolean;
};

export default function FiturLayananSlider({
  additionalSlides = [],
}: {
  additionalSlides?: ExtraSlide[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides: SlideItem[] = [
    ...fiturSlides.map((s) => ({ ...s, isSekat: (s as SlideItem).isSekat })),
    ...additionalSlides.map((s) => ({
      title: s.title,
      tagline: s.tagline,
      content: s.content,
    })),
  ];
  const total = slides.length;

  const scrollTo = (index: number) => {
    const i = Math.max(0, Math.min(index, total - 1));
    setActiveIndex(i);
    const el = scrollRef.current;
    if (el) {
      const slide = el.querySelector(`[data-slide="${i}"]`);
      slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  return (
    <section aria-label="Fitur yang didapat saat order" className="mb-16">
      {/* Dropdown pilih slide — di bawah teks order (dari header halaman) */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="fitur-slide-select" className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Pilih slide
        </label>
        <select
          id="fitur-slide-select"
          value={activeIndex}
          onChange={(e) => scrollTo(Number(e.target.value))}
          className="rounded-sm border-2 border-zinc-600/80 bg-zinc-900/80 px-4 py-2.5 font-display text-sm text-zinc-100 transition focus:border-rasya-accent/70 focus:outline-none focus:ring-1 focus:ring-rasya-accent/40 min-w-[200px] max-w-full"
        >
          {slides.map((slide, i) => (
            <option key={i} value={i}>
              {i + 1}. {slide.title}
            </option>
          ))}
        </select>
      </div>

      <div className="relative -mx-2 md:-mx-4">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-2 md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={() => {
            const el = scrollRef.current;
            if (!el || el.scrollWidth <= el.offsetWidth) return;
            const slideWidth = el.offsetWidth;
            const index = Math.round(el.scrollLeft / slideWidth);
            setActiveIndex(Math.min(Math.max(0, index), total - 1));
          }}
        >
          {slides.map((slide, i) => (
            <article
              key={i}
              data-slide={i}
              className="relative flex min-h-[420px] min-w-full max-w-full shrink-0 flex-col snap-center snap-always overflow-hidden rounded-sm border-2 border-zinc-700/80 bg-gradient-to-b from-zinc-900/95 to-rasya-dark px-8 py-12 shadow-[inset_0_1px_0_0_rgba(234,179,8,0.08),inset_0_0_0_1px_rgba(255,255,255,0.03)] md:min-h-[480px] md:px-12 md:py-14"
            >
              {/* Ornate top border accent */}
              <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-rasya-accent/50 to-transparent" />
              {slide.isSekat ? (
                <div className="flex flex-col items-center justify-center text-center">
                  {slide.tagline && (
                    <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-rasya-accent/90">
                      {slide.tagline}
                    </p>
                  )}
                  <h3 className="font-gothic text-2xl font-medium tracking-wide text-zinc-100 md:text-4xl md:tracking-wider">
                    {slide.title}
                  </h3>
                  {slide.desc && (
                    <p className="mt-4 max-w-xl font-display text-sm leading-relaxed text-zinc-400">
                      {slide.desc}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {slide.tagline && (
                    <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.35em] text-rasya-accent/90">
                      — {slide.tagline} —
                    </p>
                  )}
                  <h3 className="font-gothic mb-5 text-xl font-medium tracking-wide text-zinc-100 md:text-2xl md:tracking-wider">
                    {slide.title}
                  </h3>
                  {/* Decorative divider */}
                  <div className="mb-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-zinc-600/60" />
                    <span className="text-rasya-accent/60" aria-hidden>◆</span>
                    <span className="h-px flex-1 bg-zinc-600/60" />
                  </div>
                  {slide.content != null ? (
                    <div className="mt-4">{slide.content}</div>
                  ) : (
                    <p className="max-w-2xl font-display text-base leading-relaxed text-zinc-400 md:text-lg">
                      {slide.desc}
                    </p>
                  )}
                </>
              )}
              {/* Garis kuning tipis + tombol kanan/kiri di dalam slide, di bawah konten */}
              <div className="mt-auto pt-8">
                <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-rasya-accent/50 to-transparent" />
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-zinc-600/80 bg-zinc-900/80 text-xl text-zinc-300 transition hover:border-rasya-accent/60 hover:text-rasya-accent disabled:opacity-40 disabled:hover:border-zinc-600/80 disabled:hover:text-zinc-300"
                    aria-label="Slide sebelumnya"
                  >
                    ←
                  </button>
                  <span className="font-gothic min-w-[4rem] text-center text-sm tracking-wide text-zinc-500">
                    {activeIndex + 1} / {total}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollTo(activeIndex + 1)}
                    disabled={activeIndex === total - 1}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-zinc-600/80 bg-zinc-900/80 text-xl text-zinc-300 transition hover:border-rasya-accent/60 hover:text-rasya-accent disabled:opacity-40 disabled:hover:border-zinc-600/80 disabled:hover:text-zinc-300"
                    aria-label="Slide berikutnya"
                  >
                    →
                  </button>
                </div>
              </div>
              {/* Bottom corner accent */}
              <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-rasya-accent/20" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
