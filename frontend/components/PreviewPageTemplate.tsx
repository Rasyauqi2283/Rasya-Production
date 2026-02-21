"use client";

import Link from "next/link";
import PreviewWatermark from "@/components/PreviewWatermark";

export interface PreviewPageTemplateProps {
  title: string;
  description?: string;
  tag?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
}

export default function PreviewPageTemplate({
  title,
  description,
  tag,
  backHref = "/layanan-preview",
  backLabel = "← Kembali ke layanan preview",
  children,
}: PreviewPageTemplateProps) {
  return (
    <main className="relative min-h-screen bg-rasya-dark px-6 pb-20 pt-28 text-zinc-100">
      <PreviewWatermark />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href={backHref} className="text-sm text-zinc-400 transition hover:text-rasya-accent">
          {backLabel}
        </Link>

        <header className="mt-6 mb-10">
          {tag && (
            <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-rasya-accent">
              {tag}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          )}
        </header>

        <section className="rounded-2xl border border-rasya-border bg-rasya-surface/50 p-6 md:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
