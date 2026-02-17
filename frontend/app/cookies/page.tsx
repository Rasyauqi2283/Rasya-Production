"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function CookiesPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 font-display text-3xl font-semibold text-rasya-dark">
        {t("cookie_page_title")}
      </h1>
      <p className="mb-8 text-zinc-600">{t("cookie_page_intro")}</p>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-rasya-dark">
          {t("cookie_what")}
        </h2>
        <p className="text-zinc-600">{t("cookie_what_desc")}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-rasya-dark">
          {t("cookie_we_use")}
        </h2>
        <p className="text-zinc-600">{t("cookie_we_use_desc")}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-display text-xl font-semibold text-rasya-dark">
          {t("cookie_control")}
        </h2>
        <p className="text-zinc-600">{t("cookie_control_desc")}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 font-display text-xl font-semibold text-rasya-dark">
          {t("cookie_contact")}
        </h2>
        <p className="text-zinc-600">{t("cookie_contact_desc")}</p>
      </section>

      <Link
        href="/#contact"
        className="inline-block rounded-md bg-rasya-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        {t("nav_contact")}
      </Link>
    </div>
  );
}
