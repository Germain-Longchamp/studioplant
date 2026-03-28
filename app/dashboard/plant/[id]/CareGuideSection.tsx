"use client";

import { useState } from "react";
import { LeafyGreen, ChevronDown } from "lucide-react";
import DeferredCareLoading from "./DeferredCareLoading";
import FormatCareNotes from "./FormatCareNotes";

interface Props {
  plantId: string;
  careNotes: string | null;
  idealExposure: string | null;
  idealSubstrate: string | null;
}

function truncate(str: string | null | undefined, n: number) {
  if (!str) return null;
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function getWaterHint(careNotes: string): string {
  const lines = careNotes.split('\n');
  const waterLine = lines.find(l => /arros|eau/i.test(l));
  return truncate(waterLine?.replace(/^[-*•]\s*/, '') || careNotes, 65) ?? "";
}

export default function CareGuideSection({ plantId, careNotes, idealExposure, idealSubstrate }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasCareNotes = !!careNotes;

  return (
    <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[0.6rem] flex items-center justify-center bg-emerald-50 shrink-0">
            <LeafyGreen className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-stone-800">Guide d'entretien</div>
            <div className="text-[10px] text-stone-400">Conseils personnalisés par l'IA</div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform duration-300 shrink-0 ${expanded ? 'rotate-180' : ''}`}
          onClick={() => setExpanded(!expanded)}
        />
      </div>

      <div className="h-px bg-stone-100 mx-4" />

      {/* Aperçu ou loader */}
      {!hasCareNotes ? (
        <div className="px-4 pb-4 pt-2">
          <DeferredCareLoading plantId={plantId} />
        </div>
      ) : (
        <>
          <div className="px-4 pt-3 pb-2 flex flex-col gap-2.5">
            {idealExposure && (
              <div className="flex items-start gap-2 text-xs text-stone-600 leading-snug">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 bg-amber-50 text-amber-700">
                  ☀️ Soleil
                </span>
                <span>{truncate(idealExposure, 65)}</span>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-stone-600 leading-snug">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 bg-blue-50 text-blue-700">
                💧 Eau
              </span>
              <span>{getWaterHint(careNotes)}</span>
            </div>
            {idealSubstrate && (
              <div className="flex items-start gap-2 text-xs text-stone-600 leading-snug">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 bg-purple-50 text-purple-700">
                  🪴 Sol
                </span>
                <span>{truncate(idealSubstrate, 65)}</span>
              </div>
            )}
          </div>

          {/* Toggle guide complet */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="mx-4 mb-3 mt-1 w-[calc(100%-2rem)] text-center text-[10px] text-stone-400 border border-dashed border-stone-200 rounded-xl py-2 cursor-pointer hover:bg-stone-50 transition-colors"
          >
            {expanded ? "Réduire le guide ↑" : "Voir le guide complet →"}
          </button>

          {expanded && (
            <div className="px-4 pb-4 animate-in fade-in duration-300">
              <div className="p-4 bg-[#FAFAFA] rounded-xl border border-stone-100">
                <FormatCareNotes text={careNotes} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
