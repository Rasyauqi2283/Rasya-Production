import Link from "next/link";

const menu = [
  { name: "Espresso", price: "Rp 18.000" },
  { name: "Spanish Latte", price: "Rp 33.000" },
  { name: "Cold Brew", price: "Rp 29.000" },
  { name: "Truffle Fries", price: "Rp 34.000" },
  { name: "Smoked Beef Sandwich", price: "Rp 48.000" },
  { name: "Basque Burnt Cheesecake", price: "Rp 36.000" },
];

export default function CafePreviewPage() {
  return (
    <main className="min-h-screen bg-[#0f0f12] px-6 pb-20 pt-28 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/layanan-preview" className="text-xs text-zinc-400 hover:text-rasya-accent">
          ← Kembali ke layanan preview
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-900/30 bg-gradient-to-br from-[#22160f] via-[#151414] to-[#111214] shadow-2xl shadow-black/30">
          <div className="grid gap-10 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-12">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-amber-300/80">
                Cafe Theme Preview
              </p>
              <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">
                Senja &amp; Beans
              </h1>
              <p className="mb-8 max-w-xl text-sm leading-relaxed text-zinc-300">
                Cozy artisan coffee shop template dengan hero premium, list menu berharga jelas,
                dan visual tone hangat yang cocok untuk brand cafe modern.
              </p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-amber-200">
                  #coffee
                </span>
                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-amber-200">
                  #brunch
                </span>
                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-amber-200">
                  #artisan
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100/15 bg-black/30 p-5 backdrop-blur">
              <h2 className="mb-4 text-lg font-semibold text-amber-200">Menu Pilihan</h2>
              <div className="space-y-3">
                {menu.map((item) => (
                  <div key={item.name} className="grid grid-cols-[1fr_auto] border-b border-white/10 pb-2 text-sm">
                    <span className="text-zinc-200">{item.name}</span>
                    <span className="font-medium text-amber-300">{item.price}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-[#23170f]">
                Reservasi Meja
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

