import Link from "next/link";

const plans = [
  {
    name: "Bulanan",
    total: "Rp 1.350.000",
    details: "Bayar fleksibel per bulan",
  },
  {
    name: "6 Bulan",
    total: "Rp 7.500.000",
    details: "Setara Rp 1.250.000 / bulan",
    save: "Hemat Rp 600.000",
  },
  {
    name: "1 Tahun",
    total: "Rp 14.000.000",
    details: "Setara Rp 1.166.000 / bulan",
    save: "Hemat Rp 2.200.000",
    featured: true,
  },
];

export default function KostelPreviewPage() {
  return (
    <main className="min-h-screen bg-rasya-dark px-6 pb-20 pt-28 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/layanan-preview" className="text-xs text-zinc-400 hover:text-rasya-accent">
          ← Kembali ke layanan preview
        </Link>

        <section className="mt-6 rounded-3xl border border-rasya-border bg-gradient-to-b from-[#141725] to-[#0f111a] p-8 md:p-12">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-rasya-accent">
            Kostel Theme Preview
          </p>
          <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">Kostel Harmoni Residence</h1>
          <p className="mb-8 max-w-2xl text-sm text-zinc-300">
            Preview pricing bertingkat untuk kost/kostel. Struktur harga menonjolkan value paket 6
            bulan dan tahunan melalui anchor bulanan.
          </p>

          <div className="mb-4 inline-flex rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
            Harga normal: <span className="ml-1 font-medium text-zinc-200">Rp 1.350.000 / bulan</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-5 ${
                  plan.featured
                    ? "border-rasya-accent/60 bg-rasya-accent/10 shadow-lg shadow-rasya-accent/10"
                    : "border-zinc-700 bg-zinc-900/50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
                  {plan.featured && (
                    <span className="rounded-full bg-rasya-accent px-2 py-0.5 text-[11px] font-bold text-rasya-dark">
                      Best Deal
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{plan.total}</p>
                <p className="mt-2 text-sm text-zinc-300">{plan.details}</p>
                {plan.save && <p className="mt-2 text-xs font-medium text-rasya-accent">{plan.save}</p>}
                <button className="mt-5 w-full rounded-lg border border-zinc-600 bg-zinc-800/70 px-3 py-2 text-sm font-medium hover:border-rasya-accent/60">
                  Pilih Paket
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

