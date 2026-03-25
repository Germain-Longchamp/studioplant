"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { snoozeWatering } from "@/server/actions";

export default function SnoozeButton({
  plantId,
  snoozeDays,
}: {
  plantId: string;
  snoozeDays: number;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSnooze = () => {
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
    <Button 
      type="button" 
      onClick={handleSnooze}
      disabled={isPending}
      variant="outline" 
      className="w-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-[1.25rem] h-12 font-bold shadow-sm transition-all active:scale-95"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Clock className="w-4 h-4 mr-2" />
      )}
      +3 jours
    </Button>
  );
}
