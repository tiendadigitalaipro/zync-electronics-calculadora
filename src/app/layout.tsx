import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300","400","500","600","700","800","900"] });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["400","500","600","700"] });

export const metadata: Metadata = {
  title: "ZYNC Electronics — Suite Financiera v3.0 | A2K Digital Studio",
  description: "Suite Financiera Profesional ZYNC Electronics. Calculadora de importacion, modulo CBM maritimo, inventario, OPEX y dashboard. Desarrollado por A2K Digital Studio.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${space.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
