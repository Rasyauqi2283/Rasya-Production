"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getServiceDisplay } from "@/lib/serviceI18n";

type Skill = { label: string; done: boolean };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Dinamis: ≤6 = 1 baris statis; 7–8 = 1 baris scroll; >8 = di-split beberapa baris (max 8 per baris), tanpa gap.
const STATIC_MAX = 6;
const SPLIT_THRESHOLD = 9;
const MAX_PER_ROW = 8;
const MARQUEE_DURATION = 22;

/** Pecah daftar layanan jadi baris-barisan. ≤6 → 1 baris; 7–8 → 1 baris; >8 → split max 8 per baris. */
function buildRows(skills: Skill[]): Skill[][] {
  const n = skills.length;
  if (n <= STATIC_MAX) return [skills];
  if (n < SPLIT_THRESHOLD) return [skills]; // 7 atau 8
  const numRows = Math.ceil(n / MAX_PER_ROW);
  const rows: Skill[][] = [];
  for (let r = 0; r < numRows; r++) {
    const start = r * MAX_PER_ROW;
    const end = Math.min(start + MAX_PER_ROW, n);
    rows.push(skills.slice(start, end));
  }
  return rows;
}

/** Baris dengan 7+ item pakai scroll; ≤6 pakai statis. */
function shouldScroll(row: Skill[]): boolean {
  return row.length > STATIC_MAX;
}

function Item({ label, done }: { label: string; done: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-3 pr-10">
      {done ? (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-rasya-accent bg-rasya-accent/20 text-rasya-accent"
          aria-hidden
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2 6l3 3 5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : (
        <span
          className="h-5 w-5 shrink-0 rounded border border-rasya-border bg-rasya-card"
          aria-hidden
        />
      )}
      <span className="whitespace-nowrap text-sm text-zinc-300">{label}</span>
    </span>
  );
}

/** Satu baris statis: tidak bergerak, 1 baris, tanpa gap. */
function StaticRow({ skills }: { skills: Skill[] }) {
  return (
    <div className="w-full overflow-hidden py-2.5">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
        {skills.map((skill, i) => (
          <Item key={`static-${i}-${skill.label}`} label={skill.label} done={skill.done} />
        ))}
      </div>
    </div>
  );
}

/** Satu baris scroll: kanan → kiri, 2 salinan isi agar loop seamless (tanpa gap). */
function ScrollRow({
  skills,
  rowIndex,
}: {
  skills: Skill[];
  rowIndex: number;
}) {
  const isOffsetRow = rowIndex % 2 === 1;
  const delay = (rowIndex * (MARQUEE_DURATION / 2)) % MARQUEE_DURATION;

  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex w-max items-center py-2.5"
        style={{
          animation: `marquee-left ${MARQUEE_DURATION}s linear infinite`,
          animationDelay: `${-delay}s`,
          marginLeft: isOffsetRow ? "12%" : 0,
        }}
      >
        <span className="flex shrink-0 items-center">
          {skills.map((skill, i) => (
            <Item key={`a-${i}-${skill.label}`} label={skill.label} done={skill.done} />
          ))}
        </span>
        <span className="flex shrink-0 items-center">
          {skills.map((skill, i) => (
            <Item key={`b-${i}-${skill.label}`} label={skill.label} done={skill.done} />
          ))}
        </span>
      </div>
    </div>
  );
}

export default function JasaLanes() {
  const { t } = useLanguage();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/services`)
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (!data?.ok || !Array.isArray(data.services)) return;
          const titles: string[] = Array.from(
            new Set(
              data.services
                .map((s: { title?: string }) => (s.title || "").trim())
                .filter((t: string) => t.length > 0)
            )
          );
          setSkills(titles.map((label) => ({ label, done: false })));
        } catch {
          // ignore
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displaySkills = skills.map((s) => ({ ...s, label: getServiceDisplay(t, s.label, "").title }));
  const rows = buildRows(displaySkills);
  const hasSkills = skills.length > 0;

  return (
    <section
      className="overflow-hidden border-b border-rasya-border bg-rasya-dark pt-24 pb-12 px-6"
      aria-labelledby="jasa-lanes-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p
          id="jasa-lanes-heading"
          className="mb-2 text-center text-xl font-semibold text-rasya-accent sm:text-2xl"
        >
          {t("jasa_fresh_launch")}
        </p>
        <p className="mb-2 text-center text-base text-zinc-400 sm:text-lg">
          {t("jasa_heading")}
        </p>
        <p className="mb-10 text-center text-sm text-zinc-500">
          {t("jasa_subheading")}
        </p>
        <p className="mb-8 text-center text-sm text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-rasya-border bg-rasya-card" />
            {t("jasa_never")}
          </span>
          <span className="mx-4">·</span>
          <span className="inline-flex items-center gap-2 text-rasya-accent">
            <span className="flex h-4 w-4 items-center justify-center rounded border border-rasya-accent bg-rasya-accent/20">
              <svg width="10" height="10" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </span>
            {t("jasa_ever")}
          </span>
        </p>

        {loading && !hasSkills ? (
          <p className="text-center text-sm text-zinc-500">{t("jasa_loading")}</p>
        ) : !hasSkills ? (
          <p className="text-center text-sm text-zinc-500">{t("jasa_empty")}</p>
        ) : (
          <div className="space-y-0">
            {rows.map((rowSkills, rowIndex) =>
              shouldScroll(rowSkills) ? (
                <ScrollRow key={rowIndex} skills={rowSkills} rowIndex={rowIndex} />
              ) : (
                <StaticRow key={rowIndex} skills={rowSkills} />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
