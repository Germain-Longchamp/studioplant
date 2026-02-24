"use client";

import { useState, useTransition } from "react";
import { MoreVertical, Sparkles, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updatePlantAdvice, deletePlant } from "@/server/actions";

export default function PlantMenu({ plantId, imageUrl }: { plantId: string, imageUrl: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPendingUpdate, startTransitionUpdate] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();

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

  const handleDelete = () => {
    if (!confirm("Voulez-vous vraiment supprimer cette plante de votre jardin ?")) return;
    startTransitionDelete(async () => {
      const result = await deletePlant(plantId, imageUrl);
      if (result?.error) toast.error(result.error);
    });
  };

  return (
    <>
      {/* BOUTON "3 PETITS POINTS" */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)} 
        className="text-white bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/20 shadow-lg rounded-full transition-all active:scale-95"
      >
        <MoreVertical className="w-6 h-6" />
      </Button>

      {/* OVERLAY ET TIROIR (ACTION SHEET) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          
          <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-800 text-xl">Options de la plante</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Button onClick={handleUpdate} disabled={isPendingUpdate || isPendingDelete} className="w-full justify-start h-14 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-base transition-colors shadow-sm border border-emerald-100">
              {isPendingUpdate ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 text-emerald-500" />}
              {isPendingUpdate ? "Réflexion de l'IA..." : "Rafraîchir les conseils (IA)"}
            </Button>

            <Button onClick={handleDelete} disabled={isPendingDelete || isPendingUpdate} className="w-full justify-start h-14 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-base transition-colors shadow-sm">
              {isPendingDelete ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Trash2 className="w-5 h-5 mr-3" />}
              Supprimer la plante
            </Button>

          </div>
        </div>
      )}
    </>
  );
}
