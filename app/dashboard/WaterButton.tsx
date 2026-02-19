"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { waterPlant } from "@/server/actions";

export default function WaterButton({
  plantId,
  history,
  urgent
}: {
  plantId: string;
  history: string[];
  urgent: boolean;
}) {
  // useTransition permet d'avoir un état "isPending" pendant que la Server Action s'exécute
  const [isPending, startTransition] = useTransition();

  const handleWater = () => {
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
