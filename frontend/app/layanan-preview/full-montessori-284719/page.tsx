import type { Metadata } from "next";
import Link from "next/link";
import PreviewWatermarkDense from "@/components/PreviewWatermarkDense";

export const metadata: Metadata = {
  title: "Preview Full — Montessori",
  robots: { index: false, follow: false },
};

const m = {
  bg: "#faf7f2",
  surface: "#f0ebe3",
  card: "#e8e2d9",
  border: "#d4cdc4",
  text: "#2c2420",
  muted: "#6b5b52",
  accent: "#b85c38",
  accentHover: "#9a4a2e",
};

export default function FullMontessoriPreviewPage() {
  return (
    <main className="relative min-h-screen" style={{ backgroundColor: m.bg, color: m.text }}>
      <PreviewWatermarkDense lightBg />
      <div className="relative z-10">
        {/* Hero */}
        <section
          id="hero"
          className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-20 text-center"
        >
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl" style={{ color: m.text }}>
              Sekolah yang mengutamakan kemandirian dan cinta belajar — bukan
              sekadar pintar di kertas.
            </h1>
            <p className="mb-8 text-lg" style={{ color: m.muted }}>
              PAUD & TK dengan pendekatan Montessori, diperkaya English
              Enrichment dan Kurikulum Merdeka. Maksimal 15 siswa per kelas agar
              setiap anak benar-benar dikenal.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#kontak"
                className="rounded-lg px-6 py-3 font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: m.accent }}
              >
                Jadwalkan Tur Sekolah
              </a>
              <a
                href="#mengapa"
                className="rounded-lg border px-6 py-3 font-medium transition hover:opacity-90"
                style={{ borderColor: m.border, color: m.text }}
              >
                Kenali Pendekatan Kami
              </a>
            </div>
          </div>
        </section>

        {/* Mengapa Montessori */}
        <section id="mengapa" className="border-t px-6 py-16" style={{ borderColor: m.border, backgroundColor: m.surface }}>
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-2xl font-bold" style={{ color: m.text }}>
              Mengapa Montessori?
            </h2>
            <p className="mb-4" style={{ color: m.text }}>
              Kami percaya setiap anak memiliki rasa ingin tahu alami. Peran kami
              bukan “mengisi gelas kosong”, tetapi menyalakan api keingintahuan di
              dalam diri anak.
            </p>
            <p className="mb-6" style={{ color: m.text }}>
              Dalam kelas kami, kalimat “Biar saya coba sendiri” sangat berharga.
              Anak didorong untuk mencoba terlebih dahulu, bukan langsung dibantu.
              Fokus kami: anak berani mencoba, bukan takut salah.
            </p>
            <blockquote className="border-l-4 pl-4 italic" style={{ borderColor: m.accent, color: m.muted }}>
              Peran kami bukan “mengisi gelas kosong”, tetapi menyalakan api
              keingintahuan di dalam diri anak.
            </blockquote>
          </div>
        </section>

        {/* Prinsip Utama */}
        <section id="prinsip" className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: m.text }}>
              5 Pilar di Kelas Kami
            </h2>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Anak Mampu Belajar Secara Mandiri", items: ["Memilih aktivitas sesuai minat dan kebutuhan", "Guru mendampingi, tidak mendikte", "Latihan mengambil keputusan kecil"] },
                { title: "Belajar Melalui Aktivitas Nyata (Practical Life)", items: ["Sepatu sendiri, menuang air, merapikan", "Koordinasi gerak, konsentrasi, tanggung jawab"] },
                { title: "Kemandirian sebagai Tujuan Utama", items: ["Mencoba terlebih dahulu", "Menghargai proses, bukan hanya hasil"] },
                { title: "Lingkungan yang Disiapkan (Prepared Environment)", items: ["Furnitur & bahan sesuai anak; rapi & berurutan", "Anak merasa “ini adalah ruangku”"] },
                { title: "Guru sebagai Pembimbing (Guide)", items: ["Mengamati, presentasi singkat, anak mengulang sendiri", "Tenang, terstruktur, hangat, penuh empati"] },
              ].map((card, i) => (
                <div key={i} className="rounded-xl border p-5" style={{ borderColor: m.border, backgroundColor: m.card }}>
                  <h3 className="mb-3 font-semibold" style={{ color: m.text }}>{card.title}</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm" style={{ color: m.muted }}>
                    {card.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kurikulum Terintegrasi */}
        <section id="kurikulum" className="border-t px-6 py-16" style={{ borderColor: m.border, backgroundColor: m.surface }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold" style={{ color: m.text }}>Kurikulum Terintegrasi</h2>
            <p className="mb-10 text-center" style={{ color: m.muted }}>
              Untuk menjawab kebutuhan anak dan orang tua masa kini, kami menggabungkan tiga pendekatan utama:
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: "Montessori", desc: "Karakter, kemandirian, pembelajaran konkret. Area: Practical Life, Sensorial, Language, Mathematics, Culture." },
                { title: "English Enrichment", desc: "Lagu, storytelling, percakapan ringan. Tanpa paksaan; bahasa hadir alami dalam keseharian." },
                { title: "Kurikulum Merdeka", desc: "Pembelajaran berbasis projek, Profil Pelajar Pancasila, pengembangan minat dan potensi. Selaras standar nasional." },
              ].map((block, i) => (
                <div key={i} className="rounded-xl border p-5" style={{ borderColor: m.border, backgroundColor: m.bg }}>
                  <h3 className="mb-2 font-semibold" style={{ color: m.accent }}>{block.title}</h3>
                  <p className="text-sm" style={{ color: m.text }}>{block.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Program & Jenjang */}
        <section id="program" className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: m.text }}>
              Program & Jenjang: PAUD, TK A, TK B
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { tagline: "First Explorers", usia: "± 3–4 tahun", fokus: ["Adaptasi lingkungan sekolah", "Kemandirian dasar (toilet, sepatu, merapikan)", "Pengenalan bahasa & sensorial"] },
                { tagline: "Curious Learners", usia: "± 4–5 tahun", fokus: ["Kemandirian & percaya diri", "Pra-matematika & pra-menulis", "Projek sederhana & English rutin"] },
                { tagline: "Ready for Primary", usia: "± 5–6 tahun", fokus: ["Siap SD tanpa kehilangan esensi Montessori", "Fokus, instruksi bertahap, literasi-numerasi", "Projek kolaboratif"] },
              ].map((prog, i) => (
                <div key={i} className="rounded-xl border p-5" style={{ borderColor: m.border, backgroundColor: m.card }}>
                  <p className="text-sm font-medium" style={{ color: m.accent }}>{prog.tagline}</p>
                  <p className="mb-3 text-xs" style={{ color: m.muted }}>{prog.usia}</p>
                  <ul className="list-inside list-disc space-y-1 text-sm" style={{ color: m.text }}>
                    {prog.fokus.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs" style={{ color: m.muted }}>Maks. 15 siswa per kelas</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Manfaat */}
        <section id="manfaat" className="border-t px-6 py-16" style={{ borderColor: m.border, backgroundColor: m.surface }}>
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: m.text }}>Apa yang Akan Anak Dapatkan?</h2>
            <p className="mb-6 text-center" style={{ color: m.muted }}>
              Dengan kombinasi Montessori + English Enrichment + Kurikulum Merdeka, anak akan:
            </p>
            <ul className="space-y-2" style={{ color: m.text }}>
              {[
                "Lebih mandiri dalam aktivitas sehari-hari",
                "Lebih percaya diri saat mencoba hal baru",
                "Fokus dan konsentrasi yang lebih baik",
                "Terbiasa bertanggung jawab terhadap diri dan lingkungan",
                "Tidak terlalu bergantung pada orang dewasa",
                "Dasar kemampuan Bahasa Inggris sejak dini",
                "Siap melanjutkan ke jenjang berikutnya — akademik maupun karakter",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: m.accent }} aria-hidden>✔</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing */}
        <section id="closing" className="px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 text-2xl font-bold" style={{ color: m.text }}>
              Untuk Orang Tua yang Mencari “Sekolah yang Beda”
            </h2>
            <p style={{ color: m.text }}>
              Jika Anda ingin anak tidak hanya pintar di kertas, tetapi juga mandiri, sopan, dan berani mencoba; lingkungan sekolah yang hangat dan terstruktur namun tidak kaku; serta pendekatan yang menghargai keunikan setiap anak — pendekatan Montessori terintegrasi seperti ini bisa menjadi jawaban yang selaras dengan harapan Anda.
            </p>
          </div>
        </section>

        {/* Kontak */}
        <section id="kontak" className="border-t px-6 py-16" style={{ borderColor: m.border, backgroundColor: m.surface }}>
          <div className="mx-auto max-w-lg">
            <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: m.text }}>Jadwalkan Tur Sekolah</h2>
            <p className="mb-6 text-center text-sm" style={{ color: m.muted }}>
              Preview full version — hanya dapat diakses melalui link yang dibagikan. Order layanan untuk mendapatkan website lengkap tanpa watermark.
            </p>
            <a
              href="https://wa.me/6200000000000?text=Halo%2C%20saya%20ingin%20order%20website%20Montessori%20(setelah%20lihat%20preview%20full)."
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex max-w-xs justify-center rounded-lg px-6 py-3 font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: m.accent }}
            >
              Hubungi via WhatsApp
            </a>
            <p className="mt-8 text-center text-xs" style={{ color: m.muted }}>
              Rasya Production — Layanan pembuatan website sekolah Montessori
            </p>
          </div>
        </section>

        <footer className="border-t px-6 py-6 text-center text-sm" style={{ borderColor: m.border, color: m.muted }}>
          © {new Date().getFullYear()} — Preview template. Kemandirian & cinta belajar.
        </footer>

        <div className="sticky bottom-4 left-0 right-0 z-20 flex justify-center px-4">
          <Link
            href="/layanan-preview"
            className="rounded-lg border bg-white/95 px-4 py-2 text-xs font-medium shadow-sm backdrop-blur"
            style={{ borderColor: m.border, color: m.text }}
          >
            ← Kembali ke daftar preview
          </Link>
        </div>
      </div>
    </main>
  );
}
