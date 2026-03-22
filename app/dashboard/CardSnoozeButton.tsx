"use client";

import { useTransition } from "react";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { snoozeWatering } from "@/server/actions";

export default function CardSnoozeButton({
  plantId,
  snoozeDays,
}: {
  plantId: string;
  snoozeDays: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSnooze = (e: React.MouseEvent) => {
    // CRUCIAL : Empêche le clic de se propager à la balise <Link> parent de la carte
    e.preventDefault();
    e.stopPropagation();
    
    startTransition(async () => {
      await snoozeWatering(plantId, snoozeDays);
      toast.success("Arrosage repoussé de 3 jours ! ⏳");
    });
  };

  return (
    <button 
      type="button" 
      onClick={handleSnooze}
      disabled={isPending}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-50 hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-all border border-stone-200/60 shadow-sm active:scale-95 group"
      title="Repousser l'arrosage de 3 jours"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
      ) : (
        <Clock className="w-3 h-3 group-hover:-rotate-12 transition-transform" />
      )}
      <span className="text-[10px] font-bold leading-none mt-[1px]">+3j</span>
    </button>
  );
}
