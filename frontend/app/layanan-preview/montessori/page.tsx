import Link from "next/link";
import PreviewWatermark from "@/components/PreviewWatermark";

export default function MontessoriPreviewPage() {
  return (
    <main className="relative min-h-screen bg-[#faf7f2] px-6 pb-20 pt-28 text-[#2c2420]">
      <PreviewWatermark lightBg />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/layanan-preview"
          className="text-xs text-[#6b5b52] hover:text-[#b85c38]"
        >
          ← Kembali ke layanan preview
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-[#d4cdc4] bg-[#f0ebe3] shadow-lg">
          <div className="border-b border-[#d4cdc4] bg-[#e8e2d9]/50 p-6 md:p-8">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#b85c38]">
              Montessori School Theme
            </p>
            <h1 className="text-3xl font-bold text-[#2c2420] md:text-4xl">
              Sekolah yang mengutamakan kemandirian dan cinta belajar
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#6b5b52]">
              Preview landing PAUD & TK: pendekatan Montessori, English
              Enrichment, dan Kurikulum Merdeka. Maksimal 15 siswa per kelas.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            {[
              { tag: "PAUD", usia: "3–4 tahun", label: "First Explorers" },
              { tag: "TK A", usia: "4–5 tahun", label: "Curious Learners" },
              { tag: "TK B", usia: "5–6 tahun", label: "Ready for Primary" },
            ].map((item) => (
              <div
                key={item.tag}
                className="rounded-xl border border-[#d4cdc4] bg-[#faf7f2] p-4"
              >
                <p className="text-xs font-medium text-[#b85c38]">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#2c2420]">
                  {item.tag}
                </p>
                <p className="mt-1 text-sm text-[#6b5b52]">{item.usia}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
