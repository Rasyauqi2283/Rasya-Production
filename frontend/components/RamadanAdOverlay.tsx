"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_CLOSE_MS = 5000;
const SLIDE_COUNT = 2;

export default function RamadanAdOverlay() {
  const [visible, setVisible] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, SLIDE_COUNT - 1)));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    if (diff < -minSwipe) goTo(currentSlide + 1); // geser ke kanan = next (lihat iklan lainnya)
    if (diff > minSwipe) goTo(currentSlide - 1);  // geser ke kiri = prev
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;
    if (diff < -minSwipe) goTo(currentSlide + 1);
    if (diff > minSwipe) goTo(currentSlide - 1);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Iklan"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute -right-2 -top-2 z-20 rounded-full bg-slate-800/90 p-2 text-zinc-400 transition hover:bg-slate-700 hover:text-white"
          aria-label="Tutup"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Satu viewport tetap; tiap slide dapat lebar penuh viewport */}
        <div
          className="w-full overflow-hidden rounded-2xl border-2 border-amber-400/60 shadow-2xl shadow-amber-900/20 select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="flex w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Slide 1: Ramadan — satu layer space penuh */}
            <div className="w-full min-w-full shrink-0 overflow-hidden bg-gradient-to-b from-emerald-950/95 to-slate-900/95 px-6 py-8 sm:px-8">
              <div className="text-center">
                <span className="text-5xl" aria-hidden>
                  🌙
                </span>
                <h2 className="mt-4 font-display text-xl font-bold text-amber-200 break-words sm:text-2xl">
                  Selamat Menunaikan Ibadah Puasa
                </h2>
                <p className="mt-2 text-sm text-emerald-200/90 sm:text-base">
                  Marhaban ya Ramadan · Ramadan Kareem
                </p>
                <p className="mt-4 text-xs text-zinc-400 break-words sm:text-sm">
                  Geser ke kanan untuk iklan lainnya · Menutup otomatis dalam 5 detik
                </p>
              </div>
            </div>

            {/* Slide 2: Iklan disini — satu layer space penuh */}
            <div className="w-full min-w-full shrink-0 overflow-hidden bg-gradient-to-b from-slate-800/95 to-slate-900/95 px-6 py-8 sm:px-8">
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <p className="text-xl font-semibold text-zinc-300">Iklan disini</p>
                <p className="mt-2 text-sm text-zinc-500">Geser ke kiri untuk kembali</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition ${
                i === currentSlide ? "w-6 bg-amber-400" : "w-2 bg-zinc-500 hover:bg-zinc-400"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
