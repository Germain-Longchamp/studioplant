"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteGrowthPhoto } from "@/server/actions";
import type { GrowthPhoto } from "@/lib/types";

interface GrowthPhotoModalProps {
  photo: GrowthPhoto | null;
  open: boolean;
  plantId: string;
  onClose: () => void;
  onDelete: (photo: GrowthPhoto) => void;
}

export default function GrowthPhotoModal({
  photo,
  open,
  plantId,
  onClose,
  onDelete,
}: GrowthPhotoModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open || !photo) return null;

  const formattedDate = new Date(photo.taken_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGrowthPhoto(photo.id, plantId, photo.image_path);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Photo supprimée.");
        onDelete(photo);
        onClose();
      }
      setConfirming(false);
    });
  };

  const modal = (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#FDFCF8] w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <div>
            <p className="text-sm font-extrabold text-stone-800 capitalize">{formattedDate}</p>
            {photo.note && (
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{photo.note}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image */}
        <div className="relative w-full aspect-square bg-stone-100">
          <Image
            src={photo.image_path}
            alt={`Photo du ${formattedDate}`}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 100vw, 448px"
          />
        </div>

        {/* Légende + actions */}
        <div className="px-5 py-4 shrink-0">
          {photo.note && (
            <p className="text-sm text-stone-600 mb-4 leading-relaxed">{photo.note}</p>
          )}

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium text-stone-400 hover:text-rose-500 hover:bg-rose-50 border border-stone-150 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer cette photo
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Cette action est irréversible.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
