import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminTable from "./AdminTable";
import { Users, Sprout, MapPin, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  // 1. VÉRIFICATION DE SÉCURITÉ (Remplace par ton vrai email admin)
  const ADMIN_EMAILS = ["studiohub@test.com"]; // 🟢 METS TON EMAIL ICI
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    redirect("/dashboard"); // Redirige les curieux vers le dashboard normal
  }

  // 2. CLIENT ADMIN (Pour lire toutes les données)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. RÉCUPÉRATION DES DONNÉES GLOBALES
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const allUsers = authData?.users || [];

  const { data: allPlants } = await supabaseAdmin.from("plants").select("id, user_id");
  // ✅ Ligne corrigée
const { data: allRooms, error: roomsError } = await supabaseAdmin.from("rooms").select("id, user_id");

// Optionnel : si tu veux voir l'erreur dans ton terminal serveur si la table ne s'appelle pas "user_rooms"
if (roomsError) {
  console.warn("Erreur sur la table des pièces :", roomsError.message);
}

  // 4. AGRÉGATION DES DONNÉES PAR UTILISATEUR
  const enrichedUsers = allUsers.map((u) => {
    const userPlants = allPlants?.filter((p) => p.user_id === u.id) || [];
    const userRooms = allRooms?.filter((r) => r.user_id === u.id) || [];
    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      plantsCount: userPlants.length,
      last_sign_in_at: u.last_sign_in_at,
      roomsCount: userRooms.length,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 5. STATS GLOBALES
  const totalUsers = allUsers.length;
  const totalPlants = allPlants?.length || 0;
  const totalRooms = allRooms?.length || 0;

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-20">
      
      {/* HEADER ADMIN */}
      <div className="bg-stone-900 text-white pb-16 pt-8 px-6 sm:px-10 border-b border-stone-800">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-stone-300" />
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Admin Zone
              </div>
            </div>
            <p className="text-stone-400 text-sm font-medium">{user.email}</p>
          </header>

          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Back-Office StudioPlant</h1>
          <p className="text-stone-400 font-medium">Gérez vos utilisateurs et observez la croissance de la plateforme.</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 -mt-8 relative z-10 space-y-8">
        
        {/* WIDGETS DE STATS (Desktop: 3 colonnes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Utilisateurs</p>
              <p className="text-3xl font-extrabold text-stone-900">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Plantes hébergées</p>
              <p className="text-3xl font-extrabold text-stone-900">{totalPlants}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Pièces créées</p>
              <p className="text-3xl font-extrabold text-stone-900">{totalRooms}</p>
            </div>
          </div>

        </div>

        {/* TABLEAU DES UTILISATEURS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800 tracking-tight flex items-center gap-2">
            Base utilisateurs
          </h2>
          <AdminTable users={enrichedUsers} />
        </div>

      </main>
    </div>
  );
}
