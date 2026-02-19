"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PREVIEW_KEY = process.env.NEXT_PUBLIC_PREVIEW_CLIENT_KEY || "";

function PreviewClientContent() {
  const searchParams = useSearchParams();
  const k = searchParams.get("k") || "";

  if (!PREVIEW_KEY || k !== PREVIEW_KEY) {
    return (
      <main className="min-h-screen bg-rasya-dark px-6 pb-20 pt-28 flex flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Akses ditolak</h1>
          <p className="text-zinc-400 text-sm">
            Link tidak valid atau kedaluwarsa. Halaman ini hanya dapat diakses melalui link yang dibagikan oleh admin.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-rasya-accent hover:underline"
          >
            ← Kembali ke laman utama
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-rasya-dark px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-rasya-accent">
          Preview untuk client
        </p>
        <h1 className="mb-3 text-4xl font-bold text-white">Preview template layanan</h1>
        <p className="mb-10 max-w-2xl text-zinc-400">
          Halaman ini hanya dapat diakses melalui link yang dibagikan. Berikut preview template yang bisa Anda lihat.
        </p>

        <div className="rounded-2xl border border-rasya-border bg-rasya-surface p-8">
          <Link
            href="/layanan-preview"
            className="inline-flex items-center gap-2 rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark transition hover:bg-rasya-accent/90"
          >
            Lihat semua preview template →
          </Link>
          <p className="mt-4 text-sm text-zinc-500">
            Cafe Theme, Kostel Theme, Game Store Theme, dan lainnya.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-400 transition hover:text-rasya-accent"
        >
          ← Kembali ke laman utama
        </Link>
      </div>
    </main>
  );
}

export default function PreviewClientPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-rasya-dark flex items-center justify-center">
          <p className="text-zinc-500">Memuat...</p>
        </main>
      }
    >
      <PreviewClientContent />
    </Suspense>
  );
}
