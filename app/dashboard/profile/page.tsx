import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ProfileForms from "./ProfileForms";
import { Button } from "@/components/ui/button";
import { logOut } from "@/server/actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        
        {/* Le formulaire allégé (Email / MDP) */}
        <ProfileForms user={user} />

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

      <BottomNav />
    </div>
  );
}
