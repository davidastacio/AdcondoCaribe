import "@fontsource-variable/manrope";
import "./globals.css";
import "./visits.css";
import "./incidents.css";
import "./inventory.css";
import "./towers.css";
import "./users.css";
import "./scheduling.css";
import "./reports.css";
import "./visual-fixes.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/auth/auth-context";

export const metadata: Metadata = {
  title: "ADCONDO del Caribe",
  description: "Supervisión inteligente de torres residenciales",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
