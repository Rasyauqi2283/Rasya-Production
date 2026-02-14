import Link from "next/link";

const games = [
  { title: "Stellar Drift IX", genre: "Sci-fi RPG", price: "Rp 499.000" },
  { title: "Rogue Grid", genre: "Action Shooter", price: "Rp 379.000" },
  { title: "Kingdom Forge", genre: "Strategy", price: "Rp 429.000" },
];

export default function GameStorePreviewPage() {
  return (
    <main className="min-h-screen bg-[#090b14] px-6 pb-20 pt-28 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/layanan-preview" className="text-xs text-zinc-400 hover:text-rasya-accent">
          ← Kembali ke layanan preview
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0f1630] via-[#101529] to-[#090d1a]">
          <div className="border-b border-cyan-300/10 bg-black/20 p-6 md:p-8">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan-300/80">
              Game Store Theme
            </p>
            <h1 className="text-4xl font-bold text-white md:text-5xl">NEON ARCADE MARKET</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-300">
              Preview halaman toko game digital dengan visual futuristik: hero promo, kartu game,
              harga, dan CTA checkout.
            </p>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            {games.map((game) => (
              <article
                key={game.title}
                className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4 shadow-lg shadow-cyan-950/40"
              >
                <div className="mb-4 h-28 rounded-xl bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/20" />
                <h2 className="text-lg font-semibold text-white">{game.title}</h2>
                <p className="mt-1 text-xs text-zinc-400">{game.genre}</p>
                <p className="mt-4 text-xl font-bold text-cyan-300">{game.price}</p>
                <button className="mt-4 w-full rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-[#071015] hover:bg-cyan-300">
                  Buy Now
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

