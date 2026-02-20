"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";
import confetti from "canvas-confetti";

export default function WaterButton({
  plantId,
  history,
  urgent
}: {
  plantId: string;
  history: string[];
  urgent: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleWater = () => {
    // 1. ANIMATION "SPLASH D'EAU" STYLE ASANA 💦
    const waterColors = ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7']; // Dégradé de teintes eau
    
    confetti({
      particleCount: 80, // Nombre de gouttes
      spread: 70,        // Étalement de l'éclaboussure
      origin: { y: 0.6 }, // Démarre un peu plus bas que le milieu de l'écran
      colors: waterColors,
      shapes: ['circle'], // Des cercles pour imiter des gouttes
      gravity: 1.2,      // Tombe un peu plus vite pour le réalisme
      scalar: 1.2,       // Taille des gouttes
      ticks: 100         // Durée de l'animation
    });

    // 2. ACTION BASE DE DONNÉES
    startTransition(async () => {
      await waterPlant(plantId, history);
      toast.success("Plante arrosée ! 💧");
    });
  };

  return (
    <Button
      type="button"
      onClick={handleWater}
      disabled={isPending}
      size="sm"
      variant={urgent ? "destructive" : "outline"}
      className={`h-8 rounded-xl px-3.5 text-xs font-bold transition-all active:scale-95 ${
        urgent
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-800'
      }`}
    >
      {isPending ? (
        <Loader2 className={`w-3.5 h-3.5 mr-1.5 animate-spin ${urgent ? 'text-rose-100' : 'text-stone-400'}`} />
      ) : (
        <Droplets className={`w-3.5 h-3.5 mr-1.5 ${urgent ? 'text-rose-100' : 'text-stone-400'}`} />
      )}
      Arroser
    </Button>
  );
}
