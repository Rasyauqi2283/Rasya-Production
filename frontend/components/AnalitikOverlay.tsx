"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type ItemDesc = { id: string; en: string };
type AnalitikItem = {
  name: string;
  rating?: number;
  desc: ItemDesc;
  /** Rating tools/skills untuk tampilan explain, mis. "React 4/5, VS Code, Next.js 4/5" */
  skillsRates?: ItemDesc;
};

const CATEGORY_IDS = ["web_digital", "design", "konten_kreatif", "lain_lain"] as const;
const CATEGORY_LABEL_KEYS: Record<(typeof CATEGORY_IDS)[number], string> = {
  web_digital: "tag_web",
  design: "tag_design",
  konten_kreatif: "tag_konten",
  lain_lain: "tag_lain",
};

const ANALITIK_DATA: Record<(typeof CATEGORY_IDS)[number], AnalitikItem[]> = {
  web_digital: [
    { name: "Go (Golang)", rating: 4, desc: { id: "Bahasa pemrograman backend, API, dan layanan performa tinggi.", en: "Backend language for APIs and high-performance services." }, skillsRates: { id: "Go 4/5, VS Code, PostgreSQL, Docker.", en: "Go 4/5, VS Code, PostgreSQL, Docker." } },
    { name: "Next.js", rating: 4, desc: { id: "Framework React dengan SSR, routing, dan optimasi production.", en: "React framework with SSR, routing, and production optimizations." }, skillsRates: { id: "Next.js 4/5, React, VS Code, Vercel.", en: "Next.js 4/5, React, VS Code, Vercel." } },
    { name: "React", rating: 4, desc: { id: "Library JavaScript untuk UI interaktif berbasis komponen.", en: "JavaScript library for interactive, component-based UIs." }, skillsRates: { id: "React 4/5, TypeScript, VS Code, npm.", en: "React 4/5, TypeScript, VS Code, npm." } },
    { name: "TypeScript", rating: 4, desc: { id: "JavaScript dengan tipe statis. Memudahkan maintain dan mengurangi error.", en: "JavaScript with static types. Improves maintainability." }, skillsRates: { id: "TypeScript 4/5, VS Code.", en: "TypeScript 4/5, VS Code." } },
    { name: "PostgreSQL", rating: 4, desc: { id: "Basis data relasional open-source.", en: "Open-source relational database." }, skillsRates: { id: "PostgreSQL 4/5, SQL.", en: "PostgreSQL 4/5, SQL." } },
    { name: "Node.js", rating: 3, desc: { id: "Runtime JavaScript di sisi server.", en: "JavaScript runtime on the server." }, skillsRates: { id: "Node.js 3/5, npm, VS Code.", en: "Node.js 3/5, npm, VS Code." } },
    { name: "WordPress", desc: { id: "Situs berbasis WordPress.", en: "WordPress-based sites." }, skillsRates: { id: "PHP, tema/plugin, Local by Flywheel.", en: "PHP, themes/plugins, Local." } },
    { name: "Frontend Developer", desc: { id: "Tampilan dan interaksi di browser. Markup, styling, responsif.", en: "Browser UI and interaction. Markup, styling, responsive." }, skillsRates: { id: "React 4/5, VS Code, Next.js 4/5, Tailwind CSS, Git.", en: "React 4/5, VS Code, Next.js 4/5, Tailwind CSS, Git." } },
    { name: "Backend Developer", desc: { id: "Server, API, dan logika aplikasi. REST API, database, auth.", en: "Server, API, and app logic. REST API, database, auth." }, skillsRates: { id: "Go 4/5, Node.js 3/5, PostgreSQL, Postman, Docker.", en: "Go 4/5, Node.js 3/5, PostgreSQL, Postman, Docker." } },
    { name: "Fullstack Developer", desc: { id: "Frontend + backend dalam satu proyek. Dari awal sampai deploy.", en: "Frontend and backend in one project. From start to deploy." }, skillsRates: { id: "React 4/5, Next.js 4/5, Go/Node, PostgreSQL, Git, Vercel/Railway.", en: "React 4/5, Next.js 4/5, Go/Node, PostgreSQL, Git, Vercel/Railway." } },
    { name: "Mobile App (Android)", desc: { id: "Aplikasi Android. UI, logic, integrasi API, publish ke Play Store.", en: "Android apps. UI, logic, API integration, Play Store." }, skillsRates: { id: "Android Studio, Kotlin/Java, Firebase 4/5.", en: "Android Studio, Kotlin/Java, Firebase 4/5." } },
    { name: "Mobile App (iOS)", desc: { id: "Aplikasi iPhone/iPad. UI, logic, publish ke App Store.", en: "iPhone/iPad apps. UI, logic, App Store." }, skillsRates: { id: "Xcode, Swift/SwiftUI, Firebase 4/5.", en: "Xcode, Swift/SwiftUI, Firebase 4/5." } },
  ],
  design: [
    { name: "Figma / UI Designer", rating: 4, desc: { id: "Desain antarmuka dan prototyping.", en: "Interface design and prototyping." }, skillsRates: { id: "Figma 4/5, Adobe XD, Sketch.", en: "Figma 4/5, Adobe XD, Sketch." } },
    { name: "UX Designer", desc: { id: "Pengalaman pengguna: riset, alur, usability.", en: "User experience: research, flows, usability." }, skillsRates: { id: "Figma 4/5, Miro, Maze/Useberry.", en: "Figma 4/5, Miro, Maze/Useberry." } },
    { name: "Product Designer", desc: { id: "Produk digital dari ide ke eksekusi.", en: "Digital product from idea to execution." }, skillsRates: { id: "Figma 4/5, Miro, Notion, Jira.", en: "Figma 4/5, Miro, Notion, Jira." } },
    { name: "Landing Page Designer", desc: { id: "Halaman tunggal fokus konversi.", en: "Single-page conversion focus." }, skillsRates: { id: "Figma 4/5, Framer/Webflow, React/Next.js.", en: "Figma 4/5, Framer/Webflow, React/Next.js." } },
    { name: "Illustrator", desc: { id: "Ilustrasi orisinal.", en: "Original illustrations." }, skillsRates: { id: "Adobe Illustrator 4/5, Procreate, Affinity Designer.", en: "Adobe Illustrator 4/5, Procreate, Affinity Designer." } },
    { name: "Motion Designer", desc: { id: "Elemen visual bergerak dan animasi.", en: "Motion and animation." }, skillsRates: { id: "After Effects 4/5, Lottie, Rive.", en: "After Effects 4/5, Lottie, Rive." } },
    { name: "Editor / Proofreader", desc: { id: "Penyuntingan naskah, konsisten, bebas typo.", en: "Copy editing, consistency, typo-free." }, skillsRates: { id: "Google Docs, Word, Grammarly, Notion.", en: "Google Docs, Word, Grammarly, Notion." } },
  ],
  konten_kreatif: [
    { name: "Video Editor", rating: 3, desc: { id: "Footage jadi konten siap tayang.", en: "Footage to ready-to-publish content." }, skillsRates: { id: "Premiere Pro 3/5, DaVinci Resolve, CapCut.", en: "Premiere Pro 3/5, DaVinci Resolve, CapCut." } },
    { name: "Content Writer", rating: 4, desc: { id: "Tulisan untuk web, blog, media.", en: "Writing for web, blog, media." }, skillsRates: { id: "Google Docs, Notion 4/5, Grammarly, Canva.", en: "Google Docs, Notion 4/5, Grammarly, Canva." } },
    { name: "Copywriter", desc: { id: "Teks yang menjual dan mengajak aksi.", en: "Copy that sells and drives action." }, skillsRates: { id: "Google Docs, Notion, Canva.", en: "Google Docs, Notion, Canva." } },
    { name: "Social Media Manager", desc: { id: "Konten dan interaksi di platform sosial.", en: "Content and engagement on social platforms." }, skillsRates: { id: "Canva, Buffer/Hootsuite, Meta Business Suite.", en: "Canva, Buffer/Hootsuite, Meta Business Suite." } },
    { name: "Technical Writer", desc: { id: "Dokumentasi yang mudah dipahami.", en: "Clear documentation." }, skillsRates: { id: "Markdown, Google Docs, Confluence, Notion.", en: "Markdown, Google Docs, Confluence, Notion." } },
    { name: "SEO Specialist", desc: { id: "Optimasi agar mudah ditemukan di mesin pencari.", en: "Optimization for search visibility." }, skillsRates: { id: "Search Console, Ahrefs/SEMrush, Google Docs.", en: "Search Console, Ahrefs/SEMrush, Google Docs." } },
    { name: "Email Marketer", desc: { id: "Kampanye dan nurturance lewat email.", en: "Email campaigns and nurture." }, skillsRates: { id: "Mailchimp/Brevo, Google Sheets, Notion.", en: "Mailchimp/Brevo, Google Sheets, Notion." } },
    { name: "Community Manager", desc: { id: "Interaksi dan keterlibatan komunitas brand.", en: "Community interaction and engagement." }, skillsRates: { id: "Discord, Slack, Notion, Buffer.", en: "Discord, Slack, Notion, Buffer." } },
    { name: "Brand Strategist", desc: { id: "Posisi dan narasi brand.", en: "Brand position and narrative." }, skillsRates: { id: "Miro, Notion, Google Docs, Canva.", en: "Miro, Notion, Google Docs, Canva." } },
    { name: "Transcriber", desc: { id: "Audio/video jadi naskah tertulis.", en: "Audio/video to written text." }, skillsRates: { id: "Otter.ai, Rev, editor teks.", en: "Otter.ai, Rev, text editor." } },
    { name: "Localization Specialist", desc: { id: "Adaptasi konten ke bahasa dan konteks lokal.", en: "Content adaptation to local language and context." }, skillsRates: { id: "CAT tools (Crowdin, Lokalise), Google Docs.", en: "CAT tools, glossaries, Google Docs." } },
    { name: "Photographer", desc: { id: "Foto untuk konten atau branding.", en: "Photos for content or branding." }, skillsRates: { id: "Kamera DSLR/mirrorless, Lightroom, Capture One.", en: "DSLR/mirrorless, Lightroom, Capture One." } },
    { name: "Videographer", desc: { id: "Pengambilan footage untuk iklan atau konten.", en: "Footage capture for ads or content." }, skillsRates: { id: "Kamera, gimbal, Premiere/DaVinci.", en: "Camera, gimbal, Premiere/DaVinci." } },
  ],
  lain_lain: [
    { name: "Data Analyst", desc: { id: "Pengolahan dan penyajian data untuk keputusan bisnis.", en: "Data processing and presentation for business decisions." }, skillsRates: { id: "Google Sheets, Excel, SQL 4/5, Python (pandas), Looker/Tableau.", en: "Google Sheets, Excel, SQL 4/5, Python, Looker/Tableau." } },
    { name: "Project Manager Digital", desc: { id: "Koordinasi proyek digital dari planning ke delivery.", en: "Digital project coordination from planning to delivery." }, skillsRates: { id: "Jira, Trello, Notion 4/5, Google Calendar, Slack.", en: "Jira, Trello, Notion 4/5, Google Calendar, Slack." } },
    { name: "Virtual Assistant", desc: { id: "Dukungan administratif dan operasional daring.", en: "Remote admin and operations support." }, skillsRates: { id: "Google Workspace, Calendly, Notion, Slack.", en: "Google Workspace, Calendly, Notion, Slack." } },
  ],
};

type ViewStep = "categories" | "items" | "explain";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AnalitikOverlay({ open, onClose }: Props) {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<ViewStep>("categories");
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORY_IDS)[number] | null>(null);
  const [selectedItem, setSelectedItem] = useState<AnalitikItem | null>(null);
  const [layer2Open, setLayer2Open] = useState(false); // softskill layer

  useEffect(() => {
    if (!open) {
      setStep("categories");
      setSelectedCategory(null);
      setSelectedItem(null);
      setLayer2Open(false);
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step === "explain") setStep("items");
        else if (step === "items") setStep("categories");
        else onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, step, onClose]);

  if (!open) return null;

  const isEn = lang === "en";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analitik-overlay-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 flex w-full max-w-lg flex-col rounded-2xl border border-rasya-border bg-rasya-card shadow-xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-rasya-border px-4 py-3">
          <h2 id="analitik-overlay-title" className="font-display text-lg font-semibold text-white">
            {step === "categories" && t("analitik_layer1_title")}
            {step === "items" && t(selectedCategory ? CATEGORY_LABEL_KEYS[selectedCategory] : "analitik_layer1_title")}
            {step === "explain" && selectedItem?.name}
          </h2>
          <div className="flex items-center gap-1">
            {step !== "categories" && (
              <button
                type="button"
                onClick={() => {
                  if (step === "explain") {
                    setSelectedItem(null);
                    setStep("items");
                  } else {
                    setSelectedCategory(null);
                    setStep("categories");
                  }
                }}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-rasya-border hover:text-white"
                aria-label={t("analitik_back")}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Step 1: 4 category buttons (small form) */}
          {step === "categories" && (
            <>
              <p className="mb-6 text-sm text-zinc-400">{t("analitik_layer1_desc")}</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_IDS.map((catId) => (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(catId);
                      setStep("items");
                    }}
                    className="rounded-xl border border-rasya-border bg-rasya-dark/40 px-4 py-4 text-center text-sm font-medium text-zinc-200 transition hover:border-rasya-accent/50 hover:bg-rasya-accent/10 hover:text-white"
                  >
                    {t(CATEGORY_LABEL_KEYS[catId])}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLayer2Open(true)}
                  className="rounded-lg bg-rasya-accent px-4 py-2 text-sm font-medium text-rasya-dark transition hover:opacity-90"
                >
                  {t("analitik_next")}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Items in selected category */}
          {step === "items" && selectedCategory && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                {isEn ? "Choose one to see details and skill/tool ratings." : "Pilih satu untuk melihat penjelasan dan rating tools."}
              </p>
              <div className="flex flex-wrap gap-2">
                {ANALITIK_DATA[selectedCategory].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setStep("explain");
                    }}
                    className="rounded-lg border border-rasya-border bg-rasya-dark/60 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-rasya-accent/50 hover:text-white"
                  >
                    {item.name}
                    {item.rating != null && <span className="ml-1 text-rasya-accent">{item.rating}/5</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Explain — judul + skillsRates (rating tools) + desc */}
          {step === "explain" && selectedItem && (
            <div className="space-y-4">
              {selectedItem.skillsRates && (
                <div className="rounded-lg border border-rasya-accent/30 bg-rasya-accent/10 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-rasya-accent">
                    {isEn ? "Skills & tools" : "Skills & tools"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {isEn ? selectedItem.skillsRates.en : selectedItem.skillsRates.id}
                  </p>
                </div>
              )}
              <p className="text-sm text-zinc-400 leading-relaxed">
                {isEn ? selectedItem.desc.en : selectedItem.desc.id}
              </p>
              <button
                type="button"
                onClick={() => setStep("items")}
                className="text-xs font-medium text-rasya-accent hover:underline"
              >
                {t("analitik_back")} ← {selectedCategory ? t(CATEGORY_LABEL_KEYS[selectedCategory]) : ""}
              </button>
            </div>
          )}

          {/* Softskill teks (dari tombol Lanjut di step categories) */}
          {step === "categories" && layer2Open && (
            <div className="mt-6 rounded-lg border border-rasya-accent/20 bg-rasya-accent/5 p-4">
              <p className="text-sm font-medium text-rasya-accent mb-2">{t("analitik_layer2_title")}</p>
              <p className="text-zinc-300 leading-relaxed">{t("analitik_layer2_text")}</p>
              <button
                type="button"
                onClick={() => setLayer2Open(false)}
                className="mt-3 text-xs font-medium text-rasya-accent hover:underline"
              >
                {t("analitik_close_desc")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
