"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DoorOpen, Plus, Thermometer, Droplets, Compass, Sun, Trash2, X, Loader2, Cloud, SunDim, Wind, Pencil } from "lucide-react";
import { saveRoom, deleteRoom } from "@/server/actions";

export default function RoomsManager({ rooms }: { rooms: any[] }) {
  const [isPending, startTransition] = useTransition();

  // États pour le formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  // États pour la popup de suppression
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Valeurs locales du formulaire
  const [orientations, setOrientations] = useState<string[]>([]);
  const [lightLevel, setLightLevel] = useState("Moyenne");
  const [humidityLevel, setHumidityLevel] = useState("Normale");

  const openForm = (room?: any) => {
    if (room) {
      setEditingRoom(room);
      setOrientations(room.orientation ? room.orientation.split('-') : []);
      setLightLevel(room.light_level || "Moyenne");
      setHumidityLevel(room.humidity || "Normale");
    } else {
      setEditingRoom(null);
      setOrientations([]);
      setLightLevel("Moyenne");
      setHumidityLevel("Normale");
    }
    setIsFormOpen(true);
  };

  const toggleOrientation = (dir: string) => {
    if (orientations.includes(dir)) {
      setOrientations(orientations.filter(d => d !== dir));
    } else {
      if (orientations.length < 2) {
        setOrientations([...orientations, dir]);
      } else {
        setOrientations([orientations[0], dir]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await saveRoom(formData);
      if (result.error) toast.error(result.error);
      else {
        toast.success(editingRoom ? "Pièce modifiée avec succès !" : "Pièce ajoutée avec succès !");
        setIsFormOpen(false);
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteRoom(id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Pièce supprimée.");
        setRoomToDelete(null);
      }
    });
  };

  return (
    <>
      {/* 🔴 MODALE DE SUPPRESSION */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 border border-rose-100/50">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mb-2">Supprimer la pièce ?</h3>
            <p className="text-stone-500 font-medium text-sm mb-6 leading-relaxed">
              Les plantes qui y sont associées ne seront pas supprimées, mais elles perdront leur emplacement.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setRoomToDelete(null)} className="flex-1 h-12 rounded-xl font-bold border-stone-200 text-stone-600">
                Annuler
              </Button>
              <Button type="button" onClick={() => handleDelete(roomToDelete)} disabled={isPending} className="flex-1 h-12 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-lg shadow-rose-900/20">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 BLOC PRINCIPAL IDENTIQUE A "MA RÉGION" */}
      <section className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-stone-200/60 relative overflow-hidden mt-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm border border-emerald-100/50">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Mes pièces</h2>
              <p className="text-sm text-stone-500 mt-0.5 font-medium">Gère tes différents emplacements.</p>
            </div>
          </div>
          {!isFormOpen && (
            <Button onClick={() => openForm()} variant="ghost" size="icon" className="bg-stone-50 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-full h-10 w-10 transition-colors">
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* FORMULAIRE D'AJOUT / MODIFICATION */}
        {isFormOpen ? (
          <div className="bg-[#FDFCF8] p-5 rounded-[1.5rem] border border-stone-200/60 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-stone-800 text-lg">
                {editingRoom ? "Modifier l'emplacement" : "Nouvel emplacement"}
              </h3>
              <Button onClick={() => setIsFormOpen(false)} variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600 bg-white rounded-full shadow-sm border border-stone-100"><X className="w-4 h-4" /></Button>
            </div>
            
            {/* L'attribut key permet à React de bien recharger le form si on passe d'une édition à un ajout */}
            <form key={editingRoom?.id || "new"} onSubmit={handleSave} className="space-y-6">
              <input type="hidden" name="id" value={editingRoom?.id || ""} />

              {/* 1. NOM DE LA PIÈCE */}
              <div className="space-y-2.5">
                <Label className="text-stone-600 font-bold ml-1">Nom de la pièce / zone</Label>
                <Input name="name" defaultValue={editingRoom?.name || ""} required placeholder="Ex: Salon, Couloir, Véranda..." className="h-12 rounded-2xl bg-white border-stone-200 focus:ring-emerald-500 font-medium" />
              </div>

              {/* 2. ORIENTATION */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end ml-1">
                  <Label className="flex items-center gap-1.5 text-stone-600 font-bold"><Compass className="w-4 h-4 text-emerald-500" /> Orientation</Label>
                  <span className="text-[10px] text-stone-400 font-medium">Jusqu'à 2 choix</span>
                </div>
                <input type="hidden" name="orientation" value={orientations.join('-')} />
                <div className="grid grid-cols-4 gap-2">
                  {['Nord', 'Sud', 'Est', 'Ouest'].map((dir) => {
                    const isSelected = orientations.includes(dir);
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => toggleOrientation(dir)}
                        className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border active:scale-95 ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                            : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        {dir}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. LUMINOSITÉ */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-stone-600 font-bold ml-1"><Sun className="w-4 h-4 text-amber-500" /> Lumière globale</Label>
                <input type="hidden" name="light_level" value={lightLevel} />
                <div className="flex bg-stone-100/50 border border-stone-200/60 rounded-2xl p-1.5">
                  {[
                    { value: 'Faible', icon: Cloud, label: 'Faible' },
                    { value: 'Moyenne', icon: SunDim, label: 'Moyenne' },
                    { value: 'Forte', icon: Sun, label: 'Forte' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLightLevel(opt.value)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        lightLevel === opt.value 
                          ? 'bg-white text-amber-600 shadow-sm border border-stone-200/50' 
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. HUMIDITÉ */}
              <div className="space-y-2.5">
                <Label className="flex items-center gap-1.5 text-stone-600 font-bold ml-1"><Droplets className="w-4 h-4 text-blue-500" /> Humidité ambiante</Label>
                <input type="hidden" name="humidity" value={humidityLevel} />
                <div className="flex bg-stone-100/50 border border-stone-200/60 rounded-2xl p-1.5">
                  {[
                    { value: 'Sèche', icon: Wind, label: 'Sèche' },
                    { value: 'Normale', icon: Droplets, label: 'Normale' },
                    { value: 'Humide', icon: Cloud, label: 'Humide' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setHumidityLevel(opt.value)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        humidityLevel === opt.value 
                          ? 'bg-white text-blue-600 shadow-sm border border-stone-200/50' 
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. TEMPÉRATURES */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-600 font-bold ml-1"><Thermometer className="w-4 h-4 text-rose-500" /> Temp. Été</Label>
                  <div className="relative">
                    <Input name="temp_summer" defaultValue={editingRoom?.temp_summer || ""} type="number" placeholder="Ex: 25" className="h-12 rounded-2xl bg-white border-stone-200 pr-8 font-medium" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">°C</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-1.5 text-stone-600 font-bold ml-1"><Thermometer className="w-4 h-4 text-sky-500" /> Temp. Hiver</Label>
                  <div className="relative">
                    <Input name="temp_winter" defaultValue={editingRoom?.temp_winter || ""} type="number" placeholder="Ex: 19" className="h-12 rounded-2xl bg-white border-stone-200 pr-8 font-medium" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold">°C</span>
                  </div>
                </div>
              </div>

              {/* BOUTON SAUVEGARDER - 🟢 CORRECTION ICI */}
              <Button type="submit" disabled={isPending} className="w-full h-14 mt-4 rounded-2xl bg-emerald-800 text-white text-sm font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 border border-emerald-700">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingRoom ? "Enregistrer les modifications" : "Créer l'emplacement")}
              </Button>
            </form>
          </div>
        ) : (
          /* LISTE DES PIÈCES */
          <div className="space-y-3">
            {rooms.length === 0 && (
              <div className="text-center p-8 bg-[#FDFCF8] border border-stone-200 border-dashed rounded-[1.5rem]">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DoorOpen className="w-6 h-6 text-stone-400" />
                </div>
                <p className="text-sm text-stone-500 font-medium">Vous n'avez pas encore défini de pièces.<br/>Ajoutez un emplacement pour aider l'expert.</p>
              </div>
            )}
            
            {rooms.map(room => (
              <div key={room.id} className="bg-[#FDFCF8] p-4 sm:p-5 rounded-[1.25rem] border border-stone-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between group">
                <div>
                  <h3 className="font-extrabold text-stone-800 text-base sm:text-lg mb-1 flex items-center gap-2">
                    {room.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {room.orientation && <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1"><Compass className="w-3 h-3" /> {room.orientation}</span>}
                    {room.light_level && <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md flex items-center gap-1"><Sun className="w-3 h-3" /> {room.light_level}</span>}
                    {room.humidity && <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md flex items-center gap-1"><Droplets className="w-3 h-3" /> {room.humidity}</span>}
                    {(room.temp_summer || room.temp_winter) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Thermometer className="w-3 h-3" /> 
                        {room.temp_summer ? `${room.temp_summer}°C` : '-'} / {room.temp_winter ? `${room.temp_winter}°C` : '-'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button onClick={() => openForm(room)} disabled={isPending} variant="ghost" size="icon" className="text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full h-9 w-9 shrink-0 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setRoomToDelete(room.id)} disabled={isPending} variant="ghost" size="icon" className="text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full h-9 w-9 shrink-0 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
