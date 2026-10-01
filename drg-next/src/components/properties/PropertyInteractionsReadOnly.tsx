"use client";

import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebase/client";

type Interaction = {
  id: string;
  userName?: string;
  comment?: string;
  rating?: number;
  createdAt?: unknown;
};

function formatDate(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const seconds = (value as { seconds?: unknown }).seconds;
  if (typeof seconds !== "number") return "";
  return new Intl.DateTimeFormat("es-NI", { dateStyle: "medium" }).format(new Date(seconds * 1000));
}

export function PropertyInteractionsReadOnly({ propertyId }: { propertyId: string }) {
  const [comments, setComments] = useState<Interaction[]>([]);
  const [reviews, setReviews] = useState<Interaction[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const firebase = getFirebaseClient();
      if (!firebase) { setStatus("error"); return; }
      try {
        const [commentsSnapshot, reviewsSnapshot] = await Promise.all([
          getDocs(query(collection(firebase.db, "properties", propertyId, "comments"), orderBy("createdAt", "desc"), limit(20))),
          getDocs(query(collection(firebase.db, "properties", propertyId, "reviews"), orderBy("createdAt", "desc"), limit(20)))
        ]);
        if (cancelled) return;
        setComments(commentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Interaction)));
        setReviews(reviewsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Interaction)));
        setStatus("ready");
      } catch (error) {
        console.warn("[DRG interactions] read-only load failed", error);
        if (!cancelled) setStatus("error");
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [propertyId]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length;
  }, [reviews]);

  return (
    <section className="drg-interactions">
      <header><p className="drg-kicker">Interacciones</p><h2>Comentarios y reseñas</h2></header>
      {status === "loading" ? <p className="drg-detail-muted">Cargando interacciones…</p> : null}
      {status === "error" ? <p className="drg-detail-muted">Las interacciones no están disponibles en este momento.</p> : null}
      {status === "ready" ? (
        <div className="drg-interactions-grid">
          <article>
            <h3>Comentarios</h3>
            {comments.length ? comments.map((item) => (
              <div className="drg-interaction-item" key={item.id}>
                <strong>{item.userName || "Usuario"}</strong>
                <p>{item.comment || ""}</p>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            )) : <p className="drg-detail-muted">Aún no hay comentarios.</p>}
          </article>
          <article>
            <div className="drg-review-heading"><h3>Reseñas</h3><span>{average.toFixed(1)} ★ · {reviews.length}</span></div>
            {reviews.length ? reviews.map((item) => (
              <div className="drg-interaction-item" key={item.id}>
                <strong>{item.userName || "Usuario"} · {Number(item.rating || 0)} ★</strong>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            )) : <p className="drg-detail-muted">Aún no hay reseñas.</p>}
          </article>
        </div>
      ) : null}
      <p className="drg-readonly-note">Staging: lectura activa. Publicar comentarios y reseñas se habilitará al migrar autenticación y escrituras.</p>
    </section>
  );
}
