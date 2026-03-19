"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DoorOpen, Plus, Thermometer, Droplets, Compass, Sun, Trash2, X, Loader2 } from "lucide-react";
import { saveRoom, deleteRoom } from "@/server/actions";

export default function RoomsManager({ rooms }: { rooms: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await saveRoom(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Pièce enregistrée avec succès !");
        setIsAdding(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet emplacement ?")) return;
    startTransition(async () => {
      const result = await deleteRoom(id);
      if (result.error) toast.error(result.error);
      else toast.success("Pièce supprimée.");
    });
  };

  return (
    <section className="space-y-4 mt-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-stone-800">
          <DoorOpen className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold tracking-tight">Mes pièces</h2>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="ghost" size="icon" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-full h-9 w-9">
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* FORMULAIRE D'AJOUT */}
      {isAdding && (
        <div className="bg-white p-5 rounded-[2rem] border border-emerald-200/60 shadow-xl shadow-emerald-900/5 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-stone-800">Nouvel emplacement</h3>
            <Button onClick={() => setIsAdding(false)} variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></Button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la pièce / zone</Label>
              <Input name="name" required placeholder="Ex: Salon, Couloir, Véranda..." className="h-12 rounded-2xl bg-[#FDFCF8]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-stone-400" /> Orientation</Label>
                <select name="orientation" className="h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-3 text-sm">
                  <option value="">Non définie</option>
                  <option value="Nord">Nord</option>
                  <option value="Sud">Sud</option>
                  <option value="Est">Est</option>
                  <option value="Ouest">Ouest</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-amber-500" /> Lumière globale</Label>
                <select name="light_level" className="h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-3 text-sm">
                  <option value="">Non définie</option>
                  <option value="Faible">Faible (Sombre)</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Forte">Forte (Très lumineux)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-rose-500" /> Temp. Été</Label>
                <div className="relative">
                  <Input name="temp_summer" type="number" placeholder="Ex: 25" className="h-12 rounded-2xl bg-[#FDFCF8] pr-8" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">°C</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-sky-500" /> Temp. Hiver</Label>
                <div className="relative">
                  <Input name="temp_winter" type="number" placeholder="Ex: 19" className="h-12 rounded-2xl bg-[#FDFCF8] pr-8" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">°C</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Humidité ambiante</Label>
              <select name="humidity" className="h-12 w-full rounded-2xl border border-stone-200 bg-[#FDFCF8] px-3 text-sm">
                <option value="">Normale</option>
                <option value="Sèche">Sèche (Chauffage fort)</option>
                <option value="Humide">Humide (SDB, Cuisine)</option>
              </select>
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-12 rounded-2xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition-all">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer l'emplacement"}
            </Button>
          </form>
        </div>
      )}

      {/* LISTE DES PIÈCES */}
      <div className="space-y-3">
        {rooms.length === 0 && !isAdding && (
          <div className="text-center p-6 bg-white/50 border border-stone-200 border-dashed rounded-[2rem]">
            <p className="text-sm text-stone-500 font-medium">Vous n'avez pas encore défini de pièces.</p>
          </div>
        )}
        
        {rooms.map(room => (
          <div key={room.id} className="bg-white p-4 rounded-[1.5rem] border border-stone-100 shadow-sm flex items-center justify-between group">
            <div>
              <h3 className="font-bold text-stone-800 flex items-center gap-2">
                {room.name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {room.orientation && <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">{room.orientation}</span>}
                {room.temp_summer && <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">☀️ {room.temp_summer}°C</span>}
                {room.temp_winter && <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md">❄️ {room.temp_winter}°C</span>}
                {room.humidity && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">💧 {room.humidity}</span>}
              </div>
            </div>
            <Button onClick={() => handleDelete(room.id)} disabled={isPending} variant="ghost" size="icon" className="text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full h-9 w-9 shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
