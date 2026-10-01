import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DRG 2.0 · Migration Preview",
  description: "Architecture migration workspace for Diamantes Realty Group.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
