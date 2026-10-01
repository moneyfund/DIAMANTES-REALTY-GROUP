import type { Metadata, Viewport } from "next";
import { AgentPwaRegistration } from "@/components/pwa/AgentPwaRegistration";

export const metadata: Metadata = {
  applicationName: "DRG Agentes",
  manifest: "/agent-manifest.webmanifest",
  icons: {
    apple: [{ url: "/assets/logo.png", sizes: "3112x3112", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "DRG Agentes",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#07121f",
  viewportFit: "cover",
};

export default function AgentDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AgentPwaRegistration />
      {children}
    </>
  );
}
