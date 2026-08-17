import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Home as HomeIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import EnvironmentForm from "./EnvironmentForm";
import RoomsManager from "./RoomsManager";
import EquipmentRecommendations from "../profile/EquipmentRecommendations";
import { getEquipmentRecommendations, getUserRooms, getUrgentWateringCount } from "@/server/actions";

export default async function MyHomePage() {
  const supabase = await createClient();
  const user = await getAuthenticatedUser();

  if (!user) redirect("/auth/login");

  const metadata = user.user_metadata || {};
  const [savedRecommendations, rooms, urgentCount] = await Promise.all([
    getEquipmentRecommendations(),
    getUserRooms(), // On charge les pièces
    getUrgentWateringCount(),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER VERT HERO */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <HomeIcon className="w-6 h-6 text-emerald-300" />
            </div>
          </header>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Ma Maison
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6">
        
        {/* 1. Gestion des pièces (Remonté) */}
        <RoomsManager rooms={rooms} />

        {/* 2. Paramètres globaux (Région) */}
        <EnvironmentForm metadata={metadata} />

        {/* 3. Trousse à outils */}
        <EquipmentRecommendations initialData={savedRecommendations} />
        
      </main>

      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}