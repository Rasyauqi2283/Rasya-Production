"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ClaimResult = {
  ok: boolean;
  message: string;
  order_id?: string;
  revisi_ke?: number;
  sisa_revisi?: number;
};

export default function RevisiPage() {
  const searchParams = useSearchParams();
  const kodeFromUrl = searchParams.get("kode") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    if (kodeFromUrl) setCode(kodeFromUrl);
  }, [kodeFromUrl]);

  const submit = useCallback(async () => {
    const c = code.trim();
    if (!c) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/revisi/klaim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data: ClaimResult = await res.json().catch(() => ({}));
      setResult(data);
      if (data.ok) setCode("");
    } catch {
      setResult({ ok: false, message: "Koneksi gagal. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }, [code]);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-zinc-500 hover:text-rasya-accent"
      >
        ← Beranda
      </Link>
      <h1 className="mb-2 font-mono text-sm uppercase tracking-widest text-rasya-accent">
        Klaim tiket revisi
      </h1>
      <p className="mb-6 text-zinc-400 text-sm">
        Masukkan kode tiket revisi yang Anda terima. Satu kode hanya bisa dipakai sekali. Setelah diklaim, tim akan memproses revisi Anda.
      </p>

      <div className="rounded-xl border border-rasya-border bg-rasya-card p-6">
        <label className="block text-xs text-zinc-500 mb-2">Kode tiket</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Contoh: RV-a1b2c3d4e5"
          className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-3 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none font-mono"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !code.trim()}
          className="mt-4 w-full rounded-lg bg-rasya-accent px-4 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Klaim revisi"}
        </button>

        {result && (
          <div className={`mt-6 rounded-lg border p-4 text-sm ${result.ok ? "border-rasya-accent/50 bg-rasya-accent/10 text-rasya-accent" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            <p>{result.message}</p>
            {result.ok && result.sisa_revisi !== undefined && (
              <p className="mt-2 text-zinc-400">Sisa tiket revisi untuk order ini: {result.sisa_revisi}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
