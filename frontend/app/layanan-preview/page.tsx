import Link from "next/link";

const previews = [
  {
    slug: "cafe",
    title: "Cafe Theme",
    desc: "Menu-first landing layout with pricing emphasis.",
  },
  {
    slug: "kostel",
    title: "Kostel Theme",
    desc: "Pricing plan layout with monthly, 6-month, and yearly tiers.",
  },
  {
    slug: "game-store",
    title: "Game Store Theme",
    desc: "Modern storefront concept with featured games and bundles.",
  },
];

export default function LayananPreviewIndexPage() {
  return (
    <main className="min-h-screen bg-rasya-dark px-6 pb-20 pt-28">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-zinc-400 transition hover:text-rasya-accent"
        >
          ← Kembali ke laman utama
        </Link>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-rasya-accent">
          Layanan Preview
        </p>
        <h1 className="mb-3 text-4xl font-bold text-white">Web & Digital Preview</h1>
        <p className="mb-10 max-w-2xl text-zinc-400">
          Halaman demo untuk template layanan. Pilih salah satu tema untuk melihat desain preview
          yang lebih serius.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {previews.map((item) => (
            <Link
              key={item.slug}
              href={`/layanan-preview/${item.slug}`}
              className="group rounded-2xl border border-rasya-border bg-rasya-surface p-6 transition hover:border-rasya-accent/50"
            >
              <h2 className="mb-2 text-xl font-semibold text-white group-hover:text-rasya-accent">
                {item.title}
              </h2>
              <p className="mb-4 text-sm text-zinc-400">{item.desc}</p>
              <span className="text-xs font-medium text-rasya-accent">Buka preview →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

