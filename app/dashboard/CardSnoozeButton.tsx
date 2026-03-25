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
      const result = await snoozeWatering(plantId, snoozeDays);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Arrosage repoussé de 3 jours ! ⏳");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSnooze}
      disabled={isPending}
      className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-all border border-amber-200/70 active:scale-95"
      title="Repousser l'arrosage de 3 jours"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      <span className="text-[11px] font-bold leading-none">+3j</span>
    </button>
  );
}
