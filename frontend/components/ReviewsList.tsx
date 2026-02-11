"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  amount: number;
  comment: string;
  name: string;
  created_at: string;
};

type Response = { ok: boolean; reviews: Review[] };

function formatDate(s: string) {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function maskName(name: string) {
  if (!name || name.length <= 2) return name ? name[0] + "***" : "Anonim";
  return name[0] + "***" + name[name.length - 1];
}

export default function ReviewsList({ apiUrl }: { apiUrl: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/api/reviews`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.reviews)) setReviews(data.reviews);
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Memuat ulasan...</p>;
  }
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Belum ada ulasan. Donasi di bawah Rp 50.000 (dengan komentar) akan tampil di sini.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-rasya-border bg-rasya-card p-4 text-left"
        >
          <p className="mb-2 text-zinc-300">{r.comment}</p>
          <p className="text-xs text-zinc-500">
            {maskName(r.name)} · Donasi Rp {(r.amount / 1000).toFixed(0)}k · {formatDate(r.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
