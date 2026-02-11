"use client";

import { useEffect, useState } from "react";

type Service = { id: string; title: string; desc: string };

const DEFAULT_SERVICES: Service[] = [
  { id: "1", title: "Music Production", desc: "Rekaman, mixing, mastering, dan arrangement. Dari konsep sampai release." },
  { id: "2", title: "Web & Digital", desc: "Website, landing page, dan aplikasi web. Modern stack, performa tinggi." },
  { id: "3", title: "Konten & Kreatif", desc: "Visual, copy, dan strategi konten yang selaras dengan brand Anda." },
];

export default function ServicesList({ apiUrl }: { apiUrl: string }) {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/services`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.services) && data.services.length > 0) {
            setServices(data.services);
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-rasya-border bg-rasya-card p-6 transition hover:border-rasya-accent/30"
        >
          <h4 className="mb-2 text-lg font-semibold text-white">{item.title}</h4>
          <p className="text-sm text-zinc-400">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
