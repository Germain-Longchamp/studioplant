import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Configuration du plugin PWA
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Doit pointer vers un DOSSIER contenant un index.{js,ts} — next-pwa fait un
  // glob "{src/,}index.{ts,js}" avec ce chemin comme cwd. Avant, ça pointait vers
  // le fichier public/sw-push-handler.js : le glob ne trouvait rien, buildCustomWorker()
  // retournait undefined en silence, et le service worker généré (public/sw.js)
  // ne contenait donc jamais les listeners push/notificationclick.
  customWorkerSrc: "worker",
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
