import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ProfileForms from "./ProfileForms";
import EquipmentRecommendations from "./EquipmentRecommendations";
import { getEquipmentRecommendations } from "@/server/actions"; // NOUVEL IMPORT

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const metadata = user.user_metadata || {};
  
  // On va chercher les recommandations sauvegardées en base de données
  const savedRecommendations = await getEquipmentRecommendations();

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER VERT HERO */}
      <div className="bg-emerald-900 bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-b-[2.5rem] pb-10 pt-6 px-5 relative shadow-xl shadow-emerald-900/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-md mx-auto relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl">
              <User className="w-6 h-6 text-emerald-300" />
            </div>
          </header>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
              Mon profil
            </h1>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-5 mt-6 relative z-20 space-y-6">
        
        <ProfileForms user={user} metadata={metadata} />

        {/* On passe les données sauvegardées au composant */}
        <EquipmentRecommendations initialData={savedRecommendations} />

      </main>

      <BottomNav />
    </div>
  );
}
