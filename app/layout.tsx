import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // 👈 NOUVEL IMPORT

// Configuration des polices par défaut de Next.js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuration du SEO et de la PWA
export const metadata: Metadata = {
  title: "Studio Plantes",
  description: "Mon jardin connecté intelligent",
  manifest: "/manifest.json", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {/* 🟢 Le composant qui permet d'afficher les notifications partout */}
        <Toaster position="top-center" richColors /> 
      </body>
    </html>
  );
}