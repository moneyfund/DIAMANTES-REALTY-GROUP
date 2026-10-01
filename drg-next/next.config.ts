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
      { source: "/contacto.html", destination: "/contacto", permanent: true }
    ];
  }
};

export default nextConfig;
