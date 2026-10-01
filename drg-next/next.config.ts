import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "storage.googleapis.com" }
    ]
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/propiedades.html", destination: "/propiedades", permanent: true },
      { source: "/mapa.html", destination: "/mapa", permanent: true },
      { source: "/nosotros.html", destination: "/nosotros", permanent: true },
      { source: "/agentes.html", destination: "/agentes", permanent: true },
      { source: "/educacion.html", destination: "/educacion", permanent: true },
      { source: "/quieres-vender.html", destination: "/quieres-vender", permanent: true },
      { source: "/contacto.html", destination: "/contacto", permanent: true },
      { source: "/propiedad.html", destination: "/propiedad", permanent: true },
      { source: "/agent.html", destination: "/agent", permanent: true },
      { source: "/agente.html", destination: "/agente", permanent: true },
      { source: "/politicas-de-privacidad.html", destination: "/politicas-de-privacidad", permanent: true },
      { source: "/condiciones-de-uso.html", destination: "/condiciones-de-uso", permanent: true },
      { source: "/licencia-de-operacion.html", destination: "/licencia-de-operacion", permanent: true },
      { source: "/property-sheet.html", destination: "/property-sheet", permanent: false }
    ];
  }
};

export default nextConfig;
