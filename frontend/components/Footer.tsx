"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-rasya-border bg-rasya-surface py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
        © 2026 Rasya Production V 1.0. All rights reserved.
        {" · "}
        <Link href="/cookies" className="underline hover:no-underline">
          {t("footer_cookies")}
        </Link>
      </div>
    </footer>
  );
}
