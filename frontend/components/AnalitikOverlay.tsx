"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ItemDesc = { id: string; en: string };
/** Satu skill/tool — klik tombol, penjelasan muncul di bawah */
type SkillTool = { name: string; desc: ItemDesc };
type AnalitikItem = {
  name: string;
  rating?: number;
  desc: ItemDesc;
  /** Harga (mulai dari), revisi, estimasi pengerjaan */
  harga?: string;
  revisi?: string;
  estimasi?: string;
  skillsRates?: SkillTool[];
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
    { name: "WordPress", desc: { id: "Situs berbasis WordPress.", en: "WordPress-based sites." }, skillsRates: [
      { name: "PHP", desc: { id: "Bahasa pemrograman untuk tema dan plugin WordPress.", en: "Language for WordPress themes and plugins." } },
      { name: "Tema / plugin", desc: { id: "Kustomisasi tampilan dan fitur situs.", en: "Customize site look and features." } },
      { name: "Local by Flywheel", desc: { id: "Lingkungan development WordPress lokal.", en: "Local WordPress development environment." } },
    ]},
    { name: "Frontend Developer", desc: { id: "Perbaikan script, styling, responsif, integrasi API. UI siap production.", en: "Script fixes, styling, responsive, API integration. Production-ready UI." }, harga: "1,2 jt (mulai dari)", revisi: "2x revisi", estimasi: "3–5 hari kerja", skillsRates: [
      { name: "React", desc: { id: "Library untuk UI berbasis komponen dan interaktif.", en: "Library for component-based, interactive UI." } },
      { name: "VS Code", desc: { id: "Editor kode untuk menulis dan debug.", en: "Code editor for writing and debugging." } },
      { name: "Next.js", desc: { id: "Framework React dengan SSR dan routing.", en: "React framework with SSR and routing." } },
      { name: "Tailwind CSS", desc: { id: "Framework CSS utility-first untuk styling cepat.", en: "Utility-first CSS framework for fast styling." } },
      { name: "Git", desc: { id: "Version control untuk kolaborasi dan riwayat kode.", en: "Version control for collaboration and code history." } },
    ]},
    { name: "Backend Developer", desc: { id: "API, database, auth. Perbaikan bug, fitur baru, integrasi.", en: "API, database, auth. Bug fixes, new features, integration." }, harga: "1,5 jt (mulai dari)", revisi: "2x revisi", estimasi: "5–7 hari kerja", skillsRates: [
      { name: "Go", desc: { id: "Bahasa backend untuk API dan layanan performa tinggi.", en: "Backend language for APIs and high-performance services." } },
      { name: "Node.js", desc: { id: "Runtime JavaScript di server untuk API dan tooling.", en: "JavaScript runtime on server for APIs and tooling." } },
      { name: "PostgreSQL", desc: { id: "Basis data relasional untuk menyimpan data aplikasi.", en: "Relational database for application data." } },
      { name: "Postman", desc: { id: "Tool untuk uji dan dokumentasi API.", en: "Tool for testing and documenting APIs." } },
      { name: "Docker", desc: { id: "Kontainerisasi untuk environment yang konsisten.", en: "Containerization for consistent environments." } },
    ]},
    { name: "Fullstack Developer", desc: { id: "Frontend + backend satu proyek. Perbaikan, fitur baru, deploy.", en: "Frontend and backend in one project. Fixes, new features, deploy." }, harga: "2 jt (mulai dari)", revisi: "2x revisi", estimasi: "7–14 hari kerja", skillsRates: [
      { name: "React", desc: { id: "Library untuk UI berbasis komponen.", en: "Library for component-based UI." } },
      { name: "Next.js", desc: { id: "Framework React dengan SSR dan deploy mudah.", en: "React framework with SSR and easy deploy." } },
      { name: "Go / Node", desc: { id: "Backend untuk API dan logika server.", en: "Backend for API and server logic." } },
      { name: "PostgreSQL", desc: { id: "Basis data untuk aplikasi.", en: "Database for the application." } },
      { name: "Git", desc: { id: "Version control dan kolaborasi.", en: "Version control and collaboration." } },
      { name: "Vercel / Railway", desc: { id: "Platform deploy untuk web app.", en: "Deploy platform for web apps." } },
    ]},
    { name: "Mobile App (Android)", desc: { id: "Aplikasi Android. UI, logic, integrasi API, publish ke Play Store.", en: "Android apps. UI, logic, API integration, Play Store." }, skillsRates: [
      { name: "Android Studio", desc: { id: "IDE resmi untuk development aplikasi Android.", en: "Official IDE for Android app development." } },
      { name: "Kotlin / Java", desc: { id: "Bahasa pemrograman untuk logic aplikasi.", en: "Programming languages for app logic." } },
      { name: "Firebase", desc: { id: "Backend-as-a-service: auth, database, notifikasi.", en: "Backend-as-a-service: auth, database, notifications." } },
    ]},
    { name: "Mobile App (iOS)", desc: { id: "Aplikasi iPhone/iPad. UI, logic, publish ke App Store.", en: "iPhone/iPad apps. UI, logic, App Store." }, skillsRates: [
      { name: "Xcode", desc: { id: "IDE resmi untuk development aplikasi iOS.", en: "Official IDE for iOS app development." } },
      { name: "Swift / SwiftUI", desc: { id: "Bahasa dan framework UI untuk Apple.", en: "Language and UI framework for Apple." } },
      { name: "Firebase", desc: { id: "Backend-as-a-service untuk auth dan data.", en: "Backend-as-a-service for auth and data." } },
    ]},
  ],
  design: [
    { name: "Figma / UI Designer", rating: 4, desc: { id: "Mockup, wireframe, design system. Siap handoff ke dev.", en: "Mockup, wireframe, design system. Ready for dev handoff." }, harga: "400 rb (mulai dari)", revisi: "2x revisi", estimasi: "3–5 hari kerja", skillsRates: [
      { name: "Figma", desc: { id: "Tool utama untuk UI, prototype, dan design system.", en: "Main tool for UI, prototype, and design system." } },
      { name: "Adobe XD", desc: { id: "Prototype dan design antarmuka.", en: "Prototyping and interface design." } },
      { name: "Sketch", desc: { id: "Desain UI untuk Mac.", en: "UI design for Mac." } },
    ]},
    { name: "UX Designer", desc: { id: "Pengalaman pengguna: riset, alur, usability.", en: "User experience: research, flows, usability." }, skillsRates: [
      { name: "Figma", desc: { id: "Wireframe dan prototype alur pengguna.", en: "Wireframes and user flow prototypes." } },
      { name: "Miro", desc: { id: "Papan kolaborasi untuk riset dan ide.", en: "Collaboration board for research and ideas." } },
      { name: "Maze / Useberry", desc: { id: "Testing usability dan feedback pengguna.", en: "Usability testing and user feedback." } },
    ]},
    { name: "Product Designer", desc: { id: "Produk digital dari ide ke eksekusi.", en: "Digital product from idea to execution." }, skillsRates: [
      { name: "Figma", desc: { id: "Desain dan handoff ke development.", en: "Design and handoff to development." } },
      { name: "Miro", desc: { id: "Workshop dan roadmap produk.", en: "Workshops and product roadmap." } },
      { name: "Notion", desc: { id: "Dokumentasi dan spec produk.", en: "Product docs and specs." } },
      { name: "Jira", desc: { id: "Tracking fitur dan sprint.", en: "Feature and sprint tracking." } },
    ]},
    { name: "Landing Page Designer", desc: { id: "Halaman tunggal fokus konversi.", en: "Single-page conversion focus." }, skillsRates: [
      { name: "Figma", desc: { id: "Layout dan visual halaman.", en: "Page layout and visuals." } },
      { name: "Framer / Webflow", desc: { id: "No-code atau low-code landing page.", en: "No-code or low-code landing pages." } },
      { name: "React / Next.js", desc: { id: "Implementasi landing custom.", en: "Custom landing implementation." } },
    ]},
    { name: "Illustrator", desc: { id: "Ilustrasi orisinal.", en: "Original illustrations." }, skillsRates: [
      { name: "Adobe Illustrator", desc: { id: "Vektor dan ilustrasi skala bebas.", en: "Vector and scalable illustration." } },
      { name: "Procreate", desc: { id: "Ilustrasi digital di iPad.", en: "Digital illustration on iPad." } },
      { name: "Affinity Designer", desc: { id: "Alternatif vektor cross-platform.", en: "Cross-platform vector alternative." } },
    ]},
    { name: "Motion Designer", desc: { id: "Elemen visual bergerak dan animasi.", en: "Motion and animation." }, skillsRates: [
      { name: "After Effects", desc: { id: "Animasi dan motion graphics.", en: "Animation and motion graphics." } },
      { name: "Lottie", desc: { id: "Animasi ringan untuk web dan app.", en: "Lightweight animation for web and app." } },
      { name: "Rive", desc: { id: "Animasi interaktif untuk UI.", en: "Interactive animation for UI." } },
    ]},
    { name: "Editor / Proofreader", desc: { id: "Penyuntingan naskah, konsisten, bebas typo.", en: "Copy editing, consistency, typo-free." }, skillsRates: [
      { name: "Google Docs", desc: { id: "Draft dan revisi kolaboratif.", en: "Collaborative drafting and revision." } },
      { name: "Word", desc: { id: "Editing dan track changes.", en: "Editing and track changes." } },
      { name: "Grammarly", desc: { id: "Tata bahasa dan gaya tulisan.", en: "Grammar and style." } },
      { name: "Notion", desc: { id: "Dokumentasi dan style guide.", en: "Docs and style guide." } },
    ]},
  ],
  konten_kreatif: [
    { name: "Video Editor", rating: 3, desc: { id: "Editing, color grading, subtitle. Konten siap tayang.", en: "Editing, color grading, subtitle. Ready-to-publish content." }, harga: "500 rb (mulai dari)", revisi: "2x revisi", estimasi: "5–7 hari kerja", skillsRates: [
      { name: "Premiere Pro", desc: { id: "Editing timeline dan integrasi Adobe.", en: "Timeline editing and Adobe integration." } },
      { name: "DaVinci Resolve", desc: { id: "Editing dan color grading profesional.", en: "Professional editing and color grading." } },
      { name: "CapCut", desc: { id: "Editing cepat untuk konten pendek.", en: "Quick editing for short content." } },
    ]},
    { name: "Content Writer", rating: 4, desc: { id: "Tulisan untuk web, blog, media.", en: "Writing for web, blog, media." }, skillsRates: [
      { name: "Google Docs", desc: { id: "Draft dan revisi kolaboratif.", en: "Collaborative drafting and revision." } },
      { name: "Notion", desc: { id: "Outline konten dan dokumentasi.", en: "Content outline and documentation." } },
      { name: "Grammarly", desc: { id: "Tata bahasa dan gaya tulisan.", en: "Grammar and style." } },
      { name: "Canva", desc: { id: "Visual pendukung konten.", en: "Supporting visuals for content." } },
    ]},
    { name: "Copywriter", desc: { id: "Teks yang menjual dan mengajak aksi.", en: "Copy that sells and drives action." }, skillsRates: [
      { name: "Google Docs", desc: { id: "Draft dan revisi copy.", en: "Copy drafting and revision." } },
      { name: "Notion", desc: { id: "Brief dan outline kampanye.", en: "Briefs and campaign outlines." } },
      { name: "Canva", desc: { id: "Aset visual untuk iklan.", en: "Visual assets for ads." } },
    ]},
    { name: "Social Media Manager", desc: { id: "Konten dan interaksi di platform sosial.", en: "Content and engagement on social platforms." }, skillsRates: [
      { name: "Canva", desc: { id: "Desain grafis untuk feed dan story.", en: "Graphics for feed and story." } },
      { name: "Buffer / Hootsuite", desc: { id: "Jadwal posting multi-platform.", en: "Multi-platform scheduling." } },
      { name: "Meta Business Suite", desc: { id: "Jadwal dan insight Facebook & Instagram.", en: "Scheduling and insights for FB & IG." } },
    ]},
    { name: "Technical Writer", desc: { id: "Dokumentasi yang mudah dipahami.", en: "Clear documentation." }, skillsRates: [
      { name: "Markdown", desc: { id: "Format penulisan dokumentasi.", en: "Documentation writing format." } },
      { name: "Google Docs", desc: { id: "Draft dan review kolaboratif.", en: "Collaborative draft and review." } },
      { name: "Confluence", desc: { id: "Wiki dan dokumentasi tim.", en: "Team wiki and documentation." } },
      { name: "Notion", desc: { id: "Dokumentasi terstruktur.", en: "Structured documentation." } },
    ]},
    { name: "SEO Specialist", desc: { id: "Optimasi agar mudah ditemukan di mesin pencari.", en: "Optimization for search visibility." }, skillsRates: [
      { name: "Search Console", desc: { id: "Monitor performa pencarian.", en: "Monitor search performance." } },
      { name: "Ahrefs / SEMrush", desc: { id: "Riset keyword dan kompetitor.", en: "Keyword and competitor research." } },
      { name: "Google Docs", desc: { id: "Konten dan brief artikel.", en: "Content and article briefs." } },
    ]},
    { name: "Email Marketer", desc: { id: "Kampanye dan nurturance lewat email.", en: "Email campaigns and nurture." }, skillsRates: [
      { name: "Mailchimp / Brevo", desc: { id: "Kampanye email dan automasi.", en: "Email campaigns and automation." } },
      { name: "Google Sheets", desc: { id: "Data list dan segmentasi.", en: "List data and segmentation." } },
      { name: "Notion", desc: { id: "Strategi dan kalender kampanye.", en: "Strategy and campaign calendar." } },
    ]},
    { name: "Community Manager", desc: { id: "Interaksi dan keterlibatan komunitas brand.", en: "Community interaction and engagement." }, skillsRates: [
      { name: "Discord", desc: { id: "Komunitas berbasis server.", en: "Server-based community." } },
      { name: "Slack", desc: { id: "Komunikasi tim dan channel.", en: "Team and channel communication." } },
      { name: "Notion", desc: { id: "Wiki dan sumber daya komunitas.", en: "Wiki and community resources." } },
      { name: "Buffer", desc: { id: "Jadwal konten sosial.", en: "Social content scheduling." } },
    ]},
    { name: "Brand Strategist", desc: { id: "Posisi dan narasi brand.", en: "Brand position and narrative." }, skillsRates: [
      { name: "Miro", desc: { id: "Workshop dan peta posisi brand.", en: "Workshops and brand positioning maps." } },
      { name: "Notion", desc: { id: "Strategi dan dokumentasi brand.", en: "Strategy and brand documentation." } },
      { name: "Google Docs", desc: { id: "Brief dan narasi.", en: "Briefs and narrative." } },
      { name: "Canva", desc: { id: "Moodboard dan presentasi.", en: "Moodboards and presentations." } },
    ]},
    { name: "Transcriber", desc: { id: "Audio/video jadi naskah tertulis.", en: "Audio/video to written text." }, skillsRates: [
      { name: "Otter.ai", desc: { id: "Transkripsi otomatis dari audio.", en: "Automatic transcription from audio." } },
      { name: "Rev", desc: { id: "Transkripsi manusia untuk akurasi.", en: "Human transcription for accuracy." } },
      { name: "Editor teks", desc: { id: "Penyuntingan dan format naskah.", en: "Editing and formatting transcript." } },
    ]},
    { name: "Localization Specialist", desc: { id: "Adaptasi konten ke bahasa dan konteks lokal.", en: "Content adaptation to local language and context." }, skillsRates: [
      { name: "CAT tools (Crowdin, Lokalise)", desc: { id: "Terjemahan dan glossary konsisten.", en: "Translation and consistent glossaries." } },
      { name: "Google Docs", desc: { id: "Review dan konteks konten.", en: "Review and content context." } },
    ]},
    { name: "Photographer", desc: { id: "Foto untuk konten atau branding.", en: "Photos for content or branding." }, skillsRates: [
      { name: "Kamera DSLR / mirrorless", desc: { id: "Pengambilan gambar berkualitas.", en: "High-quality image capture." } },
      { name: "Lightroom", desc: { id: "Edit dan katalog foto.", en: "Photo editing and catalog." } },
      { name: "Capture One", desc: { id: "Editing RAW dan tethered.", en: "RAW editing and tethered shooting." } },
    ]},
    { name: "Videographer", desc: { id: "Pengambilan footage untuk iklan atau konten.", en: "Footage capture for ads or content." }, skillsRates: [
      { name: "Kamera", desc: { id: "Pengambilan video di lapangan.", en: "On-location video capture." } },
      { name: "Gimbal", desc: { id: "Stabilisasi gambar bergerak.", en: "Stabilization for moving shots." } },
      { name: "Premiere / DaVinci", desc: { id: "Editing pasca produksi.", en: "Post-production editing." } },
    ]},
  ],
  lain_lain: [
    { name: "Data Analyst", desc: { id: "Pengolahan dan penyajian data untuk keputusan bisnis.", en: "Data processing and presentation for business decisions." }, skillsRates: [
      { name: "Google Sheets", desc: { id: "Spreadsheet dan analisis dasar.", en: "Spreadsheets and basic analysis." } },
      { name: "Excel", desc: { id: "Analisis data dan pivot.", en: "Data analysis and pivots." } },
      { name: "SQL", desc: { id: "Query dan ekstraksi data dari database.", en: "Query and data extraction from databases." } },
      { name: "Python (pandas)", desc: { id: "Pengolahan dan analisis data.", en: "Data processing and analysis." } },
      { name: "Looker / Tableau", desc: { id: "Visualisasi dan dashboard data.", en: "Data visualization and dashboards." } },
    ]},
    { name: "Project Manager Digital", desc: { id: "Koordinasi proyek digital dari planning ke delivery.", en: "Digital project coordination from planning to delivery." }, skillsRates: [
      { name: "Jira", desc: { id: "Issue tracking dan sprint.", en: "Issue tracking and sprints." } },
      { name: "Trello", desc: { id: "Board dan kartu task.", en: "Board and task cards." } },
      { name: "Notion", desc: { id: "Wiki, roadmap, dan dokumentasi.", en: "Wiki, roadmap, and documentation." } },
      { name: "Google Calendar", desc: { id: "Jadwal dan meeting.", en: "Scheduling and meetings." } },
      { name: "Slack", desc: { id: "Komunikasi tim dan integrasi.", en: "Team communication and integrations." } },
    ]},
    { name: "Virtual Assistant", desc: { id: "Dukungan administratif dan operasional daring.", en: "Remote admin and operations support." }, skillsRates: [
      { name: "Google Workspace", desc: { id: "Email, dokumen, dan drive.", en: "Email, docs, and drive." } },
      { name: "Calendly", desc: { id: "Penjadwalan janji temu.", en: "Appointment scheduling." } },
      { name: "Notion", desc: { id: "Task dan dokumentasi.", en: "Tasks and documentation." } },
      { name: "Slack", desc: { id: "Komunikasi dan koordinasi.", en: "Communication and coordination." } },
    ]},
  ],
};

type ViewStep = "categories" | "items";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Item dari API (nama + penjelasan saja) */
type ApiAnalitikItem = { name: string; desc: string };

export default function AnalitikOverlay({ open, onClose }: Props) {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<ViewStep>("categories");
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORY_IDS)[number] | null>(null);
  const [selectedItem, setSelectedItem] = useState<AnalitikItem | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillTool | null>(null);
  const [layer2Open, setLayer2Open] = useState(false);
  const [apiItemsByCategory, setApiItemsByCategory] = useState<Record<string, ApiAnalitikItem[]>>({});

  const fetchAnalitik = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/analitik`);
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data.items && typeof data.items === "object") {
        setApiItemsByCategory(data.items);
      } else {
        setApiItemsByCategory({});
      }
    } catch {
      setApiItemsByCategory({});
    }
  }, []);

  useEffect(() => {
    if (open) fetchAnalitik();
  }, [open, fetchAnalitik]);

  // Gabung: kalau ada data dari API untuk kategori ini, pakai (nama + penjelasan); else pakai data statis.
  const itemsForCategory = (cat: (typeof CATEGORY_IDS)[number]): AnalitikItem[] => {
    const apiList = apiItemsByCategory[cat];
    if (apiList?.length) {
      return apiList.map((x) => ({
        name: x.name,
        desc: { id: x.desc, en: x.desc },
      }));
    }
    return ANALITIK_DATA[cat] ?? [];
  };

  useEffect(() => {
    if (!open) {
      setStep("categories");
      setSelectedCategory(null);
      setSelectedItem(null);
      setSelectedSkill(null);
      setLayer2Open(false);
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedSkill) setSelectedSkill(null);
        else if (selectedItem) setSelectedItem(null);
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
  }, [open, step, selectedItem, selectedSkill, onClose]);

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
          </h2>
          <div className="flex items-center gap-1">
            {step !== "categories" && (
              <button
                type="button"
                onClick={() => {
                  if (selectedSkill) setSelectedSkill(null);
                  else if (selectedItem) setSelectedItem(null);
                  else {
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

          {/* Step 2: Item buttons → klik tampil penjelasan + harga/revisi/estimasi di bawah; Skills & tools juga tombol klik */}
          {step === "items" && selectedCategory && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                {isEn ? "Click an item to see description, price, revisions & turnaround below." : "Klik salah satu untuk melihat penjelasan, harga, revisi & estimasi di bawah."}
              </p>
              <div className="flex flex-wrap gap-2">
                {itemsForCategory(selectedCategory).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setSelectedItem(selectedItem?.name === item.name ? null : item);
                      setSelectedSkill(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedItem?.name === item.name
                        ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                        : "border-rasya-border bg-rasya-dark/60 text-zinc-300 hover:border-rasya-accent/50 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {selectedItem && (
                <div className="rounded-xl border border-rasya-border bg-rasya-dark/50 p-4 space-y-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {isEn ? selectedItem.desc.en : selectedItem.desc.id}
                  </p>
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    {selectedItem.harga != null && selectedItem.harga !== "" && (
                      <div>
                        <dt className="text-xs text-zinc-500">{isEn ? "Price (from)" : "Harga (mulai dari)"}</dt>
                        <dd className="font-medium text-rasya-accent">{selectedItem.harga}</dd>
                      </div>
                    )}
                    {selectedItem.revisi != null && selectedItem.revisi !== "" && (
                      <div>
                        <dt className="text-xs text-zinc-500">{isEn ? "Revisions" : "Revisi"}</dt>
                        <dd className="text-zinc-300">{selectedItem.revisi}</dd>
                      </div>
                    )}
                    {selectedItem.estimasi != null && selectedItem.estimasi !== "" && (
                      <div>
                        <dt className="text-xs text-zinc-500">{isEn ? "Turnaround" : "Estimasi pengerjaan"}</dt>
                        <dd className="text-zinc-300 font-medium">{selectedItem.estimasi}</dd>
                      </div>
                    )}
                  </dl>

                  {selectedItem.skillsRates && selectedItem.skillsRates.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-rasya-accent mb-2">
                        {isEn ? "Skills & tools (click to see description)" : "Skills & tools (klik untuk penjelasan)"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.skillsRates.map((skill, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSkill(selectedSkill?.name === skill.name ? null : skill)}
                            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                              selectedSkill?.name === skill.name
                                ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                                : "border-rasya-border bg-rasya-dark/60 text-zinc-400 hover:border-rasya-accent/50 hover:text-white"
                            }`}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                      {selectedSkill && (
                        <p className="mt-2 text-xs text-zinc-400 leading-snug pl-1 border-l-2 border-rasya-accent/50">
                          {isEn ? selectedSkill.desc.en : selectedSkill.desc.id}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
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
