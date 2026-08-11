import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Calendar, Globe2, ShieldCheck, Ruler, Leaf, Sprout, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWateringStatus, getActiveWateringFrequency, formatRelativeDays, getFertilizingStatus } from "@/lib/utils";
import FertilizeButton from "./FertilizeButton";
import BottomNav from "@/components/BottomNav";
import PlantMenu from "./PlantMenu";
import PlantPhotoLightbox from "./PlantPhotoLightbox";
import DetailWaterButton from "./DetailWaterButton";
import SnoozeButton from "./SnoozeButton";
import PlantIdentityTrigger from "./PlantIdentityTrigger";
import DoctorPlantBlock from "./DoctorPlantBlock";
import CareGuideAccordion from "./CareGuideAccordion";
import { getPlantDiagnostics, getGrowthPhotos, getUrgentWateringCount } from "@/server/actions";
import GrowthJournal from "./components/GrowthJournal";
import LocationSection from "./LocationSection";
import WateringFrequencyDialog from "@/components/WateringFrequencyDialog";

export default async function PlantDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const backHref =
    from === "to-water" ? "/dashboard/plants?filter=to-water" : "/dashboard/plants";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: plant, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !plant) redirect("/dashboard");

  const snoozeDays = plant.snooze_days || 0;
  const history = plant.watering_history || [];
  const activeFreq = getActiveWateringFrequency(plant);
  const status = getWateringStatus(plant.last_watered_at, activeFreq, snoozeDays);

  const badgeColorClass =
    status.color === 'red'    ? 'text-rose-600 bg-rose-50 border-rose-100' :
    status.color === 'orange' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                'text-emerald-700 bg-emerald-50 border-emerald-100';

  const [initialDiagnoses, growthResult, urgentCount] = await Promise.all([
    getPlantDiagnostics(plant.id),
    getGrowthPhotos(plant.id),
    getUrgentWateringCount(),
  ]);
  const initialPhotos = growthResult.success ? (growthResult.data ?? []) : [];

  const hasQuickInfos = !!(plant.origin || plant.robustness || plant.max_size || plant.ideal_substrate || plant.ideal_exposure);

  // Chips : fallback gracieux sur les anciens champs
  const robustnessChip = plant.robustness_score || plant.robustness?.split(/\s*[-–]\s*/)[0] || null;
  const maxSizeChip    = plant.max_size_short    || plant.max_size?.slice(0, 12)              || null;
  const hasChips = !!(plant.origin || robustnessChip || maxSizeChip);

  const lastFertilizedFormatted = plant.last_fertilized_at
    ? formatRelativeDays(plant.last_fertilized_at)
    : null;

  const lastWateredFormatted = plant.last_watered_at
    ? new Date(plant.last_watered_at).toLocaleDateString('fr-FR', {
        weekday: 'short', day: 'numeric', month: 'short',
      }).replace('.', '')
    : null;

  return (
    <div className="min-h-screen bg-[#F4F7F4] pb-32 font-sans text-stone-800 overflow-x-hidden selection:bg-emerald-200">
      <main className="max-w-md mx-auto">

        {/* ===== 1. HERO COMPACT — photo en pleine lumière, infos déportées dans une carte ===== */}
        <div className="relative w-full h-[85vw] max-h-[380px] bg-stone-900 overflow-hidden">
          {plant.image_path ? (
            <Image
              src={plant.image_path}
              alt={plant.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-emerald-900/60">
              <Leaf className="w-12 h-12 text-white/50" />
            </div>
          )}

          {/* Boutons haut */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="w-[34px] h-[34px] text-white rounded-full border backdrop-blur-md transition-all active:scale-95"
              style={{ background: 'rgba(0,0,0,0.28)', borderColor: 'rgba(255,255,255,0.22)' }}
            >
              <Link href={backHref}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <PlantMenu plantId={plant.id} imageUrl={plant.image_path} />
          </div>

          {/* Agrandir la photo */}
          {plant.image_path && (
            <div className="absolute bottom-3 right-3 z-10">
              <PlantPhotoLightbox imageUrl={plant.image_path} alt={plant.name} />
            </div>
          )}
        </div>

        {/* Carte identité — chevauche le bas de la photo, toujours lisible quelle que soit la photo */}
        <div className="relative z-10 -mt-6 px-4">
          <div className="bg-white rounded-[1.75rem] shadow-[0_-6px_16px_rgba(0,0,0,0.05)] px-5 pt-4 pb-3.5">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-tight">
              {plant.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs italic text-stone-500">{plant.species}</span>
              {plant.room && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" />
                  {plant.room}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="px-4 pt-3 space-y-3">

          {/* ===== 2. CARTE ARROSAGE ===== */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColorClass}`}>
                <Calendar className={`w-3 h-3 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                <span>{status.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">
                  Tous les {activeFreq} j{plant.watering_frequency_custom && (
                    <span className="ml-1 text-amber-500 font-medium">· Modifié</span>
                  )}
                </span>
                <WateringFrequencyDialog
                  plantId={plant.id}
                  currentFrequency={activeFreq}
                  isCustom={!!plant.watering_frequency_custom}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div className="flex-1">
                <DetailWaterButton plantId={plant.id} history={history} />
              </div>
              <div className="flex-1">
                <SnoozeButton plantId={plant.id} snoozeDays={snoozeDays} />
              </div>
            </div>
            {lastWateredFormatted && (
              <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 mt-3 text-xs text-emerald-800">
                <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                Dernier arrosage :{" "}
                <strong className="capitalize">{lastWateredFormatted}</strong>
              </div>
            )}
            {(plant.watering_freq_spring || plant.watering_freq_summer || plant.watering_freq_autumn || plant.watering_freq_winter) && (
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {[
                  { label: "Printemps", emoji: "🌸", val: plant.watering_freq_spring, active: new Date().getMonth() >= 2 && new Date().getMonth() <= 4 },
                  { label: "Été",       emoji: "☀️", val: plant.watering_freq_summer, active: new Date().getMonth() >= 5 && new Date().getMonth() <= 7 },
                  { label: "Automne",   emoji: "🍂", val: plant.watering_freq_autumn, active: new Date().getMonth() >= 8 && new Date().getMonth() <= 10 },
                  { label: "Hiver",     emoji: "❄️", val: plant.watering_freq_winter, active: new Date().getMonth() >= 11 || new Date().getMonth() <= 1 },
                ].map(({ label, emoji, val, active }) => val ? (
                  <div key={label} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border text-center ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-stone-100'}`}>
                    <span className="text-sm leading-none">{emoji}</span>
                    <span className={`text-[9px] font-bold mt-0.5 ${active ? 'text-emerald-700' : 'text-stone-400'}`}>{val}j</span>
                    <span className={`text-[8px] ${active ? 'text-emerald-500' : 'text-stone-300'}`}>{label}</span>
                  </div>
                ) : null)}
              </div>
            )}
            {/* ── FERTILISATION ── */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-xs text-stone-500">
                  {lastFertilizedFormatted
                    ? `Dernier engrais : ${lastFertilizedFormatted}`
                    : 'Jamais fertilisée'}
                </span>
              </div>
              <FertilizeButton plantId={plant.id} />
            </div>
          </div>

          {/* ===== 3. GUIDE D'ENTRETIEN ===== */}
          <CareGuideAccordion plant={plant} />

          {/* ===== 4. JOURNAL DE CROISSANCE ===== */}
          <GrowthJournal plantId={plant.id} initialPhotos={initialPhotos} />

          {/* ===== 5. DOCTEUR PLANTE ===== */}
          <DoctorPlantBlock plantId={plant.id} plantName={plant.name} initialDiagnoses={initialDiagnoses} />

          {/* ===== 6. EMPLACEMENT ===== */}
          <LocationSection plant={plant} />

          {/* ===== 7. CHIPS RAPIDES ===== */}
          {hasChips && (
            <div className="grid grid-cols-3 gap-2">
              {plant.origin && (
                <div className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col items-center gap-1 shadow-sm">
                  <Globe2 className="w-4 h-4 text-stone-400" />
                  <div className="text-xs font-bold text-stone-800 text-center leading-tight line-clamp-2">{plant.origin}</div>
                  <div className="text-[8px] uppercase tracking-wide text-stone-400 mt-0.5">Origine</div>
                </div>
              )}
              {robustnessChip && (
                <div className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-stone-400" />
                  <div className="text-xs font-bold text-stone-800 text-center leading-tight">{robustnessChip}</div>
                  <div className="text-[8px] uppercase tracking-wide text-stone-400 mt-0.5">Robustesse</div>
                </div>
              )}
              {maxSizeChip && (
                <div className="bg-white rounded-2xl border border-stone-100 p-3 flex flex-col items-center gap-1 shadow-sm">
                  <Ruler className="w-4 h-4 text-stone-400" />
                  <div className="text-xs font-bold text-stone-800 text-center leading-tight">{maxSizeChip}</div>
                  <div className="text-[8px] uppercase tracking-wide text-stone-400 mt-0.5">Taille max.</div>
                </div>
              )}
            </div>
          )}

          {/* ===== 8. LIEN FICHE DÉTAILLÉE ===== */}
          <PlantIdentityTrigger plant={plant} hasQuickInfos={hasQuickInfos} />

        </div>
      </main>

      <BottomNav urgentCount={urgentCount} />
    </div>
  );
}
