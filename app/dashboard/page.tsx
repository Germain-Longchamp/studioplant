import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Leaf, Sprout, Calendar, Snowflake, Sun, Flower2, CheckCircle, Droplets, User } from "lucide-react";
import { getWateringStatus } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import QuickAnalysis from "./QuickAnalysis";
import DoctorPlant from "./DoctorPlant";

// IMPORT DES COMPOSANTS D'ONBOARDING ET DE L'ACTION
import RoomOnboarding from "./RoomOnboarding";
import NewUserOnboarding from "./NewUserOnboarding";
import { getUserRooms } from "@/server/actions";

const getSeasonInfo = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { name: "Printemps", icon: Flower2, color: "text-rose-500", bg: "bg-rose-50" };
  if (month >= 5 && month <= 7) return { name: "Été", icon: Sun, color: "text-amber-500", bg: "bg-amber-50" };
  if (month >= 8 && month <= 10) return { name: "Automne", icon: Leaf, color: "text-orange-500", bg: "bg-orange-50" };
  return { name: "Hiver", icon: Snowflake, color: "text-sky-500", bg: "bg-sky-50" };
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser();

  if (!user) redirect("/auth/login");

  // Les plantes et les pièces sont indépendantes l'une de l'autre : on les charge
  // en parallèle au lieu d'attendre l'une puis l'autre.
  const [{ data: plants }, rooms] = await Promise.all([
    supabase.from("plants").select("*").eq("is_deceased", false),
    getUserRooms(),
  ]);

  // VÉRIFICATION DES PIÈCES ET DES PLANTES POUR L'ONBOARDING
  const hasNoRooms = rooms.length === 0;
  const hasNoPlants = !plants || plants.length === 0;

  // Logique de ciblage des modales
  const isBrandNewUser = hasNoRooms && hasNoPlants; 
  const needsRoomMigration = hasNoRooms && !hasNoPlants;

  // US-002 : intervalle promis figé en base, plus de recalcul depuis la saison courante.
  const sortedPlants = plants?.sort((a, b) => {
    const nextDateA = new Date(a.last_watered_at);
    nextDateA.setDate(nextDateA.getDate() + a.promised_watering_interval_days + (a.snooze_days || 0));

    const nextDateB = new Date(b.last_watered_at);
    nextDateB.setDate(nextDateB.getDate() + b.promised_watering_interval_days + (b.snooze_days || 0));

    return nextDateA.getTime() - nextDateB.getTime();
  });

  const urgentPlants = sortedPlants?.filter((plant) => {
    const snoozeDays = plant.snooze_days || 0;
    const status = getWateringStatus(plant.last_watered_at, plant.promised_watering_interval_days, snoozeDays, !!plant.reminders_paused);
    return status.urgent;
  });

  const season = getSeasonInfo();
  const plantCount = plants?.length || 0;
  const urgentCount = urgentPlants?.length || 0;
  
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('fr-FR', { 
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' 
  }).format(today);
  const dateString = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden relative">
      
      {/* HEADER VERT AVEC DATE INTEGREE */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-24 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
                <Leaf className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-white font-extrabold text-lg tracking-tight">
                StudioPlantes
              </span>
            </div>
            <Link
              href="/dashboard/profile"
              aria-label="Mon profil"
              className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl text-emerald-200 hover:text-white hover:bg-white/15 transition-colors active:scale-95"
            >
              <User className="w-6 h-6" />
            </Link>
          </header>

          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Tableau de bord
            </h1>
            <p className="text-emerald-200/90 text-sm font-medium mt-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 opacity-80" />
              {dateString} • {season.name}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 -mt-14 relative z-20 space-y-10">
        
        {/* WIDGETS ECOSYSTEME - DESIGN 100% MOBILE (Paddings Équilibrés) */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            
            {/* 1. Widget : Nombre de plantes */}
            <Link href="/dashboard/plants" className="block focus:outline-none">
              <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-stone-100 flex flex-col justify-between aspect-[4/3] active:scale-[0.97] active:bg-stone-50 transition-all duration-200">
                
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center -mr-1 -mt-1">
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
                
                <div>
                  <p className="text-3xl font-extrabold text-stone-800 tracking-tight mb-0.5 flex items-baseline gap-1.5 leading-none">
                    {plantCount} <span className="text-sm font-semibold text-stone-400 tracking-normal">plante{plantCount > 1 ? 's' : ''}</span>
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mt-1.5">
                    Ma Jungle
                  </p>
                </div>
              </div>
            </Link>

            {/* 2. Widget : À arroser */}
            <Link href="/dashboard/plants?filter=to-water" className="block focus:outline-none">
              <div className={`bg-white rounded-[1.5rem] p-5 shadow-sm border flex flex-col justify-between aspect-[4/3] active:scale-[0.97] transition-all duration-200 ${
                urgentCount > 0 ? 'border-rose-100 active:bg-rose-50/50' : 'border-stone-100 active:bg-stone-50'
              }`}>
                
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${
                    urgentCount > 0 ? 'bg-rose-50 text-rose-500' : 'bg-stone-50 text-stone-400'
                  }`}>
                    {urgentCount > 0 ? <Droplets className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center -mr-1 -mt-1 ${
                    urgentCount > 0 ? 'bg-rose-50/50' : 'bg-stone-50'
                  }`}>
                    <ChevronRight className={`w-4 h-4 ${
                      urgentCount > 0 ? 'text-rose-400' : 'text-stone-400'
                    }`} />
                  </div>
                </div>
                
                <div>
                  <p className="text-3xl font-extrabold text-stone-800 tracking-tight mb-0.5 flex items-baseline gap-1.5 leading-none">
                    {urgentCount} <span className="text-sm font-semibold text-stone-400 tracking-normal">action{urgentCount > 1 ? 's' : ''}</span>
                  </p>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${
                    urgentCount > 0 ? 'text-rose-500' : 'text-stone-400'
                  }`}>
                    {urgentCount > 0 ? 'Arrosages' : 'Tout va bien'}
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* OUTILS RAPIDES */}
        <section>
          <QuickAnalysis />

          <div className="mt-6">
            <DoctorPlant
              plants={(plants ?? []).map((p) => ({
                id: p.id,
                name: p.name,
                species: p.species,
                image_path: p.image_path,
                room: p.room,
              }))}
            />
          </div>
        </section>

      </main>

      <BottomNav urgentCount={urgentCount} />

      {/* AFFICHAGE CONDITIONNEL DES MODALES D'ONBOARDING */}
      <NewUserOnboarding show={isBrandNewUser} />
      <RoomOnboarding show={needsRoomMigration} />

    </div>
  );
}
