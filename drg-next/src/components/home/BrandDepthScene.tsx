"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import type { CSSProperties } from "react";

const depthLayers = Array.from({ length: 20 }, (_, index) => 20 - index);

/** Decorative only: never observes, intercepts or changes the hero's controls. */
export function BrandDepthScene() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { stiffness: 120, damping: 30, mass: .6 });
  const phase = useTransform(smoothScroll, value => Math.max(0, value) / 720);
  // Bounded angles reveal the solid edge without turning the official mark over.
  const rotateY = useTransform(phase, value => Math.sin(value - .65) * 38);
  const rotateX = useTransform(phase, value => 8 + Math.cos(value) * 8);
  const rotateZ = useTransform(phase, value => Math.sin(value * .7 - .4) * 12);
  const y = useTransform(phase, value => Math.sin(value * .6) * -24);

  return (
    <div className="drg-brand-atmosphere" aria-hidden="true">
      <div className="drg-brand-stage">
        <motion.div
          className="drg-brand-object"
          style={{
            y: reducedMotion ? 0 : y,
            rotateX: reducedMotion ? 8 : rotateX,
            rotateY: reducedMotion ? -12 : rotateY,
            rotateZ: reducedMotion ? 0 : rotateZ,
          }}
        >
          {depthLayers.map(layer => (
            <span key={layer} className="drg-brand-depth" style={{ "--brand-layer": layer } as CSSProperties} />
          ))}
          <Image src="/assets/logo.png" alt="" fill sizes="(max-width: 460px) 92vw, (max-width: 768px) 420px, 720px" className="drg-brand-face" />
          <span className="drg-brand-sheen" />
        </motion.div>
      </div>
    </div>
  );
}
