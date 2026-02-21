"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import PreviewWatermark from "@/components/PreviewWatermark";
import FiturLayananSlider, { type ExtraSlide } from "@/components/FiturLayananSlider";

// --- DEMO 1: Lead Capture → Dashboard Realtime ---
type LeadStatus = "Baru" | "Follow-up" | "Done";

type Lead = {
  id: string;
  nama: string;
  email: string;
  kebutuhan: string;
  createdAt: number;
  status: LeadStatus;
};

function toDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function LeadCaptureDemo() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState({ nama: "", email: "", kebutuhan: "" });

  const addLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.email.trim()) return;
    setLeads((prev) => [
      ...prev,
      {
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nama: form.nama.trim(),
        email: form.email.trim(),
        kebutuhan: form.kebutuhan.trim(),
        createdAt: Date.now(),
        status: "Baru" as LeadStatus,
      },
    ]);
    setForm({ nama: "", email: "", kebutuhan: "" });
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const dailyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const key = toDateKey(l.createdAt);
      map[key] = (map[key] ?? 0) + 1;
    });
    const keys = Object.keys(map).sort();
    return keys.map((date) => ({ date, count: map[date]! }));
  }, [leads]);

  const exportCsv = () => {
    const headers = ["Nama", "Email", "Kebutuhan", "Tanggal", "Status"];
    const rows = leads.map((l) => [
      l.nama,
      l.email,
      l.kebutuhan,
      new Date(l.createdAt).toLocaleString("id-ID"),
      l.status,
    ]);
    // Pakai titik-koma agar Excel (locale ID/dll.) memisahkan per kolom, bukan satu sel
    const sep = ";";
    const csv = [headers.join(sep), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(sep))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${toDateKey(Date.now())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxDaily = Math.max(1, ...dailyCounts.map((d) => d.count));

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pr-1 text-sm">
      {/* Form: Client isi form → data masuk "database" */}
      <section className="shrink-0 rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">
          Form lead — isi lalu submit
        </p>
        <form onSubmit={addLead} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Nama"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            className="w-full rounded border border-rasya-border bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded border border-rasya-border bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Kebutuhan"
            value={form.kebutuhan}
            onChange={(e) => setForm((f) => ({ ...f, kebutuhan: e.target.value }))}
            className="w-full rounded border border-rasya-border bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            className="mt-1 rounded bg-rasya-accent px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-90"
          >
            Simpan lead
          </button>
        </form>
      </section>

      {/* Dashboard: Total, Grafik harian, Status follow-up, Export */}
      <section className="min-h-0 flex-1 rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Dashboard</p>
        <div className="space-y-3">
          <p className="text-zinc-300">
            Total leads: <span className="font-semibold text-rasya-accent">{leads.length}</span>
          </p>
          {dailyCounts.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-zinc-500">Grafik harian</p>
              <div className="flex h-12 items-end gap-1">
                {dailyCounts.map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-0.5">
                    <div
                      className="w-full min-w-0 rounded-t bg-rasya-accent transition-all"
                      style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count > 0 ? "6px" : "0" }}
                    />
                    <span className="truncate text-[10px] text-zinc-500">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {leads.length > 0 && (
            <>
              <div>
                <p className="mb-1 text-xs text-zinc-500">Status follow-up</p>
                <ul className="max-h-24 space-y-1 overflow-y-auto">
                  {leads.slice().reverse().map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 rounded bg-zinc-900/60 px-2 py-1">
                      <span className="truncate text-xs text-zinc-300">{l.nama}</span>
                      <select
                        value={l.status}
                        onChange={(e) => updateLeadStatus(l.id, e.target.value as LeadStatus)}
                        className="shrink-0 rounded border border-rasya-border bg-zinc-800 text-[10px] text-zinc-300 focus:border-rasya-accent/50 focus:outline-none"
                      >
                        <option value="Baru">Baru</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Done">Done</option>
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded border border-rasya-accent/60 bg-rasya-accent/10 px-3 py-1.5 text-xs font-medium text-rasya-accent transition hover:bg-rasya-accent/20"
              >
                Export ke CSV (Excel)
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// --- DEMO 2: Automation / Business Workflow ---
type TaskStatus = "Pending" | "Progress" | "Done";
type Task = { id: string; title: string; status: TaskStatus };

type CrmStatus = "Hot" | "Warm" | "Cold";
type Customer = {
  id: string;
  name: string;
  status: CrmStatus;
  createdAt: number;
  nextFollowUp: number; // timestamp
};

function AutomationDemo() {
  const [mode, setMode] = useState<"task" | "crm">("crm");
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto pr-1 text-sm">
      {showIntro && (
        <section className="shrink-0 rounded border border-rasya-accent/20 bg-rasya-accent/5 px-3 py-2">
          <button
            type="button"
            onClick={() => setShowIntro(false)}
            className="mb-1.5 flex w-full items-center justify-between text-left text-xs font-semibold text-rasya-accent"
          >
            Apa itu Automation?
            <span className="text-zinc-500">−</span>
          </button>
          <p className="mb-2 text-[11px] leading-relaxed text-zinc-400">
            Automation artinya sistem yang bekerja untuk Anda: trigger otomatis (misalnya &quot;belum di-follow up 3 hari&quot;), aksi otomatis (reminder, status, laporan), dan dampak bisnis yang terasa—bukan sekadar form yang Anda isi manual.
          </p>
          <p className="text-[11px] font-medium text-rasya-accent/90">
            Coba demo di bawah: tambah task/customer, ubah status, lihat grafik & laporan.
          </p>
        </section>
      )}
      {!showIntro && (
        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="shrink-0 self-start text-[10px] text-zinc-500 hover:text-rasya-accent/80"
        >
          Apa itu Automation? — Tampilkan
        </button>
      )}
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMode("task")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            mode === "task"
              ? "bg-rasya-accent text-zinc-900"
              : "border border-rasya-border text-zinc-400 hover:border-rasya-accent/50"
          }`}
        >
          Task Management
        </button>
        <button
          type="button"
          onClick={() => setMode("crm")}
          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
            mode === "crm"
              ? "bg-rasya-accent text-zinc-900"
              : "border border-rasya-border text-zinc-400 hover:border-rasya-accent/50"
          }`}
        >
          Simple CRM
        </button>
      </div>
      {mode === "task" ? <TaskManagementDemo /> : <SimpleCrmDemo />}
    </div>
  );
}

function TaskManagementDemo() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, title: newTitle.trim(), status: "Pending" as TaskStatus },
    ]);
    setNewTitle("");
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const byStatus = useMemo(() => {
    const p = tasks.filter((t) => t.status === "Pending").length;
    const g = tasks.filter((t) => t.status === "Progress").length;
    const d = tasks.filter((t) => t.status === "Done").length;
    return { Pending: p, Progress: g, Done: d };
  }, [tasks]);

  const maxCount = Math.max(1, byStatus.Pending, byStatus.Progress, byStatus.Done);

  return (
    <div className="space-y-3">
      <section className="rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Tambah task</p>
        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Judul task"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded border border-rasya-border bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-rasya-accent px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-90"
          >
            Tambah
          </button>
        </form>
      </section>
      <section className="rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Grafik progress (realtime)</p>
        <div className="mb-3 flex h-10 items-end gap-2">
          {(["Pending", "Progress", "Done"] as const).map((s) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full min-w-0 rounded-t transition-all"
                style={{
                  height: `${(byStatus[s] / maxCount) * 100}%`,
                  minHeight: byStatus[s] > 0 ? "6px" : "0",
                  backgroundColor: s === "Pending" ? "#71717a" : s === "Progress" ? "#eab308" : "#22c55e",
                }}
              />
              <span className="text-[10px] text-zinc-500">{s}</span>
            </div>
          ))}
        </div>
        <p className="mb-1 text-xs text-zinc-500">Ubah status → grafik otomatis berubah</p>
        <ul className="max-h-28 space-y-1 overflow-y-auto">
          {tasks.slice().reverse().map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 rounded bg-zinc-900/60 px-2 py-1">
              <span className="truncate text-xs text-zinc-300">{t.title}</span>
              <select
                value={t.status}
                onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                className="shrink-0 rounded border border-rasya-border bg-zinc-800 text-[10px] text-zinc-300 focus:border-rasya-accent/50 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Progress">Progress</option>
                <option value="Done">Done</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function SimpleCrmDemo() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newName, setNewName] = useState("");
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const addCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const now = Date.now();
    const nextFollowUp = now + 2 * 24 * 60 * 60 * 1000; // +2 hari
    setCustomers((prev) => [
      ...prev,
      {
        id: `c-${now}`,
        name: newName.trim(),
        status: "Warm" as CrmStatus,
        createdAt: now,
        nextFollowUp,
      },
    ]);
    setNewName("");
    setReminderMsg("Reminder follow up dalam 2 hari");
    setTimeout(() => setReminderMsg(null), 3000);
  };

  const updateCustomerStatus = (id: string, status: CrmStatus) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const distribution = useMemo(() => {
    const hot = customers.filter((c) => c.status === "Hot").length;
    const warm = customers.filter((c) => c.status === "Warm").length;
    const cold = customers.filter((c) => c.status === "Cold").length;
    return { Hot: hot, Warm: warm, Cold: cold };
  }, [customers]);

  const needFollowUpCount = useMemo(
    () => customers.filter((c) => c.nextFollowUp <= Date.now()).length,
    [customers]
  );

  const estimasiClosing = useMemo(() => {
    const { Hot, Warm, Cold } = distribution;
    const total = Hot + Warm + Cold;
    if (total === 0) return 0;
    return Math.round((Hot * 0.6 + Warm * 0.3 + Cold * 0.1) * 100 / total);
  }, [distribution]);

  const maxCount = Math.max(1, distribution.Hot, distribution.Warm, distribution.Cold);

  const reportData = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const leadsThisWeek = customers.filter((c) => c.createdAt >= weekAgo).length;
    return {
      leadsThisWeek,
      needFollowUp: needFollowUpCount,
      hot: distribution.Hot,
      warm: distribution.Warm,
      cold: distribution.Cold,
    };
  }, [customers, needFollowUpCount, distribution]);

  return (
    <div className="space-y-3">
      <section className="rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Tambah customer</p>
        <form onSubmit={addCustomer} className="flex gap-2">
          <input
            type="text"
            placeholder="Nama customer"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded border border-rasya-border bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-rasya-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-rasya-accent px-3 py-2 text-xs font-medium text-zinc-900 transition hover:opacity-90"
          >
            Tambah
          </button>
        </form>
        {reminderMsg && (
          <p className="mt-2 text-xs text-rasya-accent/90">⏰ {reminderMsg}</p>
        )}
      </section>

      {needFollowUpCount > 0 && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
          {needFollowUpCount} Customer perlu di-follow up
        </div>
      )}

      <section className="rounded border border-rasya-border bg-rasya-dark/80 p-3">
        <p className="mb-1 text-[10px] text-zinc-500">Status berubah otomatis berdasarkan interaksi terakhir.</p>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Chart distribusi (Hot / Warm / Cold)</p>
        <div className="mb-3 flex h-10 items-end gap-2">
          {(["Hot", "Warm", "Cold"] as const).map((s) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-0.5">
              <div
                className="w-full min-w-0 rounded-t transition-all"
                style={{
                  height: `${(distribution[s] / maxCount) * 100}%`,
                  minHeight: distribution[s] > 0 ? "6px" : "0",
                  backgroundColor: s === "Hot" ? "#ef4444" : s === "Warm" ? "#eab308" : "#3b82f6",
                }}
              />
              <span className="text-[10px] text-zinc-500">{s}</span>
            </div>
          ))}
        </div>

        <div className="mb-3 rounded bg-zinc-900/60 px-2 py-1.5 text-[11px] text-zinc-400">
          <span className="font-medium text-zinc-300">📊 Conversion Insight:</span>{" "}
          {distribution.Hot} Hot · {distribution.Warm} Warm · {distribution.Cold} Cold — Estimasi closing {estimasiClosing}%
        </div>

        <ul className="max-h-24 space-y-1 overflow-y-auto">
          {customers.slice().reverse().map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded bg-zinc-900/60 px-2 py-1">
              <span className="truncate text-xs text-zinc-300">{c.name}</span>
              <span className="text-[10px] text-zinc-500">Next: {formatDate(c.nextFollowUp)}</span>
              <select
                value={c.status}
                onChange={(e) => updateCustomerStatus(c.id, e.target.value as CrmStatus)}
                className="ml-auto shrink-0 rounded border border-rasya-border bg-zinc-800 text-[10px] text-zinc-300 focus:border-rasya-accent/50 focus:outline-none"
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="mt-2 w-full rounded border border-rasya-accent/40 bg-rasya-accent/10 py-1.5 text-xs font-medium text-rasya-accent transition hover:bg-rasya-accent/20"
        >
          Generate Report
        </button>
      </section>

      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowReport(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Laporan"
        >
          <div
            className="w-full max-w-sm rounded-lg border border-rasya-border bg-rasya-dark p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rasya-accent">Laporan</p>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              <li>Total leads minggu ini: <strong className="text-rasya-accent">{reportData.leadsThisWeek}</strong></li>
              <li>Perlu follow up: <strong>{reportData.needFollowUp}</strong></li>
              <li>Summary: {reportData.hot} Hot · {reportData.warm} Warm · {reportData.cold} Cold</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="mt-4 w-full rounded bg-rasya-accent py-2 text-xs font-medium text-zinc-900"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StrukturOrganisasiDemo() {
  const [profile, setProfile] = useState("Profil / Akar");
  const [boxes, setBoxes] = useState(["Kotak 1", "Kotak 2", "Kotak 3"]);

  const updateBox = (index: number, value: string) => {
    setBoxes((prev) => prev.map((b, i) => (i === index ? value : b)));
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-rasya-accent bg-rasya-dark">
          <input
            type="text"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="Isi profil"
            className="w-full max-w-[6rem] truncate bg-transparent text-center text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
        <div className="h-4 w-0.5 bg-rasya-border" aria-hidden />
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {boxes.map((text, i) => (
          <div
            key={i}
            className="flex min-w-[120px] flex-col rounded-xl border border-rasya-border bg-rasya-dark p-3"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => updateBox(i, e.target.value)}
              placeholder={`Kotak ${i + 1}`}
              className="min-h-[2.5rem] w-full bg-transparent text-center text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-500">
        Dengan order jasa saya, struktur dan konten bisa disesuaikan lewat antarmuka seperti ini.
      </p>
    </div>
  );
}

const defaultChartData = [
  { label: "Senin", value: 40 },
  { label: "Selasa", value: 65 },
  { label: "Rabu", value: 50 },
  { label: "Kamis", value: 80 },
  { label: "Jumat", value: 45 },
];

function ChartDemoContent({
  chartData,
  updateValue,
  maxVal,
}: {
  chartData: typeof defaultChartData;
  updateValue: (index: number, v: number) => void;
  maxVal: number;
}) {
  return (
    <>
      <p className="mb-4 text-sm text-zinc-400">
        Ubah nilai di bawah; chart langsung berubah tanpa reload.
      </p>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-end gap-2">
          {chartData.map((d, i) => (
            <div key={d.label} className="flex items-center gap-3">
              <label className="w-16 shrink-0 text-xs text-zinc-400">{d.label}</label>
              <div className="flex flex-1 items-center gap-2">
                <div className="h-8 flex-1 overflow-hidden rounded bg-rasya-dark">
                  <div
                    className="h-full rounded bg-rasya-accent transition-all duration-300"
                    style={{ width: `${(d.value / 100) * 100}%` }}
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={d.value}
                  onChange={(e) => updateValue(i, e.target.valueAsNumber)}
                  className="w-14 rounded border border-rasya-border bg-rasya-dark px-2 py-1 text-right text-sm text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-end rounded-xl border border-rasya-border bg-rasya-dark p-4">
          <p className="mb-3 text-center text-xs text-zinc-500">Tampilan chart (tinggi bar = nilai)</p>
          <div className="flex h-40 items-end justify-center gap-2">
            {chartData.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full min-w-0 rounded-t bg-rasya-accent transition-all duration-300"
                  style={{
                    height: `${(d.value / maxVal) * 100}%`,
                    minHeight: d.value > 0 ? "4px" : "0",
                  }}
                />
                <span className="truncate text-[10px] text-zinc-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Penyesuaian konten dan struktur bisa dilakukan lewat antarmuka seperti ini — eksekusi real-time.
      </p>
    </>
  );
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281234567890";
const WHATSAPP_PREFILL = "Halo, saya dari Fitur & Demo Rasya Production. Saya ingin diskusi layanan Web & Digital.";

export default function FiturPreviewPage() {
  const [chartData, setChartData] = useState(defaultChartData);
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  const updateValue = (index: number, v: number) => {
    const n = Math.max(0, Math.min(100, Number.isNaN(v) ? 0 : v));
    setChartData((prev) => prev.map((d, i) => (i === index ? { ...d, value: n } : d)));
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

  const additionalSlides: ExtraSlide[] = [
    {
      title: "DEMO 1 — Lead Capture → Dashboard Realtime",
      tagline: "Form → database → dashboard",
      content: <LeadCaptureDemo />,
    },
    {
      title: "DEMO 2 — Automation / Business Workflow",
      tagline: "Task Management & Simple CRM",
      content: <AutomationDemo />,
    },
    {
      title: "Siap membawa bisnis Anda ke level digital berikutnya?",
      tagline: "Mari kita bangun sistem yang bekerja untuk Anda 24/7.",
      content: (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 font-medium text-white transition hover:opacity-90"
            >
              WhatsApp
            </a>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-lg border border-rasya-border bg-rasya-surface px-6 py-3 font-medium text-zinc-200 transition hover:border-rasya-accent/50 hover:text-white"
            >
              Hubungi via situs
            </Link>
          </div>
          <p className="text-xs text-zinc-500">
            Call to action jelas — langkah berikutnya ada di tangan Anda.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen bg-rasya-dark px-6 pb-20 pt-28 text-zinc-100">
      <PreviewWatermark />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/layanan-preview"
          className="text-xs text-zinc-400 hover:text-rasya-accent"
        >
          ← Kembali ke layanan preview
        </Link>

        <header className="mt-6 mb-8">
          <p className="mb-1.5 font-mono text-xs uppercase tracking-widest text-rasya-accent">
            How Your Digital System Works — Live Preview Demo
          </p>
        </header>

        <FiturLayananSlider additionalSlides={additionalSlides} />
      </div>
    </main>
  );
}
