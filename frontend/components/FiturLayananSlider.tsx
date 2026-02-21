"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

const fiturSlides = [
  {
    title: "Website responsif",
    tagline: "Nilai jual utama",
    desc: "Tampil optimal di desktop, tablet, dan ponsel. Siap dipakai di berbagai device tanpa perlu dua versi terpisah. Satu website, semua layar.",
  },
  {
    title: "ROI & efisiensi biaya",
    desc: "Satu investasi untuk aset digital jangka panjang. Kurangi biaya marketing yang tidak terarah; website jadi hub informasi dan konversi yang Anda kendalikan sendiri.",
  },
  {
    title: "Siap konversi & monetisasi",
    desc: "CTA jelas, form kontak, link WhatsApp, atau tombol order — dirancang agar pengunjung gampang jadi lead atau pelanggan. Siap terima inquiry dan transaksi.",
  },
  {
    title: "SEO & visibilitas",
    desc: "Optimasi dasar agar website bisa muncul di pencarian Google. Calon pelanggan yang cari layanan Anda lebih gampang menemukan bisnis Anda.",
  },
  {
    title: "Analitik untuk keputusan bisnis",
    desc: "Lihat jumlah pengunjung, sumber traffic, dan perilaku (sesuai kebutuhan). Data sederhana untuk evaluasi marketing dan pengambilan keputusan.",
  },
  {
    title: "Export data ke Excel",
    desc: "Angka dan data dari website bisa ditarik langsung menjadi file Excel. Praktis untuk laporan, rekap, atau analisis lanjutan tanpa copy-paste manual.",
  },
  {
    title: "Pembuatan dokumen (PDF) tinggal klik",
    desc: "Hasilkan dokumen siap cetak atau kirim — brosur, katalog, laporan — dalam format PDF dengan satu klik. PDF creator terintegrasi sesuai kebutuhan Anda.",
  },
  {
    title: "Struktur organisasi lewat UI",
    desc: "Section, urutan, dan tampilan konten bisa Anda sesuaikan lewat antarmuka — tanpa mengubah backend. Perubahan langsung (real-time). Coba demo di slide berikutnya.",
  },
  {
    title: "Konten & copywriting",
    desc: "Saya bantu isi konten atau siapkan struktur agar Anda bisa isi sendiri. Copy bisa disesuaikan dengan nada brand Anda.",
  },
  {
    title: "Revisi terstruktur",
    desc: "Proses revisi jelas: putaran feedback terarah sehingga hasil final sesuai kesepakatan tanpa bolak-balik tidak terarah.",
  },
  {
    title: "Hosting & domain",
    desc: "Panduan deploy dan pengaturan domain. Bisa dibantu sampai online atau Anda kelola sendiri dengan dokumentasi yang saya berikan.",
  },
  {
    title: "Source code & hak milik",
    desc: "Setelah selesai, Anda dapat source code dan hak atas website. Transparan dan siap dikembangkan lagi bila perlu.",
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
};

export default function FiturLayananSlider({
  additionalSlides = [],
}: {
  additionalSlides?: ExtraSlide[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides: SlideItem[] = [
    ...fiturSlides.map((s) => ({ ...s })),
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
        {/* Tombol kiri/kanan ala PPT */}
        <div className="mb-4 flex items-center justify-center gap-4">
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
              className="relative min-w-full max-w-full shrink-0 snap-center snap-always overflow-hidden rounded-sm border-2 border-zinc-700/80 bg-gradient-to-b from-zinc-900/95 to-rasya-dark px-8 py-12 shadow-[inset_0_1px_0_0_rgba(234,179,8,0.08),inset_0_0_0_1px_rgba(255,255,255,0.03)] md:px-12 md:py-14"
            >
              {/* Ornate top border accent */}
              <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-rasya-accent/50 to-transparent" />
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
              {/* Bottom corner accent */}
              <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 border-b-2 border-r-2 border-rasya-accent/20" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
