/**
 * Satu sumber konfigurasi untuk Layanan Preview.
 * - Custom preview (fitur, game-store, dll.) punya halaman sendiri.
 * - 31 layanan dari serviceI18n pakai dynamic route [slug] + template.
 * Generate ulang SERVICE_PREVIEW_META via: npm run preview-config
 */

import { SERVICE_TITLE_TO_SLUG } from "./serviceI18n";

export type PreviewType = "design" | "konten" | "web" | "lain";

export interface PreviewMeta {
  slug: string;
  title: string;
  description: string;
  tag?: string;
  previewType: PreviewType;
}

/** Preview dengan halaman custom (bukan dynamic [slug]) */
export const CUSTOM_PREVIEWS: PreviewMeta[] = [
  { slug: "fitur", title: "Fitur & Demo", description: "Yang Anda dapatkan saat order + demo interaktif (chart real-time, seperti game).", previewType: "web" },
  { slug: "game-store", title: "Game Store Theme", description: "Modern storefront concept with featured games and bundles.", previewType: "web" },
  { slug: "montessori", title: "Montessori School Theme", description: "Landing PAUD/TK dengan pendekatan Montessori, kurikulum terintegrasi.", previewType: "web" },
  { slug: "cafe", title: "Cafe Theme", description: "Menu-first landing layout with pricing emphasis.", previewType: "web" },
  { slug: "kostel", title: "Kostel Theme", description: "Pricing plan layout with monthly, 6-month, and yearly tiers.", previewType: "web" },
];

/** Slug → tag & short description untuk 31 layanan (title dari SERVICE_TITLE_TO_SLUG) */
export const SERVICE_PREVIEW_META: Record<string, { tag: string; shortDescription: string; previewType: PreviewType }> = {
  ui_designer: { tag: "Design", shortDescription: "Contoh mockup, wireframe, dan design system.", previewType: "design" },
  video_editor: { tag: "Design", shortDescription: "Contoh reel, cutting, color grading, motion text.", previewType: "design" },
  motion_designer: { tag: "Design", shortDescription: "Contoh animasi, kinetic typography, motion graphic.", previewType: "design" },
  illustrator: { tag: "Design", shortDescription: "Contoh ilustrasi karakter, ikon, infografis.", previewType: "design" },
  editor_proofreader: { tag: "Design", shortDescription: "Contoh sebelum–sesudah penyuntingan naskah.", previewType: "design" },
  ux_designer: { tag: "Design", shortDescription: "Contoh user flow, wireframe, usability.", previewType: "design" },
  product_designer: { tag: "Design", shortDescription: "Contoh case study dan layar produk.", previewType: "design" },
  landing_page_designer: { tag: "Design", shortDescription: "Contoh mockup landing dengan CTA.", previewType: "design" },
  modelling: { tag: "Design", shortDescription: "Contoh foto atau video sample.", previewType: "design" },
  web_digital: { tag: "Web & Digital", shortDescription: "Template website & demo fitur.", previewType: "web" },
  wordpress_developer: { tag: "Web & Digital", shortDescription: "Contoh tema atau custom layout.", previewType: "web" },
  fullstack_developer: { tag: "Web & Digital", shortDescription: "Contoh arsitektur atau demo app.", previewType: "web" },
  backend_developer: { tag: "Web & Digital", shortDescription: "Contoh API atau struktur backend.", previewType: "web" },
  frontend_developer: { tag: "Web & Digital", shortDescription: "Contoh komponen atau landing.", previewType: "web" },
  mobile_app_android: { tag: "Web & Digital", shortDescription: "Contoh layar atau flow app Android.", previewType: "web" },
  mobile_app_ios: { tag: "Web & Digital", shortDescription: "Contoh layar atau flow app iOS.", previewType: "web" },
  content_writer: { tag: "Konten & Kreatif", shortDescription: "Contoh artikel atau copy landing.", previewType: "konten" },
  copywriter: { tag: "Konten & Kreatif", shortDescription: "Contoh headline, CTA, deskripsi produk.", previewType: "konten" },
  social_media_manager: { tag: "Konten & Kreatif", shortDescription: "Contoh grid post atau jadwal konten.", previewType: "konten" },
  technical_writer: { tag: "Konten & Kreatif", shortDescription: "Contoh dokumentasi atau user guide.", previewType: "konten" },
  seo_specialist: { tag: "Konten & Kreatif", shortDescription: "Contoh laporan kata kunci atau on-page.", previewType: "konten" },
  email_marketer: { tag: "Konten & Kreatif", shortDescription: "Contoh template email atau drip.", previewType: "konten" },
  community_manager: { tag: "Konten & Kreatif", shortDescription: "Contoh jadwal dan engagement.", previewType: "konten" },
  brand_strategist: { tag: "Konten & Kreatif", shortDescription: "Contoh positioning dan tone of voice.", previewType: "konten" },
  transcriber: { tag: "Konten & Kreatif", shortDescription: "Contoh halaman transkrip.", previewType: "konten" },
  localization_specialist: { tag: "Konten & Kreatif", shortDescription: "Contoh teks sumber vs terjemahan.", previewType: "konten" },
  photographer: { tag: "Lain-lain", shortDescription: "Contoh galeri foto produk atau event.", previewType: "lain" },
  videographer: { tag: "Lain-lain", shortDescription: "Contoh reel atau cuplikan shooting.", previewType: "lain" },
  data_analyst: { tag: "Lain-lain", shortDescription: "Contoh dashboard atau laporan data.", previewType: "lain" },
  project_manager_digital: { tag: "Lain-lain", shortDescription: "Contoh timeline atau status report.", previewType: "lain" },
  virtual_assistant: { tag: "Lain-lain", shortDescription: "Contoh daftar layanan atau format laporan.", previewType: "lain" },
};

const SLUG_TO_TITLE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [title, slug] of Object.entries(SERVICE_TITLE_TO_SLUG)) {
    out[slug] = title;
  }
  return out;
})();

export const SERVICE_SLUGS = Object.keys(SERVICE_PREVIEW_META) as string[];

/** Untuk halaman dynamic [slug]: ambil meta layanan by slug. Return null jika bukan layanan dari list 31. */
export function getServicePreviewMeta(slug: string): PreviewMeta | null {
  const meta = SERVICE_PREVIEW_META[slug];
  const title = SLUG_TO_TITLE[slug];
  if (!meta || !title) return null;
  return {
    slug,
    title,
    description: meta.shortDescription,
    tag: meta.tag,
    previewType: meta.previewType,
  };
}

/** Daftar semua preview untuk index: custom + 31 layanan (slug, title, description, previewType). */
export function getAllPreviews(): PreviewMeta[] {
  const servicePreviews: PreviewMeta[] = SERVICE_SLUGS.map((slug) => getServicePreviewMeta(slug)!);
  return [...CUSTOM_PREVIEWS, ...servicePreviews];
}

/** Apakah slug ini punya halaman custom (fitur, game-store, dll.)? */
export function isCustomPreviewSlug(slug: string): boolean {
  return CUSTOM_PREVIEWS.some((p) => p.slug === slug);
}

/** 4 lane sama seperti layanan utama (krusial) */
export const PREVIEW_LANE_TAGS = ["Web & Digital", "Design", "Konten & Kreatif", "Lain-lain"] as const;

/** Fitur & Demo — dipisah paling atas di lane Web & Digital */
export const FITUR_PREVIEW: PreviewMeta = CUSTOM_PREVIEWS[0];

/** 4 theme (Game Store, Montessori, Cafe, Kostel) — badge di Web & Digital */
export const THEME_PREVIEWS: PreviewMeta[] = CUSTOM_PREVIEWS.slice(1, 5);

/** Preview layanan (31) per tag — untuk lane Design, Konten & Kreatif, Lain-lain; Web & Digital hanya service (bukan fitur/theme). */
export function getPreviewsByTag(tag: string): PreviewMeta[] {
  return SERVICE_SLUGS.map((slug) => getServicePreviewMeta(slug)!).filter((p) => p.tag === tag);
}

/** Opsi dropdown kedua "Fitur & Demo" per kategori. Web & Digital = 7 layanan (sesuai kartu); plus Fitur & Demo slide + 4 theme di paling atas. */
export function getFiturDemoOptionsByCategory(category: string): PreviewMeta[] {
  if (category !== "Web & Digital") return [];
  const services = getPreviewsByTag("Web & Digital");
  return [FITUR_PREVIEW, ...THEME_PREVIEWS, ...services];
}
