"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function AntrianLayanan({ apiUrl }: { apiUrl: string }) {
  const { t } = useLanguage();
  const [antrian, setAntrian] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/orders/antrian`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.antrian)) setAntrian(data.antrian);
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return null;
  if (antrian.length === 0) return null;

  return (
    <section
      className="border-t border-rasya-border bg-rasya-surface py-16 px-6"
      aria-labelledby="antrian-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="antrian-heading"
          className="mb-4 font-mono text-sm uppercase tracking-widest text-rasya-accent"
        >
          {t("antrian_heading")}
        </h2>
        <h3 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
          {t("antrian_title")}
        </h3>
        <p className="mb-8 max-w-2xl text-zinc-400">
          {t("antrian_desc")}
        </p>
        <ul className="flex flex-wrap gap-3">
          {antrian.map((nama) => (
            <li
              key={nama}
              className="rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-2 font-medium text-zinc-300"
            >
              {nama}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
