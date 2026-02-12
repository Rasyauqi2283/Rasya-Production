"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ADMIN_KEY_STORAGE = "rasya_admin_key";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const SERVICE_TAGS = ["Design", "Web & Digital", "Konten & Kreatif", "Lain-lain"] as const;

// Parse teks harga Indonesia (e.g. "400 ribu", "1,5 jt") ke angka. Return null jika tidak bisa parse.
function parsePriceIdr(text: string): number | null {
  const t = text.replace(/\s*\([^)]*\)\s*/g, "").trim().toLowerCase();
  const match = t.match(/^([\d,.]+)\s*(rb|ribu|jt|juta)?$/);
  if (!match) return null;
  let num = parseFloat(match[1].replace(",", ".").replace(/\s/g, ""));
  if (match[2] === "rb" || match[2] === "ribu") num *= 1000;
  else if (match[2] === "jt" || match[2] === "juta") num *= 1000000;
  return Number.isFinite(num) ? num : null;
}

// Format angka ke teks harga Indonesia (e.g. 360000 -> "360 ribu", 1350000 -> "1,35 jt").
function formatPriceIdr(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace(".", ",") + " jt";
  if (num >= 1000) return (num / 1000).toFixed(0) + " ribu";
  return String(num);
}
type Service = {
  id: string;
  title: string;
  tag?: string;
  desc: string;
  price_awal?: string;
  closed?: boolean;
  discount_percent?: number;
  price_after_discount?: string;
};
type Donation = {
  id: string;
  amount: number;
  comment: string;
  name: string;
  email: string;
  highlighted: boolean;
  created_at: string;
};
type OrderItem = {
  id: string;
  layanan: string;
  deskripsi_pekerjaan: string;
  deadline: string;
  mulai_tanggal: string;
  kesepakatan_brief_uang: string;
  kapan_uang_masuk: string;
  created_at: string;
};
type PortoItem = {
  id: string;
  title: string;
  tag: string;
  description: string;
  image_url: string;
  link_url?: string;
  layanan?: string[];
  created_at: string;
};

function getAdminKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

function headers(key: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  if (key) h["X-Admin-Key"] = key;
  return h;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (res: { credential: string }) => void;
          }) => void;
          renderButton: (
            el: HTMLElement,
            config: { theme?: string; size?: string; type?: string }
          ) => void;
        };
      };
    };
  }
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = getAdminKey();
    if (k) {
      setAdminKey(k);
      setAuthed(true);
    }
  }, []);

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 403) {
            setError("Akun ini tidak diizinkan masuk. Hanya email admin yang terdaftar yang bisa masuk.");
          } else {
            setError("Gagal masuk. Coba lagi.");
          }
          return;
        }
        if (data.token) {
          sessionStorage.setItem(ADMIN_KEY_STORAGE, data.token);
          setAdminKey(data.token);
          setAuthed(true);
        } else {
          setError("Gagal masuk. Coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptLoaded || !window.google?.accounts?.id) return;
    const el = googleBtnRef.current;
    if (!el || el.hasChildNodes()) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => loginWithGoogle(res.credential),
    });
    window.google.accounts.id.renderButton(el, {
      theme: "filled_black",
      size: "large",
      type: "standard",
    });
  }, [scriptLoaded, loginWithGoogle]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
    setAuthed(false);
  }, []);

  if (!authed) {
    return (
      <>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
        />
        <div className="min-h-screen bg-rasya-dark pt-24 px-6 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-rasya-border bg-rasya-surface p-8">
            <h1 className="text-xl font-bold text-white mb-2">Admin Rasya Production</h1>
            <p className="text-sm text-zinc-400 mb-6">
              Masuk dengan akun Google yang terdaftar sebagai admin. Nantinya bisa disambungkan ke Google Calendar.
            </p>
            {!GOOGLE_CLIENT_ID ? (
              <p className="text-sm text-amber-400 mb-4">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diset. Tambahkan di .env.local lalu build/restart dev.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div ref={googleBtnRef} />
                {loading && <p className="text-sm text-zinc-500">Memverifikasi…</p>}
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-rasya-dark pt-24 pb-16 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-zinc-400 hover:text-rasya-accent">← Situs</a>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-zinc-400 hover:text-red-400"
            >
              Keluar
            </button>
          </div>
        </div>

        <AdminLayanan apiUrl={API_URL} adminKey={adminKey} />
        <AdminOrder apiUrl={API_URL} adminKey={adminKey} />
        <AdminDonasi apiUrl={API_URL} adminKey={adminKey} />
        <AdminPorto apiUrl={API_URL} adminKey={adminKey} />
        <AdminAgreement apiUrl={API_URL} adminKey={adminKey} />
      </div>
    </div>
  );
}

function AdminLayanan({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<string>(SERVICE_TAGS[0]);
  const [desc, setDesc] = useState("");
  const [priceAwal, setPriceAwal] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriceAwal, setEditPriceAwal] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState("");
  const [editPriceAfterDiscount, setEditPriceAfterDiscount] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Auto-hitung harga setelah diskon dari harga awal + diskon %
  useEffect(() => {
    if (!editing) return;
    const pct = editDiscountPercent.trim() === "" ? 0 : Math.min(100, Math.max(0, parseInt(editDiscountPercent, 10) || 0));
    if (pct <= 0) return;
    const num = parsePriceIdr(editPriceAwal);
    if (num !== null && num > 0) {
      const after = Math.round(num * (1 - pct / 100));
      setEditPriceAfterDiscount(formatPriceIdr(after));
    }
  }, [editing, editPriceAwal, editDiscountPercent]);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/services`, { headers: headers(adminKey) });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.services)) setServices(data.services);
    } catch {
      setServices([]);
    }
  }, [apiUrl, adminKey]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const add = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/services`, {
        method: "POST",
        headers: headers(adminKey),
        body: JSON.stringify({
          title: title.trim(),
          tag: tag || "Lain-lain",
          desc: desc.trim(),
          price_awal: priceAwal.trim(),
        }),
      });
      if (res.ok) {
        setTitle("");
        setTag(SERVICE_TAGS[0]);
        setDesc("");
        setPriceAwal("");
        fetchList();
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus layanan ini permanen?")) return;
    const res = await fetch(`${apiUrl}/api/admin/services?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(adminKey),
    });
    if (res.ok) fetchList();
  };

  const toggleClose = async (id: string, currentClosed: boolean) => {
    const res = await fetch(`${apiUrl}/api/admin/services/close`, {
      method: "POST",
      headers: headers(adminKey),
      body: JSON.stringify({ id, closed: !currentClosed }),
    });
    if (res.ok) fetchList();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === services.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(services.map((s) => s.id)));
  };

  const bulkClose = async () => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      const s = services.find((x) => x.id === id);
      if (s && !s.closed) {
        await fetch(`${apiUrl}/api/admin/services/close`, {
          method: "POST",
          headers: headers(adminKey),
          body: JSON.stringify({ id, closed: true }),
        });
      }
    }
    setSelectedIds(new Set());
    fetchList();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} layanan yang dipilih permanen?`)) return;
    for (const id of Array.from(selectedIds)) {
      await fetch(`${apiUrl}/api/admin/services?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: headers(adminKey),
      });
    }
    setSelectedIds(new Set());
    fetchList();
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setEditTitle(s.title);
    setEditTag(s.tag || SERVICE_TAGS[0]);
    setEditDesc(s.desc || "");
    setEditPriceAwal(s.price_awal || "");
    setEditDiscountPercent(s.discount_percent ? String(s.discount_percent) : "");
    setEditPriceAfterDiscount(s.price_after_discount || "");
    setEditError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editing || !editTitle.trim()) return;
    setEditSaving(true);
    setEditError("");
    try {
      const discountNum = editDiscountPercent.trim() === "" ? 0 : Math.min(100, Math.max(0, parseInt(editDiscountPercent, 10) || 0));
      const res = await fetch(`${apiUrl}/api/admin/services`, {
        method: "PUT",
        headers: headers(adminKey),
        body: JSON.stringify({
          id: editing.id,
          title: editTitle.trim(),
          tag: editTag || "Lain-lain",
          desc: editDesc.trim(),
          price_awal: editPriceAwal.trim(),
          discount_percent: discountNum,
          price_after_discount: editPriceAfterDiscount.trim(),
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (res.ok && data.ok) {
        closeEdit();
        fetchList();
      } else {
        setEditError(data.message || "Gagal menyimpan. Cek koneksi dan pastikan backend jalan.");
      }
    } catch (err) {
      setEditError("Gagal kirim ke server. Pastikan backend API jalan dan CORS mengizinkan PUT.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <section className="mb-12 rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">1. Kelola Layanan</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Tambah, tutup/buka, atau hapus layanan. Layanan yang ditutup tidak tampil di halaman utama, Order Layanan, dan Upload Porto—bisa dibuka lagi kapan saja.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul layanan"
          className="rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Tag (untuk section &quot;Apa yang bisa saya kerjakan&quot;)</label>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
          >
            {SERVICE_TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={priceAwal}
          onChange={(e) => setPriceAwal(e.target.value)}
          placeholder="Price awal (mis. 200 ribu (harga awal) atau Sesuai brief)"
          className="rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Deskripsi singkat"
          className="sm:col-span-2 rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={loading || !title.trim()}
          className="sm:col-span-2 rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50 w-fit"
        >
          Tambah
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-400">Daftar layanan (semua yang terdaftar):</span>
        {services.length > 0 && (
          <>
            <button
              type="button"
              onClick={selectAll}
              className="text-xs rounded border border-rasya-border px-2 py-1 text-zinc-400 hover:border-rasya-accent/50 hover:text-white"
            >
              {selectedIds.size === services.length ? "Batal pilih semua" : "Pilih semua"}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={bulkClose}
                  className="text-xs rounded border border-amber-500/50 px-2 py-1 text-amber-400 hover:bg-amber-500/20"
                >
                  Tutup yang dipilih
                </button>
                <button
                  type="button"
                  onClick={bulkDelete}
                  className="text-xs rounded border border-red-500/50 px-2 py-1 text-red-400 hover:bg-red-500/20"
                >
                  Hapus yang dipilih
                </button>
              </>
            )}
          </>
        )}
      </div>
      <ul className="space-y-2">
        {services.map((s) => (
          <li
            key={s.id}
            className={`flex items-center gap-3 rounded-lg border border-rasya-border p-3 ${
              s.closed ? "bg-rasya-dark/60 opacity-75" : "bg-rasya-dark"
            }`}
          >
            <label className="flex shrink-0 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.has(s.id)}
                onChange={() => toggleSelect(s.id)}
                className="h-4 w-4 rounded border-rasya-border bg-rasya-card text-rasya-accent focus:ring-rasya-accent"
              />
              <span className="sr-only">Pilih {s.title}</span>
            </label>
            <div className="min-w-0 flex-1">
              <p className={`font-medium ${s.closed ? "text-zinc-500 line-through" : "text-white"}`}>
                {s.title}
              </p>
              {s.tag && (
                <p className="text-xs text-rasya-accent font-mono">{s.tag}</p>
              )}
              {s.price_awal && (
                <p className="text-sm text-rasya-accent">{s.price_awal}</p>
              )}
              {s.desc && (
                <p className="text-sm text-zinc-500 truncate max-w-md">{s.desc}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => openEdit(s)}
                className="rounded border border-rasya-accent/50 px-2 py-1 text-xs font-medium text-rasya-accent hover:bg-rasya-accent/20"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toggleClose(s.id, !!s.closed)}
                className={`rounded border px-2 py-1 text-xs font-medium ${
                  s.closed
                    ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                    : "border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                {s.closed ? "Buka" : "Tutup"}
              </button>
              <button
                type="button"
                onClick={() => del(s.id)}
                className="rounded border border-red-500/50 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-zinc-500">Belum ada layanan. Tambah dari form di atas.</p>
        )}
      </ul>

      {/* Modal Edit Layanan */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" aria-modal="true" role="dialog">
          <div className="w-full max-w-lg rounded-xl border border-rasya-border bg-rasya-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Edit layanan: {editing.title}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Judul</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tag</label>
                <select
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                >
                  {SERVICE_TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Deskripsi (narasi, guna/fungsi)</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none resize-y"
                  placeholder="Teks narasi layanan..."
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Harga awal</label>
                <input
                  type="text"
                  value={editPriceAwal}
                  onChange={(e) => setEditPriceAwal(e.target.value)}
                  placeholder="Mis. 400 ribu (harga awal) atau Sesuai brief"
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Diskon % (0–100, kosong = tidak diskon)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editDiscountPercent}
                    onChange={(e) => setEditDiscountPercent(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Harga setelah diskon</label>
                  <input
                    type="text"
                    value={editPriceAfterDiscount}
                    onChange={(e) => setEditPriceAfterDiscount(e.target.value)}
                    placeholder="Otomatis dari harga awal + diskon % (bisa diedit)"
                    className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                  />
                </div>
              </div>
              {editError && (
                <p className="text-sm text-red-400">{editError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-rasya-border px-4 py-2 text-sm text-zinc-300 hover:bg-rasya-dark"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving || !editTitle.trim()}
                className="rounded-lg bg-rasya-accent px-4 py-2 text-sm font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
              >
                {editSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminOrder({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [layanan, setLayanan] = useState("");
  const [deskripsiPekerjaan, setDeskripsiPekerjaan] = useState("");
  const [deadline, setDeadline] = useState("");
  const [mulaiTanggal, setMulaiTanggal] = useState("");
  const [kesepakatanUang, setKesepakatanUang] = useState("");
  const [kapanUangMasuk, setKapanUangMasuk] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders`, { headers: headers(adminKey) });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.orders)) setOrders(data.orders);
    } catch {
      setOrders([]);
    }
  }, [apiUrl, adminKey]);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/services`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.services)) setServices(data.services);
    } catch {
      setServices([]);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchOrders();
    fetchServices();
  }, [fetchOrders, fetchServices]);

  const add = async () => {
    if (!layanan.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders`, {
        method: "POST",
        headers: headers(adminKey),
        body: JSON.stringify({
          layanan: layanan.trim(),
          deskripsi_pekerjaan: deskripsiPekerjaan.trim(),
          deadline: deadline.trim(),
          mulai_tanggal: mulaiTanggal.trim(),
          kesepakatan_brief_uang: kesepakatanUang.trim(),
          kapan_uang_masuk: kapanUangMasuk.trim(),
        }),
      });
      if (res.ok) {
        setLayanan("");
        setDeskripsiPekerjaan("");
        setDeadline("");
        setMulaiTanggal("");
        setKesepakatanUang("");
        setKapanUangMasuk("");
        fetchOrders();
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus order ini?")) return;
    const res = await fetch(`${apiUrl}/api/admin/orders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(adminKey),
    });
    if (res.ok) fetchOrders();
  };

  const byLayanan = orders.reduce<Map<string, OrderItem[]>>((acc, o) => {
    const t = o.layanan.trim() || "(Tanpa layanan)";
    if (!acc.has(t)) acc.set(t, []);
    acc.get(t)!.push(o);
    return acc;
  }, new Map());

  return (
    <section className="mb-12 rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">2. Order Layanan</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Teknis order: apa yang dikerjakan, deadline, mulai, kesepakatan brief (uang), kapan uang masuk. Tampil di antrian halaman utama (hanya nama layanan).
      </p>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Layanan</label>
          <select
            value={layanan}
            onChange={(e) => setLayanan(e.target.value)}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
          >
            <option value="">Pilih layanan</option>
            {services.map((s) => (
              <option key={s.id} value={s.title}>{s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Deadline</label>
          <input
            type="text"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            placeholder="YYYY-MM-DD atau teks"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Mulai tanggal</label>
          <input
            type="text"
            value={mulaiTanggal}
            onChange={(e) => setMulaiTanggal(e.target.value)}
            placeholder="YYYY-MM-DD atau teks"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kesepakatan brief (uang)</label>
          <input
            type="text"
            value={kesepakatanUang}
            onChange={(e) => setKesepakatanUang(e.target.value)}
            placeholder="Contoh: 2 jt"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kapan uang masuk</label>
          <input
            type="text"
            value={kapanUangMasuk}
            onChange={(e) => setKapanUangMasuk(e.target.value)}
            placeholder="Tanggal atau &quot;belum&quot;"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-zinc-500 mb-1">Apa yang akan / ingin dikerjakan</label>
          <textarea
            value={deskripsiPekerjaan}
            onChange={(e) => setDeskripsiPekerjaan(e.target.value)}
            placeholder="Deskripsi singkat pekerjaan"
            rows={2}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={add}
            disabled={loading || !layanan.trim()}
            className="rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
          >
            Tambah order
          </button>
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada order. Tambah dari form di atas.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(byLayanan.entries()).map(([namaLayanan, items]) => (
            <div key={namaLayanan} className="rounded-lg border border-rasya-border bg-rasya-dark/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-rasya-border font-mono text-sm font-medium text-rasya-accent">
                {namaLayanan}
              </div>
              <ul className="divide-y divide-rasya-border/50">
                {items.map((o) => (
                  <li key={o.id} className="flex justify-between gap-4 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300">{o.deskripsi_pekerjaan || "—"}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Deadline: {o.deadline || "—"} · Mulai: {o.mulai_tanggal || "—"} · Uang: {o.kesepakatan_brief_uang || "—"} · Masuk: {o.kapan_uang_masuk || "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => del(o.id)}
                      className="text-sm text-red-400 hover:text-red-300 shrink-0"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminDonasi({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selected, setSelected] = useState<Donation | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/admin/donations`, { headers: headers(adminKey) })
      .then((r) => r.text())
      .then((text) => {
        try {
          const d = text ? JSON.parse(text) : {};
          if (d.ok && Array.isArray(d.donations)) setDonations(d.donations);
        } catch {
          // ignore invalid/empty response
        }
      })
      .finally(() => setLoading(false));
  }, [apiUrl, adminKey]);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString("id-ID");
    } catch {
      return s;
    }
  };

  const totalPages = Math.max(1, Math.ceil(donations.length / perPage) || 1);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const current = donations.slice(start, start + perPage);

  return (
    <section className="mb-12 rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">3. Preview Donasi & Ulasan</h2>
      <p className="text-sm text-zinc-400 mb-4">Semua donasi (hanya kamu yang bisa lihat).</p>
      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-rasya-border text-zinc-400">
                  <th className="py-2 pr-4">Tanggal</th>
                  <th className="py-2 pr-4">Nominal</th>
                  <th className="py-2 pr-4">Prioritas</th>
                  <th className="py-2 pr-4">Nama</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2">Komentar</th>
                </tr>
              </thead>
              <tbody>
                {current.map((d) => {
                  const isSelected = selected?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      className={
                        "border-b border-rasya-border/50 cursor-pointer " +
                        (isSelected ? "bg-rasya-dark/70" : "hover:bg-rasya-dark/40")
                      }
                      onClick={() => setSelected(d)}
                    >
                      <td className="py-2 pr-4 text-zinc-300">{formatDate(d.created_at)}</td>
                      <td className="py-2 pr-4 text-rasya-accent">
                        Rp {(d.amount / 1000).toFixed(0)}k
                      </td>
                      <td className="py-2 pr-4">{d.highlighted ? "Ya" : "-"}</td>
                      <td className="py-2 pr-4 text-zinc-300">{d.name || "-"}</td>
                      <td className="py-2 pr-4 text-zinc-300">{d.email || "-"}</td>
                      <td className="py-2 text-zinc-400">
                        {d.comment ? "Klik baris untuk lihat" : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {donations.length === 0 && (
              <p className="text-sm text-zinc-500 py-4">Belum ada donasi.</p>
            )}
          </div>

          {donations.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-rasya-border px-2 py-1 disabled:opacity-40 hover:border-rasya-accent/60 hover:text-white"
                >
                  ‹ Prev
                </button>
                <span>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-rasya-border px-2 py-1 disabled:opacity-40 hover:border-rasya-accent/60 hover:text-white"
                >
                  Next ›
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                Menampilkan {start + 1}–{Math.min(start + perPage, donations.length)} dari{" "}
                {donations.length} donasi
              </p>
            </div>
          )}

          {selected && selected.comment && (
            <div className="mt-6 rounded-lg border border-rasya-border bg-rasya-dark p-4">
              <p className="mb-1 text-xs font-mono uppercase text-rasya-accent">
                Komentar donasi
              </p>
              <p className="mb-1 text-sm text-zinc-300">
                {selected.name || "Anonim"} • Rp {(selected.amount / 1000).toFixed(0)}k
              </p>
              <p className="mb-1 text-xs text-zinc-500">{formatDate(selected.created_at)}</p>
              <p className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">
                {selected.comment}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AdminPorto({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [porto, setPorto] = useState<PortoItem[]>([]);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [servicesForPorto, setServicesForPorto] = useState<Service[]>([]);
  const [layananList, setLayananList] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/porto`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.porto)) setPorto(data.porto);
    } catch {
      setPorto([]);
    }
  }, [apiUrl]);

  // Daftar layanan dari Kelola Layanan (sama dengan Order Layanan), dikelompokkan per tag.
  useEffect(() => {
    fetch(`${apiUrl}/api/services`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data?.ok && Array.isArray(data.services)) setServicesForPorto(data.services);
        } catch {
          // ignore
        }
      })
      .catch(() => {});
  }, [apiUrl]);

  const layananByTag = SERVICE_TAGS.map((tagLabel) => ({
    tag: tagLabel,
    items: servicesForPorto.filter((s) => (s.tag || "Lain-lain") === tagLabel).map((s) => s.title),
  })).filter((g) => g.items.length > 0);
  const layananOptions = servicesForPorto.map((s) => s.title).filter((t) => t.trim());

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleLayanan = (label: string) => {
    setLayananList((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  const upload = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("tag", tag.trim());
      form.set("description", description.trim());
      if (linkUrl.trim()) form.set("url", linkUrl.trim());
      if (layananList.length) form.set("layanan", JSON.stringify(layananList));
      if (file) form.set("image", file);
      const res = await fetch(`${apiUrl}/api/admin/porto`, {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
        body: form,
      });
      if (res.ok) {
        setTitle("");
        setTag("");
        setDescription("");
        setLinkUrl("");
        setLayananList([]);
        setFile(null);
        fetchList();
      } else if (res.status === 401) {
        // key invalid
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus porto ini?")) return;
    const res = await fetch(`${apiUrl}/api/admin/porto?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(adminKey),
    });
    if (res.ok) fetchList();
  };

  const imageBase = apiUrl.replace(/\/$/, "");

  return (
    <section className="rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">4. Upload Porto</h2>
      <p className="text-sm text-zinc-400 mb-4">Proyek yang sudah selesai kontrak (bukti nyata).</p>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul proyek"
          className="rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Tag (mis. Music / Web)"
          className="rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat"
          className="sm:col-span-2 rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="URL website (mis. https://...) — klik card = buka link"
          className="sm:col-span-2 rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <div className="sm:col-span-2">
          <label className="block text-sm text-zinc-400 mb-2">
            Layanan jasa (pilih per tag, bisa beberapa)
          </label>
          {layananByTag.length === 0 ? (
            <p className="text-xs text-zinc-500">
              Belum ada layanan dari menu &quot;Kelola Layanan&quot;. Tambah layanan (dan pilih tag) dulu supaya bisa dipilih di sini.
            </p>
          ) : (
            <div className="space-y-3">
              {layananByTag.map(({ tag: tagLabel, items }) => (
                <div key={tagLabel}>
                  <p className="text-xs font-mono text-rasya-accent mb-1.5">{tagLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((label) => {
                      const selected = layananList.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleLayanan(label)}
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition " +
                            (selected
                              ? "border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
                              : "border-rasya-border text-zinc-300 hover:border-rasya-accent/50 hover:text-white")
                          }
                        >
                          <span className="truncate max-w-[140px]">{label}</span>
                          {selected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 14 14"
                              aria-hidden
                              className="text-white/80"
                            >
                              <path
                                d="M3 3l8 8M11 3l-8 8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-rasya-accent file:px-3 file:py-1 file:text-rasya-dark"
          />
          <button
            type="button"
            onClick={upload}
            disabled={loading || !title.trim()}
            className="rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>
      {porto.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada porto. Upload dari form di atas.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(
            porto.reduce<Map<string, PortoItem[]>>((acc, p) => {
              const t = p.tag.trim() || "(Tanpa tag)";
              if (!acc.has(t)) acc.set(t, []);
              acc.get(t)!.push(p);
              return acc;
            }, new Map()).entries()
          ).map(([tagName, items]) => (
            <div key={tagName} className="rounded-lg border border-rasya-border bg-rasya-dark/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-rasya-border font-mono text-sm font-medium text-rasya-accent">
                {tagName}
              </div>
              <ul className="divide-y divide-rasya-border/50">
                {items.map((p) => (
                  <li key={p.id} className="flex gap-4 p-3">
                    {p.image_url && (
                      <img
                        src={p.image_url.startsWith("http") ? p.image_url : `${imageBase}${p.image_url}`}
                        alt={p.title}
                        className="h-20 w-28 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">
                        {p.title}
                        {p.layanan && p.layanan.length > 0 && (
                          <span className="font-normal text-rasya-accent ml-1">
                            — {p.layanan.join(", ")}
                          </span>
                        )}
                      </p>
                      {p.link_url && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">→ {p.link_url}</p>
                      )}
                      <p className="text-sm text-zinc-500 truncate">{p.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => del(p.id)}
                      className="text-sm text-red-400 hover:text-red-300 shrink-0"
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type AgreementForm = {
  nomor_perjanjian: string;
  tanggal: string;
  hari: string;
  hari_num: string;
  bulan: string;
  tahun: string;
  tempat: string;
  p1_nama: string;
  p1_alamat: string;
  p1_email: string;
  p1_telepon: string;
  p2_nama: string;
  p2_jabatan: string;
  p2_alamat: string;
  p2_email: string;
  p2_telepon: string;
  nilai_proyek_angka: string;
  nilai_proyek_terbilang: string;
  dp_percent: string;
  dp_amount: string;
  termin2_percent: string;
  termin2_amount: string;
  termin2_waktu: string;
  pelunasan_percent: string;
  pelunasan_amount: string;
  bank_name: string;
  bank_number: string;
  bank_account: string;
  keterlambatan_hari: string;
  revisi_putaran: string;
  revisi_hari: string;
  konfirmasi_hari: string;
  serah_terima_hari: string;
  tanggung_jawab_hari: string;
  pemutusan_hari: string;
};

const defaultAgreement: AgreementForm = {
  nomor_perjanjian: "",
  tanggal: "",
  hari: "",
  hari_num: "",
  bulan: "",
  tahun: "",
  tempat: "",
  p1_nama: "",
  p1_alamat: "",
  p1_email: "",
  p1_telepon: "",
  p2_nama: "",
  p2_jabatan: "",
  p2_alamat: "",
  p2_email: "",
  p2_telepon: "",
  nilai_proyek_angka: "",
  nilai_proyek_terbilang: "",
  dp_percent: "50",
  dp_amount: "",
  termin2_percent: "",
  termin2_amount: "",
  termin2_waktu: "",
  pelunasan_percent: "50",
  pelunasan_amount: "",
  bank_name: "BCA",
  bank_number: "",
  bank_account: "Rasya Production",
  keterlambatan_hari: "14 (empat belas)",
  revisi_putaran: "2 (dua)",
  revisi_hari: "7 (tujuh)",
  konfirmasi_hari: "5",
  serah_terima_hari: "7 (tujuh)",
  tanggung_jawab_hari: "14 (empat belas)",
  pemutusan_hari: "14 (empat belas)",
};

type SignedDocItem = {
  id: string;
  otp_code: string;
  label: string;
  filename: string;
  created_at: string;
  download_url?: string;
};

function AdminAgreement({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [form, setForm] = useState<AgreementForm>(defaultAgreement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpLabel, setOtpLabel] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [generatedExpiry, setGeneratedExpiry] = useState("");
  const [generatedURL, setGeneratedURL] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [signedDocs, setSignedDocs] = useState<SignedDocItem[]>([]);
  const [taperBaseUrl, setTaperBaseUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setTaperBaseUrl(window.location.origin);
  }, []);

  const set = (key: keyof AgreementForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const generateOtp = async () => {
    setOtpLoading(true);
    setGeneratedOTP("");
    setGeneratedExpiry("");
    setGeneratedURL("");
    try {
      const h: HeadersInit = { "Content-Type": "application/json" };
      if (adminKey) h["X-Admin-Key"] = adminKey;
      const res = await fetch(`${apiUrl}/api/admin/taper/otp`, {
        method: "POST",
        headers: h,
        body: JSON.stringify({ label: otpLabel.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setGeneratedOTP(data.otp);
        setGeneratedExpiry(data.expires_at || "");
        setGeneratedURL(data.url || "");
        fetchSignedDocs();
      }
    } catch {
      // ignore
    } finally {
      setOtpLoading(false);
    }
  };

  const fetchSignedDocs = useCallback(async () => {
    try {
      const h: HeadersInit = {};
      if (adminKey) h["X-Admin-Key"] = adminKey;
      const res = await fetch(`${apiUrl}/api/admin/taper/signed`, { headers: h });
      const data = await res.json();
      if (data.ok && Array.isArray(data.docs)) setSignedDocs(data.docs);
    } catch {
      setSignedDocs([]);
    }
  }, [apiUrl, adminKey]);

  useEffect(() => {
    fetchSignedDocs();
  }, [fetchSignedDocs]);

  const generatePdf = async () => {
    setError("");
    setLoading(true);
    try {
      const h: HeadersInit = { "Content-Type": "application/json" };
      if (adminKey) h["X-Admin-Key"] = adminKey;
      const res = await fetch(`${apiUrl}/api/admin/agreement/pdf`, {
        method: "POST",
        headers: h,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        setError(t || "Gagal generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "perjanjian-pemberian-jasa.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-2">5. Pembuatan agreement dengan client</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Isi data di bawah lalu klik Generate PDF. File perjanjian pemberian jasa (sesuai template Rasya Production) akan diunduh.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <input value={form.nomor_perjanjian} onChange={(e) => set("nomor_perjanjian", e.target.value)} placeholder="Nomor perjanjian (contoh: 001/RP-PJ/I/2025)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} placeholder="Tanggal (contoh: 5 Februari 2025)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.tempat} onChange={(e) => set("tempat", e.target.value)} placeholder="Tempat (contoh: Jakarta)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.hari} onChange={(e) => set("hari", e.target.value)} placeholder="Hari (contoh: Rabu)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.hari_num} onChange={(e) => set("hari_num", e.target.value)} placeholder="Tanggal angka (contoh: 5)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.bulan} onChange={(e) => set("bulan", e.target.value)} placeholder="Bulan (contoh: Februari)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.tahun} onChange={(e) => set("tahun", e.target.value)} placeholder="Tahun (contoh: 2025)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white placeholder-zinc-500 text-sm focus:border-rasya-accent focus:outline-none" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        <div className="rounded-lg border border-rasya-border bg-rasya-dark/30 p-3">
          <p className="text-xs font-mono text-rasya-accent mb-2">Pihak Pertama (Penyedia Jasa)</p>
          <input value={form.p1_nama} onChange={(e) => set("p1_nama", e.target.value)} placeholder="Nama" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p1_alamat} onChange={(e) => set("p1_alamat", e.target.value)} placeholder="Alamat" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p1_email} onChange={(e) => set("p1_email", e.target.value)} placeholder="E-mail" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p1_telepon} onChange={(e) => set("p1_telepon", e.target.value)} placeholder="No. Telepon / WhatsApp" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        </div>
        <div className="rounded-lg border border-rasya-border bg-rasya-dark/30 p-3">
          <p className="text-xs font-mono text-rasya-accent mb-2">Pihak Kedua (Klien)</p>
          <input value={form.p2_nama} onChange={(e) => set("p2_nama", e.target.value)} placeholder="Nama / Nama Perusahaan" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p2_jabatan} onChange={(e) => set("p2_jabatan", e.target.value)} placeholder="Jabatan (jika badan usaha)" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p2_alamat} onChange={(e) => set("p2_alamat", e.target.value)} placeholder="Alamat" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p2_email} onChange={(e) => set("p2_email", e.target.value)} placeholder="E-mail" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm mb-2 focus:border-rasya-accent focus:outline-none" />
          <input value={form.p2_telepon} onChange={(e) => set("p2_telepon", e.target.value)} placeholder="No. Telepon / WhatsApp" className="w-full rounded border border-rasya-border bg-rasya-dark px-3 py-1.5 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <input value={form.nilai_proyek_angka} onChange={(e) => set("nilai_proyek_angka", e.target.value)} placeholder="Nilai proyek angka (contoh: 5.000.000)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.nilai_proyek_terbilang} onChange={(e) => set("nilai_proyek_terbilang", e.target.value)} placeholder="Nilai terbilang (contoh: Lima juta rupiah)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.dp_percent} onChange={(e) => set("dp_percent", e.target.value)} placeholder="DP %" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.dp_amount} onChange={(e) => set("dp_amount", e.target.value)} placeholder="DP jumlah (angka)" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.termin2_percent} onChange={(e) => set("termin2_percent", e.target.value)} placeholder="Termin II %" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.termin2_amount} onChange={(e) => set("termin2_amount", e.target.value)} placeholder="Termin II jumlah" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.termin2_waktu} onChange={(e) => set("termin2_waktu", e.target.value)} placeholder="Termin II waktu" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.pelunasan_percent} onChange={(e) => set("pelunasan_percent", e.target.value)} placeholder="Pelunasan %" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.pelunasan_amount} onChange={(e) => set("pelunasan_amount", e.target.value)} placeholder="Pelunasan jumlah" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} placeholder="Bank" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.bank_number} onChange={(e) => set("bank_number", e.target.value)} placeholder="No. Rekening" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.bank_account} onChange={(e) => set("bank_account", e.target.value)} placeholder="Atas nama" className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
      </div>
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input value={form.keterlambatan_hari} onChange={(e) => set("keterlambatan_hari", e.target.value)} placeholder="Keterlambatan hari" className="w-40 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.revisi_putaran} onChange={(e) => set("revisi_putaran", e.target.value)} placeholder="Revisi putaran" className="w-32 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.revisi_hari} onChange={(e) => set("revisi_hari", e.target.value)} placeholder="Revisi hari" className="w-32 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.konfirmasi_hari} onChange={(e) => set("konfirmasi_hari", e.target.value)} placeholder="Konfirmasi hari" className="w-28 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.serah_terima_hari} onChange={(e) => set("serah_terima_hari", e.target.value)} placeholder="Serah terima hari" className="w-36 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.tanggung_jawab_hari} onChange={(e) => set("tanggung_jawab_hari", e.target.value)} placeholder="Tanggung jawab hari" className="w-40 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
        <input value={form.pemutusan_hari} onChange={(e) => set("pemutusan_hari", e.target.value)} placeholder="Pemutusan hari" className="w-36 rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
      </div>
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      <button
        type="button"
        onClick={generatePdf}
        disabled={loading}
        className="rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate PDF"}
      </button>

      <div className="mt-8 pt-6 border-t border-rasya-border">
        <h3 className="text-md font-semibold text-white mb-2">OTP untuk penandatanganan (Taper)</h3>
        <p className="text-sm text-zinc-400 mb-3">
          Generate OTP (valid 20 menit). Berikan OTP + link ini ke client agar mereka bisa masuk ke laman tanda tangan.
        </p>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <input
            value={otpLabel}
            onChange={(e) => setOtpLabel(e.target.value)}
            placeholder="Label (opsional, mis. nomor perjanjian)"
            className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm w-64 focus:border-rasya-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={generateOtp}
            disabled={otpLoading}
            className="rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50 text-sm"
          >
            {otpLoading ? "..." : "Generate OTP"}
          </button>
        </div>
        {generatedOTP && (
          <div className="rounded-lg border border-rasya-border bg-rasya-dark/50 p-4 mb-4">
            <p className="text-sm text-zinc-300 mb-1">
              <span className="text-rasya-accent font-mono text-lg">{generatedOTP}</span>
              {generatedExpiry && <span className="text-zinc-500 ml-2">(berlaku sampai {new Date(generatedExpiry).toLocaleString("id-ID")})</span>}
            </p>
            <p className="text-sm text-zinc-400 break-all mt-2">
              Link untuk client: <a href={taperBaseUrl ? taperBaseUrl + "/taper" : "#"} target="_blank" rel="noopener noreferrer" className="text-rasya-accent underline">{taperBaseUrl || "..."}/taper</a>
            </p>
          </div>
        )}

        <h3 className="text-md font-semibold text-white mt-6 mb-2">Dokumen yang telah ditandatangani</h3>
        {signedDocs.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum ada. Setelah client menyimpan PDF di laman Taper, dokumen akan muncul di sini (nama sama dengan yang diunduh client).</p>
        ) : (
          <ul className="space-y-2">
            {signedDocs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/30 px-3 py-2 text-sm">
                <span className="font-mono text-rasya-accent">{d.id}</span>
                <span className="text-zinc-300">{d.filename}</span>
                <span className="text-zinc-500">{d.created_at}</span>
                {d.download_url && (
                  <a href={d.download_url} target="_blank" rel="noopener noreferrer" className="text-rasya-accent underline ml-auto">Unduh</a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
