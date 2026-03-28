"use client";

import { useState, useEffect, useTransition } from "react";
import { MapPin, Sun, SunDim, CloudSun, Cloud, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updatePlantEnvironmentWithAI, getUserRooms } from "@/server/actions";

const lightOptions = [
  { value: "Plein soleil",           label: "Plein soleil",  desc: "Fenêtre Sud",          icon: Sun },
  { value: "Lumière indirecte vive", label: "Lumière vive",  desc: "Sans soleil direct",   icon: SunDim },
  { value: "Mi-ombre",               label: "Mi-ombre",      desc: "Un peu reculé",        icon: CloudSun },
  { value: "Faible luminosité",      label: "Faible",        desc: "Coin sombre",          icon: Cloud },
];

export default function LocationSection({ plant }: { plant: any }) {
  const [editing, setEditing] = useState(false);
  const [room, setRoom]       = useState(plant.room     || "");
  const [light, setLight]     = useState(plant.exposure || "");
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUserRooms().then(data => setUserRooms(data));
  }, []);

  const handleSave = () => {
    if (!room || !light) {
      toast.error("Veuillez sélectionner un emplacement et une luminosité.");
      return;
    }
    startTransition(async () => {
      const result = await updatePlantEnvironmentWithAI(plant.id, room, light);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Emplacement mis à jour ! 🌱");
        setEditing(false);
      }
    });
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm overflow-hidden">

      {/* ── En-tête compact ── */}
      <div className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[0.6rem] bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-extrabold text-stone-800">Emplacement</div>
          <div className="text-[10px] text-stone-400 truncate mt-0.5">
            {[plant.room, plant.exposure].filter(Boolean).join(' · ') || 'Non défini'}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[10px] text-stone-400 px-2 py-1.5 border border-stone-200 rounded-lg bg-stone-50 flex-shrink-0 hover:bg-stone-100 transition-colors"
        >
          {editing ? "Annuler" : "Modifier"}
        </button>
      </div>

      {/* ── Formulaire inline (edit state) ── */}
      {editing && (
        <div className="border-t border-stone-100 px-4 pt-4 pb-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Sélection pièce */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 ml-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Déplacer vers :
            </Label>
            <div className="flex flex-wrap gap-2">
              {(userRooms.length > 0 ? userRooms.map(r => r.name) : ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Bureau']).map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setRoom(name)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                    room === name
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            {userRooms.length === 0 && (
              <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 ml-0.5">
                <Sparkles className="w-3 h-3" />
                Crée tes pièces dans "Ma Maison" pour plus de précision !
              </p>
            )}
          </div>

          {/* Sélection luminosité */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 ml-0.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> Luminosité locale
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {lightOptions.map(opt => {
                const isSelected = light === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLight(opt.value)}
                    className={`flex flex-col items-start text-left p-3 rounded-[1rem] border transition-all active:scale-95 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50 shadow-sm'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white'
                    }`}
                  >
                    <opt.icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-amber-500' : 'text-stone-400'}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>{opt.label}</span>
                    <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-amber-700' : 'text-stone-400'}`}>{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full h-12 rounded-[1rem] bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md shadow-emerald-900/20 active:scale-95 transition-all"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <><Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-300" /> Enregistrer</>
            }
          </Button>
        </div>
      )}
    </div>
  );
}
