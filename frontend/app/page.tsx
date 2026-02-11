import AntrianLayanan from "@/components/AntrianLayanan";
import DonateForm from "@/components/DonateForm";
import JasaLanes from "@/components/JasaLanes";
import LayananSection from "@/components/LayananSection";
import PortoList from "@/components/PortoList";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
const WHATSAPP_PREFILL = "Halo, saya dari website Rasya Production. Saya ingin bertanya tentang layanan.";

export default function Home() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;
  return (
    <>
      {/* Mau sewa jasa + jalur kotak/checklist */}
      <JasaLanes />

      {/* Hero */}
      <section
        id="hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24"
        aria-label="Hero"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-rasya-surface/50 to-rasya-dark" />
        <div className="relative z-10 max-w-3xl text-center">
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent">
            Creative Production & Digital
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Rasya{" "}
            <span className="text-rasya-accent">Production</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            Dari konsep sampai deliver. Konten, desain, dan solusi digital yang
            dibangun dengan presisi—untuk brand dan bisnis Anda.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark transition hover:bg-rasya-accent/90"
            >
              Mulai Proyek
            </a>
            <a
              href="#about"
              className="rounded-lg border border-rasya-border px-6 py-3 font-medium text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
            >
              Tentang Saya
            </a>
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-rasya-border bg-rasya-surface py-24 px-6"
        aria-labelledby="about-heading"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="about-heading"
            className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent"
          >
            Tentang
          </h2>
          <h3 className="mb-8 text-3xl font-bold text-white sm:text-4xl">
            Solusi kreatif & digital perorangan
          </h3>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-zinc-400 leading-relaxed">
              Rasya Production adalah brand pribadi saya: konten, desain, dan
              teknologi. Setiap proyek saya kerjakan dengan pendekatan rapi dan
              berorientasi hasil—tanpa mengorbankan kreativitas.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Saya fokus pada kualitas output: dari konten dan desain hingga
              pengalaman digital. Situs ini—rasyaproduction.up.railway.app atau
              raspro.co.id—adalah wajah profesional dari layanan yang saya tawarkan.
            </p>
          </div>
          <div className="mt-10 rounded-xl border border-rasya-accent/30 bg-rasya-accent/5 px-6 py-5">
            <p className="text-zinc-300 leading-relaxed">
              <span className="font-medium text-white">Vendor atau agency yang butuh tenaga eksternal?</span> Saya bisa menjadi third party Anda dalam pengerjaan—dengan <span className="text-rasya-accent font-medium">kontrak yang jelas</span>: scope, deadline, dan kompensasi terdefinisi. Kerja sama profesional, bukan kerja borongan tanpa batas.
            </p>
          </div>
        </div>
      </section>

      {/* Layanan (kategori + card deskripsi & harga) */}
      <LayananSection />

      {/* Antrian layanan (hanya nama, tanpa harga) */}
      <AntrianLayanan apiUrl={API_URL} />

      {/* Porto (Portofolio) */}
      <section
        id="porto"
        className="border-t border-rasya-border bg-rasya-surface py-24 px-6"
        aria-labelledby="porto-heading"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="porto-heading"
            className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent"
          >
            Porto
          </h2>
          <h3 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
            Portofolio
          </h3>
          <p className="mb-12 max-w-2xl text-zinc-400">
            Beberapa proyek yang pernah saya kerjakan—musik, web, dan konten (yang sudah selesai kontrak).
          </p>
          <PortoList apiUrl={API_URL} />
        </div>
      </section>

      {/* Contact & Donasi */}
      <section
        id="contact"
        className="border-t border-rasya-border bg-rasya-surface py-24 px-6"
        aria-labelledby="contact-heading"
      >
        <div className="mx-auto max-w-2xl">
          <h2
            id="contact-heading"
            className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent"
          >
            Kontak
          </h2>
          <h3 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            Siap mulai proyek atau ingin berdonasi?
          </h3>
          <p className="mb-8 text-zinc-400">
            Langsung hubungi lewat WhatsApp, media sosial, atau email dan donasi di bawah.
          </p>

          <p className="mb-4 text-center text-sm text-zinc-500">Temukan kami di:</p>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
              aria-label="WhatsApp"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href="https://instagram.com/rasyaproduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </a>
            <a
              href="https://facebook.com/rasyaproduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
            <a
              href="https://linkedin.com/in/rasyaproduction"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="mailto:rasyauqi2283@gmail.com"
              className="rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark transition hover:bg-rasya-accent/90 text-center"
            >
              rasyauqi2283@gmail.com
            </a>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Donasi</h4>
            <DonateForm apiUrl={API_URL} />
          </div>
        </div>
      </section>
    </>
  );
}
