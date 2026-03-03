"use client"; // Obligatoire pour les pages d'erreur dans Next.js

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CloudOff, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void; // Fonction fournie par Next.js pour retenter l'action
}) {
  useEffect(() => {
    // Optionnel : tu pourrais envoyer l'erreur à un service comme Sentry ici
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans text-stone-800 flex flex-col items-center justify-center p-6 selection:bg-emerald-100 selection:text-emerald-900 relative z-0">
      
      {/* Halo de fond subtil (tons chauds pour indiquer l'erreur sans être agressif) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-100/40 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Petite barre colorée en haut de la carte */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-amber-400" />
        
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-rose-100">
          <CloudOff className="w-10 h-10" />
        </div>

        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
          Petit coup de sec !
        </h1>
        
        <p className="text-stone-500 font-medium leading-relaxed mb-8">
          Il semble que l'application n'arrive pas à joindre le serveur. Vérifiez votre connexion internet ou réessayez dans quelques instants.
        </p>

        <div className="flex flex-col gap-3">
          {/* Le bouton "reset" permet de relancer le rendu du composant qui a planté sans recharger toute la page */}
          <Button 
            onClick={() => reset()}
            className="w-full h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Rafraîchir
          </Button>
          
          <Button 
            variant="outline" 
            asChild
            className="w-full h-14 rounded-full bg-white border-stone-200 text-stone-700 font-bold text-base hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
          >
            <Link href="/dashboard">
              <Home className="w-5 h-5 mr-2" />
              Retour au jardin
            </Link>
          </Button>
        </div>
      </div>

    </div>
  );
}
