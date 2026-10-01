"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { OriginalHero } from "./OriginalHero";

export function HomeCurtain() {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const touchY = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  const viewportHeight = useCallback(() => Math.max(1, window.innerHeight), []);

  const apply = useCallback((next: number) => {
    const value = Math.max(0, Math.min(viewportHeight(), next));
    offsetRef.current = value;
    setOffset(value);
  }, [viewportHeight]);

  const animateTo = useCallback((target: number) => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    const start = offsetRef.current;
    const distance = target - start;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 420);
      const eased = 1 - Math.pow(1 - progress, 3);
      apply(start + distance * eased);
      if (progress < 1) animationFrame.current = requestAnimationFrame(tick);
    };

    animationFrame.current = requestAnimationFrame(tick);
  }, [apply]);

  useEffect(() => {
    const wheel = (event: WheelEvent) => {
      const height = viewportHeight();
      if (offsetRef.current < height && event.deltaY > 0) {
        event.preventDefault();
        apply(offsetRef.current + event.deltaY);
      } else if (window.scrollY <= 0.5 && offsetRef.current > 0 && event.deltaY < 0) {
        event.preventDefault();
        apply(offsetRef.current + event.deltaY);
      }
    };

    const touchStart = (event: TouchEvent) => {
      touchY.current = event.touches[0]?.clientY ?? null;
    };

    const touchMove = (event: TouchEvent) => {
      const current = event.touches[0]?.clientY;
      if (current == null || touchY.current == null) return;
      const delta = touchY.current - current;
      touchY.current = current;
      const height = viewportHeight();
      if ((offsetRef.current < height && delta > 0) || (window.scrollY <= 0.5 && offsetRef.current > 0 && delta < 0)) {
        event.preventDefault();
        apply(offsetRef.current + delta);
      }
    };

    const touchEnd = () => {
      touchY.current = null;
      const height = viewportHeight();
      if (offsetRef.current > 0 && offsetRef.current < height) {
        animateTo(offsetRef.current >= height * 0.5 ? height : 0);
      }
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchend", touchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [animateTo, apply, viewportHeight]);

  const curtainStyle = { transform: "translate3d(0," + (-offset) + "px,0)" };
  const open = typeof window !== "undefined" && offset >= viewportHeight() - 1;

  const headerScrolled = offset > 44 || open;

  return (
    <>
      <PublicHeader home homeScrolled={headerScrolled} />
      <div className={"drg-home-curtain" + (open ? " is-open" : "")} style={curtainStyle}>
        <OriginalHero />
        <button className={"drg-scroll-cue" + (offset > 42 ? " is-hidden" : "")} type="button" onClick={() => animateTo(viewportHeight())}>
          <span>Desliza hacia arriba</span><span className="drg-scroll-icon is-up" aria-hidden="true"><i /></span>
        </button>
      </div>
    </>
  );
}
