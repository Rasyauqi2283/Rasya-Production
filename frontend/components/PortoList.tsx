"use client";

import { useEffect, useMemo, useState } from "react";

type PortoItem = {
  id: string;
  title: string;
  tag: string;
  description: string;
  image_url: string;
  link_url?: string;
  layanan?: string[];
  created_at: string;
};

export default function PortoList({ apiUrl }: { apiUrl: string }) {
  const [porto, setPorto] = useState<PortoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/api/porto`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.porto)) setPorto(data.porto);
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const tags = useMemo(
    () =>
      Array.from(
        new Set(
          porto
            .map((p) => p.tag.trim())
            .filter((t) => t.length > 0)
        )
      ),
    [porto]
  );
  const selectedTag = activeTag || (tags[0] ?? "");
  const filtered = selectedTag
    ? porto.filter((p) => p.tag.trim() === selectedTag)
    : porto;

  const imageBase = apiUrl.replace(/\/$/, "");

  if (loading) {
    return <p className="text-sm text-zinc-500">Memuat portofolio...</p>;
  }
  if (porto.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Belum ada portofolio. Upload dari halaman admin.
      </p>
    );
  }

  return (
    <>
      {tags.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium transition " +
                (selectedTag === tag
                  ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                  : "border-rasya-border text-zinc-400 hover:border-rasya-accent/50 hover:text-white")
              }
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
        const href = item.link_url?.trim();
        const cardClass =
          "rounded-xl border border-rasya-border bg-rasya-card overflow-hidden transition hover:border-rasya-accent/30 block";
        const inner = (
          <>
            {item.image_url && (
              <div className="aspect-video bg-rasya-dark">
                <img
                  src={item.image_url.startsWith("http") ? item.image_url : `${imageBase}${item.image_url}`}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <p className="mb-2 font-mono text-xs uppercase text-rasya-accent">{item.tag}</p>
              <h4 className="mb-2 text-lg font-semibold text-white">
                {item.title}
                {item.layanan && item.layanan.length > 0 && (
                  <span className="font-normal text-rasya-accent text-base ml-1">
                    — {item.layanan.join(", ")}
                  </span>
                )}
              </h4>
              <p className="text-sm text-zinc-400">{item.description}</p>
              {href && (
                <p className="mt-2 text-xs text-rasya-accent">Buka situs →</p>
              )}
            </div>
          </>
        );
        return (
          <div key={item.id} className={href ? "" : undefined}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {inner}
              </a>
            ) : (
              <div className={cardClass}>{inner}</div>
            )}
          </div>
        );
        })}
      </div>
    </>
  );
}
