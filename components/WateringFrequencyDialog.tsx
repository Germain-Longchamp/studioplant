"use client";

import { useState, useTransition } from "react";
import { Pencil, Minus, Plus, Droplets } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateWateringFrequency } from "@/server/actions";

interface Props {
  plantId: string;
  currentFrequency: number;
  aiFrequency?: number | null;
  isCustom: boolean;
}

export default function WateringFrequencyDialog({ plantId, currentFrequency, aiFrequency, isCustom }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentFrequency);
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    if (isOpen) setValue(currentFrequency);
    setOpen(isOpen);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateWateringFrequency(plantId, value);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Fréquence d'arrosage mise à jour !");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-emerald-600 transition-colors"
          aria-label="Ajuster la fréquence d'arrosage"
        >
          <Pencil className="w-3 h-3" />
          <span>Ajuster</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[340px] rounded-[1.5rem] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-stone-800">
            <Droplets className="w-4 h-4 text-blue-400" />
            Fréquence d'arrosage
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {isCustom && aiFrequency && aiFrequency !== value && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700">
              Recommandé par l'IA : <strong>{aiFrequency} jours</strong>
            </div>
          )}

          <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-4">
            <button
              onClick={() => setValue(v => Math.max(1, v - 1))}
              disabled={value <= 1}
              className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-all disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="text-3xl font-black text-emerald-700">{value}</span>
              <p className="text-xs text-stone-400 mt-0.5">jours entre chaque arrosage</p>
            </div>

            <button
              onClick={() => setValue(v => Math.min(60, v + 1))}
              disabled={value >= 60}
              className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-all disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending || value === currentFrequency}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
