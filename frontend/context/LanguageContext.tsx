"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/translations";
import { t as tFn } from "@/lib/translations";

const STORAGE_KEY = "raspro-lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLang(): Lang {
  if (typeof window === "undefined") return "id";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "id") return stored;
  return "id";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getStoredLang());
    setMounted(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next === "en" ? "en" : "id";
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang === "en" ? "en" : "id";
  }, [mounted, lang]);

  const t = useCallback((key: string) => tFn(lang, key), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
