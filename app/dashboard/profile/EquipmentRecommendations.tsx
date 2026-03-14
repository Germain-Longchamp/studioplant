"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateEquipmentRecommendations } from "@/server/actions";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Layers, Droplet, Wrench, Lightbulb, Sparkles, ChevronDown } from "lucide-react";

type RecommendationData = {
  categories: {
    title: string;
    icon: "layers" | "droplet" | "wrench";
    items: { name: string; reason: string }[];
  }[];
  expert_tip: string;
};

export default function EquipmentRecommendations({ initialData }: { initialData: RecommendationData | null }) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<RecommendationData | null>(initialData);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateEquipmentRecommendations();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.data) {
        setData(result.data);
        toast.success("Trousse à outils générée et sauvegardée ! 🛠️");
      }
    });
  };

  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "layers": return <Layers className={className} />;
      case "droplet": return <Droplet className={className} />;
      case "wrench": return <Wrench className={className} />;
      default: return <ShoppingBag className={className} />;
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-stone-200/40 border border-stone-100/60 overflow-hidden relative group mt-6">
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">Ma Trousse Idéale</h2>
          <p className="text-sm text-stone-500 font-medium leading-snug">Produits déduits de votre jungle</p>
        </div>
      </div>

      {!data ? (
        <div className="relative z-10">
          <p className="text-sm text-stone-600 mb-5 leading-relaxed">
            L'IA peut analyser vos plantes actuelles et votre environnement pour vous créer une liste de courses sur-mesure (substrats, engrais, outils spécifiques).
          </p>
          <Button 
            onClick={handleGenerate} 
            disabled={isPending}
            className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-[1.25rem] h-12 transition-all active:scale-95 shadow-sm"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-amber-600" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2 text-amber-600" />
            )}
            {isPending ? "Analyse de votre jungle..." : "Générer mes recommandations"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6 relative z-10 pt-1">
          
          {/* NOUVEAU DESIGN : LE CONSEIL DE L'EXPERT */}
          <div className="relative p-5 bg-gradient-to-br from-amber-50/80 to-[#FDFCF8] rounded-2xl border border-amber-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-600">
               <Lightbulb className="w-4 h-4 fill-amber-100" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Le conseil du pro</span>
            </div>
            <p className="text-sm font-semibold text-amber-950/80 leading-relaxed italic">
              "{data.expert_tip}"
            </p>
          </div>

          {/* ACCORDÉONS POUR LES CATÉGORIES */}
          <div className="space-y-3">
            {data.categories.map((cat, idx) => (
              <details 
                key={idx} 
                className="group [&_summary::-webkit-details-marker]:hidden bg-[#FDFCF8] rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm transition-all"
                // On ouvre le premier accordéon par défaut pour montrer à quoi ça ressemble
                open={idx === 0} 
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-stone-50/50 active:bg-stone-100 select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                      {getIcon(cat.icon, "w-4 h-4")}
                    </div>
                    <span className="text-stone-800 font-bold text-sm tracking-wide">{cat.title}</span>
                  </div>
                  <div className="w-7 h-7 flex items-center justify-center rounded-full bg-white group-hover:bg-stone-100 transition-colors shrink-0 shadow-sm border border-stone-100">
                    <ChevronDown className="h-4 w-4 text-stone-400 transition-transform duration-300 group-open:-rotate-180" />
                  </div>
                </summary>
                
                <div className="px-4 pb-4 pt-1 animate-in fade-in duration-300">
                  <div className="space-y-2.5">
                    {cat.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="bg-white border border-stone-100 rounded-xl p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <p className="font-bold text-stone-900 text-[13px] mb-1 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                           {item.name}
                        </p>
                        <p className="text-xs font-medium text-stone-500 leading-relaxed pl-3.5 border-l-2 border-stone-100 ml-0.5 mt-1">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isPending}
            variant="outline"
            className="w-full bg-white border border-stone-200 text-stone-600 font-bold rounded-[1.25rem] h-12 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isPending ? "Analyse en cours..." : "Mettre à jour la liste"}
          </Button>
        </div>
      )}
    </div>
  );
}