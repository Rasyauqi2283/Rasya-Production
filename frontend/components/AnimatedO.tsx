"use client";

export default function AnimatedO() {
  return (
    <span className="inline-flex items-center justify-center align-middle -mx-[0.15em] -my-[0.25em] w-[1.84em] h-[2em] shrink-0">
      {/* Animated aperture O from logo; eslint ok: decorative SVG with animation */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Animate_O.svg"
        alt=""
        aria-hidden
        className="w-full h-full object-contain animate-spin"
        style={{ animationDuration: "4s" }}
      />
    </span>
  );
}
