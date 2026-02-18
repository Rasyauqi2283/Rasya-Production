"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const ADMIN_KEY_STORAGE = "rasya_admin_key";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const SERVICE_TAGS = ["Web & Digital", "Design", "Konten & Kreatif", "Lain-lain"] as const;

// Dashboard Analitik: kategori sama seperti overlay (Web & Digital, Design, Konten & Kreatif, Lain-lain).
const ANALITIK_CATEGORIES = [
  { value: "web_digital", label: "Web & Digital" },
  { value: "design", label: "Design" },
  { value: "konten_kreatif", label: "Konten & Kreatif" },
  { value: "lain_lain", label: "Lain-lain" },
] as const;

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

function formatDateWIB(input: string): string {
  if (!input) return "-";
  // Legacy format from backend: "YYYY-MM-DD HH:mm:ss" (assume UTC).
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
    ? input.replace(" ", "T") + "Z"
    : input;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateDDMMYYYY(input: string): string {
  const raw = input.trim();
  if (!raw) return "-";
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseDeadlineDate(input: string): Date | null {
  const raw = input.trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatCountdown(deadlineRaw: string, nowMs: number): string {
  const d = parseDeadlineDate(deadlineRaw);
  if (!d) return "-";
  let diff = d.getTime() - nowMs;
  const passed = diff < 0;
  diff = Math.abs(diff);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const core = `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`;
  return passed ? `Lewat ${core}` : `Sisa ${core}`;
}

/** Build "Add to Google Calendar" URL untuk satu order (deadline + pemesan + layanan). */
function buildGoogleCalendarUrl(o: OrderItem): string {
  const title = [o.layanan?.trim(), o.pemesan?.trim()].filter(Boolean).join(" — ") || "Order Layanan";
  const parts = [
    `Pemesan: ${o.pemesan || "-"}`,
    `Layanan: ${o.layanan || "-"}`,
    o.deskripsi_pekerjaan ? `Deskripsi: ${o.deskripsi_pekerjaan}` : "",
    o.kesepakatan_brief_uang ? `Kesepakatan: ${o.kesepakatan_brief_uang}` : "",
    o.mulai_tanggal ? `Mulai: ${formatDateDDMMYYYY(o.mulai_tanggal)}` : "",
    o.kapan_uang_masuk ? `Uang masuk: ${formatDateDDMMYYYY(o.kapan_uang_masuk)}` : "",
  ].filter(Boolean);
  const details = parts.join("\n");
  const base = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details,
  });
  const d = parseDeadlineDate(o.deadline);
  if (d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const start = `${y}${m}${day}`;
    const endD = new Date(d);
    endD.setDate(endD.getDate() + 1);
    const end = `${endD.getFullYear()}${String(endD.getMonth() + 1).padStart(2, "0")}${String(endD.getDate()).padStart(2, "0")}`;
    params.set("dates", `${start}/${end}`);
  }
  return `${base}?${params.toString()}`;
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
type RevisionTicket = {
  id: string;
  order_id: string;
  code: string;
  sequence: number;
  status: string;
  used_at?: string;
  note?: string;
  created_at: string;
};
type OrderItem = {
  id: string;
  layanan: string;
  pemesan: string;
  deskripsi_pekerjaan: string;
  deadline: string;
  mulai_tanggal: string;
  kesepakatan_brief_uang: string;
  kapan_uang_masuk: string;
  created_at: string;
  tickets?: RevisionTicket[];
};
type PortoItem = {
  id: string;
  title: string;
  tag: string;
  description: string;
  image_url: string;
  link_url?: string;
  layanan?: string[];
  closed?: boolean;
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
    <div className="min-h-screen bg-rasya-dark pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
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

        <AdminAnalitik apiUrl={API_URL} adminKey={adminKey} />
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="min-w-0">
            <AdminLayanan apiUrl={API_URL} adminKey={adminKey} />
          </div>
          <div className="min-w-0">
            <AdminOrder apiUrl={API_URL} adminKey={adminKey} />
          </div>
        </div>
        <AdminDonasi apiUrl={API_URL} adminKey={adminKey} />
        <AdminPorto apiUrl={API_URL} adminKey={adminKey} />
        <AdminAgreement apiUrl={API_URL} adminKey={adminKey} />
      </div>
    </div>
  );
}

type AnalitikItemType = {
  id: string;
  category: string;
  name: string;
  desc: string;
  order: number;
  closed: boolean;
  created_at: string;
};

function AdminAnalitik({ apiUrl, adminKey }: { apiUrl: string; adminKey: string }) {
  const [items, setItems] = useState<AnalitikItemType[]>([]);
  const [category, setCategory] = useState(ANALITIK_CATEGORIES[0].value);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<AnalitikItemType | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState(ANALITIK_CATEGORIES[0].value);
  const [editDesc, setEditDesc] = useState("");
  const [daftarOpen, setDaftarOpen] = useState(false);

  const headers = (key: string) => ({ "Content-Type": "application/json", "X-Admin-Key": key });

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/analitik`, { headers: headers(adminKey) });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.items)) setItems(data.items);
    } catch {
      setItems([]);
    }
  }, [apiUrl, adminKey]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/analitik`, {
        method: "POST",
        headers: headers(adminKey),
        body: JSON.stringify({ category, name: name.trim(), desc: desc.trim() }),
      });
      if (res.ok) {
        setName("");
        setDesc("");
        fetchList();
      }
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Hapus item ini permanen?")) return;
    const res = await fetch(`${apiUrl}/api/admin/analitik?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(adminKey),
    });
    if (res.ok) fetchList();
  };

  const toggleClose = async (id: string, currentClosed: boolean) => {
    const res = await fetch(`${apiUrl}/api/admin/analitik/close`, {
      method: "POST",
      headers: headers(adminKey),
      body: JSON.stringify({ id, closed: !currentClosed }),
    });
    if (res.ok) fetchList();
  };

  const openEdit = (it: AnalitikItemType) => {
    setEditing(it);
    setEditName(it.name);
    setEditCategory(it.category);
    setEditDesc(it.desc);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`${apiUrl}/api/admin/analitik`, {
      method: "PUT",
      headers: headers(adminKey),
      body: JSON.stringify({
        id: editing.id,
        category: editCategory,
        name: editName.trim(),
        desc: editDesc.trim(),
      }),
    });
    if (res.ok) {
      setEditing(null);
      fetchList();
    }
  };

  const categoryLabel = (value: string) => ANALITIK_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <section className="mb-8 rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Kelola Dashboard Analitik</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Tambah, tutup/buka, atau hapus item kemampuan (nama + penjelasan). Sama seperti di halaman utama: tidak ada rating, hanya penjelasan. Item yang ditutup tidak tampil di overlay &quot;Penasaran apa yang saya bisa?&quot;.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama kemampuan (mis. Frontend Developer)"
          className="rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
        />
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
          >
            {ANALITIK_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-zinc-500 mb-1">Penjelasan</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Deskripsi singkat kemampuan (tanpa rating)"
            rows={2}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none resize-y"
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={loading || !name.trim()}
          className="sm:col-span-2 rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50 w-fit"
        >
          Tambah
        </button>
      </div>

      <div className="rounded-lg border border-rasya-border bg-rasya-dark/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setDaftarOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-300 hover:bg-rasya-dark/60 transition"
          aria-expanded={daftarOpen}
        >
          <span>Daftar item analitik: {items.length} item</span>
          <span className="shrink-0 text-zinc-500" aria-hidden>
            {daftarOpen ? "▼ Tutup" : "▶ Buka"}
          </span>
        </button>
        {daftarOpen && (
          <div className="border-t border-rasya-border px-4 pb-4 pt-3">
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className={`rounded-lg border border-rasya-border p-3 ${it.closed ? "bg-rasya-dark/60 opacity-75" : "bg-rasya-dark"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${it.closed ? "text-zinc-500 line-through" : "text-white"}`}>
                        {it.name}
                      </p>
                      <p className="text-xs text-rasya-accent font-mono mt-0.5">{categoryLabel(it.category)}</p>
                      {it.desc && (
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{it.desc}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(it)}
                        className="rounded border border-rasya-accent/50 px-2 py-1 text-xs font-medium text-rasya-accent hover:bg-rasya-accent/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleClose(it.id, !!it.closed)}
                        className={`rounded border px-2 py-1 text-xs font-medium ${
                          it.closed
                            ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        {it.closed ? "Buka" : "Tutup"}
                      </button>
                      <button
                        type="button"
                        onClick={() => del(it.id)}
                        className="rounded border border-red-500/50 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {items.length === 0 && (
                <p className="text-sm text-zinc-500 py-2">Belum ada item. Tambah dari form di atas.</p>
              )}
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" aria-modal="true" role="dialog">
          <div className="w-full max-w-lg rounded-xl border border-rasya-border bg-rasya-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Edit item: {editing.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Nama</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none"
                >
                  {ANALITIK_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Penjelasan</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white focus:border-rasya-accent focus:outline-none resize-y"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-lg bg-rasya-accent px-4 py-2 font-medium text-rasya-dark hover:bg-rasya-accent/90"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-lg border border-rasya-border px-4 py-2 text-zinc-300 hover:bg-rasya-dark"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
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
  const [daftarOpen, setDaftarOpen] = useState(false);

  // Auto-hitung harga setelah diskon dari nominal mulai dari + diskon %
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
          placeholder="Mulai dari (mis. 200 ribu atau Sesuai brief)"
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

      <div className="rounded-lg border border-rasya-border bg-rasya-dark/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setDaftarOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-zinc-300 hover:bg-rasya-dark/60 transition"
          aria-expanded={daftarOpen}
        >
          <span>
            Daftar layanan (semua yang terdaftar): {services.length} layanan
            {selectedIds.size > 0 && (
              <span className="ml-2 text-rasya-accent">— {selectedIds.size} dipilih</span>
            )}
          </span>
          <span className="shrink-0 text-zinc-500" aria-hidden>
            {daftarOpen ? "▼ Tutup" : "▶ Buka"}
          </span>
        </button>
        {daftarOpen && (
          <div className="border-t border-rasya-border px-4 pb-4 pt-3">
            {services.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
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
              </div>
            )}
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
                <p className="text-sm text-zinc-500 py-2">Belum ada layanan. Tambah dari form di atas.</p>
              )}
            </ul>
          </div>
        )}
      </div>

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
                <label className="block text-xs text-zinc-500 mb-1">Mulai dari</label>
                <input
                  type="text"
                  value={editPriceAwal}
                  onChange={(e) => setEditPriceAwal(e.target.value)}
                  placeholder="Mis. 400 ribu (mulai dari) atau Sesuai brief"
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
                    placeholder="Otomatis dari nominal mulai dari + diskon % (bisa diedit)"
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
  const [pemesan, setPemesan] = useState("");
  const [deskripsiPekerjaan, setDeskripsiPekerjaan] = useState("");
  const [deadline, setDeadline] = useState("");
  const [mulaiTanggal, setMulaiTanggal] = useState("");
  const [kesepakatanUang, setKesepakatanUang] = useState("");
  const [kapanUangMasuk, setKapanUangMasuk] = useState("");
  const [loading, setLoading] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

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

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const add = async () => {
    if (!layanan.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders`, {
        method: "POST",
        headers: headers(adminKey),
        body: JSON.stringify({
          layanan: layanan.trim(),
          pemesan: pemesan.trim(),
          deskripsi_pekerjaan: deskripsiPekerjaan.trim(),
          deadline: deadline.trim(),
          mulai_tanggal: mulaiTanggal.trim(),
          kesepakatan_brief_uang: kesepakatanUang.trim(),
          kapan_uang_masuk: kapanUangMasuk.trim(),
        }),
      });
      if (res.ok) {
        setLayanan("");
        setPemesan("");
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

  const byPemesan = orders.reduce<Map<string, Map<string, OrderItem[]>>>((acc, o) => {
    const pemesanKey = o.pemesan?.trim() || "(Tanpa nama pemesan)";
    const layananKey = o.layanan.trim() || "(Tanpa layanan)";
    if (!acc.has(pemesanKey)) acc.set(pemesanKey, new Map());
    const layananMap = acc.get(pemesanKey)!;
    if (!layananMap.has(layananKey)) layananMap.set(layananKey, []);
    layananMap.get(layananKey)!.push(o);
    return acc;
  }, new Map());

  return (
    <section className="mb-12 rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">2. Order Layanan</h2>
      <p className="text-sm text-zinc-400 mb-4">
        Teknis order: siapa pemesan, apa yang dikerjakan, deadline, mulai, kesepakatan brief (uang), kapan uang masuk. Data dikelompokkan per pemesan agar rapi seperti folder kerja. Gunakan &quot;Tambah ke Google Calendar&quot; per order agar jadwal sinkron dengan kalender dan mudah penjadwalan dengan client.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Siapa yang order (pemesan)</label>
          <input
            type="text"
            value={pemesan}
            onChange={(e) => setPemesan(e.target.value)}
            placeholder="Contoh: PT Maju Jaya / Nama client"
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
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
          <label className="block text-xs text-zinc-500 mb-1">Deadline (DD-MM-YYYY)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-4 py-2 text-white placeholder-zinc-500 focus:border-rasya-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Mulai tanggal (DD-MM-YYYY)</label>
          <input
            type="date"
            value={mulaiTanggal}
            onChange={(e) => setMulaiTanggal(e.target.value)}
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
          <label className="block text-xs text-zinc-500 mb-1">Kapan uang masuk (DD-MM-YYYY)</label>
          <input
            type="date"
            value={kapanUangMasuk}
            onChange={(e) => setKapanUangMasuk(e.target.value)}
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
          {Array.from(byPemesan.entries()).map(([namaPemesan, layananMap]) => (
            <div key={namaPemesan} className="rounded-lg border border-rasya-border bg-rasya-dark/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-rasya-border font-mono text-sm font-medium text-rasya-accent">
                {namaPemesan}
              </div>
              <div className="space-y-3 p-3">
                {Array.from(layananMap.entries()).map(([namaLayanan, items]) => (
                  <div key={`${namaPemesan}-${namaLayanan}`} className="rounded-lg border border-rasya-border/60 bg-rasya-dark/40 overflow-hidden">
                    <div className="px-3 py-2 border-b border-rasya-border/60 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      {namaLayanan}
                    </div>
                    <ul className="divide-y divide-rasya-border/40">
                      {items.map((o) => (
                        <li key={o.id} className="flex flex-col gap-3 p-3">
                          <div className="flex justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-zinc-300">{o.deskripsi_pekerjaan || "—"}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                Deadline: {formatDateDDMMYYYY(o.deadline)} · Mulai: {formatDateDDMMYYYY(o.mulai_tanggal)} · Uang: {o.kesepakatan_brief_uang || "—"} · Masuk: {formatDateDDMMYYYY(o.kapan_uang_masuk)}
                              </p>
                              <p className="text-xs mt-1 text-amber-300">
                                Countdown: {formatCountdown(o.deadline, nowMs)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <a
                                href={buildGoogleCalendarUrl(o)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-rasya-accent hover:underline inline-flex items-center gap-1"
                              >
                                <span aria-hidden>📅</span>
                                Tambah ke Google Calendar
                              </a>
                              <button
                                type="button"
                                onClick={() => del(o.id)}
                                className="text-sm text-red-400 hover:text-red-300"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                          {o.tickets && o.tickets.length > 0 && (
                            <div className="rounded-lg border border-rasya-border/60 bg-rasya-dark/60 p-3">
                              <p className="text-xs font-mono text-rasya-accent mb-2">Kupon revisi (serahkan ke client)</p>
                              <div className="flex flex-wrap gap-3">
                                {o.tickets.map((t) => {
                                  const claimUrl = typeof window !== "undefined" ? `${window.location.origin}/revisi?kode=${encodeURIComponent(t.code)}` : "";
                                  const usedAt = t.used_at ? formatDateWIB(t.used_at) : null;
                                  return (
                                    <div key={t.id} className={`rounded border px-3 py-2 text-sm ${t.status === "used" ? "border-zinc-600 bg-zinc-800/50" : "border-rasya-accent/50 bg-rasya-accent/10"}`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-rasya-accent">Revisi {t.sequence}</span>
                                        <span className="text-zinc-400">·</span>
                                        <span className="font-mono">{t.code}</span>
                                        <span className={t.status === "used" ? "text-amber-400 text-xs" : "text-emerald-400 text-xs"}>
                                          {t.status === "used" ? "Sudah dipakai" : "Belum dipakai"}
                                        </span>
                                      </div>
                                      {usedAt && <p className="text-xs text-zinc-500 mt-1">Dipakai: {usedAt}</p>}
                                      {t.status === "unused" && claimUrl && (
                                        <button
                                          type="button"
                                          onClick={() => { navigator.clipboard.writeText(claimUrl); }}
                                          className="mt-2 text-xs text-rasya-accent hover:underline"
                                        >
                                          Salin link klaim
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
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
      <h2 className="text-lg font-semibold text-white mb-4">3. Preview Support & Ulasan</h2>
      <p className="text-sm text-zinc-400 mb-4">Semua apresiasi (hanya kamu yang bisa lihat).</p>
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
              <p className="text-sm text-zinc-500 py-4">Belum ada apresiasi.</p>
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
                {donations.length} apresiasi
              </p>
            </div>
          )}

          {selected && selected.comment && (
            <div className="mt-6 rounded-lg border border-rasya-border bg-rasya-dark p-4">
              <p className="mb-1 text-xs font-mono uppercase text-rasya-accent">
                Komentar apresiasi
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
      const res = await fetch(`${apiUrl}/api/admin/porto`, { headers: headers(adminKey) });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (data.ok && Array.isArray(data.porto)) setPorto(data.porto);
    } catch {
      setPorto([]);
    }
  }, [apiUrl, adminKey]);

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

  const toggleClose = async (id: string, currentClosed: boolean) => {
    const res = await fetch(`${apiUrl}/api/admin/porto/close`, {
      method: "POST",
      headers: headers(adminKey),
      body: JSON.stringify({ id, closed: !currentClosed }),
    });
    if (res.ok) fetchList();
  };

  const setAllPortoClosed = async (closed: boolean) => {
    if (porto.length === 0) return;
    for (const item of porto) {
      if (!!item.closed !== closed) {
        await fetch(`${apiUrl}/api/admin/porto/close`, {
          method: "POST",
          headers: headers(adminKey),
          body: JSON.stringify({ id: item.id, closed }),
        });
      }
    }
    fetchList();
  };

  const imageBase = apiUrl.replace(/\/$/, "");
  const allClosed = porto.length > 0 && porto.every((p) => !!p.closed);

  return (
    <section className="rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <h2 className="text-lg font-semibold text-white mb-4">4. Upload Porto</h2>
      <p className="text-sm text-zinc-400 mb-4">Proyek yang sudah selesai kontrak (bukti nyata). Porto bisa ditutup/buka supaya section Porto di halaman utama bisa di-hide sepenuhnya saat diperlukan.</p>
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
      {porto.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAllPortoClosed(true)}
            className="text-xs rounded border border-amber-500/50 px-2 py-1 text-amber-400 hover:bg-amber-500/20"
          >
            Tutup semua dari halaman utama
          </button>
          <button
            type="button"
            onClick={() => setAllPortoClosed(false)}
            className="text-xs rounded border border-emerald-500/50 px-2 py-1 text-emerald-400 hover:bg-emerald-500/20"
          >
            Buka semua di halaman utama
          </button>
          <span className="text-xs text-zinc-500">
            Status saat ini: {allClosed ? "Semua porto tertutup" : "Sebagian/semua porto terbuka"}
          </span>
        </div>
      )}
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
          )
            .sort(([a], [b]) => {
              const i = SERVICE_TAGS.indexOf(a as typeof SERVICE_TAGS[number]);
              const j = SERVICE_TAGS.indexOf(b as typeof SERVICE_TAGS[number]);
              if (i === -1 && j === -1) return a.localeCompare(b);
              if (i === -1) return 1;
              if (j === -1) return -1;
              return i - j;
            })
            .map(([tagName, items]) => (
            <div key={tagName} className="rounded-lg border border-rasya-border bg-rasya-dark/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-rasya-border font-mono text-sm font-medium text-rasya-accent">
                {tagName}
              </div>
              <ul className="divide-y divide-rasya-border/50">
                {items.map((p) => (
                  <li key={p.id} className={`flex gap-4 p-3 ${p.closed ? "opacity-70" : ""}`}>
                    {p.image_url && (
                      <img
                        src={p.image_url.startsWith("http") ? p.image_url : `${imageBase}${p.image_url}`}
                        alt={p.title}
                        className="h-20 w-28 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${p.closed ? "text-zinc-500 line-through" : "text-white"}`}>
                        {p.title}
                        {p.layanan && p.layanan.length > 0 && (
                          <span className="font-normal text-rasya-accent ml-1">
                            — {p.layanan.join(", ")}
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${p.closed ? "text-amber-400" : "text-emerald-400"}`}>
                        {p.closed ? "Ditutup (tidak tampil di halaman utama)" : "Terbuka (tampil di halaman utama)"}
                      </p>
                      {p.link_url && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">→ {p.link_url}</p>
                      )}
                      <p className="text-sm text-zinc-500 truncate">{p.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleClose(p.id, !!p.closed)}
                        className={`rounded border px-2 py-1 text-xs font-medium ${
                          p.closed
                            ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                            : "border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                        }`}
                      >
                        {p.closed ? "Buka" : "Tutup"}
                      </button>
                      <button
                        type="button"
                        onClick={() => del(p.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </div>
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
  tier: string;
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
  // Profesional-only fields
  sla_response_time: string;
  sla_uptime: string;
  milestone_detail: string;
  non_compete_bulan: string;
  data_protection_pic: string;
  escalation_pic1: string;
  escalation_pic2: string;
};

const defaultAgreement: AgreementForm = {
  tier: "standar",
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
  sla_response_time: "",
  sla_uptime: "",
  milestone_detail: "",
  non_compete_bulan: "",
  data_protection_pic: "",
  escalation_pic1: "",
  escalation_pic2: "",
};

type SignedDocItem = {
  id: string;
  otp_code: string;
  label: string;
  filename: string;
  created_at: string;
  download_url?: string;
};

type AgreementGeneratedItem = {
  id: string;
  filename: string;
  created_at: string;
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
  const [agreementGeneratedDocs, setAgreementGeneratedDocs] = useState<AgreementGeneratedItem[]>([]);
  const [showAgreementDocsOverlay, setShowAgreementDocsOverlay] = useState(false);
  const [showSamplePdfModal, setShowSamplePdfModal] = useState(false);
  const [samplePdfBlobUrl, setSamplePdfBlobUrl] = useState<string | null>(null);
  const [samplePdfLoading, setSamplePdfLoading] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") setTaperBaseUrl(window.location.origin);
  }, []);

  const openSamplePdf = async () => {
    setSamplePdfLoading(true);
    setSamplePdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const h: HeadersInit = {};
      if (adminKey) h["X-Admin-Key"] = adminKey;
      const res = await fetch(`${apiUrl}/api/admin/agreement/sample?tier=${form.tier}`, { headers: h });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setSamplePdfBlobUrl(url);
      setShowSamplePdfModal(true);
    } catch {
      // ignore
    } finally {
      setSamplePdfLoading(false);
    }
  };

  const closeSamplePdfModal = () => {
    setShowSamplePdfModal(false);
    setSamplePdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

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
      let filename = form.tier === "profesional" ? "perjanjian-jasa-profesional.pdf" : "perjanjian-jasa-standar.pdf";
      const disp = res.headers.get("Content-Disposition");
      if (disp) {
        const m = disp.match(/filename="?([^"]+)"?/);
        if (m && m[1]) filename = m[1].trim();
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setAgreementGeneratedDocs((prev) => [
        ...prev,
        { id: crypto.randomUUID(), filename, created_at: new Date().toISOString() },
      ]);
    } catch (e) {
      setError("Koneksi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-rasya-border bg-rasya-surface p-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold text-white">5. Pembuatan agreement dengan client</h2>
        <button
          type="button"
          onClick={openSamplePdf}
          disabled={samplePdfLoading}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rasya-border bg-rasya-dark text-zinc-400 hover:border-rasya-accent hover:text-rasya-accent focus:outline-none focus:ring-2 focus:ring-rasya-accent/50 disabled:opacity-50"
          title="Lihat PDF contoh (template yang disepakati)"
          aria-label="Lihat PDF contoh"
        >
          ?
        </button>
      </div>
      {showSamplePdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeSamplePdfModal}>
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-rasya-border bg-rasya-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-rasya-border px-4 py-2">
              <span className="text-sm font-medium text-white">Contoh draft perjanjian ({form.tier === "profesional" ? "Profesional / MSA" : "Standar"})</span>
              <button type="button" onClick={closeSamplePdfModal} className="rounded p-1 text-zinc-400 hover:bg-rasya-dark hover:text-white">✕</button>
            </div>
            <div className="flex-1 min-h-0">
              {samplePdfBlobUrl ? (
                <iframe src={samplePdfBlobUrl} title="PDF contoh perjanjian" className="h-full w-full rounded-b-xl" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500">Memuat PDF...</div>
              )}
            </div>
          </div>
        </div>
      )}
      <p className="text-sm text-zinc-400 mb-4">
        Pilih tier agreement lalu isi data di bawah. File perjanjian jasa akan di-generate sesuai tier yang dipilih.
      </p>
      {/* Tier selector */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 mb-1">Tier Agreement</label>
        <select
          value={form.tier}
          onChange={(e) => set("tier", e.target.value)}
          className="rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none w-full max-w-xs"
        >
          <option value="standar">Perjanjian Jasa Standar (Lite) — proyek ringan</option>
          <option value="profesional">Perjanjian Jasa Profesional (Full) — proyek besar / corporate</option>
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          {form.tier === "profesional"
            ? "Profesional: SLA, milestone, perlindungan data, indemnity, non-solicitation, force majeure detail, eskalasi, dispute resolution (arbitrase). Cocok untuk proyek > 10 juta / kompleks."
            : "Standar: Ringkas 4-5 halaman. Cocok untuk proyek < 10 juta / sederhana."}
        </p>
      </div>
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
      {/* Profesional-only fields */}
      {form.tier === "profesional" && (
        <div className="mb-4 rounded-lg border border-rasya-accent/30 bg-rasya-accent/5 p-4">
          <p className="text-xs font-semibold text-rasya-accent mb-3 uppercase tracking-wider">Field khusus Profesional</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">SLA Response Time</label>
              <input value={form.sla_response_time} onChange={(e) => set("sla_response_time", e.target.value)} placeholder="contoh: 1x24 jam kerja" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">SLA Uptime (opsional)</label>
              <input value={form.sla_uptime} onChange={(e) => set("sla_uptime", e.target.value)} placeholder="contoh: 99.5%" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Non-Compete (bulan, kosongkan jika tidak perlu)</label>
              <input value={form.non_compete_bulan} onChange={(e) => set("non_compete_bulan", e.target.value)} placeholder="contoh: 6 (enam)" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">PIC Data Protection</label>
              <input value={form.data_protection_pic} onChange={(e) => set("data_protection_pic", e.target.value)} placeholder="PIC perlindungan data" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Eskalasi Tingkat 1 (Operasional)</label>
              <input value={form.escalation_pic1} onChange={(e) => set("escalation_pic1", e.target.value)} placeholder="contoh: Project Manager" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Eskalasi Tingkat 2 (Manajerial)</label>
              <input value={form.escalation_pic2} onChange={(e) => set("escalation_pic2", e.target.value)} placeholder="contoh: Direktur" className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-zinc-400 mb-1">Detail Milestone (opsional)</label>
            <textarea value={form.milestone_detail} onChange={(e) => set("milestone_detail", e.target.value)} placeholder="contoh: Milestone 1: Desain mockup; Milestone 2: Development; Milestone 3: Testing & deployment" rows={3} className="w-full rounded-lg border border-rasya-border bg-rasya-dark px-3 py-2 text-white text-sm focus:border-rasya-accent focus:outline-none resize-y" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      <button
        type="button"
        onClick={generatePdf}
        disabled={loading}
        className="rounded-lg bg-rasya-accent px-6 py-3 font-medium text-rasya-dark hover:bg-rasya-accent/90 disabled:opacity-50"
      >
        {loading ? "Generating..." : `Generate PDF (${form.tier === "profesional" ? "Profesional" : "Standar"})`}
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
              {generatedExpiry && <span className="text-zinc-500 ml-2">(berlaku sampai {formatDateWIB(generatedExpiry)} WIB)</span>}
            </p>
            <p className="text-sm text-zinc-400 break-all mt-2">
              Link untuk client: <a href={taperBaseUrl ? taperBaseUrl + "/taper" : "#"} target="_blank" rel="noopener noreferrer" className="text-rasya-accent underline">{taperBaseUrl || "..."}/taper</a>
            </p>
          </div>
        )}

        <h3 className="text-md font-semibold text-white mt-6 mb-2">Dokumen terbuat dari perjanjian</h3>
        <button
          type="button"
          onClick={() => setShowAgreementDocsOverlay(true)}
          className="flex items-center gap-3 rounded-lg border border-rasya-border bg-rasya-dark/50 px-4 py-3 text-left w-full max-w-xs hover:bg-rasya-dark hover:border-rasya-accent/50 transition-colors"
        >
          <svg className="w-8 h-8 text-rasya-accent shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
          <span className="text-white font-medium">Dokumen terbuat dari perjanjian</span>
          {agreementGeneratedDocs.length > 0 && (
            <span className="text-zinc-500 text-sm ml-auto">({agreementGeneratedDocs.length})</span>
          )}
        </button>

        {showAgreementDocsOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAgreementDocsOverlay(false)}>
            <div className="rounded-xl border border-rasya-border bg-rasya-surface p-6 max-w-md w-full shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Dokumen terbuat dari perjanjian</h4>
                <button type="button" onClick={() => setShowAgreementDocsOverlay(false)} className="text-zinc-400 hover:text-white p-1">✕</button>
              </div>
              {agreementGeneratedDocs.length === 0 ? (
                <p className="text-sm text-zinc-500">Belum ada. Setelah Anda mengklik Generate PDF di atas, dokumen akan tercatat di sini (file terunduh ke perangkat Anda).</p>
              ) : (
                <ul className="space-y-2 overflow-y-auto flex-1 min-h-0">
                  {agreementGeneratedDocs.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-dark/30 px-3 py-2 text-sm">
                      <span className="text-rasya-accent font-mono truncate flex-1">{d.filename}</span>
                      <span className="text-zinc-500 shrink-0">{formatDateWIB(d.created_at)} WIB</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                <span className="text-zinc-500">{formatDateWIB(d.created_at)} WIB</span>
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
