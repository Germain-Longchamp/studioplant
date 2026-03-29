import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Droplets, CheckCircle, Leaf, Sprout } from "lucide-react";
import { getWateringStatus, getActiveWateringFrequency } from "@/lib/utils";
import PlantCard from "../PlantCard";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

export default async function UrgentPlantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: plants } = await supabase.from("plants").select("*");

  // On filtre et on trie par urgence
  const urgentPlants = plants?.filter((plant) => {
    const snoozeDays = plant.snooze_days || 0;
    const status = getWateringStatus(plant.last_watered_at, getActiveWateringFrequency(plant), snoozeDays);
    return status.urgent;
  }).sort((a, b) => {
    const nextDateA = new Date(a.last_watered_at);
    nextDateA.setDate(nextDateA.getDate() + getActiveWateringFrequency(a) + (a.snooze_days || 0));

    const nextDateB = new Date(b.last_watered_at);
    nextDateB.setDate(nextDateB.getDate() + getActiveWateringFrequency(b) + (b.snooze_days || 0));

    return nextDateA.getTime() - nextDateB.getTime();
  }) || [];

  const urgentCount = urgentPlants.length;

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER HERO (Padding réduit et indicateur intégré) */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-14 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-start gap-3">
            <Button variant="ghost" size="icon" asChild className="text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors mt-0.5 shrink-0">
              <Link href="/dashboard">
                <ArrowLeft className="w-6 h-6" />
              </Link>
            </Button>
            
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm mb-2">
                Arrosages
              </h1>
              
              {/* Le texte des actions est maintenant un badge dans le header ! */}
              {urgentCount > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-bold uppercase tracking-wider">
                  <Droplets className="w-4 h-4 text-rose-300" />
                  {urgentCount} action{urgentCount > 1 ? 's' : ''} requise{urgentCount > 1 ? 's' : ''}
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  Tout est à jour
                </div>
              )}
            </div>
          </header>
        </div>
      </div>

      {/* MARGE NÉGATIVE RÉDUITE (-mt-6 au lieu de -mt-14) */}
      <main className="max-w-md mx-auto px-5 -mt-6 relative z-20">
        
        {urgentCount === 0 ? (
          <div className="bg-white rounded-[2rem] border border-stone-100 p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-stone-200/40 relative overflow-hidden">
            <div className="p-4 bg-emerald-50 rounded-full relative z-10 mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-stone-800 text-lg relative z-10">Tout va bien !</h3>
            <p className="text-sm text-stone-500 mt-1 relative z-10">Aucune de vos plantes n'a soif actuellement. C'est l'heure de se reposer.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* On boucle directement sur les cartes, plus de texte noir ici ! */}
            {urgentPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}