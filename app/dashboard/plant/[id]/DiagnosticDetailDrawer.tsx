"use client";

import { useTransition } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDiagnosis } from "@/server/actions";
import type { PlantDiagnostic } from "@/server/actions";

interface DiagnosticDetailDrawerProps {
  diagnostic: PlantDiagnostic;
  plantId: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function urgencyBadgeStyles(urgency: string) {
  if (urgency === "Haute")   return "bg-rose-50 text-rose-700 border border-rose-100";
  if (urgency === "Moyenne") return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-emerald-50 text-emerald-700 border border-emerald-100";
}

function urgencyBannerColor(urgency: string) {
  if (urgency?.toLowerCase() === "haute")   return "bg-rose-500";
  if (urgency?.toLowerCase() === "moyenne") return "bg-orange-500";
  return "bg-emerald-500";
}

function parseActionLines(action: string): string[] {
  return action
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.startsWith("-"))
    .map(l => l.replace(/^-\s*/, ""));
}

export default function DiagnosticDetailDrawer({
  diagnostic, plantId, onClose, onDeleted,
}: DiagnosticDetailDrawerProps) {
  const [isPending, startTransition] = useTransition();

  const formattedDate = new Date(diagnostic.created_at).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const actionLines = parseActionLines(diagnostic.action);

  const handleDelete = () => {
    toast("Supprimer ce diagnostic ?", {
      action: {
        label: "Supprimer",
        onClick: () => {
          startTransition(async () => {
            const result = await deleteDiagnosis(diagnostic.id, plantId);
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success("Diagnostic supprimé.");
              onDeleted(diagnostic.id);
              onClose();
            }
          });
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const drawer = (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" />

      <div
        className="relative bg-[#FDFCF8] rounded-t-[2rem] shadow-2xl max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Bandeau urgence */}
        <div className={`${urgencyBannerColor(diagnostic.urgency)} px-5 py-2.5 flex items-center justify-between shrink-0`}>
          <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Urgence {diagnostic.urgency}
          </span>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">

          {/* Date + badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${urgencyBadgeStyles(diagnostic.urgency)}`}>
              {diagnostic.urgency}
            </span>
            <p className="text-xs text-stone-400 font-medium capitalize">{formattedDate}</p>
          </div>

          {/* Diagnostic */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
              Ce qu'il se passe
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed font-medium">
              {diagnostic.diagnosis}
            </p>
          </div>

          {/* Plan d'action */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
            </h4>
            {actionLines.length > 0 ? (
              <ul className="space-y-2">
                {actionLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700 leading-snug">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {diagnostic.action}
              </p>
            )}
          </div>
        </div>

        {/* Bouton suppression — discret, en bas */}
        <div className="px-5 pb-8 pt-3 border-t border-stone-100 shrink-0">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-stone-400 hover:text-rose-500 hover:bg-rose-50 border border-stone-150 transition-colors disabled:opacity-50"
          >
            {isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            Supprimer ce diagnostic
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
