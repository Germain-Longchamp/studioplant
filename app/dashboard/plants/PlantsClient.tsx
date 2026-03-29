"use client";

import { useState } from "react";
import { Leaf, Droplets, Plus, MapPin, Sprout } from "lucide-react";
import { getWateringStatus, getActiveWateringFrequency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import PlantCard from "../PlantCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PlantsClient({ plants, userRooms }: { plants: any[], userRooms: any[] }) {
  const [filter, setFilter] = useState("Toutes");

  // 🟢 1. On extrait les noms des pièces configurées par l'utilisateur
  const configuredRooms = userRooms.map(r => r.name);
  
  // 🟢 2. On récupère les pièces des plantes qui n'existent pas (ou plus) dans la configuration (anciennes pièces)
  const plantRooms = Array.from(new Set(plants.map(p => p.room).filter(Boolean)));
  const orphanedRooms = plantRooms
    .filter(r => !configuredRooms.includes(r as string))
    .sort((a, b) => (a as string).localeCompare(b as string, 'fr', { sensitivity: 'base' }));

  // 🟢 3. On combine pour avoir la liste finale des filtres
  const filters = ["Toutes", ...configuredRooms, ...orphanedRooms];

  // On applique le filtre ET on trie les plantes par ordre alphabétique
  const filteredPlants = (filter === "Toutes" ? [...plants] : plants.filter(p => p.room === filter))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

  // Calcul des statistiques pour l'en-tête
  const totalCount = plants.length;
  const urgentCount = plants.filter((plant) => {
    const snoozeDays = plant.snooze_days || 0;
    const status = getWateringStatus(plant.last_watered_at, getActiveWateringFrequency(plant), snoozeDays);
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
              {/* 🟢 2. C'est ici ! Remplacement de LayoutGrid par Sprout */}
              <Sprout className="w-6 h-6 text-emerald-300" />
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
        
        {plants.length === 0 ? (
          // 🟢 ÉTAT VIDE : Affiché s'il n'y a aucune plante dans le compte
          <div className="bg-white border border-stone-100 shadow-sm rounded-[2rem] p-10 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 mt-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border border-emerald-100/50 shadow-inner">
              <Leaf className="w-10 h-10 text-emerald-500 opacity-80" />
            </div>
            <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-2">
              Votre jungle est vide
            </h3>
            <p className="text-stone-500 font-medium text-sm mb-8 leading-relaxed max-w-[250px]">
              Vous n'avez pas encore de plante dans votre bibliothèque. Prenez votre première photo !
            </p>
            <Button asChild className="h-14 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-8 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
              <Link href="/dashboard/add">
                <Plus className="w-5 h-5 mr-2" />
                Ajouter une plante
              </Link>
            </Button>
          </div>
        ) : (
          // 🟢 LISTE DES PLANTES
          <>
            {/* BARRE DE FILTRES AVEC NOUVEAU DESIGN */}
            {filters.length > 1 && (
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-5 px-5">
                {filters.map((f: string) => {
                  const count = f === "Toutes" ? totalCount : plants.filter(p => p.room === f).length;
                  
                  return (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)} 
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95 ${
                        filter === f 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {f !== "Toutes" && <MapPin className={`w-3.5 h-3.5 ${filter === f ? 'text-emerald-500' : 'text-stone-400'}`} />}
                      <span>{f}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] leading-none font-extrabold ${
                        filter === f 
                          ? 'bg-emerald-200/50 text-emerald-800' 
                          : 'bg-stone-100 text-stone-500'
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
              {filteredPlants.length === 0 ? (
                // Sous-état vide si un filtre ne retourne rien
                <div className="text-center py-10 animate-in fade-in">
                  <p className="text-stone-500 font-medium">Aucune plante dans cet emplacement.</p>
                </div>
              ) : (
                filteredPlants.map((plant) => (
                  <PlantCard key={plant.id} plant={plant} />
                ))
              )}
            </div>
          </>
        )}
        
      </main>

      <BottomNav />
    </div>
  );
}