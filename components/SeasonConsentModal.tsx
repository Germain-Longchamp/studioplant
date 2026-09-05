"use client";

import { useEffect, useState } from "react";
import { X, Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  applySeasonConsent,
  declineSeasonConsent,
  type SeasonConsentStatus,
} from "@/server/actions";

// Fermer sans choisir = report (comme le soft-ask des rappels d'US-001) : on ne
// réécrit rien, la proposition pourra réapparaître à la session suivante. Un
// "refus" (bouton "Conserver mes cadences actuelles") est en revanche durable —
// géré côté serveur via declineSeasonConsent(), pas ici.
const SNOOZE_KEY_PREFIX = "season_consent_snoozed_";

const SEASON_TITLE_FR: Record<string, string> = {
  spring: "C'est le printemps",
  summer: "C'est l'été",
  autumn: "C'est l'automne",
  winter: "C'est l'hiver",
};

const SEASON_DE_FR: Record<string, string> = {
  spring: "de printemps",
  summer: "d'été",
  autumn: "d'automne",
  winter: "d'hiver",
};

export default function SeasonConsentModal({ status }: { status: SeasonConsentStatus }) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"idle" | "applying" | "declining">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SNOOZE_KEY_PREFIX + status.season)) return;
    setVisible(true);
  }, [status.season]);

  function reportAndClose() {
    try {
      sessionStorage.setItem(SNOOZE_KEY_PREFIX + status.season, "1");
    } catch {
      /* sessionStorage indisponible : tant pis, la modale se ferme quand même */
    }
    setVisible(false);
  }

  async function handleApply() {
    setPhase("applying");
    const res = await applySeasonConsent();
    if (res?.error) {
      toast.error(res.error);
      setPhase("idle");
      return;
    }
    toast.success(`🌿 Cadences ${SEASON_DE_FR[status.season]} appliquées.`);
    setVisible(false);
  }

  async function handleDecline() {
    setPhase("declining");
    const res = await declineSeasonConsent();
    if (res?.error) {
      toast.error(res.error);
      setPhase("idle");
      return;
    }
    setVisible(false);
  }

  if (!visible) return null;

  // Risque énoncé selon le sens du changement : une cadence NOUVELLE plus longue
  // (avgAfter > avgBefore) signifie qu'on arrose moins souvent à partir de
  // maintenant — la conserver ancienne (plus courte) expose au pourrissement par
  // excès d'arrosage. À l'inverse, une nouvelle cadence plus courte expose au
  // dessèchement si on s'en tient à l'ancienne (plus longue).
  const risk =
    status.avgAfter > status.avgBefore
      ? "au pourrissement des racines par excès d'arrosage"
      : "au dessèchement par manque d'eau";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={reportAndClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#FDFCF8] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-900 bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/30 rounded-full blur-3xl" />
          <button
            onClick={reportAndClose}
            aria-label="Plus tard"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex flex-col items-center pt-2">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center border border-white/20 shadow-xl mb-4">
              <Leaf className="w-8 h-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
              {SEASON_TITLE_FR[status.season]}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm font-medium text-stone-600 leading-relaxed text-center">
            <strong className="text-stone-800">
              {status.concernedCount} plante{status.concernedCount > 1 ? "s" : ""}
            </strong>{" "}
            {status.concernedCount > 1 ? "passeraient" : "passerait"} d&apos;une cadence
            moyenne de <strong>{status.avgBefore} j</strong> à{" "}
            <strong>{status.avgAfter} j</strong>. Conserver l&apos;ancienne cadence
            expose {risk}.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleApply}
              disabled={phase !== "idle"}
              className="w-full h-14 rounded-2xl text-lg font-bold bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              {phase === "applying" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Adopter les cadences ${SEASON_DE_FR[status.season]}`
              )}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={phase !== "idle"}
              variant="outline"
              className="w-full h-12 rounded-[1.25rem] border-stone-200 text-stone-600 font-bold shadow-none"
            >
              {phase === "declining" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Conserver mes cadences actuelles"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
