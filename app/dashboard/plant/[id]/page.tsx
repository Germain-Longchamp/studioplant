import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplets, AlignLeft, Info, LeafyGreen, ChevronDown, Calendar, MapPin } from "lucide-react";
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

const getSeasonAdvice = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "au printemps, la terre peut sécher plus vite avec la reprise de la croissance";
  if (month >= 5 && month <= 7) return "en été avec la chaleur, les besoins en eau sont souvent plus importants";
  if (month >= 8 && month <= 10) return "en automne, la baisse des températures réduit progressivement les besoins";
  return "en hiver, les plantes entrent en dormance et nécessitent beaucoup moins d'eau";
};

function FormatCareNotes({ text }: { text: string }) {
  if (!text) return <p className="text-sm text-stone-500 italic">Aucun guide disponible pour le moment.</p>;
  
  const lines = text.split('\n');
  
  return (
    <div className="space-y-4">
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
            return <strong key={j} className="text-emerald-900 font-bold">{part}</strong>;
          }
          return part.replace(/\*/g, '');
        });

        if (isBullet) {
          return (
            <div key={i} className="flex gap-3 text-[15px] text-stone-700 leading-relaxed">
              {/* 🟢 CHANGEMENT : On a retiré l'icône Sparkles pour une puce simple et propre */}
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
          <p key={i} className="text-[15px] text-stone-700 leading-relaxed">
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
    status.color === 'red' ? 'text-rose-600 bg-rose-50 border-rose-100' :
    status.color === 'orange' ? 'text-amber-600 bg-amber-50 border-amber-100' :
    'text-emerald-700 bg-emerald-50 border-emerald-100';

  const seasonAdvice = getSeasonAdvice();
  const hasQuickInfos = !!(plant.origin || plant.robustness || plant.max_size || plant.ideal_substrate || plant.ideal_exposure);

  return (
    <div className="min-h-screen bg-[#F4F7F4] pb-32 font-sans text-stone-800 overflow-x-hidden selection:bg-emerald-200">
      
      <header className="fixed top-0 w-full z-[60] bg-gradient-to-b from-black/60 via-black/20 to-transparent pt-6 pb-6">
        <div className="max-w-md mx-auto px-5 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="text-white bg-black/20 backdrop-blur-md hover:bg-black/40 border border-white/20 shadow-lg rounded-full transition-all active:scale-95">
            <Link href="/dashboard/plants">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>

          <PlantMenu plantId={plant.id} imageUrl={plant.image_path} />
        </div>
      </header>

      <main className="max-w-md mx-auto">
        
        <div className="relative w-full h-[50vh] bg-stone-900 overflow-hidden">
          {plant.image_path ? (
            <Image src={plant.image_path} alt={plant.name} fill className="object-cover opacity-95" priority sizes="100vw" />
          ) : (
             <div className="flex items-center justify-center h-full bg-emerald-900/50"><Info className="w-12 h-12 text-white/50" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F4F7F4] via-transparent to-transparent opacity-90" />
        </div>

        <div className="relative -mt-28 z-20 px-4 space-y-5">
          
          <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-stone-200/50 border border-white flex flex-col gap-4">
            <div>
              <h1 className="text-4xl font-black text-stone-900 tracking-tight leading-none mb-2 drop-shadow-sm">
                {plant.name}
              </h1>
              
              {/* 🟢 CHANGEMENT : Intégration de l'espèce et de la pièce (room) sur la même ligne ou en colonne selon la place */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-lg text-emerald-600 font-semibold tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {plant.species}
                </p>
                {plant.room && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100/60 text-stone-600 text-sm font-medium border border-stone-200/50">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {plant.room}
                  </span>
                )}
              </div>
            </div>
            
            <div className="pt-2 border-t border-stone-200/50">
              <PlantIdentityModal plant={plant} hasQuickInfos={hasQuickInfos} />
            </div>
          </div>

          {/* ===== 1. ARROSAGE ===== */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-stone-100 overflow-hidden transition-all hover:border-emerald-100/60">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl text-blue-600 shrink-0 shadow-sm">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left overflow-hidden pr-2">
                  <span className="text-stone-800 font-extrabold text-lg">Arrosage</span>
                  <div className={`mt-1 flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${badgeColorClass}`}>
                    <Calendar className={`w-3 h-3 shrink-0 ${status.urgent ? 'animate-pulse' : ''}`} />
                    <span className="truncate">{status.text}</span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0 border border-stone-100">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            
            <div className="px-5 pb-6 pt-2 animate-in fade-in duration-300 space-y-4">
              
              <div className="flex gap-3">
                <div className="flex-1 shadow-sm rounded-2xl">
                  <DetailWaterButton plantId={plant.id} history={history} />
                </div>
                <div className="flex-1 shadow-sm rounded-2xl">
                  <SnoozeButton plantId={plant.id} snoozeDays={snoozeDays} />
                </div>
              </div>

              {plant.last_watered_at && (
                <div className="px-4 py-3.5 bg-stone-50 rounded-2xl border border-stone-100/80 flex items-center justify-between mt-2">
                  <span className="text-stone-500 font-medium text-sm">Dernier arrosage</span>
                  <span className="text-stone-900 font-bold text-sm capitalize bg-white px-3 py-1 rounded-lg shadow-sm border border-stone-100">
                    {new Date(plant.last_watered_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
                  </span>
                </div>
              )}

              <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 rounded-2xl border border-emerald-100 flex items-start gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200/20 rounded-bl-full -z-10 blur-xl"></div>
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-stone-700 leading-relaxed">
                  Arrosage conseillé tous les <strong>{plant.watering_frequency} jours</strong>. 
                  Attention, {seasonAdvice}. En cas de doute, touchez la terre avant d'arroser.
                </p>
              </div>

            </div>
          </details>

          {/* ===== 2. GUIDE D'ENTRETIEN ===== */}
          <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-stone-100 overflow-hidden transition-all hover:border-emerald-100/60">
            <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0 shadow-sm">
                  <LeafyGreen className="w-5 h-5" />
                </div>
                <span className="text-stone-800 font-extrabold text-lg">Guide d'entretien</span>
              </div>
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0 border border-stone-100">
                <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
              </div>
            </summary>
            <div className="px-5 pb-6 pt-1 animate-in fade-in duration-300">
              {!plant.care_notes ? (
                <DeferredCareLoading plantId={plant.id} />
              ) : (
                <div className="p-5 bg-[#FAFAFA] rounded-2xl border border-stone-100 shadow-inner">
                  <FormatCareNotes text={plant.care_notes} />
                </div>
              )}
            </div>
          </details>

          {/* ===== 3. EMPLACEMENT ACTUEL ===== */}
          <div className="[&>details]:shadow-lg [&>details]:shadow-stone-200/30 [&>details]:border-stone-100 hover:[&>details]:border-emerald-100/60 transition-all">
             <EnvironmentAccordion plant={plant} />
          </div>

          {/* ===== 4. MON CARNET ===== */}
          {plant.description && (
            <details className="group [&_summary::-webkit-details-marker]:hidden bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-stone-100 overflow-hidden transition-all hover:border-emerald-100/60">
              <summary className="flex cursor-pointer items-center justify-between p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="p-3 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-2xl text-stone-600 shrink-0 shadow-sm">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden pr-2">
                    <span className="text-stone-800 font-extrabold text-lg">Mon carnet</span>
                    <span className="text-stone-400 text-sm truncate font-medium mt-0.5">{plant.description}</span>
                  </div>
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 group-hover:bg-white transition-colors shrink-0 border border-stone-100">
                  <ChevronDown className="h-5 w-5 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                </div>
              </summary>
              <div className="px-5 pb-6 pt-1 animate-in fade-in duration-300">
                <div className="p-5 bg-yellow-50/30 rounded-2xl border border-yellow-100/50 shadow-inner relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400/50 rounded-l-2xl"></div>
                  <p className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap pl-2">
                    {plant.description}
                  </p>
                </div>
              </div>
            </details>
          )}

          <div className="pt-2">
            <SosFeature plantId={plant.id} />
          </div>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
