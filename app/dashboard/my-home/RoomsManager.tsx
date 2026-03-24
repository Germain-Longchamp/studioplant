"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, MapPin, Compass, Sun, Droplets, ThermometerSun, Snowflake, Home } from "lucide-react";
import { deleteRoom } from "@/server/actions";
import EnvironmentForm from "./EnvironmentForm";

export default function RoomsManager({ initialRooms, userId }: { initialRooms: any[], userId: string }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (roomId: string) => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette pièce ?")) return;

    startTransition(async () => {
      const result = await deleteRoom(roomId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Pièce supprimée");
        setRooms(rooms.filter(r => r.id !== roomId));
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* BOUTON AJOUTER */}
      {!isAdding && !isEditing && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-500 font-bold flex items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-400 hover:text-stone-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une nouvelle pièce
        </button>
      )}

      {/* FORMULAIRE D'AJOUT */}
      {isAdding && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-600" />
            Nouvelle pièce
          </h3>
          <EnvironmentForm 
            userId={userId} 
            onSuccess={(newRoom) => {
              setRooms([newRoom, ...rooms]);
              setIsAdding(false);
            }} 
            onCancel={() => setIsAdding(false)} 
          />
        </div>
      )}

      {/* LISTE DES PIÈCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="relative bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-200 transition-all hover:shadow-md hover:border-emerald-200 group overflow-hidden">
            
            {isEditing === room.id ? (
              // MODE ÉDITION
              <div className="animate-in fade-in duration-200">
                <h3 className="font-bold text-stone-800 mb-4">Modifier {room.name}</h3>
                <EnvironmentForm 
                  userId={userId} 
                  initialData={room} 
                  onSuccess={(updatedRoom) => {
                    setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
                    setIsEditing(null);
                  }}
                  onCancel={() => setIsEditing(null)} 
                />
              </div>
            ) : (
              // 🟢 MODE LECTURE (Design compact)
              <>
                {/* En-tête : Titre + Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-stone-100/80 rounded-xl text-stone-600 border border-stone-200/60 shadow-sm shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-lg leading-tight">{room.name}</h3>
                      {/* Placeholder pour le nombre de plantes (si vous l'avez dans les props plus tard) */}
                      {/* <p className="text-xs text-stone-500 font-medium mt-0.5">3 plantes</p> */}
                    </div>
                  </div>

                  {/* Boutons d'action discrets en haut à droite */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsEditing(room.id)}
                      className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(room.id)}
                      disabled={isPending}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Grille d'informations (2 colonnes) */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50/50 rounded-xl border border-stone-100/80">
                  
                  {room.orientation && (
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-stone-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold uppercase text-stone-500 tracking-wide">Orientation</span>
                        <span className="text-sm font-medium text-stone-700 truncate">{room.orientation}</span>
                      </div>
                    </div>
                  )}

                  {room.light_level && (
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold uppercase text-amber-700/70 tracking-wide">Lumière</span>
                        <span className="text-sm font-medium text-stone-700 truncate">{room.light_level}</span>
                      </div>
                    </div>
                  )}

                  {room.humidity && (
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-semibold uppercase text-blue-700/70 tracking-wide">Humidité</span>
                        <span className="text-sm font-medium text-stone-700 truncate">{room.humidity}</span>
                      </div>
                    </div>
                  )}

                  {/* Regroupement des températures sur une seule case si possible */}
                  {(room.temp_summer || room.temp_winter) && (
                    <div className="flex flex-col min-w-0 justify-center">
                       <span className="text-[10px] font-semibold uppercase text-stone-500 tracking-wide mb-0.5">Températures</span>
                       <div className="flex items-center gap-2">
                         {room.temp_summer && (
                           <span className="flex items-center text-xs font-medium text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded shadow-sm">
                             <ThermometerSun className="w-3 h-3 text-rose-500 mr-1" /> {room.temp_summer}°
                           </span>
                         )}
                         {room.temp_winter && (
                           <span className="flex items-center text-xs font-medium text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded shadow-sm">
                             <Snowflake className="w-3 h-3 text-cyan-500 mr-1" /> {room.temp_winter}°
                           </span>
                         )}
                       </div>
                    </div>
                  )}
                  
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {rooms.length === 0 && !isAdding && (
        <div className="text-center py-10 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <MapPin className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-stone-700 font-bold mb-1">Aucune pièce</h3>
          <p className="text-stone-500 text-sm">Ajoute tes pièces pour y associer tes plantes.</p>
        </div>
      )}
    </div>
  );
}
