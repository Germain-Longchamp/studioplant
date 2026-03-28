"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import EnvironmentAccordion from "./EnvironmentAccordion";

export default function LocationSection({ plant }: { plant: any }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Carte compacte */}
      <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[0.6rem] bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-stone-800 truncate">
            {[plant.room, plant.exposure].filter(Boolean).join(' · ') || 'Emplacement non défini'}
          </div>
          {plant.room_advice && (
            <div className="text-[10px] text-emerald-700 leading-snug mt-0.5 line-clamp-2">
              {plant.room_advice}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[10px] text-stone-400 px-2 py-1.5 border border-stone-200 rounded-lg bg-stone-50 flex-shrink-0 hover:bg-stone-100 transition-colors"
        >
          {editing ? "Fermer" : "Modifier"}
        </button>
      </div>

      {/* EnvironmentAccordion déplié si editing */}
      {editing && <EnvironmentAccordion plant={plant} />}
    </div>
  );
}
