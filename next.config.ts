import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configuration du plugin PWA
const withPWA = withPWAInit({
  dest: "public", // Dossier de destination du service worker
  disable: process.env.NODE_ENV === "development", // Désactive le cache en mode dev pour éviter les bugs
  register: true, // Enregistre automatiquement le service worker
  skipWaiting: true, // Met à jour le SW dès qu'une nouvelle version est dispo
  workboxOptions: {
    disableDevLogs: true,
  },
});

// 2. Configuration native de Next.js
const nextConfig: NextConfig = {
  // Optimisation des images (indispensable pour Supabase Storage)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // ⚠️ REMPLACE CECI par l'ID de ton projet Supabase (ex: "xyz123.supabase.co")
        hostname: "mddlrlefettxzrnpxqkj.supabase.co", 
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Options expérimentales (souvent nécessaire avec les dernières versions de Next)
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Autorise l'upload de photos jusqu'à 4MB
    },
  },
};

// 3. On exporte la config enveloppée par le plugin PWA
export default withPWA(nextConfig);