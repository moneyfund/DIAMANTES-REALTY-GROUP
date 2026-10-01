"use client";

import Image from "next/image";
import { useState } from "react";

export function PropertyDetailGallery({ images, title }: { images: string[]; title: string }) {
  const safeImages = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const current = safeImages[index] || null;

  function move(delta: number) {
    if (!safeImages.length) return;
    setIndex((value) => (value + delta + safeImages.length) % safeImages.length);
  }

  return (
    <section className="drg-detail-gallery" aria-label="Galería de propiedad">
      <div className="drg-detail-gallery-main">
        {current ? (
          <Image src={current} alt={title + " (" + (index + 1) + "/" + safeImages.length + ")"} fill priority sizes="(max-width:900px) 100vw, 68vw" />
        ) : (
          <div className="drg-detail-no-image">Sin imagen disponible</div>
        )}
        <span className="drg-gallery-watermark" aria-hidden="true">DRG</span>
        {safeImages.length > 1 ? (
          <>
            <button className="drg-gallery-nav is-prev" type="button" onClick={() => move(-1)} aria-label="Imagen anterior">‹</button>
            <button className="drg-gallery-nav is-next" type="button" onClick={() => move(1)} aria-label="Imagen siguiente">›</button>
            <span className="drg-gallery-counter">{index + 1}/{safeImages.length}</span>
          </>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <div className="drg-gallery-thumbs" aria-label="Miniaturas de la propiedad">
          {safeImages.slice(0, 8).map((image, imageIndex) => (
            <button key={image} type="button" className={imageIndex === index ? "is-active" : ""} onClick={() => setIndex(imageIndex)} aria-label={"Ver imagen " + (imageIndex + 1)}>
              <Image src={image} alt="" fill sizes="140px" />
              {imageIndex === 7 && safeImages.length > 8 ? <span>+{safeImages.length - 8}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
