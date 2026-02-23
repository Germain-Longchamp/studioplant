"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, MapPin, Leaf, Calendar } from "lucide-react";
import { getWateringStatus } from "@/lib/utils";
import WaterButton from "../WaterButton";
import BottomNav from "@/components/BottomNav";

export default function PlantsClient({ plants }: { plants: any[] }) {
  const [filter, setFilter] = useState("Toutes");

  // On extrait dynamiquement toutes les pièces utilisées
  const rooms = Array.from(new Set(plants.map(p => p.room).filter(Boolean)));
  const filters = ["Toutes", ...rooms];

  // On applique le filtre
  const filteredPlants = filter === "Toutes" ? plants : plants.filter(p => p.room === filter);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER VERT PLUS COMPACT (pb-10 au lieu de pb-24) */}
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
          </div>
        </div>
      </div>

      {/* MAIN SANS OVERLAP (mt-6 au lieu de -mt-14) */}
      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6">
        
        {/* BARRE DE FILTRES PLUS FINE ET DISCRÈTE */}
        {rooms.length > 0 && (
          <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-5 px-5">
            {filters.map((f: string) => (
              <button 
                key={f}
                onClick={() => setFilter(f)} 
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                  filter === f 
                    ? 'bg-emerald-800 text-white border border-emerald-700 shadow-emerald-900/20' 
                    : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {/* LISTE FILTRÉE */}
        <div className="flex flex-col gap-3">
          {filteredPlants.map((plant) => {
            const snoozeDays = plant.snooze_days || 0;
            const history = plant.watering_history || [];
            const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);
            const badgeColorClass = status.color === 'red' ? 'text-rose-600' : status.color === 'orange' ? 'text-amber-500' : 'text-emerald-600';

            return (
              <div key={plant.id} className="group relative flex flex-row bg-white rounded-[1.75rem] overflow-hidden shadow-lg shadow-stone-200/40 border border-stone-100/60 transition-all duration-300 hover:shadow-xl hover:border-emerald-200">
                <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />
                
                <div className="relative w-[35%] min-w-[120px] max-w-[140px] bg-stone-100 shrink-0 border-r border-stone-100/50">
                  {plant.image_path ? (
                    <Image src={plant.image_path} alt={plant.name} fill className="object-cover" sizes="(max-width: 768px) 33vw, 25vw" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-stone-300 bg-emerald-50/50">
                      <Leaf className="w-8 h-8 opacity-40 text-emerald-600" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-stone-800 text-lg leading-tight line-clamp-1 pr-2">{plant.name}</h3>
                    <p className="text-sm text-stone-500 italic mt-0.5 line-clamp-1">{plant.species}</p>
                    {plant.room && (
                      <div className="inline-flex items-center gap-1 mt-2.5 bg-[#FDFCF8] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-200/60">
                        <MapPin className="w-3 h-3 text-emerald-700" /> {plant.room}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 relative z-20">
                    <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden ${badgeColorClass}`}>
                      <Calendar className={`w-3.5 h-3.5 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                      <span className="truncate">{status.text}</span>
                    </div>
                    <div className="shrink-0">
                      <WaterButton plantId={plant.id} history={history} urgent={status.urgent} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
