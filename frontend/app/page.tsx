"use client";

import { useEffect, useState } from "react";
import AntrianLayanan from "@/components/AntrianLayanan";
import AnalitikOverlay from "@/components/AnalitikOverlay";
import CaraKerjaOverlay from "@/components/CaraKerjaOverlay";
import JasaLanes from "@/components/JasaLanes";
import LayananSection from "@/components/LayananSection";
import Link from "next/link";
import PortoList from "@/components/PortoList";
import { useLanguage } from "@/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";

const WHATSAPP_PREFILL_ID = "Halo, saya dari website Rasya Production. Saya ingin bertanya tentang layanan.";
const WHATSAPP_PREFILL_EN = "Hi, I'm from the Rasya Production website. I'd like to ask about your services.";

export default function Home() {
  const { lang, t } = useLanguage();
  const [caraKerjaOpen, setCaraKerjaOpen] = useState(false);
  const [analitikOpen, setAnalitikOpen] = useState(false);
  const [showPortoSection, setShowPortoSection] = useState(false);
  const whatsappPrefill = lang === "en" ? WHATSAPP_PREFILL_EN : WHATSAPP_PREFILL_ID;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappPrefill)}`;

  useEffect(() => {
    fetch(`${API_URL}/api/porto`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          setShowPortoSection(Boolean(data?.ok && Array.isArray(data.porto) && data.porto.length > 0));
        } catch {
          setShowPortoSection(false);
        }
      })
      .catch(() => setShowPortoSection(false));
  }, []);

  return (
    <>
      <JasaLanes />
      <section
        id="hero"
        className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24"
        aria-label="Hero"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-rasya-surface/50 to-rasya-dark" />
        <div className="relative z-10 max-w-3xl text-center">
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent">
            {t("hero_tagline")}
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Rasya <span className="text-rasya-accent">Production</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            {t("hero_subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark transition hover:bg-rasya-accent/90"
            >
              {t("hero_cta_project")}
            </a>
            <a
              href="#about"
              className="rounded-lg border border-rasya-border px-6 py-3 font-medium text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
            >
              {t("hero_cta_about")}
            </a>
          </div>
        </div>
      </section>

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
            {t("about_heading")}
          </h2>
          <h3 className="mb-8 text-3xl font-bold text-white sm:text-4xl">
            {t("about_title")}
          </h3>
          <div className="grid gap-8 md:grid-cols-2">
            <p className="text-zinc-400 leading-relaxed">{t("about_p1")}</p>
            <p className="text-zinc-400 leading-relaxed">{t("about_p2")}</p>
          </div>
          <p className="mt-6 text-zinc-400 leading-relaxed md:col-span-2">
            {t("about_p3")}
          </p>
          <div className="mt-10 rounded-xl border border-rasya-accent/30 bg-rasya-accent/5 px-6 py-5">
            <p className="text-zinc-300 leading-relaxed">
              <span className="font-medium text-white">{t("about_vendor")}</span>{" "}
              {t("about_vendor_desc")}
            </p>
          </div>
        </div>
      </section>

      <LayananSection />

      <AntrianLayanan apiUrl={API_URL} />

      <section
        id="layanan-preview"
        className="border-t border-rasya-border bg-rasya-surface py-24 px-6"
        aria-labelledby="layanan-preview-heading"
      >
        <div className="mx-auto max-w-6xl">
          <h2
            id="layanan-preview-heading"
            className="mb-8 font-mono text-sm uppercase tracking-widest text-rasya-accent"
          >
            Layanan Preview
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/layanan-preview"
              className="rounded-xl border-2 border-rasya-border bg-rasya-card px-6 py-4 font-semibold text-white transition hover:border-rasya-accent/60 hover:bg-rasya-accent/10 hover:text-rasya-accent"
            >
              {lang === "en" ? "See all previews" : "Lihat semua preview"}
            </Link>
            <button
              type="button"
              onClick={() => setAnalitikOpen(true)}
              className="rounded-xl border-2 border-rasya-primary/60 bg-rasya-primary/10 px-6 py-4 font-semibold text-rasya-primary transition hover:border-rasya-primary hover:bg-rasya-primary/20"
            >
              {t("analitik_btn")}
            </button>
            <button
              type="button"
              onClick={() => setCaraKerjaOpen(true)}
              className="rounded-xl border-2 border-dashed border-rasya-accent/60 bg-rasya-accent/10 px-6 py-4 text-left font-semibold text-rasya-accent transition hover:border-rasya-accent hover:bg-rasya-accent/20"
            >
              👉 {t("cara_kerja_btn")}
            </button>
          </div>
        </div>
      </section>

      <CaraKerjaOverlay open={caraKerjaOpen} onClose={() => setCaraKerjaOpen(false)} />
      <AnalitikOverlay open={analitikOpen} onClose={() => setAnalitikOpen(false)} />

      {showPortoSection && (
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
              {t("porto_heading")}
            </h2>
            <h3 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
              {t("porto_title")}
            </h3>
            <p className="mb-12 max-w-2xl text-zinc-400">{t("porto_desc")}</p>
            <PortoList apiUrl={API_URL} />
          </div>
        </section>
      )}

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
            {t("contact_heading")}
          </h2>
          <h3 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
            {t("contact_title")}
          </h3>
          <p className="mb-8 text-zinc-400">{t("contact_desc")}</p>
          <p className="mb-4 text-center text-sm text-zinc-500">{t("contact_find")}</p>
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
              href="https://www.instagram.com/hello_rasyaproduction/"
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
              href="https://www.tiktok.com/@rasya.production"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
              aria-label="TikTok"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
              TikTok
            </a>
            <a
              href="https://www.linkedin.com/in/farras-syauqi-muharam/"
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
          <footer className="mt-12 border-t border-rasya-border pt-6 text-center">
            <p className="mb-3 text-sm text-zinc-500">{t("contact_support_intro")}</p>
            <a
              href="/support"
              className="text-sm font-medium text-rasya-accent hover:underline"
            >
              {t("contact_support_link")}
            </a>
          </footer>
        </div>
      </section>
    </>
  );
}
