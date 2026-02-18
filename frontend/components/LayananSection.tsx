"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getServiceDisplay } from "@/lib/serviceI18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const SERVICE_TAGS = ["Web & Digital", "Design", "Konten & Kreatif", "Lain-lain"] as const;
const TAG_KEYS: Record<string, string> = {
  "Design": "tag_design",
  "Web & Digital": "tag_web",
  "Konten & Kreatif": "tag_konten",
  "Lain-lain": "tag_lain",
};

type ServiceItem = {
  id: string;
  title: string;
  desc: string;
  price_awal?: string;
  tag?: string;
  discount_percent?: number;
  price_after_discount?: string;
  closed?: boolean;
};

type Category = {
  id: string;
  label: string;
  services: ServiceItem[];
};

function groupByTag(services: ServiceItem[]): Category[] {
  const byTag = new Map<string, ServiceItem[]>();
  for (const tag of SERVICE_TAGS) {
    byTag.set(tag, []);
  }
  for (const s of services) {
    const tag = (s.tag && SERVICE_TAGS.includes(s.tag as typeof SERVICE_TAGS[number])) ? s.tag : "Lain-lain";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag)!.push(s);
  }
  return SERVICE_TAGS.map((label) => ({
    id: label,
    label,
    services: byTag.get(label) || [],
  }));
}

export default function LayananSection() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>(SERVICE_TAGS[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.services)) {
            const grouped = groupByTag(data.services);
            setCategories(grouped);
            setCategoryId((prev) => (grouped.some((c) => c.id === prev) ? prev : SERVICE_TAGS[0]));
          }
        } catch {
          // ignore invalid response
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const hasAny = categories.some((c) => c.services.length > 0);
  const services = category?.services ?? [];

  const handleCategoryChange = (label: string) => {
    setCategoryId(label);
    setExpandedId(null);
  };

  return (
    <section
      id="services"
      className="border-t border-rasya-border py-24 px-6"
      aria-labelledby="services-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2
                id="services-heading"
                className="font-mono text-sm uppercase tracking-widest text-rasya-accent"
              >
                {t("services_heading")}
              </h2>
              <nav aria-label="Kategori layanan" className="flex flex-wrap gap-2">
                {SERVICE_TAGS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleCategoryChange(label)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      categoryId === label
                        ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                        : "border-rasya-border text-zinc-400 hover:border-rasya-accent/50 hover:text-white"
                    }`}
                  >
                    {t(TAG_KEYS[label] ?? "tag_lain")}
                  </button>
                ))}
              </nav>
            </div>
            <h3 className="text-3xl font-bold text-white sm:text-4xl">
              {t("services_title")}
            </h3>
            {hasAny && (
              <p className="mt-2 text-sm text-zinc-500">
                {t("services_click_to_reveal")}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">{t("services_loading")}</p>
        ) : !hasAny ? (
          <p className="text-sm text-zinc-500">{t("services_empty")}</p>
        ) : (
          <div className="space-y-2">
            {services.map((item) => {
              const { title: displayTitle, desc: displayDesc } = getServiceDisplay(t, item.title, item.desc || "");
              const priceLabel = (item.price_awal || "").replace(/\s*\(harga awal\)\s*/gi, "").trim();
              const priceDisplay = priceLabel ? `${t("services_price_from")} ${priceLabel}` : t("services_brief");
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-rasya-border bg-rasya-card overflow-hidden transition hover:border-rasya-accent/30"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
                    aria-expanded={isExpanded}
                  >
                    <h4 className="text-lg font-semibold text-white">
                      {displayTitle}
                    </h4>
                    <span
                      className={`shrink-0 text-rasya-accent transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-rasya-border px-4 pb-4 pt-2">
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                        {displayDesc || "—"}
                      </p>
                      <div className="text-sm pt-2 border-t border-rasya-border/60">
                        {item.closed ? (
                          <p className="font-medium text-zinc-500">{t("services_closed")}</p>
                        ) : item.discount_percent && item.discount_percent > 0 ? (
                          <>
                            <p className="text-zinc-500 line-through">{priceDisplay}</p>
                            <p className="font-medium text-rasya-accent mt-0.5">
                              {t("services_discount")} {item.discount_percent}%: {item.price_after_discount || "—"}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-rasya-accent">{priceDisplay}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
