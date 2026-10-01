"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { SocialIcon } from "@/components/social/SocialIcon";

export function PropertyShareActions({ title, whatsappPhone }: { title: string; whatsappPhone?: string }) {
  const [feedback, setFeedback] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: "Mira esta propiedad en Diamantes Realty Group", url });
        return;
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Enlace copiado.");
    } catch {
      setFeedback("No se pudo copiar el enlace.");
    }
  }

  const cleanPhone = String(whatsappPhone || "").replace(/\D+/g, "");
  const whatsappUrl = cleanPhone
    ? "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent("Hola, quisiera más información sobre la propiedad: " + title + ". La vi en Diamantes Realty Group.")
    : "";

  return (
    <div className="drg-detail-actions">
      <button type="button" onClick={share}><Share2 size={16} aria-hidden="true"/> Compartir propiedad</button>
      {whatsappUrl ? <a className="drg-whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer"><SocialIcon network="WhatsApp" size={17}/> Más información</a> : null}
      {feedback ? <small aria-live="polite">{feedback}</small> : null}
    </div>
  );
}
