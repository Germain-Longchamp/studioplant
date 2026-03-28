"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import PlantIdentityModal from "./PlantIdentityModal";

interface Props {
  plant: any;
  hasQuickInfos: boolean;
}

export default function PlantIdentityTrigger({ plant, hasQuickInfos }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-transparent hover:bg-stone-50 transition-colors cursor-pointer"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Voir la fiche détaillée complète ›
      </button>
      <PlantIdentityModal
        plant={plant}
        hasQuickInfos={hasQuickInfos}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
