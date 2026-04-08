"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import type { GrowthPhoto } from "@/lib/types";

interface GrowthPhotoCarouselProps {
  photos: GrowthPhoto[];
  onPhotoClick: (photo: GrowthPhoto) => void;
  onAddClick: () => void;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function GrowthPhotoCarousel({
  photos,
  onPhotoClick,
  onAddClick,
}: GrowthPhotoCarouselProps) {
  return (
    <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2 -mx-1 px-1">
      {photos.map((photo) => {
        const shortDate = formatShortDate(photo.taken_at);
        return (
          <button
            key={photo.id}
            onClick={() => onPhotoClick(photo)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-stone-100 bg-stone-100 shadow-sm">
              <Image
                src={photo.image_path}
                alt={`Photo du ${shortDate}`}
                width={96}
                height={96}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
            <span className="text-[9px] text-stone-400 font-medium whitespace-nowrap">
              {shortDate}
            </span>
          </button>
        );
      })}

      {/* Slot "+" toujours en dernier */}
      <button
        onClick={onAddClick}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
      >
        <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
          <Plus className="w-5 h-5 text-stone-300" />
        </div>
        <span className="text-[9px] text-stone-300 font-medium">Ajouter</span>
      </button>
    </div>
  );
}
