"use client";

import { useState, useTransition } from "react";
import { Pencil, Minus, Plus, Droplets, CalendarSync, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  updateWateringFrequency,
  disableSeasonality,
  reactivateSeasonality,
} from "@/server/actions";

const FREQ_MIN = 1;
const FREQ_MAX = 90;

interface Props {
  plantId: string;
  currentFrequency: number;
  followsSeasons: boolean;
  /** Les 4 cadences saisonnières sont toutes égales → une réactivation devra
   *  passer par une régénération IA (perte de la valeur manuelle). */
  seasonalValuesDegenerate: boolean;
}

export default function WateringFrequencyDialog({
  plantId,
  currentFrequency,
  followsSeasons,
  seasonalValuesDegenerate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentFrequency);
  const [confirmingReactivate, setConfirmingReactivate] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isToggling, startToggle] = useTransition();

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setValue(currentFrequency);
      setConfirmingReactivate(false);
    }
    setOpen(isOpen);
  }

  function handleSave() {
    startSave(async () => {
      const result = await updateWateringFrequency(plantId, value);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Fréquence d'arrosage mise à jour !");
        setOpen(false);
      }
    });
  }

  function handleDisable() {
    startToggle(async () => {
      const result = await disableSeasonality(plantId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Cette plante garde une cadence fixe toute l'année.");
        setOpen(false);
      }
    });
  }

  function handleReactivate() {
    startToggle(async () => {
      const result = await reactivateSeasonality(plantId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.regenerated
          ? "Saisonnalité réactivée, cadences régénérées."
          : "Cette plante suit à nouveau les saisons."
      );
      setOpen(false);
    });
  }

  const busy = isSaving || isToggling;

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
          {/* Ajusteur de cadence */}
          <div>
            <p className="text-xs font-medium text-stone-500 mb-2 ml-1">
              {followsSeasons ? "Cadence de la saison en cours" : "Cadence, constante toute l'année"}
            </p>
            <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-4">
              <button
                onClick={() => setValue((v) => Math.max(FREQ_MIN, v - 1))}
                disabled={value <= FREQ_MIN || busy}
                className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-all disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-3xl font-black text-emerald-700">{value}</span>
                <p className="text-xs text-stone-400 mt-0.5">jours entre chaque arrosage</p>
              </div>

              <button
                onClick={() => setValue((v) => Math.min(FREQ_MAX, v + 1))}
                disabled={value >= FREQ_MAX || busy}
                className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-sm active:scale-95 transition-all disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {followsSeasons && (
              <p className="text-[11px] text-stone-400 mt-2 ml-1">
                Les autres saisons seront ajustées dans la même proportion.
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={busy || value === currentFrequency}
              className="w-full mt-4 rounded-[1.25rem] h-12 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>

          {/* Réglage saisonnalité */}
          <div className="border-t border-stone-100 pt-4">
            {followsSeasons ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <CalendarSync className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-700">Suit les saisons</p>
                    <p className="text-[11px] text-stone-400 leading-snug">
                      La cadence s'adapte au fil de l'année.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDisable}
                  disabled={busy}
                  className="shrink-0 text-[11px] font-bold text-stone-400 hover:text-stone-600 underline underline-offset-2 disabled:opacity-40"
                >
                  {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Désactiver"}
                </button>
              </div>
            ) : confirmingReactivate && seasonalValuesDegenerate ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Les cadences par saison de cette plante ont été perdues. Les réactiver
                    les fera régénérer par l'IA — votre valeur de {currentFrequency} j sera remplacée.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setConfirmingReactivate(false)}
                    disabled={busy}
                    variant="outline"
                    className="flex-1 rounded-[1.25rem] h-12 border-stone-200 text-stone-600 font-bold shadow-none"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReactivate}
                    disabled={busy}
                    className="flex-1 rounded-[1.25rem] h-12 bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Réactiver"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <CalendarSync className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-700">Cadence fixe</p>
                    <p className="text-[11px] text-stone-400 leading-snug">
                      Même rythme toute l'année, quelle que soit la saison.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    seasonalValuesDegenerate ? setConfirmingReactivate(true) : handleReactivate()
                  }
                  disabled={busy}
                  className="shrink-0 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 disabled:opacity-40"
                >
                  {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Suivre les saisons"}
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
