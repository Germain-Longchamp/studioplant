"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Sparkles, Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updatePlantAdvice, deletePlant } from "@/server/actions";

export default function PlantMenu({ plantId, imageUrl }: { plantId: string, imageUrl: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isPendingUpdate, startTransitionUpdate] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  const handleUpdate = () => {
    startTransitionUpdate(async () => {
      const result = await updatePlantAdvice(plantId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Conseils réévalués et mis à jour ! 🌱");
        setIsOpen(false);
      }
    });
  };

  // On lance la vraie suppression uniquement après la modale
  const executeDelete = () => {
    startTransitionDelete(async () => {
      const result = await deletePlant(plantId, imageUrl);
      if (result?.error) {
        toast.error(result.error);
        setShowConfirm(false);
      }
      // Si succès, l'action serveur redirige automatiquement vers le dashboard
    });
  };

  // Gère la fermeture complète du menu
  const closeAll = () => {
    setIsOpen(false);
    setShowConfirm(false);
  };

  const menuModal = isOpen && !showConfirm ? (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeAll}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800 text-xl">Options de la plante</h3>
          <Button variant="ghost" size="icon" onClick={closeAll} className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Button onClick={handleUpdate} disabled={isPendingUpdate || isPendingDelete} className="w-full justify-start h-14 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-base transition-colors shadow-sm border border-emerald-100">
          {isPendingUpdate ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 text-emerald-500" />}
          {isPendingUpdate ? "Mise à jour en cours..." : "Rafraîchir les conseils"}
        </Button>

        <Button onClick={() => setShowConfirm(true)} disabled={isPendingDelete || isPendingUpdate} className="w-full justify-start h-14 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-base transition-colors shadow-sm">
          <Trash2 className="w-5 h-5 mr-3" />
          Supprimer la plante
        </Button>
      </div>
    </div>
  ) : null;

  const confirmModal = showConfirm ? (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={closeAll}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="font-extrabold text-stone-900 text-2xl tracking-tight mb-2">
          Êtes-vous sûr ?
        </h3>

        <p className="text-stone-500 text-sm mb-8 leading-relaxed font-medium">
          Cette plante et tout son historique d'arrosage seront définitivement effacés de votre jardin.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={executeDelete}
            disabled={isPendingDelete}
            className="w-full h-14 rounded-[1.25rem] bg-rose-500 hover:bg-rose-600 text-white font-bold text-base shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            {isPendingDelete ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isPendingDelete ? "Suppression..." : "Oui, supprimer définitivement"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowConfirm(false)}
            disabled={isPendingDelete}
            className="w-full h-12 rounded-[1.25rem] text-stone-500 font-bold hover:bg-stone-100 hover:text-stone-700 active:scale-95 transition-all"
          >
            Annuler
          </Button>
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      {/* BOUTON D'OUVERTURE */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-white bg-stone-900/40 backdrop-blur-md hover:bg-stone-900/60 border border-white/10 shadow-md rounded-full transition-all active:scale-95"
      >
        <MoreVertical className="w-6 h-6" />
      </Button>

      {mounted && createPortal(menuModal, document.body)}
      {mounted && createPortal(confirmModal, document.body)}
    </>
  );
}
