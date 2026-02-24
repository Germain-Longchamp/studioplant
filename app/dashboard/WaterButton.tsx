"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";
import confetti from "canvas-confetti";

export default function WaterButton({
  plantId,
  history,
  urgent,
  timeText // NOUVEAU PARAMÈTRE
}: {
  plantId: string;
  history: string[];
  urgent: boolean;
  timeText?: string; 
}) {
  const [isPending, startTransition] = useTransition();

  const handleWater = () => {
    const waterColors = ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7'];
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: waterColors,
      shapes: ['circle'],
      gravity: 1.2,
      scalar: 1.2,
      ticks: 100
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
      // Design du bloc principal (Gris par défaut, Rouge si urgent)
      className={`w-full h-12 flex items-center justify-between p-1 rounded-[1.25rem] transition-all active:scale-95 ${
        urgent
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
          : 'bg-stone-50 border border-stone-200/60 text-stone-500 hover:bg-stone-100 hover:text-stone-700 shadow-sm'
      }`}
    >
      
      {/* PARTIE GAUCHE : L'information de temps */}
      <div className="flex items-center gap-2 pl-3 font-medium text-[13px] tracking-tight">
        <Calendar className={`w-4 h-4 ${urgent ? 'text-rose-200' : 'text-stone-400'}`} />
        <span className="truncate">{timeText}</span>
      </div>

      {/* PARTIE DROITE : L'action visuelle */}
      <div className={`flex items-center gap-1.5 px-4 h-full rounded-xl font-bold text-xs sm:text-sm transition-colors ${
        urgent
          ? 'bg-white/20 text-white' // Contraste doux sur fond rouge
          : 'bg-white text-stone-700 shadow-sm border border-stone-200/50' // Style bouton encastré sur fond gris
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
