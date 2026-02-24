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
  timeText
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
      // Hauteur réduite (h-11 au lieu de h-12) et nouvelles couleurs Vertes
      className={`w-full h-11 flex items-center justify-between p-1 rounded-[1.25rem] transition-all active:scale-95 ${
        urgent
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
          : 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-sm'
      }`}
    >
      
      {/* PARTIE GAUCHE : L'information de temps plus compacte */}
      <div className="flex items-center gap-1.5 pl-2.5 font-semibold text-[11px] sm:text-xs tracking-tight">
        <Calendar className={`w-3.5 h-3.5 ${urgent ? 'text-rose-200' : 'text-emerald-500/70'}`} />
        <span className="truncate">{timeText}</span>
      </div>

      {/* PARTIE DROITE : L'action visuelle affinée */}
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
