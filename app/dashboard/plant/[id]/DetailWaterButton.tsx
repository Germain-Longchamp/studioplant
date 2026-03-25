"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";
import confetti from "canvas-confetti";

export default function DetailWaterButton({
  plantId,
  history,
}: {
  plantId: string;
  history: string[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleWater = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Calcul de la position du clic pour l'animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const waterColors = ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7'];
    
    // 1. Grosses gouttes
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
      zIndex: 100
    });

    // 2. Fine brume
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
      const result = await waterPlant(plantId, history);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Plante arrosée ! 💧");
      }
    });
  };

  return (
    <Button 
      type="button" 
      onClick={handleWater}
      disabled={isPending}
      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white rounded-[1.25rem] shadow-lg shadow-emerald-900/20 h-12 font-bold transition-all active:scale-95"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Droplets className="w-4 h-4 mr-2" />
      )}
      Arrosée
    </Button>
  );
}
