import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import UserDetailClient from "./UserDetailClient";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser || currentUser.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: targetUserData, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error || !targetUserData?.user) notFound();

  const targetUser = targetUserData.user;

  const [{ data: plants }, { data: rooms }, { data: activity }] = await Promise.all([
    supabaseAdmin
      .from("plants")
      .select("id, name, image_path, created_at, room, last_watered_at, snooze_days, promised_watering_interval_days, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter, reminders_paused")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("rooms").select("id, name, created_at").eq("user_id", id).order("created_at", { ascending: false }),
    supabaseAdmin.from("user_activity").select("last_seen_at").eq("user_id", id).maybeSingle(),
  ]);

  // Activité réelle (chargement de page) — fallback sur last_sign_in_at si l'utilisateur
  // n'a encore jamais chargé de page depuis le déploiement de ce suivi.
  const lastActive = activity?.last_seen_at ?? targetUser.last_sign_in_at ?? null;

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-20">
      <div className="bg-stone-900 text-white pb-16 pt-8 px-6 sm:px-10 border-b border-stone-800">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-stone-300" />
              </Link>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" /> Admin Zone
              </div>
            </div>
            <p className="text-stone-400 text-sm font-medium">{currentUser.email}</p>
          </header>

          <h1 className="text-3xl font-extrabold tracking-tight mb-1 truncate">{targetUser.email}</h1>
          <p className="text-stone-400 font-mono text-xs">{targetUser.id}</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 -mt-8 relative z-10">
        <UserDetailClient
          user={{
            id: targetUser.id,
            email: targetUser.email,
            created_at: targetUser.created_at,
            last_seen_at: lastActive,
            role: (targetUser.app_metadata?.role as string | undefined) ?? null,
          }}
          plants={plants ?? []}
          rooms={rooms ?? []}
        />
      </main>
    </div>
  );
}
