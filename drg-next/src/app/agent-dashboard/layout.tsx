import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { AgentPwaRegistration } from "@/components/pwa/AgentPwaRegistration";
import "./agent-dashboard.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-drg-agent",
});

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
    <div className={poppins.variable}>
      <AgentPwaRegistration />
      {children}
    </div>
  );
}
