"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEY = "raspro-cookie-consent";

export default function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (accepted !== "true") setVisible(true);
  }, []);

  const accept = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookie_banner_label")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-rasya-border bg-rasya-surface/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {t("cookie_banner_text")}{" "}
          <Link
            href="/cookies"
            className="font-medium text-rasya-primary underline underline-offset-2 hover:no-underline"
          >
            {t("cookie_banner_learn")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/cookies"
            className="rounded-md border border-rasya-border bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("cookie_banner_settings")}
          </Link>
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-rasya-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {t("cookie_banner_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
