import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Bell, HeartCrack, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ProfileForms from "./ProfileForms";
import { Button } from "@/components/ui/button";
import { logOut, getUrgentWateringCount, getDeceasedPlantsCount } from "@/server/actions";
import PushNotificationToggle from "@/components/PushNotificationToggle";

export default async function ProfilePage() {
  const supabase = await createClient();
  // getUrgentWateringCount() vérifie elle-même l'utilisateur (et renvoie 0 si non
  // connecté) : on peut la lancer en parallèle de la vérification de la page sans
  // risque, les deux partagent de toute façon le même appel mémoïsé.
  const [user, urgentCount, deceasedCount] = await Promise.all([
    getAuthenticatedUser(),
    getUrgentWateringCount(),
    getDeceasedPlantsCount(),
  ]);

  if (!user) redirect("/auth/login");

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
        
        {/* Notifications */}
        <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-[0.6rem] bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-stone-800">Rappels d'arrosage</div>
              <div className="text-[10px] text-stone-400 mt-0.5">Notification chaque matin à 8h</div>
            </div>
          </div>
          <PushNotificationToggle />
        </div>

        {/* Le formulaire allégé (Email / MDP) */}
        <ProfileForms user={user} />

        {/* Jardin des souvenirs — discret, visible seulement s'il y a un historique */}
        {deceasedCount > 0 && (
          <Link
            href="/dashboard/memorial"
            className="flex items-center gap-3 px-1 py-1 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <HeartCrack className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-medium flex-1">
              Jardin des souvenirs · {deceasedCount} plante{deceasedCount > 1 ? "s" : ""}
            </span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        )}

        {/* Le gros bouton de déconnexion rouge et clair */}
        <form action={logOut}>
          <Button 
            type="submit" 
            variant="ghost" 
            className="w-full h-14 rounded-[1.25rem] bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold shadow-sm transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Se déconnecter
          </Button>
        </form>

      </main>

      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
