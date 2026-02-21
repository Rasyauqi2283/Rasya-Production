"use client";

import Link from "next/link";
import { useState } from "react";
import PreviewWatermark from "@/components/PreviewWatermark";
import FiturLayananSlider, { type ExtraSlide } from "@/components/FiturLayananSlider";

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
      title: "Bukan sekadar janji. Ini bisa Anda coba sekarang.",
      tagline: "Demo fitur",
      content: (
        <>
          <p className="mb-6 text-sm text-zinc-400">
            Silakan coba di bawah: isi struktur organisasi dan ubah nilai chart. Perubahan langsung terlihat — seperti sistem yang Anda dapat setelah order.
          </p>
          <div className="space-y-10">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-rasya-accent/90">Struktur organisasi</p>
              <StrukturOrganisasiDemo />
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-rasya-accent/90">Chart real-time</p>
              <ChartDemoContent
                chartData={chartData}
                updateValue={updateValue}
                maxVal={maxVal}
              />
            </div>
          </div>
        </>
      ),
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
            Fitur & Demo — Web & Digital
          </p>
        </header>

        <FiturLayananSlider additionalSlides={additionalSlides} />
      </div>
    </main>
  );
}
