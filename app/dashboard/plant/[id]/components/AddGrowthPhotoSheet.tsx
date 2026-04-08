"use client";

import { useState, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Camera, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addGrowthPhoto } from "@/server/actions";

interface AddGrowthPhotoSheetProps {
  open: boolean;
  plantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddGrowthPhotoSheet({
  open,
  plantId,
  onClose,
  onSuccess,
}: AddGrowthPhotoSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [takenAt, setTakenAt] = useState(todayISO());
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setNote("");
    setTakenAt(todayISO());
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("note", note.trim());
    formData.append("taken_at", takenAt);

    startTransition(async () => {
      const result = await addGrowthPhoto(plantId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo ajoutée !");
        onSuccess();
        handleClose();
      }
    });
  };

  if (!open) return null;

  const sheet = (
    <div
      className="fixed inset-0 z-[150] flex flex-col justify-end"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" />

      <div
        className="relative bg-[#FDFCF8] rounded-t-[2rem] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0">
          <h3 className="font-extrabold text-stone-800">
            {step === 1 ? "Choisir une photo" : "Détails"}
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">

          {/* ÉTAPE 1 — Sélection photo */}
          {step === 1 && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-stone-100">
                  <Image
                    src={previewUrl}
                    alt="Prévisualisation"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-3 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-stone-300" />
                  <span className="text-sm font-medium text-stone-400">
                    Appuyer pour prendre ou importer une photo
                  </span>
                </button>
              )}

              {!previewUrl && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Choisir une photo
                </button>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selectedFile}
                className="w-full py-3 rounded-2xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ÉTAPE 2 — Métadonnées */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Miniature */}
              {previewUrl && (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-100">
                  <Image src={previewUrl} alt="Aperçu" fill style={{ objectFit: "cover" }} />
                </div>
              )}

              {/* Légende */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Légende <span className="text-stone-300 normal-case font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={140}
                  rows={3}
                  placeholder="Ex : Nouvelle feuille après la taille…"
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                />
                <p className="text-[10px] text-stone-300 text-right">{note.length}/140</p>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Date de la photo
                </label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  max={todayISO()}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !selectedFile}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pb-8 shrink-0" />
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
