"use client";

import { useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const OTP_LENGTH = 6;

export default function TaperPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [token, setToken] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signError, setSignError] = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [signedDone, setSignedDone] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const otpString = otp.join("").trim();
      const res = await fetch(`${API_URL}/api/taper/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpString }),
      });
      let data: { ok?: boolean; token?: string; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        if (res.status === 401) setVerifyError("OTP tidak valid atau sudah kedaluwarsa.");
        else setVerifyError("Koneksi gagal. Periksa URL backend.");
        setVerifyLoading(false);
        return;
      }
      if (data.ok && data.token) {
        setToken(data.token);
      } else {
        setVerifyError(data.message || (res.status === 401 ? "OTP tidak valid atau sudah kedaluwarsa." : "Verifikasi gagal."));
      }
    } catch {
      setVerifyError("Koneksi gagal. Periksa URL backend.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !signatureFile) {
      setSignError("Unggah file PDF perjanjian dan gambar tanda tangan.");
      return;
    }
    setSignError("");
    setSignLoading(true);
    try {
      const form = new FormData();
      form.set("pdf", pdfFile);
      form.set("signature", signatureFile);
      const res = await fetch(`${API_URL}/api/taper/sign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = "Gagal memproses.";
        try {
          const j = JSON.parse(t);
          if (j.message) msg = j.message;
        } catch {
          if (t) msg = t;
        }
        setSignError(msg);
        setSignLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "") + "-ditandatangani.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setSignedDone(true);
    } catch {
      setSignError("Koneksi gagal.");
    } finally {
      setSignLoading(false);
    }
  };

  // Belum verifikasi OTP: tampilkan form OTP
  if (!token) {
    return (
      <div className="min-h-screen bg-rasya-dark pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">Penandatanganan Perjanjian (Taper)</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Masukkan kode OTP yang diberikan admin untuk melanjutkan.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    setVerifyError("");
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length > 1) {
                      const digits = v.slice(0, OTP_LENGTH).split("");
                      const next = [...otp];
                      digits.forEach((d, j) => { if (i + j < OTP_LENGTH) next[i + j] = d; });
                      setOtp(next);
                      const idx = Math.min(i + digits.length, OTP_LENGTH - 1);
                      inputRefs.current[idx]?.focus();
                      return;
                    }
                    const next = [...otp];
                    next[i] = v;
                    setOtp(next);
                    if (v && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      setVerifyError("");
                      const next = [...otp];
                      next[i - 1] = "";
                      setOtp(next);
                      inputRefs.current[i - 1]?.focus();
                    }
                  }}
                  className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-lg border border-rasya-border bg-rasya-surface text-white focus:border-rasya-accent focus:outline-none focus:ring-2 focus:ring-rasya-accent/30"
                  aria-label={`Digit OTP ${i + 1}`}
                />
              ))}
            </div>
            {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}
            <button
              type="submit"
              disabled={verifyLoading || otp.join("").length !== OTP_LENGTH}
              className="w-full rounded-lg bg-rasya-accent px-4 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
            >
              {verifyLoading ? "Memverifikasi..." : "Lanjut"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Sudah verifikasi: tampilkan form upload PDF + tanda tangan
  if (signedDone) {
    return (
      <div className="min-h-screen bg-rasya-dark pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Selesai</h1>
          <p className="text-zinc-400 mb-6">
            PDF yang telah ditandatangani telah diunduh. Dokumen yang sama tercatat di pihak admin.
          </p>
          <a
            href="/taper"
            className="inline-block rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90"
          >
            Tandatangani dokumen lain
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rasya-dark pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Penandatanganan Perjanjian</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Unggah file PDF perjanjian dan gambar tanda tangan Anda. Tanda tangan akan ditempelkan di halaman terakhir (grayscale, tanpa background).
        </p>
        <form onSubmit={handleSign} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">File PDF perjanjian</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-rasya-accent file:px-4 file:py-2 file:text-rasya-dark"
            />
            {pdfFile && <p className="mt-1 text-xs text-zinc-500">{pdfFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Gambar tanda tangan (PNG/JPG)</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-rasya-accent file:px-4 file:py-2 file:text-rasya-dark"
            />
            {signatureFile && <p className="mt-1 text-xs text-zinc-500">{signatureFile.name}</p>}
            <p className="mt-1 text-xs text-zinc-500">
              Rekomendasi: foto tanda tangan di atas kertas putih; background putih akan dihilangkan dan tampil grayscale.
            </p>
          </div>
          {signError && <p className="text-sm text-red-400">{signError}</p>}
          <button
            type="submit"
            disabled={signLoading || !pdfFile || !signatureFile}
            className="w-full rounded-lg bg-rasya-accent px-4 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
          >
            {signLoading ? "Memproses..." : "Simpan & unduh PDF"}
          </button>
        </form>
      </div>
    </div>
  );
}
