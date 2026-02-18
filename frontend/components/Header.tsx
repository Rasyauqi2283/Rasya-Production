"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";

function AnimatedO() {
  return (
    <span className="inline-flex items-center align-middle mx-0.5 w-[0.9em] h-[0.9em]">
      {/* Animated aperture O from logo; eslint ok: decorative SVG with animation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Animate_O.svg"
        alt=""
        aria-hidden
        className="w-full h-full object-contain animate-spin"
        style={{ animationDuration: "4s" }}
      />
    </span>
  );
}

const LOGO = (
  <>
    <Image
      src="/Logo_sebenarnya.png"
      alt="Rasya Production"
      width={36}
      height={36}
      className="mr-2.5 shrink-0 object-contain"
    />
    <span className="align-middle">
      Rasya<span className="text-rasya-accent">.</span>Prod
      <AnimatedO />
      uction
    </span>
  </>
);

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-rasya-border/50 bg-rasya-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {isHome ? (
          <a
            href="#hero"
            className="flex items-center text-xl font-semibold tracking-tight text-white"
          >
            {LOGO}
          </a>
        ) : (
          <Link
            href="/"
            className="flex items-center text-xl font-semibold tracking-tight text-white"
          >
            {LOGO}
          </Link>
        )}
        {isHome && (
          <div className="flex items-center gap-4">
            <nav className="hidden gap-8 md:flex" aria-label="Main">
              <a
                href="#about"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                {t("nav_about")}
              </a>
              <a
                href="#services"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                {t("nav_services")}
              </a>
              <a
                href="#porto"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                {t("nav_porto")}
              </a>
              <a
                href="#contact"
                className="text-sm text-zinc-400 transition hover:text-rasya-accent"
              >
                {t("nav_contact")}
              </a>
            </nav>
            <div className="flex rounded-lg border border-rasya-border bg-rasya-surface/80 p-0.5">
              <button
                type="button"
                onClick={() => setLang("id" as Lang)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  lang === "id"
                    ? "bg-rasya-accent text-rasya-dark"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={lang === "id"}
                aria-label="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang("en" as Lang)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  lang === "en"
                    ? "bg-rasya-accent text-rasya-dark"
                    : "text-zinc-400 hover:text-white"
                }`}
                aria-pressed={lang === "en"}
                aria-label="English"
              >
                EN
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
