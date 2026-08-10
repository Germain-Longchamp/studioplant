"use client";

import { useState } from "react";
import { Leaf, Droplets, Plus, MapPin, Sprout, CheckCircle } from "lucide-react";
import { getWateringStatus, getActiveWateringFrequency } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import PlantCard from "../PlantCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const WATER_FILTER = "to-water";

export default function PlantsClient({
  plants,
  userRooms,
  initialUrgentOnly = false,
}: {
  plants: any[];
  userRooms: any[];
  initialUrgentOnly?: boolean;
}) {
  const [roomFilter, setRoomFilter] = useState("Toutes");
  const [urgentOnly, setUrgentOnly] = useState(initialUrgentOnly);

  const isUrgent = (plant: any) => {
    const status = getWateringStatus(
      plant.last_watered_at,
      getActiveWateringFrequency(plant),
      plant.snooze_days || 0
    );
    return status.urgent;
  };
  const nextWateringTime = (plant: any) => {
    const d = new Date(plant.last_watered_at);
    d.setDate(d.getDate() + getActiveWateringFrequency(plant) + (plant.snooze_days || 0));
    return d.getTime();
  };

  const configuredRooms = userRooms.map((r) => r.name);
  const plantRooms = Array.from(new Set(plants.map((p) => p.room).filter(Boolean)));
  const orphanedRooms = plantRooms
    .filter((r) => !configuredRooms.includes(r as string))
    .sort((a, b) => (a as string).localeCompare(b as string, "fr", { sensitivity: "base" }));

  const roomFilters = ["Toutes", ...configuredRooms, ...orphanedRooms];

  const totalCount = plants.length;
  const urgentCount = plants.filter(isUrgent).length;

  const alpha = (a: any, b: any) =>
    a.name.localeCompare(b.name, "fr", { sensitivity: "base" });

  let filteredPlants = plants.filter((p) => {
    const roomMatch = roomFilter === "Toutes" || p.room === roomFilter;
    const urgentMatch = !urgentOnly || isUrgent(p);
    return roomMatch && urgentMatch;
  });
  filteredPlants = urgentOnly
    ? filteredPlants.sort((a, b) => nextWateringTime(a) - nextWateringTime(b))
    : filteredPlants.sort(alpha);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">

      {/* HEADER */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
          </header>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Toutes mes plantes
            </h1>
            <div className="flex items-center gap-2 mt-2 text-emerald-200/90 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 opacity-80" /> {totalCount} plante{totalCount > 1 ? "s" : ""}
              </span>
              <span className="opacity-50">•</span>
              <span className={`flex items-center gap-1.5 ${urgentCount > 0 ? "text-rose-300 font-bold" : ""}`}>
                <Droplets className="w-3.5 h-3.5 opacity-80" /> {urgentCount} arrosage{urgentCount > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6">

        {plants.length === 0 ? (
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
          <>
            {/* BARRE DE FILTRES — deux facettes combinables : statut d'arrosage + pièce */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-5 px-5">

              {/* Facette statut : toggle "À arroser" */}
              <button
                onClick={() => setUrgentOnly((u) => !u)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95 ${
                  urgentOnly
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-rose-200/70 bg-white text-rose-500 hover:bg-rose-50/50"
                }`}
              >
                <Droplets className={`w-3.5 h-3.5 ${urgentOnly ? "text-rose-500" : "text-rose-400"}`} />
                <span>À arroser</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] leading-none font-extrabold ${
                    urgentOnly ? "bg-rose-200/60 text-rose-800" : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {urgentCount}
                </span>
              </button>

              {/* Séparateur entre les deux facettes */}
              <div className="w-px bg-stone-200 shrink-0 rounded-full" />

              {/* Facette lieu : pastilles de pièces */}
              {roomFilters.map((room) => {
                const count = room === "Toutes" ? totalCount : plants.filter((p) => p.room === room).length;

                return (
                  <button
                    key={room}
                    onClick={() => setRoomFilter(room)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95 ${
                      roomFilter === room
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {room !== "Toutes" && (
                      <MapPin className={`w-3.5 h-3.5 ${roomFilter === room ? "text-emerald-500" : "text-stone-400"}`} />
                    )}
                    <span>{room}</span>
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] leading-none font-extrabold ${
                        roomFilter === room ? "bg-emerald-200/50 text-emerald-800" : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LISTE FILTRÉE */}
            <div className="flex flex-col gap-3">
              {filteredPlants.length === 0 ? (
                urgentOnly ? (
                  <div className="bg-white rounded-[2rem] border border-stone-100 p-8 flex flex-col items-center justify-center text-center shadow-sm mt-2">
                    <div className="p-4 bg-emerald-50 rounded-full mb-3">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-stone-800 text-lg">Tout va bien !</h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {roomFilter === "Toutes"
                        ? "Aucune de vos plantes n'a soif actuellement."
                        : `Aucune plante n'a soif dans « ${roomFilter} ».`}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-10 animate-in fade-in">
                    <p className="text-stone-500 font-medium">Aucune plante dans cet emplacement.</p>
                  </div>
                )
              ) : (
                filteredPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    from={urgentOnly ? WATER_FILTER : undefined}
                  />
                ))
              )}
            </div>
          </>
        )}

      </main>

      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
