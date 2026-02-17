"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const OTP_LENGTH = 6;

type Placement = {
  x: number; // 0..1
  y: number; // 0..1
  scale: number; // 0.08..0.5
};

// White paper + black ink: bright = transparent (shows white in preview box), dark = black.
async function processSignaturePreview(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca gambar tanda tangan."));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Gambar tanda tangan tidak valid."));
    i.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const threshold = 240;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const gray = Math.round((r + g + b) / 3);
    if (gray > threshold && r > 235 && g > 235 && b > 235) {
      d[i] = 0;
      d[i + 1] = 0;
      d[i + 2] = 0;
      d[i + 3] = 0;
      continue;
    }
    const ink = Math.min(255, Math.max(40, 255 - gray));
    d[i] = 0;
    d[i + 1] = 0;
    d[i + 2] = 0;
    d[i + 3] = ink;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function TaperPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [token, setToken] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");
  const [basePdfUrl, setBasePdfUrl] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [positionLocked, setPositionLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [signError, setSignError] = useState("");
  const [signLoading, setSignLoading] = useState(false);
  const [signedDone, setSignedDone] = useState(false);
  const [placement, setPlacement] = useState<Placement>({ x: 0.72, y: 0.82, scale: 0.2 });
  const [signaturePage, setSignaturePage] = useState(1);
  const [signatureSelected, setSignatureSelected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const placementRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);
  const pointerDownOnSigRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      if (basePdfUrl) URL.revokeObjectURL(basePdfUrl);
    };
  }, [previewPdfUrl, basePdfUrl]);

  useEffect(() => {
    setPreviewReady(false);
    setPositionLocked(false);
    setLockedAt(null);
    setSignError("");
    if (!signatureFile) {
      setSignaturePreviewUrl("");
      return;
    }
    let cancelled = false;
    processSignaturePreview(signatureFile)
      .then((url) => {
        if (!cancelled) setSignaturePreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setSignaturePreviewUrl("");
          setSignError("Gagal memproses preview tanda tangan.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signatureFile]);

  useEffect(() => {
    setPreviewReady(false);
    setPositionLocked(false);
    setLockedAt(null);
    setPreviewPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setBasePdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return pdfFile ? URL.createObjectURL(pdfFile) : "";
    });
  }, [pdfFile]);

  const requestSignedPdf = async (previewOnly: boolean) => {
    if (!pdfFile || !signatureFile) {
      setSignError("Unggah file PDF perjanjian dan gambar tanda tangan.");
      return false;
    }
    setSignError("");
    if (previewOnly) setPreviewLoading(true);
    else setSignLoading(true);
    try {
      const form = new FormData();
      form.set("pdf", pdfFile);
      form.set("signature", signatureFile);
      form.set("preview_only", previewOnly ? "1" : "0");
      form.set("x_ratio", placement.x.toFixed(4));
      form.set("y_ratio", placement.y.toFixed(4));
      form.set("scale_ratio", placement.scale.toFixed(4));
      form.set("page", String(signaturePage));
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
        return false;
      }
      const blob = await res.blob();
      if (previewOnly) {
        const nextUrl = URL.createObjectURL(blob);
        setPreviewPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
        setPreviewReady(true);
        return true;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFile.name.replace(/\.pdf$/i, "") + "-ditandatangani.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setSignedDone(true);
      return true;
    } catch {
      setSignError("Koneksi gagal.");
      return false;
    } finally {
      if (previewOnly) setPreviewLoading(false);
      else setSignLoading(false);
    }
  };

  const handleSavePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPositionLocked(false);
    setLockedAt(null);
  };

  const handleLockPosition = async () => {
    const ok = await requestSignedPdf(true);
    if (ok) {
      setPositionLocked(true);
      setLockedAt(
        new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "medium",
        })
      );
    }
  };

  const handleUnlockPosition = () => {
    setPositionLocked(false);
    setLockedAt(null);
    setSignatureSelected(false);
    // Keep showing original PDF; do not revoke basePdfUrl or change iframe to a revoked URL
  };

  const handleFinalDownload = async () => {
    await requestSignedPdf(false);
  };

  const updatePlacementFromPointer = (clientX: number, clientY: number) => {
    const box = placementRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));
    setPlacement((p) => ({ ...p, x: clampedX, y: clampedY }));
  };

  const handleSignaturePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    e.stopPropagation(); // agar stage tidak menerima pointer down dan memanggil setSignatureSelected(false)
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
    pointerDownOnSigRef.current = true;
  };

  const handleSignaturePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!pointerDownOnSigRef.current || !signatureSelected) return;
    const start = dragStartRef.current;
    if (start && (Math.abs(e.clientX - start.x) > 5 || Math.abs(e.clientY - start.y) > 5)) {
      didDragRef.current = true;
      setDragging(true);
      updatePlacementFromPointer(e.clientX, e.clientY);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleSignaturePointerUp = () => {
    if (!pointerDownOnSigRef.current) return;
    pointerDownOnSigRef.current = false;
    if (!didDragRef.current) {
      setSignatureSelected((s) => !s);
    }
    setDragging(false);
    dragStartRef.current = null;
    didDragRef.current = false;
  };

  const handleStagePointerDown = () => {
    setSignatureSelected(false);
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Penandatanganan Perjanjian</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Sistem baru: unggah file perjanjian + tanda tangan, cek preview grayscale, simpan, atur posisi tanda tangan, lalu klik <span className="font-semibold text-zinc-300">Unduh & berikan</span>.
        </p>
        <form onSubmit={handleSavePreview} className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4 rounded-xl border border-rasya-border bg-rasya-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">1) Unggah dokumen</h2>
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
                Rekomendasi: foto tanda tangan di atas kertas putih; background putih dihilangkan, tinta hitam di atas kertas HVS.
              </p>
            </div>
            {signaturePreviewUrl && (
              <div className="rounded-lg border border-rasya-border bg-rasya-dark/50 p-3">
                <p className="text-xs font-medium text-zinc-300 mb-2">Preview tanda tangan (hitam di atas kertas putih)</p>
                <div className="rounded bg-white p-3 flex items-center justify-center min-h-[80px]">
                  <img src={signaturePreviewUrl} alt="Preview tanda tangan" className="max-h-20 object-contain" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!pdfFile || !signatureFile}
              className="w-full rounded-lg bg-rasya-accent px-4 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
            >
              Simpan
            </button>
            <p className="text-xs text-zinc-500">
              Setelah simpan, atur posisi tanda tangan langsung di area preview PDF.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-rasya-border bg-rasya-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">2) Atur posisi & preview draft</h2>
            {!pdfFile || !signatureFile ? (
              <p className="text-sm text-zinc-500">
                Upload dua file terlebih dahulu, lalu klik <span className="text-zinc-300">Simpan</span> untuk mulai atur posisi.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-xs text-zinc-400">Tanda tangan di halaman ke</label>
                  <input
                    type="number"
                    min={1}
                    value={signaturePage}
                    onChange={(e) => setSignaturePage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    disabled={positionLocked}
                    className="w-16 rounded border border-rasya-border bg-rasya-dark px-2 py-1 text-white text-sm"
                  />
                </div>
                <div
                  ref={placementRef}
                  onPointerDown={handleStagePointerDown}
                  className="relative min-h-[620px] rounded-lg border border-rasya-border bg-rasya-dark/60 overflow-hidden"
                >
                  {basePdfUrl || previewPdfUrl ? (
                    <iframe
                      key={positionLocked ? "locked" : "editing"}
                      src={positionLocked && previewPdfUrl ? previewPdfUrl : basePdfUrl}
                      title="Preview draft perjanjian bertanda tangan"
                      className="h-[620px] w-full rounded-lg"
                    />
                  ) : (
                    <div className="flex h-[620px] items-center justify-center text-sm text-zinc-500">
                      Preview belum tersedia.
                    </div>
                  )}
                  {signaturePreviewUrl && !positionLocked && (
                    <img
                      src={signaturePreviewUrl}
                      alt="Tanda tangan (klik sekali untuk pilih, geser untuk pindah, klik lagi untuk lepas)"
                      onPointerDown={handleSignaturePointerDown}
                      onPointerMove={handleSignaturePointerMove}
                      onPointerUp={handleSignaturePointerUp}
                      onPointerCancel={handleSignaturePointerUp}
                      className={`absolute z-20 select-none touch-none ${signatureSelected ? "cursor-grabbing ring-2 ring-rasya-accent ring-offset-2 ring-offset-rasya-dark" : "cursor-grab"}`}
                      style={{
                        left: `${placement.x * 100}%`,
                        top: `${placement.y * 100}%`,
                        width: `${placement.scale * 100}%`,
                        transform: "translate(-50%, -50%)",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                        maxWidth: "320px",
                      }}
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  {signatureSelected ? "Geser untuk pindah posisi, klik sekali lagi untuk lepas." : "Klik tanda tangan sekali untuk pilih, lalu geser. Klik lagi untuk lepas."}
                </p>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Ukuran tanda tangan</label>
                  <input
                    type="range"
                    min={0.08}
                    max={0.5}
                    step={0.01}
                    value={placement.scale}
                    onChange={(e) => setPlacement((p) => ({ ...p, scale: Number(e.target.value) }))}
                    disabled={positionLocked}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleLockPosition}
                    disabled={previewLoading || positionLocked}
                    className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-sm font-medium text-zinc-200 hover:border-rasya-accent disabled:opacity-50"
                  >
                    {previewLoading ? "Mengunci..." : "Lock position"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlockPosition}
                    disabled={!positionLocked}
                    className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-sm font-medium text-zinc-200 hover:border-rasya-accent disabled:opacity-50"
                  >
                    Ubah posisi lagi
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  {positionLocked
                    ? "Posisi terkunci. Sekarang Anda bisa unduh & berikan."
                    : "Geser tanda tangan sampai pas, lalu klik Lock position."}
                </p>
                {positionLocked && lockedAt && (
                  <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    Posisi terkunci pada {lockedAt} (WIB)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {signError && <p className="mb-3 text-sm text-red-400">{signError}</p>}
            <button
              type="button"
              onClick={handleFinalDownload}
              disabled={signLoading || !positionLocked || !previewReady || !pdfFile || !signatureFile}
              className="w-full rounded-lg bg-rasya-accent px-4 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
            >
              {signLoading ? "Memproses unduhan..." : "Unduh & berikan"}
            </button>
            <p className="mt-2 text-xs text-zinc-500">
              Saat klik <span className="text-zinc-300">Unduh & berikan</span>, file final diunduh ke perangkat Anda dan salinannya disimpan di arsip admin.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
