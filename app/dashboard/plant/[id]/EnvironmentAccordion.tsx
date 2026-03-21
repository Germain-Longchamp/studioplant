"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Sun, Loader2, Sparkles, ChevronDown, SunDim, CloudSun, Cloud } from "lucide-react";
import { toast } from "sonner";
import { updatePlantEnvironmentWithAI, getUserRooms } from "@/server/actions";

export default function EnvironmentAccordion({ plant }: { plant: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [room, setRoom] = useState(plant.room || "");
  const [light, setLight] = useState(plant.exposure || "");
  
  const [userRooms, setUserRooms] = useState<any[]>([]);

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
        setIsOpen(false);
      }
    });
  };

  // Options de luminosité avec icônes et descriptions courtes
  const lightOptions = [
    { value: "Plein soleil", label: "Plein soleil", desc: "Fenêtre Sud", icon: Sun },
    { value: "Lumière indirecte vive", label: "Lumière vive", desc: "Sans soleil direct", icon: SunDim },
    { value: "Mi-ombre", label: "Mi-ombre", desc: "Un peu reculé", icon: CloudSun },
    { value: "Faible luminosité", label: "Faible", desc: "Coin sombre", icon: Cloud },
  ];

  return (
    <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden mb-6 relative group">
      
      {/* BOUTON D'OUVERTURE DE L'ACCORDÉON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-[#FDFCF8] hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50 shadow-sm shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-extrabold text-stone-800 text-lg tracking-tight">Emplacement actuel</h3>
            <p className="text-sm font-medium text-stone-500 mt-0.5">
              {plant.room} • {plant.exposure}
            </p>
          </div>
        </div>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-white border border-stone-200 transition-transform duration-300 shadow-sm shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-stone-400" />
        </div>
      </button>

      {/* CONTENU DE L'ACCORDÉON */}
      {isOpen && (
        <div className="p-5 pt-4 border-t border-stone-100/60 bg-white animate-in fade-in slide-in-from-top-4">
          <div className="space-y-6">
            
            {/* 1. SÉLECTION DE LA PIÈCE (Boutons Pilules) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                <MapPin className="w-4 h-4 text-emerald-600" /> Déplacer vers :
              </Label>
              
              <div className="flex flex-wrap gap-2">
                {userRooms.length > 0 ? (
                  userRooms.map((r: any) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoom(r.name)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                        room === r.name 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                          : 'border-stone-200 bg-[#FDFCF8] text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {r.name}
                    </button>
                  ))
                ) : (
                  ['Salon', 'Chambre', 'Cuisine', 'Salle de bain', 'Bureau'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setRoom(name)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                        room === name 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                          : 'border-stone-200 bg-[#FDFCF8] text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))
                )}
              </div>
              
              {userRooms.length === 0 && (
                <p className="text-[11px] text-amber-600 font-bold ml-2 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Astuce : Crée tes pièces dans l'onglet "Ma Maison" !
                </p>
              )}
            </div>

            {/* 2. LUMINOSITÉ LOCALE (Cartes cliquables) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-stone-700 font-semibold ml-1">
                <Sun className="w-4 h-4 text-amber-500" /> Luminosité locale
              </Label>
              
              <div className="grid grid-cols-2 gap-2">
                {lightOptions.map((opt) => {
                  const isSelected = light === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLight(opt.value)}
                      className={`flex flex-col items-start text-left p-3.5 rounded-[1.25rem] border transition-all active:scale-95 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50 shadow-sm'
                          : 'border-stone-200 bg-[#FDFCF8] hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-500' : 'text-stone-400'}`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-amber-900' : 'text-stone-700'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-amber-700' : 'text-stone-500'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOUTON D'ACTION */}
            <Button 
              onClick={handleSave} 
              disabled={isPending}
              className="w-full h-14 mt-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-base font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2 text-emerald-300" /> Mettre à jour l'emplacement</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}