"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import type { CSSProperties } from "react";

const depthLayers = Array.from({ length: 20 }, (_, index) => 20 - index);

/** Decorative only: never observes, intercepts or changes the hero's controls. */
export function BrandDepthScene() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  // Start front-facing and stay level; scrolling only turns the vertical axis.
  const scrollRotation = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotateY = useSpring(scrollRotation, { stiffness: 120, damping: 30, mass: .6 });

  return (
    <div className="drg-brand-atmosphere" aria-hidden="true">
      <div className="drg-brand-stage">
        <motion.div
          className="drg-brand-object"
          style={{
            rotateY: reducedMotion ? 0 : rotateY,
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
