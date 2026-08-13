"use client";

import { useState, useRef } from "react";
import { Stethoscope, ChevronRight } from "lucide-react";
import DoctorPlantFlow, { type JunglePlant } from "./DoctorPlantFlow";

export default function DoctorPlant({ plants = [] }: { plants?: JunglePlant[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ file: File; previewUrl: string } | null>(null);

  const handleTriggerClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicked({ file, previewUrl: URL.createObjectURL(file) });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeFlow = () => {
    if (picked) URL.revokeObjectURL(picked.previewUrl);
    setPicked(null);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={handleTriggerClick}
        className="w-full bg-blue-50/80 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm border border-blue-200/60 transition-all hover:bg-blue-100/50 hover:shadow-md active:scale-95 group"
      >
        <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm shadow-blue-600/20">
          <Stethoscope className="w-6 h-6" />
        </div>
        <div className="text-left flex-1">
          <h3 className="font-bold text-blue-950 text-lg leading-tight">Docteur Plante</h3>
          <p className="text-blue-700/80 text-sm font-medium mt-0.5">Diagnostic rapide par photo</p>
        </div>
        <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors shrink-0" />
      </button>

      {picked && (
        <DoctorPlantFlow
          file={picked.file}
          previewUrl={picked.previewUrl}
          userPlants={plants}
          onClose={closeFlow}
        />
      )}
    </div>
  );
}
