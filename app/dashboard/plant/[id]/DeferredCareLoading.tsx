"use client";

import { useEffect, useRef } from "react";
import { generateDeferredCareGuide } from "@/server/actions";
import { Sprout, Loader2 } from "lucide-react";

export default function DeferredCareLoading({ plantId }: { plantId: string }) {
  const hasRequested = useRef(false);

  useEffect(() => {
    // On s'assure de ne lancer la requête qu'une seule fois
    if (hasRequested.current) return;
    hasRequested.current = true;

    // Déclenche l'action serveur en arrière-plan
    generateDeferredCareGuide(plantId);
  }, [plantId]);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[2rem] p-8 border border-emerald-100 shadow-inner flex flex-col items-center justify-center text-center animate-pulse duration-1000 mt-4">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-60"></div>
        <div className="relative bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
          <Sprout className="w-8 h-8 text-emerald-600" />
        </div>
      </div>
      
      <h3 className="text-xl font-extrabold text-stone-800 mb-2">
        Analyse de l'environnement...
      </h3>
      <p className="text-sm text-stone-600 font-medium max-w-[250px] mx-auto leading-relaxed">
        Notre expert rédige le carnet d'entretien sur-mesure pour votre plante, en fonction de votre pièce et luminosité.
      </p>
      
      <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-white px-4 py-2 rounded-full shadow-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Veuillez patienter quelques secondes
      </div>
    </div>
  );
}
