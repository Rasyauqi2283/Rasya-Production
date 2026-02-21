"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * 10 slide yang lebih tajam & menjual — outcome-driven, benefit-focused.
 * Struktur: Intro hook → Nilai jual (manfaat) → Web & Digital (positioning + 3 pilar) → 5 solusi → Demo → Closing CTA.
 */
const fiturSlides = [
  {
    title: "Website yang bukan hanya online — tapi menghasilkan.",
    tagline: "Intro",
    desc: "Saya membantu bisnis mengubah traffic menjadi leads, dan leads menjadi revenue lewat sistem digital yang terukur dan scalable.\nKarena di era ini, yang bertahan bukan yang punya website — tapi yang punya sistem.",
  },
  {
    title: "Nilai jual — fokus ke manfaat, bukan sekadar fitur",
    tagline: "Nilai jual",
    listItems: [
      "Meningkatkan kredibilitas bisnis",
      "Meningkatkan konversi & leads",
      "Otomatisasi proses bisnis",
      "Data untuk keputusan strategis",
      "Skalabilitas jangka panjang",
    ],
    listFootnote: "Website responsif, SEO, hosting, source code sebagai fondasi teknis.",
  },
  {
    title: "Saya tidak hanya membuat website. Saya membangun sistem digital untuk bisnis Anda.",
    tagline: "Web & Digital",
    listItems: [
      "Visibility — SEO & Branding",
      "Conversion — CTA, Form, WhatsApp, Funnel",
      "Automation — Dashboard, Export, Analytics",
    ],
    comparison: {
      leftTitle: "❌ Proses Konvensional",
      leftItems: [
        "Catat manual di kertas",
        "Data tercecer",
        "Rekap Excel manual",
        "Sulit monitoring",
        "Lambat follow up",
      ],
      rightTitle: "✅ Dengan Sistem Digital",
      rightItems: [
        "Form otomatis tersimpan",
        "Dashboard realtime",
        "Monitoring 24/7",
        "Data terpusat",
        "Export laporan instan",
      ],
    },
    isSekat: true,
  },
  {
    title: "Frontend",
    tagline: "Solusi",
    desc: "Fokus pada User Experience → meningkatkan trust & waktu kunjungan. Tampil rapi di semua device, aksesibel, dan mengarahkan visitor ke aksi yang Anda mau.",
  },
  {
    title: "Backend",
    tagline: "Solusi",
    desc: "Fokus pada keamanan, performa, dan stabilitas sistem. Data aman, API andal, siap tumbuh seiring bisnis Anda.",
  },
  {
    title: "Fullstack",
    tagline: "Solusi",
    desc: "Fokus pada efisiensi biaya & komunikasi lebih cepat. Satu tim, satu alur — dari konsep sampai deploy tanpa putus koordinasi.",
  },
  {
    title: "WordPress",
    tagline: "Solusi",
    desc: "Fokus pada cepat live, mudah dikelola, cocok UMKM. Online dalam hitungan hari, Anda bisa update konten sendiri.",
  },
  {
    title: "Mobile apps",
    tagline: "Solusi",
    desc: "Fokus pada engagement lebih tinggi & loyalitas pelanggan. Aplikasi Android/iOS yang membuat pelanggan tetap terhubung dengan brand Anda.",
  },
];

export type ExtraSlide = {
  title: string;
  tagline?: string;
  content: ReactNode;
};

type ComparisonBlock = {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
};

type SlideItem = {
  title: string;
  tagline?: string;
  desc?: string;
  listItems?: string[];
  listFootnote?: string;
  comparison?: ComparisonBlock;
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
      const slideWidth = el.clientWidth;
      el.scrollTo({ left: i * slideWidth, behavior: "smooth" });
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
              className="relative flex min-h-[260px] max-h-[58vh] min-w-full max-w-full shrink-0 flex-col snap-center snap-always overflow-hidden rounded-sm border-2 border-zinc-700/80 bg-gradient-to-b from-zinc-900/95 to-rasya-dark px-6 py-5 shadow-[inset_0_1px_0_0_rgba(234,179,8,0.08),inset_0_0_0_1px_rgba(255,255,255,0.03)] md:min-h-[300px] md:max-h-[62vh] md:px-8 md:py-6"
            >
              {/* Ornate top border accent */}
              <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-rasya-accent/50 to-transparent" />
              {slide.isSekat ? (
                <div className="flex flex-1 min-h-0 flex-col items-center justify-center text-center">
                  {slide.tagline && (
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-rasya-accent/90">
                      {slide.tagline}
                    </p>
                  )}
                  <h3 className="font-gothic text-lg font-medium tracking-wide text-zinc-100 md:text-2xl md:tracking-wider">
                    {slide.title}
                  </h3>
                  {slide.listItems && slide.listItems.length > 0 ? (
                    <ul className="mt-2 list-none space-y-1 text-left font-display text-sm text-zinc-300 md:text-base">
                      {slide.listItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-rasya-accent" aria-hidden>✔</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : slide.desc ? (
                    <p className="mt-2 max-w-xl font-display text-sm leading-relaxed text-zinc-400">
                      {slide.desc}
                    </p>
                  ) : null}
                  {slide.comparison && (
                    <div className="mt-4 grid w-full max-w-2xl grid-cols-2 gap-4 text-left">
                      <div className="rounded border border-zinc-600/60 bg-zinc-900/50 px-3 py-2">
                        <p className="mb-1.5 text-xs font-semibold text-zinc-400">
                          {slide.comparison.leftTitle}
                        </p>
                        <ul className="list-none space-y-0.5 text-[11px] text-zinc-500 md:text-xs">
                          {slide.comparison.leftItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded border border-rasya-accent/30 bg-rasya-accent/5 px-3 py-2">
                        <p className="mb-1.5 text-xs font-semibold text-rasya-accent/90">
                          {slide.comparison.rightTitle}
                        </p>
                        <ul className="list-none space-y-0.5 text-[11px] text-zinc-300 md:text-xs">
                          {slide.comparison.rightItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {slide.tagline && (
                    <p className="mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-rasya-accent/90">
                      — {slide.tagline} —
                    </p>
                  )}
                  <h3 className="font-gothic mb-2 text-base font-medium tracking-wide text-zinc-100 md:text-lg md:tracking-wider">
                    {slide.title}
                  </h3>
                  {/* Decorative divider */}
                  <div className="mb-2 flex items-center gap-3">
                    <span className="h-px flex-1 bg-zinc-600/60" />
                    <span className="text-rasya-accent/60" aria-hidden>◆</span>
                    <span className="h-px flex-1 bg-zinc-600/60" />
                  </div>
                  {slide.content != null ? (
                    <div className="min-h-0 flex-1 overflow-y-auto">{slide.content}</div>
                  ) : slide.listItems && slide.listItems.length > 0 ? (
                    <div className="min-h-0 flex-1">
                      <ul className="list-none space-y-1 font-display text-sm text-zinc-300 md:text-base">
                        {slide.listItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="shrink-0 text-rasya-accent" aria-hidden>✔</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      {slide.listFootnote && (
                        <p className="mt-2 text-xs text-zinc-500">{slide.listFootnote}</p>
                      )}
                    </div>
                  ) : slide.desc ? (
                    <div className="max-w-2xl space-y-2 font-display text-sm leading-relaxed text-zinc-400 md:text-base">
                      {slide.desc.split("\n").map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
              {/* Garis kuning tipis + tombol kanan/kiri di dalam slide, di bawah konten */}
              <div className="mt-auto shrink-0 pt-2">
                <div className="mb-2 h-px w-full bg-gradient-to-r from-transparent via-rasya-accent/50 to-transparent" />
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => scrollTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-zinc-600/80 bg-zinc-900/80 text-base text-zinc-300 transition hover:border-rasya-accent/60 hover:text-rasya-accent disabled:opacity-40 disabled:hover:border-zinc-600/80 disabled:hover:text-zinc-300"
                    aria-label="Slide sebelumnya"
                  >
                    ←
                  </button>
                  <span className="font-gothic min-w-[3rem] text-center text-xs tracking-wide text-zinc-500">
                    {activeIndex + 1} / {total}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollTo(activeIndex + 1)}
                    disabled={activeIndex === total - 1}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border-2 border-zinc-600/80 bg-zinc-900/80 text-base text-zinc-300 transition hover:border-rasya-accent/60 hover:text-rasya-accent disabled:opacity-40 disabled:hover:border-zinc-600/80 disabled:hover:text-zinc-300"
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
