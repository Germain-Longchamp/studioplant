"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Stethoscope, Loader2, X, AlertTriangle, CheckCircle, Copy, BookOpen,
  ChevronLeft, ChevronRight, Leaf, Sprout, PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { diagnosePlant, appendDiagnosisToNotes } from "@/server/actions";

export interface JunglePlant {
  id: string;
  name: string;
  species?: string | null;
  image_path?: string | null;
  room?: string | null;
}

interface SelectedPlant {
  id: string;
  name: string;
  species?: string | null;
}

interface DiagnosisResult {
  name?: string;
  diagnosis: string;
  urgency: string;
  action: string;
}

const SOIL_OPTIONS = ["Sec", "Normal", "Détrempé"];
const EVENT_OPTIONS = ["Rempotage récent", "Nouvel emplacement", "Animal ou enfant", "Courant d'air / froid"];

function urgencyBanner(urgency: string) {
  switch (urgency?.toLowerCase()) {
    case "haute":   return "bg-rose-500";
    case "moyenne": return "bg-orange-500";
    case "faible":  return "bg-emerald-500";
    default:        return "bg-stone-400";
  }
}

export default function DoctorPlantFlow({
  file,
  previewUrl,
  preselectedPlant = null,
  userPlants = [],
  onClose,
  onDiagnosed,
}: {
  file: File;
  previewUrl: string;
  preselectedPlant?: SelectedPlant | null;
  userPlants?: JunglePlant[];
  onClose: () => void;
  onDiagnosed?: (data: DiagnosisResult, plantId: string | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();

  const canSelect = !preselectedPlant && userPlants.length > 0;
  const [step, setStep] = useState<"select" | "questions" | "result">(canSelect ? "select" : "questions");

  const [selectedPlant, setSelectedPlant] = useState<SelectedPlant | null>(preselectedPlant);
  const [soilState, setSoilState] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [showOtherDetails, setShowOtherDetails] = useState(false);
  const [otherDetails, setOtherDetails] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [savedToNotes, setSavedToNotes] = useState(false);

  const toggleEvent = (label: string) => {
    setEvents((prev) => (prev.includes(label) ? prev.filter((e) => e !== label) : [...prev, label]));
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("image", file);
    if (selectedPlant) formData.append("plantId", selectedPlant.id);
    if (soilState) formData.append("soilState", soilState);
    formData.append("events", JSON.stringify(events));
    if (otherDetails.trim()) formData.append("otherDetails", otherDetails.trim());

    startTransition(async () => {
      const res = await diagnosePlant(formData);
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.data) {
        setResult(res.data);
        setStep("result");
        onDiagnosed?.(res.data, selectedPlant?.id ?? null);
      }
    });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `Diagnostic : ${result.diagnosis}\nUrgence : ${result.urgency}\nPlan d'action :\n${result.action}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Ordonnance copiée !"));
  };

  const handleSaveToNotes = () => {
    if (!result || !selectedPlant) return;
    startSavingTransition(async () => {
      const noteContent = `Diagnostic : ${result.diagnosis}\nUrgence : ${result.urgency}\nPlan d'action :\n${result.action}`;
      const res = await appendDiagnosisToNotes(selectedPlant.id, noteContent);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Sauvegardé dans les notes d'entretien !");
        setSavedToNotes(true);
      }
    });
  };

  const isUnknown = !result?.name || result.name === "Plante inconnue";

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200"
      onClick={step === "result" ? undefined : onClose}
    >
      <div
        className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── ÉTAPE : SÉLECTION DE LA PLANTE ── */}
        {step === "select" && (
          <>
            <div className="bg-blue-900 bg-gradient-to-b from-blue-800 to-blue-950 p-6 relative shrink-0">
              <Button
                variant="ghost" size="icon" onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner shrink-0 bg-blue-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Plante à diagnostiquer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg tracking-tight leading-tight">Docteur Plante</h3>
                  <p className="text-blue-300 text-sm font-medium mt-0.5">Est-ce une plante de ta Jungle ?</p>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-2">
                {userPlants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPlant({ id: p.id, name: p.name, species: p.species }); setStep("questions"); }}
                    className="w-full text-left flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-stone-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors active:scale-[0.99] shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-50 shrink-0 relative">
                      {p.image_path ? (
                        <Image src={p.image_path} alt={p.name} fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-emerald-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{p.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{p.species || p.room || ""}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-stone-100 shrink-0">
              <button
                onClick={() => { setSelectedPlant(null); setStep("questions"); }}
                className="w-full h-11 rounded-2xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-colors active:scale-[0.98]"
              >
                Ce n'est pas une plante de ma Jungle
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE : QUESTIONS RAPIDES ── */}
        {step === "questions" && (
          <>
            <div className="bg-blue-900 bg-gradient-to-b from-blue-800 to-blue-950 p-6 relative shrink-0">
              {canSelect && (
                <Button
                  variant="ghost" size="icon" onClick={() => setStep("select")}
                  className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full h-7 w-7"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost" size="icon" onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner shrink-0 bg-blue-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Plante à diagnostiquer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg tracking-tight leading-tight">
                    {selectedPlant ? selectedPlant.name : "Consultation rapide"}
                  </h3>
                  <p className="text-blue-300 text-sm font-medium mt-0.5">Quelques détails avant l'analyse</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">État du terreau</h4>
                <div className="flex gap-2">
                  {SOIL_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSoilState((prev) => (prev === opt ? "" : opt))}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition-colors ${
                        soilState === opt
                          ? "bg-blue-600 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">Un évènement récent ?</h4>
                <div className="flex flex-wrap gap-2">
                  {EVENT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => toggleEvent(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        events.includes(opt)
                          ? "bg-blue-600 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {showOtherDetails ? (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">Autre détail</h4>
                  <textarea
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    placeholder="Ex : les feuilles collent, il y a des taches blanches…"
                    rows={2}
                    className="w-full rounded-xl border border-stone-200 p-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowOtherDetails(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  + Ajouter un détail
                </button>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full h-12 rounded-[1.25rem] bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all gap-2"
              >
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours…</> : "Lancer le diagnostic"}
              </Button>
            </div>
          </>
        )}

        {/* ── ÉTAPE : RÉSULTAT ── */}
        {step === "result" && result && (
          <>
            <div className={`${urgencyBanner(result.urgency)} px-5 py-2.5 flex items-center justify-between shrink-0 rounded-t-[2rem]`}>
              <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgence {result.urgency}
              </span>
              <Button
                variant="ghost" size="icon" onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-blue-900 bg-gradient-to-b from-blue-800 to-blue-950 p-6 relative shrink-0">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-inner shrink-0 bg-blue-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Patient" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-xl tracking-tight leading-tight pr-2">
                    {selectedPlant ? selectedPlant.name : result.name || "Plante inconnue"}
                  </h3>
                  <p className="text-blue-300 text-sm font-medium mt-0.5">Diagnostic terminé</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">Ce qu'il se passe</h4>
                <p className="text-sm text-stone-700 leading-relaxed font-medium">{result.diagnosis}</p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Plan d'action
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{result.action}</p>
              </div>

              <div className="flex gap-2.5">
                <Button onClick={handleCopy} variant="outline" className="flex-1 h-11 rounded-2xl text-sm font-semibold border-stone-200 gap-2">
                  <Copy className="w-4 h-4" /> Copier
                </Button>
                {selectedPlant && (
                  <Button
                    onClick={handleSaveToNotes}
                    disabled={isSaving || savedToNotes}
                    variant="outline"
                    className="flex-1 h-11 rounded-2xl text-sm font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                    {savedToNotes ? "Sauvegardé" : "Dans les notes"}
                  </Button>
                )}
              </div>

              {!selectedPlant && !isUnknown && (
                <Button
                  onClick={() => { onClose(); router.push("/dashboard/add"); }}
                  className="w-full h-12 rounded-[1.25rem] bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-all gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Ajouter à ma collection →
                </Button>
              )}

              <Button
                onClick={onClose}
                className="w-full h-12 shrink-0 rounded-[1.25rem] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold active:scale-95 transition-all shadow-none"
              >
                Fermer l'ordonnance
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
