"use client";

import { useState, useCallback } from "react";
import { Camera, Plus } from "lucide-react";
import { getGrowthPhotos } from "@/server/actions";
import type { GrowthPhoto } from "@/lib/types";
import GrowthPhotoCarousel from "./GrowthPhotoCarousel";
import GrowthPhotoModal from "./GrowthPhotoModal";
import AddGrowthPhotoSheet from "./AddGrowthPhotoSheet";

interface GrowthJournalProps {
  plantId: string;
  initialPhotos: GrowthPhoto[];
}

export default function GrowthJournal({ plantId, initialPhotos }: GrowthJournalProps) {
  const [photos, setPhotos]             = useState<GrowthPhoto[]>(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState<GrowthPhoto | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [sheetOpen, setSheetOpen]       = useState(false);

  const refreshPhotos = useCallback(async () => {
    const result = await getGrowthPhotos(plantId);
    if (result.success && result.data) {
      setPhotos(result.data);
    }
  }, [plantId]);

  const handlePhotoDeleted = (deleted: GrowthPhoto) => {
    setPhotos((prev) => prev.filter((p) => p.id !== deleted.id));
  };

  // ── État vide ──
  if (photos.length === 0) {
    return (
      <>
        <div className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm p-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
            <Camera className="w-6 h-6 text-stone-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-700">Journal de croissance</p>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Immortalisez l'évolution de votre plante !
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajouter une photo
          </button>
        </div>

        <AddGrowthPhotoSheet
          open={sheetOpen}
          plantId={plantId}
          onClose={() => setSheetOpen(false)}
          onSuccess={refreshPhotos}
        />
      </>
    );
  }

  // ── État rempli ──
  return (
    <>
      <section className="bg-white rounded-[1.5rem] border border-stone-100 shadow-sm px-4 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-sm font-extrabold text-stone-800">Journal de croissance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">
              {photos.length} photo{photos.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setSheetOpen(true)}
              className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors active:scale-95"
              title="Ajouter une photo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <GrowthPhotoCarousel
          photos={photos}
          onPhotoClick={(photo) => {
            setSelectedPhoto(photo);
            setModalOpen(true);
          }}
          onAddClick={() => setSheetOpen(true)}
        />
      </section>

      <GrowthPhotoModal
        photo={selectedPhoto}
        open={modalOpen}
        plantId={plantId}
        onClose={() => { setModalOpen(false); setSelectedPhoto(null); }}
        onDelete={handlePhotoDeleted}
      />

      <AddGrowthPhotoSheet
        open={sheetOpen}
        plantId={plantId}
        onClose={() => setSheetOpen(false)}
        onSuccess={refreshPhotos}
      />
    </>
  );
}
