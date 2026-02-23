"use client";

import { useState, useTransition } from "react";
import { Sun, ChevronDown, Sparkles, MapPin, Edit2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updatePlantEnvironmentWithAI } from "@/server/actions";

export default function EnvironmentAccordion({ plant }: { plant: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [room, setRoom] = useState(plant.room || "");
  const [light, setLight] = useState(plant.exposure || "");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!room || !light) {
      toast.error("Veuillez sélectionner une pièce et une luminosité.");
      return;
    }

    startTransition(async () => {
      const result = await updatePlantEnvironmentWithAI(plant.id, room, light);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Emplacement mis à jour avec succès ! ✨");
        setIsEditing(false);
      }
    });
  };

  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
      <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left overflow-hidden pr-2">
            <span className="text-stone-800 font-bold text-lg">Environnement</span>
            <span className="text-stone-500 text-sm truncate font-medium mt-0.5">
              {plant.room || "Pièce inconnue"} • {plant.exposure || "Lumière non précisée"}
            </span>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
          <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
        </div>
      </summary>
      
      <div className="px-5 pb-6 pt-1 space-y-4 animate-in fade-in duration-300">
        
        {isEditing ? (
          /* =========================================
             MODE ÉDITION
             ========================================= */
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/60 space-y-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" /> Nouvel emplacement
              </h4>
              <button onClick={() => setIsEditing(false)} disabled={isPending} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Pièce</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all shadow-sm"
                value={room} 
                onChange={(e) => setRoom(e.target.value)} 
                disabled={isPending}
              >
                <option value="">Sélectionner une pièce...</option>
                <option value="Salon">Salon</option>
                <option value="Chambre">Chambre</option>
                <option value="Cuisine">Cuisine</option>
                <option value="Salle de bain">Salle de bain</option>
                <option value="Bureau">Bureau</option>
                <option value="Véranda">Véranda</option>
                <option value="Patio / Balcon">Patio / Balcon</option>
                <option value="Jardin">Jardin</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Luminosité</Label>
              <select 
                className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all shadow-sm"
                value={light} 
                onChange={(e) => setLight(e.target.value)} 
                disabled={isPending}
              >
                <option value="">Sélectionner l'exposition...</option>
                <option value="Plein soleil">☀️ Plein soleil (Fenêtre Sud)</option>
                <option value="Lumière indirecte vive">🌤️ Lumière indirecte vive</option>
                <option value="Mi-ombre">⛅ Mi-ombre</option>
                <option value="Faible luminosité">🌑 Faible luminosité</option>
              </select>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isPending}
              className="w-full mt-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-lg shadow-emerald-900/20 h-11 font-bold transition-all active:scale-95"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Enregistrer & Réanalyser</>
              )}
            </Button>
          </div>
        ) : (
          /* =========================================
             MODE VUE
             ========================================= */
          <>
            <div className="flex justify-end -mt-2 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full h-8 px-3 text-xs font-bold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Modifier le lieu
              </Button>
            </div>

            {plant.room_advice && (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                <h4 className="text-purple-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Avis sur la pièce
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">{plant.room_advice}</p>
              </div>
            )}
            {plant.light_advice && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <h4 className="text-amber-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Avis sur la lumière
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">{plant.light_advice}</p>
              </div>
            )}
          </>
        )}

      </div>
    </details>
  );
}
