"use client";

import { useCallback, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

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

  const { t } = useLanguage();
  const showThankYou = useCallback((highlighted: boolean) => {
    setSuccess({
      ok: true,
      message: t("donate_thanks_msg"),
      highlighted,
    });
    setAmount(0);
    setCustomAmount("");
    setComment("");
    setName("");
    setEmail("");
  }, [t]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (effectiveAmount < 1000) {
      setError(t("donate_error_min"));
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
          setError(data.message || t("donate_error_create"));
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
          setError(t("donate_error_script"));
          return;
        }
        if (typeof window.snap?.pay !== "function") {
          setLoading(false);
          setError(t("donate_error_ready"));
          return;
        }
        setLoading(false);
        const threshold = 50000;
        const highlighted = effectiveAmount >= threshold;
        window.snap.pay(data.snap_token, {
          onSuccess: () => showThankYou(highlighted),
          onPending: () => showThankYou(highlighted),
          onError: () => setError(t("donate_error_failed")),
          onClose: () => {},
        });
      })
      .catch(() => {
        setLoading(false);
        setError(t("donate_error_connection"));
      });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-rasya-accent/30 bg-rasya-card p-6 text-left">
        <p className="mb-4 text-rasya-accent">{t("donate_thanks")}</p>
        <p className="mb-4 text-zinc-300">{success.message}</p>
        {success.highlighted && (
          <p className="mt-4 text-sm text-rasya-accent">{t("donate_priority")}</p>
        )}
        <button
          type="button"
          onClick={() => setSuccess(null)}
          className="mt-4 text-sm text-zinc-400 underline hover:text-white"
        >
          {t("donate_again")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <p className="text-sm text-zinc-400">{t("donate_note")}</p>
      <div>
        <label className="mb-2 block text-sm text-zinc-400">{t("donate_label_amount")}</label>
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
          placeholder={t("donate_placeholder_amount")}
          value={customAmount}
          onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
          className="mt-2 w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm text-zinc-400">{t("donate_label_comment")}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={t("donate_placeholder_comment")}
          className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">{t("donate_label_name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("donate_placeholder_name")}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-400">{t("donate_label_email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("donate_placeholder_email")}
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
        {loading ? t("donate_loading") : t("donate_submit")}
      </button>

      {/* Opsi bayar via QRIS: scan QRIS untuk donasi */}
      {(() => {
        const qrisImageUrl = process.env.NEXT_PUBLIC_QRIS_IMAGE_URL || "/qris.png";
        return (
          <div className="mt-6 border-t border-rasya-border pt-6">
            <p className="mb-2 text-center text-sm text-zinc-400">{t("donate_qris")}</p>
            <div className="flex justify-center">
              <a
                href={qrisImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-rasya-border bg-white p-2"
                aria-label="Buka gambar QRIS"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrisImageUrl}
                  alt="QRIS Donasi - scan dengan aplikasi e-wallet atau bank"
                  className="h-48 w-48 object-contain sm:h-56 sm:w-56"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </a>
            </div>
            <p className="mt-2 text-center text-xs text-zinc-500">{t("donate_qris_hint")}</p>
          </div>
        );
      })()}
    </form>
  );
}
