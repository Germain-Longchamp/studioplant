import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminLayout from "./AdminLayout";
import type { EnrichedUser, RetentionMetrics } from "./types";
import { Users, Sprout, MapPin, ShieldAlert, ArrowLeft, Scan } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // FETCH
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const allUsers = authData?.users || [];

  const { data: allPlants } = await supabaseAdmin
    .from("plants")
    .select("id, user_id, created_at, last_watered_at, watering_history, watering_frequency");
  const { data: allRooms } = await supabaseAdmin
    .from("rooms")
    .select("id, user_id, created_at");
  const { data: allScans } = await supabaseAdmin
    .from("quick_scans")
    .select("id, created_at");
  const { data: adminLogs } = await supabaseAdmin
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // ENRICHED USERS
  const enrichedUsers = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    plantsCount: allPlants?.filter((p) => p.user_id === u.id).length ?? 0,
    last_sign_in_at: u.last_sign_in_at,
    roomsCount: allRooms?.filter((r) => r.user_id === u.id).length ?? 0,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as EnrichedUser[];

  // GLOBAL KPIs
  const totalUsers  = allUsers.length;
  const totalPlants = allPlants?.length  ?? 0;
  const totalRooms  = allRooms?.length   ?? 0;
  const totalScans  = allScans?.length   ?? 0;

  // RETENTION METRICS
  const now = Date.now();
  const ms  = (days: number) => days * 24 * 3600 * 1000;

  const DAU = allUsers.filter(u => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < ms(1)).length;
  const WAU = allUsers.filter(u => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < ms(7)).length;
  const MAU = allUsers.filter(u => u.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < ms(30)).length;
  const stickinessRatio = MAU > 0 ? Math.round((DAU / MAU) * 100) : 0;

  const usersWithPlant   = new Set(allPlants?.map(p => p.user_id) ?? []);
  const activationRate   = totalUsers > 0 ? Math.round((usersWithPlant.size / totalUsers) * 100) : 0;

  const newUsers7d       = allUsers.filter(u => now - new Date(u.created_at).getTime() < ms(7));
  const newActivationRate = newUsers7d.length > 0
    ? Math.round((newUsers7d.filter(u => usersWithPlant.has(u.id)).length / newUsers7d.length) * 100)
    : 0;

  const ghostUsers = allUsers.filter(u => {
    if (now - new Date(u.created_at).getTime() < ms(3)) return false;
    if (!u.last_sign_in_at) return true;
    return Math.abs(new Date(u.last_sign_in_at).getTime() - new Date(u.created_at).getTime()) < 60_000;
  }).length;

  const powerUsers = allUsers.filter(u => {
    const plants = allPlants?.filter(p => p.user_id === u.id).length ?? 0;
    const rooms  = allRooms?.filter(r => r.user_id === u.id).length ?? 0;
    return plants >= 3 && rooms >= 1;
  }).length;

  const thirtyDaysAgo = new Date(now - ms(30));
  const usersWhoWatered = new Set(
    allPlants?.filter(p => p.last_watered_at && new Date(p.last_watered_at) >= thirtyDaysAgo).map(p => p.user_id) ?? []
  );
  const wateringEngagementRate = MAU > 0 ? Math.round((usersWhoWatered.size / MAU) * 100) : 0;

  const plantsPerActiveUser = (() => {
    const count = allPlants?.filter(p => {
      const u = allUsers.find(u => u.id === p.user_id);
      return u?.last_sign_in_at && now - new Date(u.last_sign_in_at).getTime() < ms(30);
    }).length ?? 0;
    return MAU > 0 ? Math.round((count / MAU) * 10) / 10 : 0;
  })();

  const cohortData = (() => {
    const cohorts: Record<string, { total: number; retained: number }> = {};
    allUsers.forEach(u => {
      const month = u.created_at.slice(0, 7);
      if (!cohorts[month]) cohorts[month] = { total: 0, retained: 0 };
      cohorts[month].total += 1;
      if (u.last_sign_in_at && new Date(u.last_sign_in_at) >= thirtyDaysAgo) {
        cohorts[month].retained += 1;
      }
    });
    return Object.entries(cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([month, { total, retained }]) => ({
        name: month,
        retention: total > 0 ? Math.round((retained / total) * 100) : 0,
        total,
      }));
  })();

  // ── MÉTRIQUES ARROSAGE (Sprint 4) ──────────────────────────────────
  const usersWithAtLeastOnePlant = new Set(allPlants?.map(p => p.user_id) ?? []);

  const usersWhoWateredRecently = new Set(
    allPlants
      ?.filter(p => p.last_watered_at && new Date(p.last_watered_at) >= thirtyDaysAgo)
      .map(p => p.user_id) ?? []
  );
  const activeWatererRate = usersWithAtLeastOnePlant.size > 0
    ? Math.round((usersWhoWateredRecently.size / usersWithAtLeastOnePlant.size) * 100)
    : 0;

  const abandonedPlants = allPlants?.filter(p => {
    if (!p.last_watered_at || !p.watering_frequency) return false;
    const daysSinceWatered = (Date.now() - new Date(p.last_watered_at).getTime()) / (24 * 3600 * 1000);
    return daysSinceWatered > p.watering_frequency * 2;
  }) ?? [];
  const totalPlantsCount = allPlants?.length ?? 0;
  const abandonedRate = totalPlantsCount > 0
    ? Math.round((abandonedPlants.length / totalPlantsCount) * 100)
    : 0;

  const adherenceScores = (allPlants ?? [])
    .filter(p => {
      const history = p.watering_history as string[] | null;
      return Array.isArray(history) && history.length >= 2 && p.watering_frequency;
    })
    .map(p => {
      const history = (p.watering_history as string[])
        .slice(0, 3)
        .map(d => new Date(d).getTime())
        .sort((a, b) => b - a);
      const avgGapMs = (history[0] - history[history.length - 1]) / (history.length - 1);
      return (avgGapMs / (24 * 3600 * 1000)) / p.watering_frequency;
    });
  const avgAdherenceRatio = adherenceScores.length > 0
    ? Math.round((adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length) * 100) / 100
    : null;
  // ───────────────────────────────────────────────────────────────────

  const retention: RetentionMetrics = {
    DAU, WAU, MAU, stickinessRatio, totalUsers,
    activationRate, newActivationRate, ghostUsers,
    powerUsers, wateringEngagementRate, plantsPerActiveUser,
    cohortData,
    activeWatererRate,
    abandonedRate,
    abandonedCount: abandonedPlants.length,
    avgAdherenceRatio,
    plantsWithHistoryCount: adherenceScores.length,
    usersWithPlantsCount: usersWithAtLeastOnePlant.size,
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans pb-20">

      {/* HEADER */}
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Back-Office Studio Plantes</h1>
          <p className="text-stone-400 font-medium">Gérez vos utilisateurs et observez la croissance de la plateforme.</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 sm:px-10 -mt-8 relative z-10 space-y-6">

        {/* KPI WIDGETS — toujours visibles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Utilisateurs</p>
              <p className="text-2xl font-extrabold text-stone-900">{totalUsers}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Plantes</p>
              <p className="text-2xl font-extrabold text-stone-900">{totalPlants}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Pièces</p>
              <p className="text-2xl font-extrabold text-stone-900">{totalRooms}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 shrink-0">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Scans</p>
              <p className="text-2xl font-extrabold text-stone-900">{totalScans}</p>
            </div>
          </div>
        </div>

        {/* TABBED LAYOUT */}
        <AdminLayout
          chartData={{
            users:  allUsers.map(u => ({ created_at: u.created_at })),
            plants: allPlants?.map(p => ({ created_at: p.created_at })) ?? [],
            rooms:  allRooms?.map(r => ({ created_at: r.created_at })) ?? [],
            scans:  allScans?.map(s => ({ created_at: s.created_at })) ?? [],
          }}
          retention={retention}
          enrichedUsers={enrichedUsers}
          adminLogs={adminLogs ?? []}
        />

      </main>
    </div>
  );
}
