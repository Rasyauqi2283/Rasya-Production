/**
 * Service i18n: tampilkan title/desc layanan sesuai bahasa tanpa duplikasi di DB.
 * DB tetap menyimpan satu bahasa (ID); terjemahan ID+EN ada di translations.ts.
 * Mapping exact title (dari API) → slug untuk lookup key svc_${slug}_title / svc_${slug}_desc.
 */

export const SERVICE_TITLE_TO_SLUG: Record<string, string> = {
  "UI Designer": "ui_designer",
  "Video Editor": "video_editor",
  "Motion Designer": "motion_designer",
  "Illustrator": "illustrator",
  "Editor / Proofreader": "editor_proofreader",
  "UX Designer": "ux_designer",
  "Product Designer": "product_designer",
  "Landing Page Designer": "landing_page_designer",
  "Modelling": "modelling",
  "Web & Digital": "web_digital",
  "WordPress Developer": "wordpress_developer",
  "Fullstack Developer": "fullstack_developer",
  "Backend Developer": "backend_developer",
  "Frontend Developer": "frontend_developer",
  "Mobile App Developer (Android)": "mobile_app_android",
  "Mobile App Developer (iOS)": "mobile_app_ios",
  "Content Writer": "content_writer",
  "Copywriter": "copywriter",
  "Social Media Manager": "social_media_manager",
  "Technical Writer": "technical_writer",
  "SEO Specialist": "seo_specialist",
  "Email Marketer": "email_marketer",
  "Community Manager": "community_manager",
  "Brand Strategist": "brand_strategist",
  "Transcriber": "transcriber",
  "Localization Specialist": "localization_specialist",
  "Photographer": "photographer",
  "Videographer": "videographer",
  "Data Analyst": "data_analyst",
  "Project Manager Digital": "project_manager_digital",
  "Virtual Assistant": "virtual_assistant",
};

export function getServiceDisplay(
  t: (key: string) => string,
  title: string,
  desc: string
): { title: string; desc: string } {
  const slug = SERVICE_TITLE_TO_SLUG[title];
  if (!slug) return { title, desc };
  const titleKey = `svc_${slug}_title`;
  const descKey = `svc_${slug}_desc`;
  const outTitle = t(titleKey);
  const outDesc = t(descKey);
  return {
    title: outTitle && outTitle !== titleKey ? outTitle : title,
    desc: outDesc && outDesc !== descKey ? outDesc : desc,
  };
}
