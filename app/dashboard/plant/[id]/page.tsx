import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, LeafyGreen, ChevronDown, Calendar, Globe2, ShieldCheck, Ruler, Leaf } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWateringStatus } from "@/lib/utils";
import EnvironmentAccordion from "./EnvironmentAccordion";
import BottomNav from "@/components/BottomNav";
import PlantMenu from "./PlantMenu";
import SosFeature from "./SosFeature";
import DetailWaterButton from "./DetailWaterButton";
import SnoozeButton from "./SnoozeButton";
import PlantIdentityModal from "./PlantIdentityModal";
import DeferredCareLoading from "./DeferredCareLoading";
import PlantHealthHistory from "./PlantHealthHistory";

function FormatCareNotes({ text }: { text: string }) {
  if (!text) return <p className="text-sm text-stone-500 italic">Aucun guide disponible pour le moment.</p>;

  const lines = text.split('\n');

  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return null;

        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('* ');
        let content = line.trim();
        if (isBullet) content = content.replace(/^[-*]\s*/, '');

        const parts = content.split(/\*\*(.*?)\*\*/g);
        const formattedLine = parts.map((part, j) => {
          if (j % 2 === 1) return <strong key={j} className="text-emerald-900 font-bold">{part}</strong>;
          return part.replace(/\*/g, '');
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-3 text-[15px] text-stone-700 leading-relaxed">
              <span className="text-emerald-500 font-black mt-0.5">•</span>
              <span className="flex-1">{formattedLine}</span>
            </div>
          );
        }

        if (content.startsWith('#')) {
          return (
            <h4 key={i} className="text-stone-900 font-extrabold text-base pt-3 pb-1 border-b border-stone-100">
              {content.replace(/^#+\s*/, '')}
            </h4>
          );
        }

        return (
          <p key={i} className="text-[15px] text-stone-700 leading-relaxed">{formattedLine}</p>
        );
      })}
    </div>
  );
}

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);

  const badgeColorClass =
    status.color === 'red' ? 'text-rose-600 bg-rose-50 border-rose-100' :
    status.color === 'orange' ? 'text-amber-600 bg-amber-50 border-amber-100' :
    'text-emerald-700 bg-emerald-50 border-emerald-100';

  const hasQuickInfos = !!(plant.origin || plant.robustness || plant.max_size || plant.ideal_substrate || plant.ideal_exposure);
  const hasChips = !!(plant.origin || plant.robustness || plant.max_size);

  const lastWateredFormatted = plant.last_watered_at
    ? new Date(plant.last_watered_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')
    : null;

  const carePreview = [plant.ideal_exposure, plant.ideal_substrate].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-[#F4F7F4] pb-32 font-sans text-stone-800 overflow-x-hidden selection:bg-emerald-200">
      <main className="max-w-md mx-auto">

        {/* ===== HERO COMPACT ===== */}
        <div className="relative w-full h-[42vw] max-h-[220px] bg-stone-900 overflow-hidden">
          {plant.image_path ? (
            <Image
              src={plant.image_path}
              alt={plant.name}
              fill
              className="object-cover opacity-90"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-emerald-900/60">
              <Leaf className="w-12 h-12 text-white/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Bouton retour + menu */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-white rounded-full border transition-all active:scale-95 backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.28)', borderColor: 'rgba(255,255,255,0.22)' }}
            >
              <Link href="/dashboard/plants">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <PlantMenu plantId={plant.id} imageUrl={plant.image_path} />
          </div>

          {/* Nom + espèce + room */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <h1 className="text-2xl font-black text-white leading-tight drop-shadow">{plant.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="text-white/70 text-xs italic">{plant.species}</span>
              {plant.room && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium backdrop-blur-sm">
                  📍 {plant.room}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="px-4 pt-4 space-y-3">

          {/* Fiche identité */}
          <div className="-mb-6">
            <PlantIdentityModal plant={plant} hasQuickInfos={hasQuickInfos} />
          </div>

          {/* ===== CARTE ARROSAGE ===== */}
          <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColorClass}`}>
                <Calendar className={`w-3 h-3 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                <span>{status.text}</span>
              </div>
              <span className="text-xs text-stone-400">Tous les {plant.watering_frequency} jours</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><DetailWaterButton plantId={plant.id} history={history} /></div>
              <div className="flex-1"><SnoozeButton plantId={plant.id} snoozeDays={snoozeDays} /></div>
            </div>
            {lastWateredFormatted && (
              <div className="flex items-center gap-1.5 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-800">
                <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                Dernier arrosage :{" "}
                <strong className="ml-1 capitalize">{lastWateredFormatted}</strong>
              </div>
            )}
          </div>

          {/* ===== CHIPS RAPIDES ===== */}
          {hasChips && (
            <div className="grid grid-cols-3 gap-2">
              {plant.origin && (
                <div className="bg-white rounded-[1rem] border border-stone-100 p-3 text-center shadow-sm">
                  <Globe2 className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-stone-800 leading-tight">{plant.origin}</div>
                  <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-1">Origine</div>
                </div>
              )}
              {plant.robustness && (
                <div className="bg-white rounded-[1rem] border border-stone-100 p-3 text-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-stone-800 leading-tight">{plant.robustness}</div>
                  <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-1">Robustesse</div>
                </div>
              )}
              {plant.max_size && (
                <div className="bg-white rounded-[1rem] border border-stone-100 p-3 text-center shadow-sm">
                  <Ruler className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-stone-800 leading-tight">{plant.max_size}</div>
                  <div className="text-[9px] uppercase tracking-wide text-stone-400 mt-1">Taille max.</div>
                </div>
              )}
            </div>
          )}

          {/* ===== GUIDE D'ENTRETIEN ===== */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[1.5rem] border border-stone-100 shadow-sm overflow-hidden">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between p-4 hover:bg-stone-50/50 active:bg-stone-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[0.6rem] flex items-center justify-center bg-emerald-50 shrink-0">
                    <LeafyGreen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-stone-800">Guide d'entretien</div>
                    <div className="text-[10px] text-stone-400">Conseils personnalisés par l'IA</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-stone-400 transition-transform duration-300 group-open:-rotate-180 shrink-0" />
              </div>
              <div className="h-px bg-stone-100 mx-4" />
              <div className="px-4 pt-2 pb-3 text-xs text-stone-500 truncate">
                {carePreview || (plant.care_notes ? "Guide disponible ↓" : "Génération en cours...")}
              </div>
            </summary>
            <div className="px-4 pb-4 animate-in fade-in duration-300">
              {!plant.care_notes ? (
                <DeferredCareLoading plantId={plant.id} />
              ) : (
                <div className="p-4 bg-[#FAFAFA] rounded-xl border border-stone-100">
                  <FormatCareNotes text={plant.care_notes} />
                </div>
              )}
            </div>
          </details>

          {/* ===== EMPLACEMENT ===== */}
          <EnvironmentAccordion plant={plant} />

          {/* ===== HISTORIQUE SANTÉ ===== */}
          <PlantHealthHistory plantId={plant.id} />

          {/* ===== SOS DOCTEUR PLANTE ===== */}
          <SosFeature plantId={plant.id} plantName={plant.name} />

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
