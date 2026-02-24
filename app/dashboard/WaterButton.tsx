"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";
import confetti from "canvas-confetti";

export default function WaterButton({
  plantId,
  history,
  urgent,
  buttonText // Nouveau paramètre
}: {
  plantId: string;
  history: string[];
  urgent: boolean;
  buttonText?: string; 
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
      // CLASSES : Bouton pleine largeur, gris si pas urgent, rouge si urgent
      className={`w-full h-11 rounded-[1rem] text-sm font-bold transition-all active:scale-95 ${
        urgent
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 border border-rose-600/50'
          : 'bg-stone-100 border border-stone-200/60 text-stone-500 hover:bg-stone-200 hover:text-stone-700 shadow-none'
      }`}
    >
      {isPending ? (
        <Loader2 className={`w-4 h-4 mr-2 animate-spin ${urgent ? 'text-rose-100' : 'text-stone-400'}`} />
      ) : (
        <Droplets className={`w-4 h-4 mr-2 ${urgent ? 'text-rose-100' : 'text-stone-400'}`} />
      )}
      {buttonText || "Arroser"}
    </Button>
  );
}
