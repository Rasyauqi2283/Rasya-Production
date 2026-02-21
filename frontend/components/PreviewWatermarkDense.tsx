"use client";

/**
 * Watermark "Rasya Production" kecil tapi banyak — pola berulang untuk preview full version.
 * Hanya dipakai di halaman full preview yang diakses via link panduan (tidak di-index).
 */
export default function PreviewWatermarkDense({ lightBg = false }: { lightBg?: boolean }) {
  const text = "Rasya Production";
  const count = 80;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[0] overflow-hidden"
      style={{
        transform: "rotate(-25deg)",
        transformOrigin: "center center",
        width: "180vmax",
        height: "180vmax",
        left: "50%",
        top: "50%",
        marginLeft: "-90vmax",
        marginTop: "-90vmax",
      }}
    >
      <div
        className="grid select-none gap-x-16 gap-y-20"
        style={{
          gridTemplateColumns: "repeat(10, 1fr)",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`whitespace-nowrap text-[9px] font-semibold tracking-wider ${lightBg ? "text-[#2c2420]/[0.07]" : "text-white/[0.07]"}`}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
