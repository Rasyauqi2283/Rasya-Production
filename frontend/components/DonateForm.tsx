"use client";

import { useCallback, useState } from "react";

const AMOUNTS = [10000, 25000, 50000, 100000] as const;

type DonateResponse = {
  ok: boolean;
  message: string;
  bank_name?: string;
  bank_number?: string;
  bank_account?: string;
  highlighted: boolean;
};

type CreateTransactionResponse = {
  ok: boolean;
  message?: string;
  snap_token?: string;
  order_id?: string;
  client_key?: string;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const SNAP_SCRIPT_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_SCRIPT_PROD = "https://app.midtrans.com/snap/snap.js";

function loadSnapScript(clientKey: string, isProduction: boolean): Promise<void> {
  const src = isProduction ? SNAP_SCRIPT_PROD : SNAP_SCRIPT_SANDBOX;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Snap"));
    document.body.appendChild(script);
  });
}

export default function DonateForm({ apiUrl }: { apiUrl: string }) {
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<DonateResponse | null>(null);
  const [error, setError] = useState("");

  const effectiveAmount = amount > 0 ? amount : (parseInt(customAmount, 10) || 0);
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

  const showThankYou = useCallback((highlighted: boolean) => {
    setSuccess({
      ok: true,
      message: "Terima kasih. Pembayaran donasi Anda diproses.",
      highlighted,
    });
    setAmount(0);
    setCustomAmount("");
    setComment("");
    setName("");
    setEmail("");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (effectiveAmount < 1000) {
      setError("Nominal minimal Rp 1.000.");
      return;
    }
    setLoading(true);
    fetch(`${apiUrl}/api/donate/create-transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: effectiveAmount,
        comment: comment.trim(),
        name: name.trim(),
        email: email.trim(),
      }),
    })
      .then((res) => res.json())
      .then(async (data: CreateTransactionResponse) => {
        if (!data.ok || !data.snap_token) {
          setLoading(false);
          setError(data.message || "Gagal membuat transaksi. Coba lagi atau gunakan transfer manual.");
          return;
        }
        const clientKey = data.client_key || "";
        if (!clientKey) {
          setLoading(false);
          setError("Backend belum mengatur Midtrans Client Key.");
          return;
        }
        try {
          await loadSnapScript(clientKey, isProduction);
        } catch {
          setLoading(false);
          setError("Gagal memuat halaman pembayaran.");
          return;
        }
        if (typeof window.snap?.pay !== "function") {
          setLoading(false);
          setError("Pembayaran belum siap. Refresh halaman dan coba lagi.");
          return;
        }
        setLoading(false);
        const threshold = 50000;
        const highlighted = effectiveAmount >= threshold;
        window.snap.pay(data.snap_token, {
          onSuccess: () => showThankYou(highlighted),
          onPending: () => showThankYou(highlighted),
          onError: () => setError("Pembayaran gagal atau dibatalkan."),
          onClose: () => {},
        });
      })
      .catch(() => {
        setLoading(false);
        setError("Koneksi gagal. Pastikan backend berjalan dan CORS benar.");
      });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-rasya-accent/30 bg-rasya-card p-6 text-left">
        <p className="mb-4 text-rasya-accent">Terima kasih sudah berdonasi.</p>
        <p className="mb-4 text-zinc-300">{success.message}</p>
        {success.highlighted && (
          <p className="mt-4 text-sm text-rasya-accent">Donasi Anda akan diprioritaskan ke inbox saya.</p>
        )}
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-4 text-sm text-zinc-400 underline hover:text-white"
        >
          Donasi lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <p className="text-sm text-zinc-400">
        Donasi ≥ Rp 50.000 akan diprioritaskan ke inbox saya. Donasi &lt; Rp 50.000 akan tampil sebagai ulasan di situs ini (dengan komentar).
      </p>
      <div>
        <label className="mb-2 block text-sm text-zinc-400">Nominal (IDR)</label>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount(""); }}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                amount === a
                  ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                  : "border-rasya-border text-zinc-400 hover:border-rasya-accent/50"
              }`}
            >
              {a >= 1000 ? `${a / 1000}k` : a}
            </button>
          ))}
        </div>
        <input
          type="number"
          min={0}
          placeholder="Atau isi nominal lain"
          value={customAmount}
          onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
          className="mt-2 w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-zinc-400">Komentar / ulasan (opsional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Pesan atau ulasan Anda..."
          className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Nama</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama Anda"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || effectiveAmount <= 0}
        className="w-full rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark transition hover:bg-rasya-accent/90 disabled:opacity-50"
      >
        {loading ? "Menyiapkan pembayaran..." : "Bayar dengan GoPay"}
      </button>
    </form>
  );
}
