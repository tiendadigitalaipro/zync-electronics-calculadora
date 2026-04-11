import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SynthTrade Pro | A2K DIGITAL STUDIO",
  description: "Professional automated trading bot for Deriv synthetic indices by A2K DIGITAL STUDIO. Trade Boom, Crash, Volatility, Jump, Gold, and Forex with advanced AI strategies.",
  keywords: ["trading bot", "deriv", "synthetic indices", "automated trading", "boom", "crash", "volatility", "A2K DIGITAL STUDIO", "gold trading", "forex"],
  authors: [{ name: "A2K DIGITAL STUDIO" }],
  icons: {
    icon: [
      { url: "/favicon-a2k.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-a2k-pro.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/logo-a2k-pro.png",
  },
  openGraph: {
    title: "SynthTrade Pro | A2K DIGITAL STUDIO",
    description: "Professional automated trading bot for Deriv synthetic indices.",
    images: ["/logo-a2k-pro.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0e17] text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
