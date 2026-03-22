"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { snoozeWatering } from "@/server/actions";
import { toast } from "sonner";

export default function CardSnoozeButton({ plantId, snoozeDays }: { plantId: string, snoozeDays: number }) {
  const [isPending, startTransition] = useTransition();

  const handleSnooze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Évite de cliquer sur le lien de la carte

    startTransition(async () => {
      const result = await snoozeWatering(plantId, snoozeDays);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Arrosage repoussé de 3 jours ⏳");
      }
    });
  };

  return (
    <button
      onClick={handleSnooze}
      disabled={isPending}
      title="Repousser de 3 jours"
      // 🟢 Design épuré : h-full (prend la hauteur du conteneur parent), fond gris clair, texte discret
      className="h-full px-3 flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-500 font-extrabold rounded-[1rem] transition-colors active:scale-95 border border-stone-200/50 text-xs shadow-sm"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
      ) : (
        "+3j"
      )}
    </button>
  );
}