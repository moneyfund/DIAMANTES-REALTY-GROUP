"use client";

import { useEffect, useMemo, useState } from "react";
import { readProperties } from "@/lib/firebase/properties";
import type { Property } from "@/types/property";
import { PropertyCard } from "./PropertyCard";

type LoadState = "idle" | "loading" | "ready" | "error";

export function PropertyCatalogClient() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setState("loading");
      try {
        const result = await readProperties();
        if (!active) return;

        setProperties(result.properties);
        if (!result.sourceCount) {
          setMessage("La lectura de Firebase está deshabilitada en este entorno.");
        } else {
          setMessage(`${result.publicCount} propiedades públicas leídas de ${result.sourceCount} documentos.`);
        }
        setState("ready");
      } catch (error) {
        if (!active) return;
        console.error("[DRG 2.0] Error leyendo propiedades", error);
        setMessage("No fue posible leer el inventario en este entorno.");
        setState("error");
      }
    }

    load();
    return () => { active = false; };
  }, []);

  const sorted = useMemo(
    () => [...properties].sort((a, b) => a.title.localeCompare(b.title, "es")),
    [properties]
  );

  return (
    <section>
      <p className="mb-6 text-sm text-[var(--drg-muted)]" role="status">
        {state === "loading" ? "Cargando inventario…" : message}
      </p>

      {state === "error" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      {sorted.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      ) : null}
    </section>
  );
}
