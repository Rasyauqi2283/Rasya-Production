"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

type ItemDesc = { id: string; en: string };
type AnalitikItem = { name: string; rating?: number; desc: ItemDesc };

const CATEGORY_IDS = ["web_digital", "design", "konten_kreatif", "lain_lain"] as const;
const CATEGORY_LABEL_KEYS: Record<(typeof CATEGORY_IDS)[number], string> = {
  web_digital: "tag_web",
  design: "tag_design",
  konten_kreatif: "tag_konten",
  lain_lain: "tag_lain",
};

// Isi per kategori dari LAYANAN-TOOLS.md + penjelasan singkat. Klik item untuk tampilkan desc.
const ANALITIK_DATA: Record<(typeof CATEGORY_IDS)[number], AnalitikItem[]> = {
  web_digital: [
    { name: "Go (Golang)", rating: 4, desc: { id: "Bahasa pemrograman backend, API, dan layanan performa tinggi. Tools: server, microservice, tooling.", en: "Backend language for APIs and high-performance services. Used for servers, microservices, and tooling." } },
    { name: "Next.js", rating: 4, desc: { id: "Framework React dengan SSR, routing, dan optimasi production. Tools: VS Code, Vercel. Untuk website dan web app modern.", en: "React framework with SSR, routing, and production optimizations. Tools: VS Code, Vercel. For modern sites and web apps." } },
    { name: "React", rating: 4, desc: { id: "Library JavaScript untuk UI interaktif berbasis komponen. Tools: VS Code, npm. Untuk single-page app dan antarmuka dinamis.", en: "JavaScript library for interactive, component-based UIs. Tools: VS Code, npm. For single-page apps and dynamic interfaces." } },
    { name: "TypeScript", rating: 4, desc: { id: "JavaScript dengan tipe statis. Memudahkan maintain dan mengurangi error. Dipakai di hampir semua stack modern.", en: "JavaScript with static types. Improves maintainability and reduces errors. Used across modern stacks." } },
    { name: "PostgreSQL", rating: 4, desc: { id: "Basis data relasional open-source. Untuk menyimpan dan mengolah data aplikasi, transaksi andal, query kompleks.", en: "Open-source relational database. For storing and querying application data with reliable transactions." } },
    { name: "Node.js", rating: 3, desc: { id: "Runtime JavaScript di server. Tools: VS Code, npm. Untuk API, tooling, dan backend aplikasi.", en: "JavaScript runtime on the server. Tools: VS Code, npm. For APIs, tooling, and backend applications." } },
    { name: "WordPress", desc: { id: "Situs berbasis WordPress. Tools: PHP, tema/plugin, Local by Flywheel. Setup tema, custom layout, integrasi konten.", en: "WordPress-based sites. Tools: PHP, themes/plugins, Local. Theme setup, custom layout, content integration." } },
    { name: "Frontend Developer", desc: { id: "Tampilan dan interaksi di browser. Tools: VS Code, React/Vue/Next.js, Tailwind CSS, Git. Markup, styling, responsif.", en: "Browser UI and interaction. Tools: VS Code, React/Vue/Next.js, Tailwind, Git. Markup, styling, responsive." } },
    { name: "Backend Developer", desc: { id: "Server, API, dan logika aplikasi. Tools: VS Code, Go/Node/Python, PostgreSQL, Postman, Docker. REST API, database, auth.", en: "Server, API, and app logic. Tools: VS Code, Go/Node/Python, PostgreSQL, Postman, Docker. REST API, database, auth." } },
    { name: "Fullstack Developer", desc: { id: "Frontend + backend dalam satu proyek. Tools: VS Code, React/Next.js, Go/Node, PostgreSQL, Git, Vercel/Railway. Dari awal sampai deploy.", en: "Frontend and backend in one project. Tools: VS Code, React/Next, Go/Node, PostgreSQL, Git, Vercel/Railway. From start to deploy." } },
    { name: "Mobile App (Android)", desc: { id: "Aplikasi Android. Tools: Android Studio, Kotlin/Java, Firebase, Play Console. UI, logic, integrasi API, publish ke Play Store.", en: "Android apps. Tools: Android Studio, Kotlin/Java, Firebase, Play Console. UI, logic, API integration, publish to Play Store." } },
    { name: "Mobile App (iOS)", desc: { id: "Aplikasi iPhone/iPad. Tools: Xcode, Swift/SwiftUI, Firebase, App Store Connect. UI, logic, publish ke App Store.", en: "iPhone/iPad apps. Tools: Xcode, Swift/SwiftUI, Firebase, App Store Connect. UI, logic, publish to App Store." } },
  ],
  design: [
    { name: "Figma / UI Designer", rating: 4, desc: { id: "Desain antarmuka dan prototyping. Tools: Figma, Adobe XD, Sketch. Wireframe, mockup, design system untuk web dan app.", en: "Interface design and prototyping. Tools: Figma, Adobe XD, Sketch. Wireframes, mockups, design systems for web and app." } },
    { name: "UX Designer", desc: { id: "Pengalaman pengguna: riset, alur, usability. Tools: Figma, Miro, Maze/Useberry. User flow, wireframe, usability testing.", en: "User experience: research, flows, usability. Tools: Figma, Miro, Maze/Useberry. User flow, wireframes, usability testing." } },
    { name: "Product Designer", desc: { id: "Produk digital dari ide ke eksekusi. Tools: Figma, Miro, Notion, Jira. Discovery, konsep fitur, koordinasi dengan dev.", en: "Digital product from idea to execution. Tools: Figma, Miro, Notion, Jira. Discovery, feature concept, coordination with dev." } },
    { name: "Landing Page Designer", desc: { id: "Halaman tunggal fokus konversi. Tools: Figma, Framer/Webflow atau React/Next.js. Layout, CTA, visual untuk kampanye atau produk.", en: "Single-page conversion focus. Tools: Figma, Framer/Webflow or React/Next.js. Layout, CTA, visuals for campaigns or products." } },
    { name: "Illustrator", desc: { id: "Ilustrasi orisinal. Tools: Adobe Illustrator, Procreate, Affinity Designer. Karakter, ikon, infografis, artwork digital atau cetak.", en: "Original illustrations. Tools: Adobe Illustrator, Procreate, Affinity Designer. Characters, icons, infographics, digital or print." } },
    { name: "Motion Designer", desc: { id: "Elemen visual bergerak dan animasi. Tools: Adobe After Effects, Lottie, Rive. Motion graphic, kinetic typography untuk video atau web.", en: "Motion and animation. Tools: Adobe After Effects, Lottie, Rive. Motion graphics, kinetic typography for video or web." } },
    { name: "Editor / Proofreader", desc: { id: "Penyuntingan naskah, konsisten, bebas typo. Tools: Google Docs, Word, Grammarly, Notion. Bahasa Indonesia/Inggris, penyeragaman istilah.", en: "Copy editing, consistency, typo-free. Tools: Google Docs, Word, Grammarly, Notion. Indonesian/English, terminology." } },
  ],
  konten_kreatif: [
    { name: "Video Editor", rating: 3, desc: { id: "Footage jadi konten siap tayang. Tools: Adobe Premiere Pro, DaVinci Resolve, CapCut. Cutting, color grading, subtitle, packaging untuk sosmed/YouTube.", en: "Footage to ready-to-publish content. Tools: Premiere Pro, DaVinci Resolve, CapCut. Cutting, color grading, subtitles, packaging." } },
    { name: "Content Writer", rating: 4, desc: { id: "Tulisan untuk web, blog, media. Tools: Google Docs, Notion, Grammarly, Canva. Artikel, copy landing, script video, konten selaras brand dan SEO.", en: "Writing for web, blog, media. Tools: Google Docs, Notion, Grammarly, Canva. Articles, landing copy, video scripts, brand and SEO." } },
    { name: "Copywriter", desc: { id: "Teks yang menjual dan mengajak aksi. Tools: Google Docs, Notion, Canva. Headline, CTA, deskripsi produk, kampanye iklan.", en: "Copy that sells and drives action. Tools: Google Docs, Notion, Canva. Headlines, CTAs, product descriptions, ad campaigns." } },
    { name: "Social Media Manager", desc: { id: "Konten dan interaksi di platform sosial. Tools: Canva, Buffer/Hootsuite/Later, Meta Business Suite, Google Docs. Jadwal konten, caption, planning.", en: "Content and engagement on social platforms. Tools: Canva, Buffer/Hootsuite/Later, Meta Business Suite. Content schedule, captions, planning." } },
    { name: "Technical Writer", desc: { id: "Dokumentasi yang mudah dipahami. Tools: Markdown, Google Docs, Confluence, Notion. User guide, dokumentasi API, artikel how-to.", en: "Clear documentation. Tools: Markdown, Google Docs, Confluence, Notion. User guides, API docs, how-to articles." } },
    { name: "SEO Specialist", desc: { id: "Optimasi agar mudah ditemukan di mesin pencari. Tools: Google Search Console, Ahrefs/SEMrush/Ubersuggest, Google Docs, Notion. Riset kata kunci, on-page, rekomendasi konten.", en: "Optimization for search visibility. Tools: Search Console, Ahrefs/SEMrush, Google Docs, Notion. Keyword research, on-page, content recommendations." } },
    { name: "Email Marketer", desc: { id: "Kampanye dan nurturance lewat email. Tools: Mailchimp/Brevo/Sendinblue, Google Sheets, Notion. Copy email, segmentasi, drip, newsletter.", en: "Email campaigns and nurture. Tools: Mailchimp/Brevo/Sendinblue, Google Sheets, Notion. Copy, segmentation, drip, newsletter." } },
    { name: "Community Manager", desc: { id: "Interaksi dan keterlibatan komunitas brand. Tools: Discord, Slack, Notion, Buffer/Hootsuite. Moderasi, jadwal konten, engagement.", en: "Community interaction and engagement. Tools: Discord, Slack, Notion, Buffer/Hootsuite. Moderation, content schedule, engagement." } },
    { name: "Brand Strategist", desc: { id: "Posisi dan narasi brand. Tools: Miro, Notion, Google Docs, Canva. Positioning, tone of voice, panduan brand.", en: "Brand position and narrative. Tools: Miro, Notion, Google Docs, Canva. Positioning, tone of voice, brand guidelines." } },
    { name: "Transcriber", desc: { id: "Audio/video jadi naskah tertulis. Tools: Otter.ai, Rev, atau editor teks. Transkripsi wawancara, podcast, meeting.", en: "Audio/video to written text. Tools: Otter.ai, Rev, or text editor. Transcription for interviews, podcasts, meetings." } },
    { name: "Localization Specialist", desc: { id: "Adaptasi konten ke bahasa dan konteks lokal. Tools: CAT tools (Crowdin, Lokalise), glossaries, Google Docs. Terjemahan, adaptasi budaya.", en: "Content adaptation to local language and context. Tools: CAT tools, glossaries, Google Docs. Translation, cultural adaptation." } },
    { name: "Photographer", desc: { id: "Foto untuk konten atau branding. Tools: Kamera DSLR/mirrorless, Adobe Lightroom, Capture One. Foto produk, dokumentasi event, konten visual.", en: "Photos for content or branding. Tools: DSLR/mirrorless camera, Lightroom, Capture One. Product shots, event docs, visual content." } },
    { name: "Videographer", desc: { id: "Pengambilan footage untuk iklan atau konten. Tools: Kamera, gimbal, Adobe Premiere/DaVinci. Shooting, angle, koordinasi dengan editor.", en: "Footage capture for ads or content. Tools: Camera, gimbal, Premiere/DaVinci. Shooting, angles, coordination with editor." } },
  ],
  lain_lain: [
    { name: "Data Analyst", desc: { id: "Pengolahan dan penyajian data untuk keputusan bisnis. Tools: Google Sheets, Excel, SQL, Python (pandas), Looker Studio/Tableau/Power BI. Visualisasi, laporan.", en: "Data processing and presentation for business decisions. Tools: Google Sheets, Excel, SQL, Python, Looker/Tableau/Power BI. Visualization, reports." } },
    { name: "Project Manager Digital", desc: { id: "Koordinasi proyek digital dari planning ke delivery. Tools: Jira, Trello, Notion, Google Calendar, Slack. Jadwal, task tracking, komunikasi tim.", en: "Digital project coordination from planning to delivery. Tools: Jira, Trello, Notion, Google Calendar, Slack. Schedule, task tracking, team communication." } },
    { name: "Virtual Assistant", desc: { id: "Dukungan administratif dan operasional daring. Tools: Google Workspace, Calendly, Notion, Slack/Email. Jadwal, email, riset, tugas rutin.", en: "Remote admin and operations support. Tools: Google Workspace, Calendly, Notion, Slack/Email. Schedule, email, research, routine tasks." } },
  ],
};

// Build flat map name -> desc for selected item (names are unique across categories)
function getAllDescriptions(): Record<string, ItemDesc> {
  const out: Record<string, ItemDesc> = {};
  for (const cat of CATEGORY_IDS) {
    for (const item of ANALITIK_DATA[cat]) {
      out[item.name] = item.desc;
    }
  }
  return out;
}
const ALL_DESCRIPTIONS = getAllDescriptions();

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AnalitikOverlay({ open, onClose }: Props) {
  const { t, lang } = useLanguage();
  const [layer, setLayer] = useState<1 | 2>(1);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLayer(1);
      setSelectedItem(null);
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="analitik-overlay-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full max-w-4xl flex-col rounded-2xl border border-rasya-border bg-rasya-card shadow-xl max-h-[90vh] overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-rasya-border px-4 py-3">
          <h2
            id="analitik-overlay-title"
            className="font-display text-lg font-semibold text-white"
          >
            {layer === 1 ? t("analitik_layer1_title") : t("analitik_layer2_title")}
          </h2>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {layer === 1 ? (
            <>
              <p className="mb-4 text-sm text-zinc-400">
                {t("analitik_layer1_desc")}
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CATEGORY_IDS.map((catId) => (
                  <div
                    key={catId}
                    className="rounded-xl border border-rasya-border bg-rasya-dark/40 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rasya-accent">
                      {t(CATEGORY_LABEL_KEYS[catId])}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ANALITIK_DATA[catId].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() =>
                            setSelectedItem(selectedItem === item.name ? null : item.name)
                          }
                          className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                            selectedItem === item.name
                              ? "border-rasya-accent bg-rasya-accent/10 text-white"
                              : "border-rasya-border bg-rasya-dark/60 text-zinc-300 hover:border-rasya-accent/50"
                          }`}
                        >
                          <span className="truncate max-w-[140px] inline-block" title={item.name}>
                            {item.name}
                          </span>
                          {item.rating != null && (
                            <span className="ml-1 text-rasya-accent">
                              {" "}{item.rating}/5
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedItem && ALL_DESCRIPTIONS[selectedItem] && (
                <div className="mt-4 rounded-lg border border-rasya-accent/30 bg-rasya-accent/5 p-4">
                  <p className="mb-2 text-sm font-medium text-white">{selectedItem}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {lang === "en"
                      ? ALL_DESCRIPTIONS[selectedItem].en
                      : ALL_DESCRIPTIONS[selectedItem].id}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="mt-3 text-xs font-medium text-rasya-accent hover:underline"
                  >
                    {t("analitik_close_desc")}
                  </button>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLayer(2)}
                  className="rounded-lg bg-rasya-accent px-4 py-2 text-sm font-medium text-rasya-dark transition hover:opacity-90"
                >
                  {t("analitik_next")}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-zinc-300 leading-relaxed">
                {t("analitik_layer2_text")}
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLayer(1)}
                  className="rounded-lg border border-rasya-border px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-rasya-border hover:text-white"
                >
                  {t("analitik_back")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-rasya-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  {t("analitik_close")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
