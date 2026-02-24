"use client";

import { useState } from "react";
import { LayoutGrid, Leaf, Droplets } from "lucide-react";
import { getWateringStatus } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import PlantCard from "../PlantCard";

export default function PlantsClient({ plants }: { plants: any[] }) {
  const [filter, setFilter] = useState("Toutes");

  // On extrait dynamiquement toutes les pièces utilisées
  const rooms = Array.from(new Set(plants.map(p => p.room).filter(Boolean)));
  const filters = ["Toutes", ...rooms];

  // On applique le filtre
  const filteredPlants = filter === "Toutes" ? plants : plants.filter(p => p.room === filter);

  // Calcul des statistiques pour l'en-tête
  const totalCount = plants.length;
  const urgentCount = plants.filter((plant) => {
    const snoozeDays = plant.snooze_days || 0;
    const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);
    return status.urgent;
  }).length;

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER VERT PLUS COMPACT */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <LayoutGrid className="w-6 h-6 text-emerald-300" />
            </div>
          </header>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Toutes mes plantes
            </h1>
            <div className="flex items-center gap-2 mt-2 text-emerald-200/90 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 opacity-80" /> {totalCount} plante{totalCount > 1 ? 's' : ''}
              </span>
              <span className="opacity-50">•</span>
              <span className={`flex items-center gap-1.5 ${urgentCount > 0 ? 'text-rose-300 font-bold' : ''}`}>
                <Droplets className="w-3.5 h-3.5 opacity-80" /> {urgentCount} arrosage{urgentCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6">
        
        {/* BARRE DE FILTRES AVEC COMPTEURS INTÉGRÉS */}
        {rooms.length > 0 && (
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-5 px-5">
            {filters.map((f: string) => {
              // NOUVEAU : On calcule le nombre de plantes pour chaque filtre
              const count = f === "Toutes" ? totalCount : plants.filter(p => p.room === f).length;
              
              return (
                <button 
                  key={f}
                  onClick={() => setFilter(f)} 
                  className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    filter === f 
                      ? 'bg-emerald-800 text-white border border-emerald-700 shadow-emerald-900/20' 
                      : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{f}</span>
                  {/* NOUVEAU : Le badge de compteur */}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none ${
                    filter === f 
                      ? 'bg-emerald-900/50 text-emerald-50' 
                      : 'bg-stone-100 text-stone-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* LISTE FILTRÉE */}
        <div className="flex flex-col gap-3">
          {filteredPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
        
      </main>

      <BottomNav />
    </div>
  );
}
