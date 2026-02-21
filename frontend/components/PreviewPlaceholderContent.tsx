"use client";

import type { PreviewType } from "@/lib/layananPreviewConfig";

const PLACEHOLDER_CONFIG: Record<
  PreviewType,
  { label: string; icon: string; hint: string }
> = {
  design: {
    label: "Preview contoh hasil desain",
    icon: "🎨",
    hint: "Tambahkan galeri mockup, reel video, atau before/after di sini.",
  },
  konten: {
    label: "Preview contoh hasil konten",
    icon: "✍️",
    hint: "Tambahkan sample artikel, copy, atau mockup grid di sini.",
  },
  web: {
    label: "Preview contoh hasil web & digital",
    icon: "🌐",
    hint: "Tambahkan demo, screenshot, atau link ke tema di sini.",
  },
  lain: {
    label: "Preview contoh hasil",
    icon: "📋",
    hint: "Tambahkan galeri, laporan sample, atau template di sini.",
  },
};

export default function PreviewPlaceholderContent({
  previewType,
  title,
}: {
  previewType: PreviewType;
  title: string;
}) {
  const config = PLACEHOLDER_CONFIG[previewType];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-5xl" aria-hidden>
        {config.icon}
      </span>
      <h2 className="mb-2 text-lg font-semibold text-white">
        {config.label} — {title}
      </h2>
      <p className="max-w-md text-sm text-zinc-500">
        {config.hint}
      </p>
      <p className="mt-6 text-xs text-zinc-600">
        Konten preview untuk layanan ini bisa ditambahkan di komponen atau halaman yang merender
        area ini.
      </p>
    </div>
  );
}
