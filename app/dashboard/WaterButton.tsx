"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2 } from "lucide-react"; // 🟢 Retrait de Calendar ici
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";
import confetti from "canvas-confetti";

export default function WaterButton({
  plantId,
  history,
  urgent,
  timeText
}: {
  plantId: string;
  history: string[];
  urgent: boolean;
  timeText?: string; 
}) {
  const [isPending, startTransition] = useTransition();

  // On récupère l'événement du clic pour avoir les coordonnées
  const handleWater = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Calcul de la position du clic par rapport à l'écran
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const waterColors = ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7'];
    
    // 1. Grosses gouttes lourdes (tombent vite)
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { x, y },
      colors: waterColors,
      shapes: ['circle'],
      gravity: 1.8,
      scalar: 1.2,
      ticks: 80,
      startVelocity: 25,
      zIndex: 100 // S'assure de passer au-dessus des menus
    });

    // 2. Fine brume légère (jaillit plus haut, s'éparpille plus)
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { x, y },
      colors: waterColors,
      shapes: ['circle'],
      gravity: 1.2,
      scalar: 0.5,
      ticks: 120,
      startVelocity: 45,
      zIndex: 100
    });

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
      className={`w-full h-11 flex items-center justify-between p-1 rounded-[1.25rem] transition-all active:scale-95 ${
        urgent
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
          : 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-sm'
      }`}
    >
      
      {/* 🟢 MODIFICATION ICI : Plus de <Calendar />, et ajustement du padding (pl-3) */}
      <div className="flex items-center pl-3 pr-2 font-semibold text-[11px] sm:text-xs tracking-tight">
        <span className="truncate">{timeText}</span>
      </div>

      <div className={`flex items-center gap-1.5 px-3 h-full rounded-xl font-bold text-[11px] sm:text-xs transition-colors ${
        urgent
          ? 'bg-white/20 text-white' 
          : 'bg-white text-emerald-700 shadow-sm border border-emerald-100' 
      }`}>
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Droplets className="w-3.5 h-3.5" />
        )}
        Arroser
      </div>

    </Button>
  );
}