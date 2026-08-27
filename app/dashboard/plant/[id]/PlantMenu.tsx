"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Sparkles, Trash2, X, Loader2, AlertTriangle, Image as ImageIcon, Camera, GalleryHorizontal, HeartCrack, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { updatePlantAdvice, deletePlant, updatePlantImage, markPlantDeceased, restorePlant } from "@/server/actions";
import { compressImage } from "@/lib/utils";

const DECEASED_REASONS = [
  "Chaleur extrême",
  "Manque d'eau",
  "Excès d'eau",
  "Chute / accident",
  "Gel",
  "Parasites / maladie",
  "Autre",
];

export default function PlantMenu({ plantId, imageUrl, isDeceased = false }: { plantId: string, imageUrl: string | null, isDeceased?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isPendingUpdate, startTransitionUpdate] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPendingImage, startTransitionImage] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showDeceasedModal, setShowDeceasedModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isPendingDeceased, startTransitionDeceased] = useTransition();
  const [isPendingRestore, startTransitionRestore] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  const handleUpdate = () => {
    startTransitionUpdate(async () => {
      const result = await updatePlantAdvice(plantId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Conseils réévalués et mis à jour ! 🌱");
        setIsOpen(false);
      }
    });
  };

  // On lance la vraie suppression uniquement après la modale
  const executeDelete = () => {
    startTransitionDelete(async () => {
      const result = await deletePlant(plantId, imageUrl);
      if (result?.error) {
        toast.error(result.error);
        setShowConfirm(false);
      }
      // Si succès, l'action serveur redirige automatiquement vers le dashboard
    });
  };

  // Gère la fermeture complète du menu
  const closeAll = () => {
    setIsOpen(false);
    setShowConfirm(false);
  };

  const closeDeceasedModal = () => {
    setShowDeceasedModal(false);
    setSelectedReason(null);
  };

  const executeMarkDeceased = () => {
    startTransitionDeceased(async () => {
      const result = await markPlantDeceased(plantId, selectedReason);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Plante ajoutée au Jardin des souvenirs 🕊️");
        closeDeceasedModal();
        setIsOpen(false);
      }
    });
  };

  const executeRestore = () => {
    startTransitionRestore(async () => {
      const result = await restorePlant(plantId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Plante restaurée dans votre jungle 🌱");
        setIsOpen(false);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Photo compressée avant upload — évite de dépasser la limite de taille de la
    // Server Action sur les photos prises en pleine résolution avec l'appareil photo.
    const compressedFile = await compressImage(file);
    setSelectedFile(compressedFile);
    setImagePreview(URL.createObjectURL(compressedFile));
  };

  const closeImagePicker = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setShowImagePicker(false);
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleConfirmImage = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("image", selectedFile);
    startTransitionImage(async () => {
      const result = await updatePlantImage(plantId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo mise à jour ! 🌿");
        closeImagePicker();
      }
    });
  };

  const menuModal = isOpen && !showConfirm ? (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeAll}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-800 text-xl">Options de la plante</h3>
          <Button variant="ghost" size="icon" onClick={closeAll} className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Button onClick={handleUpdate} disabled={isPendingUpdate || isPendingDelete} className="w-full justify-start h-14 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-base transition-colors shadow-sm border border-emerald-100">
          {isPendingUpdate ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 text-emerald-500" />}
          {isPendingUpdate ? "Mise à jour en cours..." : "Rafraîchir les conseils"}
        </Button>

        <Button
          onClick={() => { setShowImagePicker(true); setIsOpen(false); }}
          disabled={isPendingUpdate || isPendingDelete}
          className="w-full justify-start h-14 rounded-2xl bg-stone-50 text-stone-700 hover:bg-stone-100 font-semibold text-base transition-colors shadow-sm border border-stone-100"
        >
          <ImageIcon className="w-5 h-5 mr-3 text-stone-400" />
          Changer la photo
        </Button>

        {isDeceased ? (
          <Button
            onClick={executeRestore}
            disabled={isPendingRestore || isPendingUpdate || isPendingDelete}
            className="w-full justify-start h-14 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-base transition-colors shadow-sm border border-emerald-100"
          >
            {isPendingRestore ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Heart className="w-5 h-5 mr-3 text-emerald-500" />}
            {isPendingRestore ? "Restauration..." : "Restaurer la plante"}
          </Button>
        ) : (
          <Button
            onClick={() => { setShowDeceasedModal(true); setIsOpen(false); }}
            disabled={isPendingUpdate || isPendingDelete}
            className="w-full justify-start h-14 rounded-2xl bg-stone-50 text-stone-600 hover:bg-stone-100 font-semibold text-base transition-colors shadow-sm border border-stone-100"
          >
            <HeartCrack className="w-5 h-5 mr-3 text-stone-400" />
            Marquer comme morte
          </Button>
        )}

        <Button onClick={() => setShowConfirm(true)} disabled={isPendingDelete || isPendingUpdate} className="w-full justify-start h-14 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-base transition-colors shadow-sm">
          <Trash2 className="w-5 h-5 mr-3" />
          Supprimer la plante
        </Button>
      </div>
    </div>
  ) : null;

  const confirmModal = showConfirm ? (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-5 animate-in fade-in duration-200" onClick={closeAll}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-rose-100">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="font-extrabold text-stone-900 text-2xl tracking-tight mb-2">
          Êtes-vous sûr ?
        </h3>

        <p className="text-stone-500 text-sm mb-8 leading-relaxed font-medium">
          Cette plante et tout son historique d'arrosage seront définitivement effacés de votre jardin.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={executeDelete}
            disabled={isPendingDelete}
            className="w-full h-14 rounded-[1.25rem] bg-rose-500 hover:bg-rose-600 text-white font-bold text-base shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            {isPendingDelete ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isPendingDelete ? "Suppression..." : "Oui, supprimer définitivement"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setShowConfirm(false)}
            disabled={isPendingDelete}
            className="w-full h-12 rounded-[1.25rem] text-stone-500 font-bold hover:bg-stone-100 hover:text-stone-700 active:scale-95 transition-all"
          >
            Annuler
          </Button>
        </div>

      </div>
    </div>
  ) : null;

  const deceasedModal = showDeceasedModal ? (
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeDeceasedModal}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>

        <div className="w-16 h-16 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-stone-200">
          <HeartCrack className="w-8 h-8" />
        </div>

        <h3 className="font-extrabold text-stone-900 text-2xl tracking-tight mb-2 text-center">
          Une pensée pour elle
        </h3>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed font-medium text-center">
          Cette plante rejoindra votre Jardin des souvenirs. Vous pourrez toujours la restaurer plus tard.
        </p>

        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2.5">
          Raison (facultatif)
        </p>
        <div className="flex flex-wrap gap-2 mb-6">
          {DECEASED_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(selectedReason === reason ? null : reason)}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                selectedReason === reason
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={executeMarkDeceased}
            disabled={isPendingDeceased}
            className="w-full h-14 rounded-[1.25rem] bg-stone-800 hover:bg-stone-900 text-white font-bold text-base shadow-lg shadow-stone-800/20 active:scale-95 transition-all"
          >
            {isPendingDeceased ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {isPendingDeceased ? "Enregistrement..." : "Confirmer"}
          </Button>

          <Button
            variant="ghost"
            onClick={closeDeceasedModal}
            disabled={isPendingDeceased}
            className="w-full h-12 rounded-[1.25rem] text-stone-500 font-bold hover:bg-stone-100 hover:text-stone-700 active:scale-95 transition-all"
          >
            Annuler
          </Button>
        </div>

      </div>
    </div>
  ) : null;

  const imagePickerModal = showImagePicker ? (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeImagePicker}>
      <div className="bg-[#FDFCF8] w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-8 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-800 text-xl">Changer la photo</h3>
          <Button variant="ghost" size="icon" onClick={closeImagePicker} className="text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* input galerie */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* input caméra directe */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {imagePreview ? (
          <div
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-stone-100 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image src={imagePreview} alt="Prévisualisation" fill style={{ objectFit: "cover" }} />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full">
              Appuyer pour changer
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            >
              <Camera className="w-7 h-7 text-emerald-400" />
              <span className="text-xs font-semibold text-stone-500">Prendre une photo</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center gap-2 hover:border-stone-300 hover:bg-stone-100 transition-colors"
            >
              <GalleryHorizontal className="w-7 h-7 text-stone-400" />
              <span className="text-xs font-semibold text-stone-500">Depuis la galerie</span>
            </button>
          </div>
        )}

        <Button
          onClick={handleConfirmImage}
          disabled={!selectedFile || isPendingImage}
          className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all"
        >
          {isPendingImage ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          {isPendingImage ? "Mise à jour..." : "Confirmer"}
        </Button>

        <Button
          variant="ghost"
          onClick={closeImagePicker}
          disabled={isPendingImage}
          className="w-full h-12 rounded-2xl text-stone-500 font-bold hover:bg-stone-100 hover:text-stone-700 transition-all"
        >
          Annuler
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* BOUTON D'OUVERTURE */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-white bg-stone-900/40 backdrop-blur-md hover:bg-stone-900/60 border border-white/10 shadow-md rounded-full transition-all active:scale-95"
      >
        <MoreVertical className="w-6 h-6" />
      </Button>

      {mounted && createPortal(menuModal, document.body)}
      {mounted && createPortal(confirmModal, document.body)}
      {mounted && createPortal(deceasedModal, document.body)}
      {mounted && createPortal(imagePickerModal, document.body)}
    </>
  );
}
