"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateEquipmentRecommendations } from "@/server/actions";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Layers, Droplet, Wrench, Lightbulb, Sparkles } from "lucide-react";

type RecommendationData = {
  categories: {
    title: string;
    icon: "layers" | "droplet" | "wrench";
    items: { name: string; reason: string }[];
  }[];
  expert_tip: string;
};

export default function EquipmentRecommendations() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<RecommendationData | null>(null);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateEquipmentRecommendations();
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.data) {
        setData(result.data);
        toast.success("Trousse à outils générée avec succès ! 🛠️");
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
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
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
        <div className="space-y-6 relative z-10 animate-in fade-in duration-500 pt-2">
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-amber-900 leading-relaxed">
              {data.expert_tip}
            </p>
          </div>

          <div className="space-y-5">
            {data.categories.map((cat, idx) => (
              <div key={idx}>
                <h3 className="flex items-center gap-2 text-stone-800 font-bold text-sm uppercase tracking-wider mb-3">
                  {getIcon(cat.icon, "w-4 h-4 text-emerald-500")}
                  {cat.title}
                </h3>
                <div className="space-y-2.5">
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-[#FDFCF8] border border-stone-200/60 rounded-xl p-3.5 shadow-sm">
                      <p className="font-bold text-stone-900 text-sm mb-1">{item.name}</p>
                      <p className="text-xs font-medium text-stone-500 leading-relaxed">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isPending}
            variant="outline"
            className="w-full bg-white border border-stone-200 text-stone-600 font-bold rounded-[1.25rem] h-12 hover:bg-stone-50 transition-all active:scale-95"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Mettre à jour la liste
          </Button>
        </div>
      )}
    </div>
  );
}
