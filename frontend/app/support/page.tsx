"use client";

import Link from "next/link";
import DonateForm from "@/components/DonateForm";
import { useLanguage } from "@/context/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function SupportPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href="/#contact"
        className="mb-8 inline-block text-sm text-zinc-500 hover:text-rasya-accent"
      >
        ← {t("contact_heading")}
      </Link>
      <h1 className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent">
        {t("support_heading")}
      </h1>
      <p className="mb-8 text-zinc-400">
        {t("support_intro")}
      </p>
      <div className="rounded-xl border border-rasya-border bg-rasya-card p-6">
        <DonateForm apiUrl={API_URL} />
      </div>
    </div>
  );
}
