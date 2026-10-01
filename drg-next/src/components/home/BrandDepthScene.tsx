"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** Decorative only: never observes, intercepts or changes the hero's controls. */
export function BrandDepthScene() {
  const object = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const paint = () => {
      frame = 0;
      const node = object.current;
      if (!node) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / 1800));
      node.style.setProperty("--brand-y", `${motion.matches ? 0 : progress * -48}px`);
      node.style.setProperty("--brand-rotate", `${motion.matches ? -12 : -18 + progress * 12}deg`);
    };
    const schedule = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    motion.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      motion.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="drg-brand-atmosphere" aria-hidden="true">
      <div className="drg-brand-stage">
        <div ref={object} className="drg-brand-object">
          <Image src="/assets/logo.png" alt="" fill sizes="(max-width: 768px) 420px, 660px" className="drg-brand-face" />
        </div>
      </div>
    </div>
  );
}
