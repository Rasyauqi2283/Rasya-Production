"use client";

/**
 * Watermark diagonal "Rasya Production" untuk halaman layanan preview.
 * Dicetak miring seperti dokumen, semi-transparan, tidak mengganggu baca.
 * @param lightBg — true untuk halaman dengan background terang (mis. Montessori), pakai teks gelap; default untuk background gelap, pakai teks putih.
 */
export default function PreviewWatermark({ lightBg = false }: { lightBg?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[0] flex items-center justify-center overflow-hidden"
    >
      <div
        className={`whitespace-nowrap text-[clamp(2rem,12vw,6rem)] font-bold tracking-wider select-none ${lightBg ? "text-[#2c2420]/12" : "text-white/10"}`}
        style={{
          transform: "rotate(-25deg)",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        Rasya Production
      </div>
    </div>
  );
}
