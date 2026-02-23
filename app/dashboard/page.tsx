import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Leaf, MapPin, Sprout, Calendar, Snowflake, Sun, Flower2, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWateringStatus } from "@/lib/utils";
import WaterButton from "./WaterButton";
import BottomNav from "@/components/BottomNav";

const getSeasonInfo = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { name: "Printemps", icon: Flower2, color: "text-rose-500", bg: "bg-rose-50" };
  if (month >= 5 && month <= 7) return { name: "Été", icon: Sun, color: "text-amber-500", bg: "bg-amber-50" };
  if (month >= 8 && month <= 10) return { name: "Automne", icon: Leaf, color: "text-orange-500", bg: "bg-orange-50" };
  return { name: "Hiver", icon: Snowflake, color: "text-sky-500", bg: "bg-sky-50" };
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: plants } = await supabase.from("plants").select("*");

  // On trie toutes les plantes pour la logique de base
  const sortedPlants = plants?.sort((a, b) => {
    const nextDateA = new Date(a.last_watered_at);
    nextDateA.setDate(nextDateA.getDate() + a.watering_frequency + (a.snooze_days || 0));
    
    const nextDateB = new Date(b.last_watered_at);
    nextDateB.setDate(nextDateB.getDate() + b.watering_frequency + (b.snooze_days || 0));

    return nextDateA.getTime() - nextDateB.getTime();
  });

  // NOUVEAU : On filtre pour ne garder QUE les plantes "urgentes"
  const urgentPlants = sortedPlants?.filter((plant) => {
    const snoozeDays = plant.snooze_days || 0;
    const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);
    return status.urgent;
  });

  const signOut = async () => {
    "use server";
    const supabaseAuth = await createClient();
    await supabaseAuth.auth.signOut();
    redirect("/auth/login");
  };

  const season = getSeasonInfo();
  const plantCount = plants?.length || 0;
  
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' 
  }).format(today);
  const dateString = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-24 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <Leaf className="w-6 h-6 text-emerald-300" />
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit" className="text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <LogOut className="w-5 h-5" />
              </Button>
            </form>
          </header>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Tableau de bord
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 -mt-14 relative z-20 space-y-10">
        
        {/* WIDGETS ECOSYSTEME */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[1.5rem] p-4 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col justify-between aspect-[4/3] transition-transform hover:scale-[1.02] relative overflow-hidden">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${season.bg} ${season.color} mb-2 relative z-10`}>
                <season.icon className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <p className="text-stone-800 font-bold text-sm sm:text-[15px] leading-tight capitalize mb-1.5">{dateString}</p>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Saison : {season.name}</p>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-4 shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-col justify-between aspect-[4/3] transition-transform hover:scale-[1.02] relative overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-700 mb-2 relative z-10">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <p className="text-stone-800 font-bold text-lg sm:text-xl leading-tight mb-1">{plantCount} plante{plantCount > 1 ? 's' : ''}</p>
                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">Dans la jungle</p>
              </div>
            </div>
          </div>
        </section>

        {/* LISTE : À ARROSER */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-stone-800 tracking-tight">À arroser</h2>
            <div className="h-px bg-stone-200 flex-1 ml-2"></div>
          </div>

          {plantCount === 0 ? (
            /* Cas 1 : Aucune plante enregistrée */
            <div className="bg-white rounded-[2rem] border border-stone-100 p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-lg shadow-stone-200/40 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-emerald-50"><Leaf className="w-32 h-32 rotate-12" /></div>
              <div className="p-4 bg-emerald-50 rounded-full relative z-10"><Sprout className="w-8 h-8 text-emerald-600" /></div>
              <div className="relative z-10">
                <h3 className="font-bold text-stone-800 text-lg">Aucune plante</h3>
                <p className="text-sm text-stone-500 mt-1">Commencez à créer votre jungle urbaine.</p>
              </div>
            </div>
          ) : urgentPlants?.length === 0 ? (
            /* Cas 2 : Des plantes, mais aucune n'a soif ! (Message positif) */
            <div className="bg-white rounded-[2rem] border border-stone-100 p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-stone-200/40 relative overflow-hidden">
              <div className="p-4 bg-emerald-50 rounded-full relative z-10 mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-bold text-stone-800 text-lg relative z-10">Tout va bien !</h3>
              <p className="text-sm text-stone-500 mt-1 relative z-10">Aucune de vos plantes n'a soif aujourd'hui. Profitez de votre écosystème.</p>
            </div>
          ) : (
            /* Cas 3 : Liste des plantes urgentes */
            <div className="flex flex-col gap-3">
              {urgentPlants?.map((plant) => {
                const snoozeDays = plant.snooze_days || 0;
                const history = plant.watering_history || [];
                const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);
                const badgeColorClass = status.color === 'red' ? 'text-rose-600' : status.color === 'orange' ? 'text-amber-500' : 'text-emerald-600';

                return (
                  <div key={plant.id} className="group relative flex flex-row bg-white rounded-[1.75rem] overflow-hidden shadow-lg shadow-stone-200/40 border border-stone-100/60 transition-all duration-300 hover:shadow-xl hover:border-emerald-200">
                    <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />
                    <div className="relative w-[35%] min-w-[120px] max-w-[140px] bg-stone-100 shrink-0 border-r border-stone-100/50">
                      {plant.image_path ? (
                        <Image src={plant.image_path} alt={plant.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 33vw, 25vw" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-stone-300 bg-emerald-50/50"><Leaf className="w-8 h-8 opacity-40 text-emerald-600" /></div>
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
                        <div className="shrink-0"><WaterButton plantId={plant.id} history={history} urgent={status.urgent} /></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Remplacement du vieux bouton FAB par le BottomNav global */}
      <BottomNav />
    </div>
  );
}
