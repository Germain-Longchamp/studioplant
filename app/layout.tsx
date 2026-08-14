import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Durée max des fonctions serverless (Server Actions incluses) pour toute l'app.
// Par défaut Vercel coupe à 10s, ce qui suffisait à peine pour les appels Gemini
// (identification, diagnostic, Docteur Plante...) et a commencé à sauter dès que
// les prompts sont devenus plus longs/détaillés. 60s laisse la marge nécessaire.
export const maxDuration = 60;

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StudioPlantes",
    template: "%s · StudioPlantes",
  },
  description: "Prenez soin de vos plantes avec des conseils personnalisés selon votre environnement.",
  applicationName: "StudioPlantes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudioPlantes",
  },
  openGraph: {
    title: "StudioPlantes",
    description: "Suivi intelligent et personnalisé de vos plantes d'intérieur.",
    type: "website",
    locale: "fr_FR",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${dmSans.variable} antialiased`}
      >
        {children}
        
        {/* 🟢 Le composant qui permet d'afficher les notifications partout */}
        <Toaster position="top-center" richColors /> 
      </body>
    </html>
  );
}