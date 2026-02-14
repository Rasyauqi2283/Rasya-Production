"use client";

import { useLanguage } from "@/context/LanguageContext";

type MenuItem = {
  name: string;
  price: string;
};

type Plan = {
  label: string;
  total: string;
  perMonth?: string;
  save?: string;
  featured?: boolean;
};

const CAFE_MENU_ID: MenuItem[] = [
  { name: "Espresso", price: "Rp 18.000" },
  { name: "Cappuccino", price: "Rp 28.000" },
  { name: "Signature Latte", price: "Rp 34.000" },
  { name: "Butter Croissant", price: "Rp 24.000" },
  { name: "Chicken Pasta", price: "Rp 42.000" },
];

const CAFE_MENU_EN: MenuItem[] = [
  { name: "Espresso", price: "IDR 18,000" },
  { name: "Cappuccino", price: "IDR 28,000" },
  { name: "Signature Latte", price: "IDR 34,000" },
  { name: "Butter Croissant", price: "IDR 24,000" },
  { name: "Chicken Pasta", price: "IDR 42,000" },
];

const KOST_PLANS_ID: Plan[] = [
  { label: "Bulanan", total: "Rp 1.350.000" },
  { label: "6 Bulan", total: "Rp 7.500.000", perMonth: "Rp 1.250.000/bln", save: "Hemat Rp 600.000" },
  { label: "1 Tahun", total: "Rp 14.000.000", perMonth: "Rp 1.166.000/bln", save: "Hemat Rp 2.200.000", featured: true },
];

const KOST_PLANS_EN: Plan[] = [
  { label: "Monthly", total: "IDR 1,350,000" },
  { label: "6 Months", total: "IDR 7,500,000", perMonth: "IDR 1,250,000/mo", save: "Save IDR 600,000" },
  { label: "1 Year", total: "IDR 14,000,000", perMonth: "IDR 1,166,000/mo", save: "Save IDR 2,200,000", featured: true },
];

export default function TemplatesShowcase() {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  const copy = {
    sectionTag: isEn ? "Templates" : "Template",
    sectionTitle: isEn ? "Two Ready-to-Use Design Themes" : "Dua Tema Design Siap Pakai",
    sectionDesc: isEn
      ? "Initial showcase for clients. We can duplicate and customize each layout quickly."
      : "Showcase awal untuk klien. Tinggal duplikasi lalu custom sesuai identitas brand.",
    cafeTitle: isEn ? "Cafe Theme — Menu Layout" : "Tema Cafe — Layout List Menu",
    cafeDesc: isEn
      ? "Clean and premium menu block with direct pricing focus."
      : "Blok menu rapi dengan fokus langsung ke harga supaya mudah dipilih pelanggan.",
    menuCol: isEn ? "Menu" : "Menu",
    priceCol: isEn ? "Price" : "Harga",
    kostTitle: isEn ? "Boarding House Theme — Pricing Table" : "Tema Kost/Kostel — Tabel Harga",
    kostDesc: isEn
      ? "Anchored pricing with monthly, 6-month, and yearly options. 6/12 month plans appear more valuable."
      : "Pricing bertingkat (bulanan, 6 bulan, tahunan) dengan teknik anchor agar paket 6/12 bulan terlihat lebih bernilai.",
    normalPrice: isEn ? "Normal monthly benchmark" : "Patokan harga normal",
    normalPriceValue: isEn ? "IDR 1,350,000/mo" : "Rp 1.350.000/bulan",
    bestValue: isEn ? "Best Value" : "Paling Untung",
    note: isEn
      ? "Pricing psychology uses anchor pricing and bundle framing. Final numbers can be adjusted per property."
      : "Psikologi harga memakai anchor pricing dan framing paket. Angka final tetap bisa disesuaikan properti.",
  };

  const menu = isEn ? CAFE_MENU_EN : CAFE_MENU_ID;
  const plans = isEn ? KOST_PLANS_EN : KOST_PLANS_ID;

  return (
    <section
      id="templates"
      className="border-t border-rasya-border bg-rasya-dark py-24 px-6"
      aria-labelledby="templates-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent">
          {copy.sectionTag}
        </h2>
        <h3 id="templates-heading" className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          {copy.sectionTitle}
        </h3>
        <p className="mb-12 max-w-3xl text-zinc-400">{copy.sectionDesc}</p>

        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-2xl border border-rasya-border bg-rasya-surface p-6">
            <h4 className="mb-3 text-xl font-semibold text-white">{copy.cafeTitle}</h4>
            <p className="mb-5 text-sm text-zinc-400">{copy.cafeDesc}</p>
            <div className="rounded-xl border border-rasya-border bg-rasya-dark/50 p-4">
              <div className="mb-3 grid grid-cols-2 border-b border-rasya-border pb-2 text-xs uppercase tracking-wider text-zinc-500">
                <span>{copy.menuCol}</span>
                <span className="text-right">{copy.priceCol}</span>
              </div>
              <div className="space-y-2">
                {menu.map((item) => (
                  <div key={item.name} className="grid grid-cols-2 text-sm">
                    <span className="text-zinc-300">{item.name}</span>
                    <span className="text-right font-medium text-rasya-accent">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-rasya-border bg-rasya-surface p-6">
            <h4 className="mb-3 text-xl font-semibold text-white">{copy.kostTitle}</h4>
            <p className="mb-5 text-sm text-zinc-400">{copy.kostDesc}</p>
            <div className="mb-3 rounded-lg border border-rasya-border bg-rasya-dark/50 px-3 py-2 text-xs text-zinc-500">
              {copy.normalPrice}: <span className="text-zinc-300">{copy.normalPriceValue}</span>
            </div>
            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.label}
                  className={`rounded-xl border p-4 ${
                    plan.featured
                      ? "border-rasya-accent/60 bg-rasya-accent/10"
                      : "border-rasya-border bg-rasya-dark/50"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">{plan.label}</span>
                    {plan.featured && (
                      <span className="rounded-full bg-rasya-accent px-2 py-0.5 text-[11px] font-semibold text-rasya-dark">
                        {copy.bestValue}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-white">{plan.total}</p>
                  {plan.perMonth && <p className="text-sm text-zinc-300">{plan.perMonth}</p>}
                  {plan.save && <p className="text-xs text-rasya-accent">{plan.save}</p>}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">{copy.note}</p>
          </article>
        </div>
      </div>
    </section>
  );
}

