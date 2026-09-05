"use client";

import { useTransition } from "react";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { snoozeWatering, restoreWateringState } from "@/server/actions";

export default function CardSnoozeButton({
  plantId,
  snoozeDays,
  lastWateredAt,
  history,
  promisedIntervalDays,
}: {
  plantId: string;
  snoozeDays: number;
  lastWateredAt: string | null;
  history: string[];
  promisedIntervalDays: number;
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
        toast.success("Arrosage repoussé de 3 jours ! ⏳", {
          duration: 5000,
          action: {
            label: "Annuler",
            onClick: () => {
              startTransition(async () => {
                const undoResult = await restoreWateringState(plantId, {
                  lastWateredAt: lastWateredAt,
                  wateringHistory: history,
                  snoozeDays: snoozeDays,
                  promisedIntervalDays: promisedIntervalDays,
                });
                if (undoResult?.error) {
                  toast.error(undoResult.error);
                } else {
                  toast.info("Report annulé");
                }
              });
            },
          },
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSnooze}
      disabled={isPending}
      className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-400 transition-all border border-stone-200/80 active:scale-95"
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
