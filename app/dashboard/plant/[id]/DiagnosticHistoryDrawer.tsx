"use client";

import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";
import type { PlantDiagnostic } from "@/server/actions";

interface DiagnosticHistoryDrawerProps {
  diagnoses: PlantDiagnostic[];
  onClose: () => void;
  onSelect: (d: PlantDiagnostic) => void;
}

function urgencyBadgeStyles(urgency: string) {
  if (urgency === "Haute")   return "bg-rose-50 text-rose-700 border border-rose-100";
  if (urgency === "Moyenne") return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

export default function DiagnosticHistoryDrawer({
  diagnoses, onClose, onSelect,
}: DiagnosticHistoryDrawerProps) {
  const drawer = (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" />

      <div
        className="relative bg-[#FDFCF8] rounded-t-[2rem] shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-extrabold text-blue-900 text-base">Historique complet</h3>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {diagnoses.length} / 10
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {diagnoses.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className="w-full text-left flex items-start gap-3 p-3 bg-white rounded-2xl border border-stone-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors active:scale-[0.99]"
            >
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 mt-0.5 whitespace-nowrap ${urgencyBadgeStyles(d.urgency)}`}>
                {d.urgency}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-stone-700 leading-snug line-clamp-2">
                  {d.diagnosis}
                </p>
                <p className="text-[9px] text-stone-400 mt-1">
                  {new Date(d.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-stone-300 text-xs shrink-0 mt-0.5">›</span>
            </button>
          ))}
        </div>

        <div className="pb-8 shrink-0" />
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
