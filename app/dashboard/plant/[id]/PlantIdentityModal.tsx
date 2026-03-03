"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Globe2, ShieldCheck, Ruler, Layers, Sun, X, Info } from "lucide-react";

export default function PlantIdentityModal({ plant, hasQuickInfos }: { plant: any, hasQuickInfos: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 sm:p-5 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div className="bg-[#FDFCF8] w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* HEADER DE LA MODALE */}
        <div className="p-6 relative border-b border-stone-100 shrink-0 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 text-lg">Fiche détaillée</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full shrink-0 transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENU DE LA MODALE */}
        <div className="p-6 overflow-y-auto">
          {hasQuickInfos ? (
            <div className="space-y-3">
              
              {/* ROBUSTESSE : Mise en avant comme élément principal */}
              {plant.robustness && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                  <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-emerald-600 mb-1">Robustesse globale</h4>
                    <p className="text-sm font-semibold text-emerald-950 leading-snug">{plant.robustness}</p>
                  </div>
                </div>
              )}

              {/* LIGNE 2 COLONNES : Infos courtes */}
              <div className="grid grid-cols-2 gap-3">
                {plant.origin && (
                  <div className="bg-white border border-stone-100 shadow-sm rounded-2xl p-4 flex flex-col gap-2.5">
                    <Globe2 className="w-5 h-5 text-stone-400" />
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-0.5">Origine</h4>
                      <p className="text-sm font-bold text-stone-800 leading-tight">{plant.origin}</p>
                    </div>
                  </div>
                )}
                {plant.max_size && (
                  <div className="bg-white border border-stone-100 shadow-sm rounded-2xl p-4 flex flex-col gap-2.5">
                    <Ruler className="w-5 h-5 text-stone-400" />
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-0.5">Taille Max.</h4>
                      <p className="text-sm font-bold text-stone-800 leading-tight">{plant.max_size}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* EXPOSITION : Pleine largeur pour le confort de lecture */}
              {plant.ideal_exposure && (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-amber-100/50 p-2.5 rounded-xl text-amber-600 shrink-0">
                     <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-amber-700/70 mb-0.5">Exposition idéale</h4>
                    <p className="text-sm font-semibold text-amber-950 leading-snug">{plant.ideal_exposure}</p>
                  </div>
                </div>
              )}

              {/* SUBSTRAT : Pleine largeur */}
              {plant.ideal_substrate && (
                <div className="bg-stone-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="bg-stone-200/50 p-2.5 rounded-xl text-stone-500 shrink-0">
                     <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase font-bold tracking-wider text-stone-500 mb-0.5">Substrat recommandé</h4>
                    <p className="text-sm font-semibold text-stone-800 leading-snug">{plant.ideal_substrate}</p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-amber-800/80 leading-relaxed">
                Votre fiche d'identité est incomplète. Cliquez sur les 3 points en haut à droite puis sur <strong>"Rafraîchir les conseils"</strong> pour que l'IA génère les infos !
              </p>
            </div>
          )}

          <Button onClick={() => setIsOpen(false)} className="w-full mt-6 h-12 rounded-[1.25rem] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold active:scale-95 transition-all shadow-none">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        className="w-full bg-white/60 backdrop-blur-md border border-stone-200/50 text-stone-700 hover:bg-white rounded-2xl h-12 font-bold shadow-sm mb-6 transition-all active:scale-95 flex items-center justify-between px-5"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>Voir la fiche détaillée</span>
        </div>
        <div className="text-[10px] uppercase tracking-wide font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
          Infos
        </div>
      </Button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
