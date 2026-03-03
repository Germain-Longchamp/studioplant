import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, AlignLeft, Info, LeafyGreen, ChevronDown, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getWateringStatus } from "@/lib/utils";
import EnvironmentAccordion from "./EnvironmentAccordion";
import BottomNav from "@/components/BottomNav";
import PlantMenu from "./PlantMenu";
import SosFeature from "./SosFeature";
import DetailWaterButton from "./DetailWaterButton";
import SnoozeButton from "./SnoozeButton";
import PlantIdentityModal from "./PlantIdentityModal"; // NOUVEL IMPORT

const getSeasonAdvice = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "au printemps, la terre peut sécher plus vite avec la reprise de la croissance";
  if (month >= 5 && month <= 7) return "en été avec la chaleur, les besoins en eau sont souvent plus importants";
  if (month >= 8 && month <= 10) return "en automne, la baisse des températures réduit progressivement les besoins";
  return "en hiver, les plantes entrent en dormance et nécessitent beaucoup moins d'eau";
};

function FormatCareNotes({ text }: { text: string }) {
  if (!text) return <p className="text-sm text-stone-700">Aucun guide disponible pour le moment.</p>;
  
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3.5">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        
        const isBullet = line.trim().startsWith('-') || line.trim().startsWith('* ');
        let content = line.trim();
        if (isBullet) {
          content = content.replace(/^[-*]\s*/, '');
        }
        
        const parts = content.split(/\*\*(.*?)\*\*/g);
        
        const formattedLine = parts.map((part, j) => {
          if (j % 2 === 1) {
            return <strong key={j} className="text-stone-900 font-bold">{part}</strong>;
          }
          return part.replace(/\*/g, '');
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-2.5 text-sm text-stone-700 leading-relaxed ml-1">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              <span className="flex-1">{formattedLine}</span>
            </div>
          );
        }

        if (content.startsWith('#')) {
          return (
            <h4 key={i} className="text-stone-900 font-bold text-[15px] pt-2">
              {content.replace(/^#+\s*/, '')}
            </h4>
          );
        }

        return (
          <p key={i} className="text-sm text-stone-700 leading-relaxed">
            {formattedLine}
          </p>
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
    status.color === 'red' ? 'text-rose-600' :
    status.color === 'orange' ? 'text-amber-500' :
    'text-emerald-600';

  const seasonAdvice = getSeasonAdvice();

  // On vérifie si la plante a les nouvelles infos pour le passer à la modale
  const hasQuickInfos = !!(plant.origin || plant.robustness || plant.max_size || plant.ideal_substrate || plant.ideal_exposure);

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-32 font-sans text-stone-800 overflow-x-hidden">
      
      <header className="fixed top-0 w-full z-[60] bg-gradient-to-b from-black/50 via-black/10 to-transparent pt-6 pb-4">
        <div className="max-w-md mx-auto px-5 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="text-white bg-stone-900/40 backdrop-blur-md hover:bg-stone-900/60 border border-white/10 shadow-md rounded-full transition-all active:scale-95">
            <Link href="/dashboard/plants">
              <ArrowLeft className="w-6 h-6" />
            </Link>
          </Button>

          <PlantMenu plantId={plant.id} imageUrl={plant.image_path} />
        </div>
      </header>

      <main className="max-w-md mx-auto">
        
        <div className="relative w-full h-[55vh] bg-emerald-900 overflow-hidden">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover" priority sizes="100vw" />
          ) : (
             <div className="flex items-center justify-center h-full opacity-30"><Info className="w-16 h-16 text-white" /></div>
          )}
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#FDFCF8] via-[#FDFCF8]/80 to-transparent" />
        </div>

        <div className="px-5 relative -mt-24 z-20 space-y-4">
          
          <div className="mb-4 drop-shadow-sm">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight leading-none mb-1">
              {plant.name}
            </h1>
            <p className="text-lg text-emerald-700 font-medium italic">
              {plant.species}
            </p>
          </div>

          {/* ===== NOUVEAU BOUTON MODALE ===== */}
          <PlantIdentityModal plant={plant} hasQuickInfos={hasQuickInfos} />

          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden" open>
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-bold text-lg">Arrosage</span>
                  <div className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide mt-0.5 ${badgeColorClass}`}>
                    <Calendar className={`w-3.5 h-3.5 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                    <span className="truncate">{status.text}</span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300 space-y-5">
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <DetailWaterButton plantId={plant.id} history={history} />
                </div>
                <div className="flex-1">
                  <SnoozeButton plantId={plant.id} snoozeDays={snoozeDays} />
                </div>
              </div>

              {plant.last_watered_at && (
                <div className="p-4 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm flex items-center justify-between">
                  <span className="text-stone-500 font-medium text-sm">Dernier arrosage</span>
                  <span className="text-stone-800 font-bold text-sm capitalize">
                    {new Date(plant.last_watered_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
                  </span>
                </div>
              )}

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-3 mt-2">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed">
                  Il est recommandé d'arroser cette plante tous les <strong>{plant.watering_frequency} jours</strong> en moyenne. 
                  Attention, {seasonAdvice}. En cas de doute, touchez la terre : si elle est encore humide, utilisez le bouton "+3 jours".
                </p>
              </div>

            </div>
          </details>

          <EnvironmentAccordion plant={plant} />

          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                  <LeafyGreen className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-bold text-lg">Guide d'entretien</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
              <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm">
                <FormatCareNotes text={plant.care_notes} />
              </div>
            </div>
          </details>

          {plant.description && (
            <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-stone-100 rounded-2xl text-stone-600 shrink-0">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden pr-2">
                    <span className="text-stone-800 font-bold text-lg">Mon carnet</span>
                    <span className="text-stone-500 text-sm truncate font-medium mt-0.5">{plant.description}</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0">
                  <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>
              <div className="px-5 pb-6 pt-1 text-stone-600 animate-in fade-in duration-300">
                <div className="p-5 bg-[#FDFCF8] rounded-2xl border border-stone-200/60 shadow-sm">
                  <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {plant.description}
                  </p>
                </div>
              </div>
            </details>
          )}

          <SosFeature plantId={plant.id} />

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
