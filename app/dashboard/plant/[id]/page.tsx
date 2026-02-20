import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, Sun, AlignLeft, Sparkles, Info, LeafyGreen, ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import DeleteButton from "./DeleteButton";
import { getWateringStatus } from "@/lib/utils";
import { waterPlant, snoozeWatering } from "@/server/actions";

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !plant) redirect("/dashboard");

  // Récupération sécurisée des valeurs d'arrosage
  const snoozeDays = plant.snooze_days || 0;
  const history = plant.watering_history || [];
  const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans text-stone-800 overflow-x-hidden">
      
      {/* HEADER : Glassmorphism flottant */}
      <header className="fixed top-0 w-full z-30 bg-gradient-to-b from-black/50 via-black/10 to-transparent pt-6 pb-4">
        <div className="max-w-md mx-auto px-5 flex items-center">
          <Button variant="ghost" size="icon" asChild className="text-white bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/20 shadow-lg rounded-full transition-all active:scale-95">
            <Link href="/dashboard">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        
        {/* HERO IMAGE : Prends la moitié de l'écran avec fondu vers la couleur de fond */}
        <div className="relative w-full h-[55vh] bg-emerald-900 overflow-hidden">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover" priority sizes="100vw" />
          ) : (
             <div className="flex items-center justify-center h-full opacity-30"><Info className="w-16 h-16 text-white" /></div>
          )}
          {/* Dégradé de transition image -> fond #FDFCF8 */}
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#FDFCF8] via-[#FDFCF8]/80 to-transparent" />
        </div>

        {/* CONTENU PRINCIPAL : Overlap sur l'image */}
        <div className="px-5 relative -mt-24 z-20 space-y-4">
          
          {/* En-tête de la plante */}
          <div className="mb-6 drop-shadow-sm">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none mb-1">
              {plant.name}
            </h1>
            <p className="text-lg text-emerald-700 font-medium italic">
              {plant.species}
            </p>
          </div>

          {/* === 1. ACCORDÉON : ARROSAGE === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden" open>
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-sky-50 rounded-2xl text-sky-500 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-bold text-lg">Arrosage</span>
                  {/* Statut cohérent avec le Dashboard (Calendrier + Format court) */}
                  <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide mt-0.5 ${status.urgent ? 'text-rose-600' : 'text-stone-400'}`}>
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                    <span className="truncate">{status.text}</span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300 space-y-5">
              
              {/* Actions d'arrosage Premium */}
              <div className="flex gap-3">
                <form action={waterPlant.bind(null, plant.id, history)} className="flex-1">
                  <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-[1.25rem] shadow-lg shadow-sky-500/20 h-12 font-bold transition-all active:scale-95">
                    <Droplets className="w-4 h-4 mr-2" /> Arrosée
                  </Button>
                </form>
                <form action={snoozeWatering.bind(null, plant.id, snoozeDays)}>
                  <Button type="submit" variant="outline" className="w-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-[1.25rem] h-12 font-bold shadow-sm transition-all active:scale-95">
                    +3 jours
                  </Button>
                </form>
              </div>

              {/* Petit historique */}
              {(history && history.length > 0) && (
                <div className="p-4 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm">
                  <h4 className="text-stone-400 font-bold text-[10px] uppercase tracking-wider mb-3">Derniers arrosages</h4>
                  <ul className="space-y-2.5">
                    {history.map((dateStr: string, index: number) => {
                      const date = new Date(dateStr);
                      return (
                        <li key={index} className="flex items-center gap-3 text-sm text-stone-700 font-medium">
                          <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Conseil IA */}
              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 flex items-start gap-3 mt-2">
                <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed">
                  L'IA recommande tous les <strong>{plant.watering_frequency} jours</strong>. Touchez la terre : si elle est encore humide, utilisez le bouton "+3 jours".
                </p>
              </div>

            </div>
          </details>

          {/* === 2. ACCORDÉON : ENVIRONNEMENT === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-bold text-lg">Environnement</span>
                  <span className="text-stone-500 text-sm truncate font-medium mt-0.5">
                    {plant.room || "Pièce inconnue"} • {plant.exposure || "Lumière non précisée"}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 space-y-3 text-stone-600 animate-in fade-in duration-300">
              {plant.room_advice && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                  <h4 className="text-purple-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Avis sur la pièce
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed">{plant.room_advice}</p>
                </div>
              )}
              {plant.light_advice && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                  <h4 className="text-amber-800 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Avis sur la lumière
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed">{plant.light_advice}</p>
                </div>
              )}
            </div>
          </details>

          {/* === 3. ACCORDÉON : GUIDE D'ENTRETIEN === */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                  <LeafyGreen className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-bold text-lg">Guide d'entretien</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
              <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm">
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {plant.care_notes || "Aucun guide disponible pour le moment."}
                </p>
              </div>
            </div>
          </details>

          {/* === 4. ACCORDÉON : MON CARNET === */}
          {plant.description && (
            <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 shrink-0">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden pr-2">
                    <span className="text-stone-800 font-bold text-lg">Mon carnet</span>
                    <span className="text-stone-500 text-sm truncate font-medium mt-0.5">{plant.description}</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                  <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>
              <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
                <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {plant.description}
                  </p>
                </div>
              </div>
            </details>
          )}

          <div className="pt-8 pb-4">
            <DeleteButton plantId={plant.id} imageUrl={plant.image_path} />
          </div>

        </div>
      </main>
    </div>
  );
}
