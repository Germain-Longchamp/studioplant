"use client";

import { useTransition } from "react";
import { BellOff, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleRemindersPaused } from "@/server/actions";

export default function PauseRemindersToggle({
  plantId,
  paused,
}: {
  plantId: string;
  paused: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleRemindersPaused(plantId, !paused);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(paused ? "Rappels réactivés" : "Rappels mis en pause");
      }
    });
  };

  if (paused) {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-full transition-colors"
        aria-label="Réactiver les rappels d'arrosage"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
        Reprendre
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
      aria-label="Mettre en pause les rappels d'arrosage"
      title="Cette plante n'a presque jamais besoin d'être arrosée ? Mets les rappels en pause."
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellOff className="w-3 h-3" />}
      <span>Pause</span>
    </button>
  );
}
