"use client";

import { useState } from "react";
import { ChevronDown, Sun, Droplets, Layers, Flower2, LeafyGreen } from "lucide-react";
import DeferredCareLoading from "./DeferredCareLoading";

type CareBlock = { summary: string; detail: string } | null;

const CARE_SECTIONS = [
  {
    key: "light_care",
    label: "Lumière",
    icon: Sun,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    key: "watering_care",
    label: "Arrosage",
    icon: Droplets,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    key: "substrate_care",
    label: "Substrat & rempotage",
    icon: Layers,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    key: "seasonal_care",
    label: "Entretien saisonnier",
    icon: Flower2,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-500",
  },
] as const;

export default function CareGuideAccordion({ plant }: { plant: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const hasAnyCare = CARE_SECTIONS.some(
    (s) => plant[s.key] && plant[s.key].summary
  );

  if (!hasAnyCare) {
    return <DeferredCareLoading plantId={plant.id} />;
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-lg shadow-stone-200/30 border border-stone-100 overflow-hidden transition-all hover:border-emerald-100/60">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 p-5 border-b border-stone-100">
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0 shadow-sm">
          <LeafyGreen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-stone-800 font-extrabold text-lg">
            Guide d&apos;entretien
          </h3>
          <p className="text-xs text-stone-400 font-medium mt-0.5">
            Conseils personnalisés par l&apos;IA
          </p>
        </div>
      </div>

      {/* ── LIGNES THÉMATIQUES ── */}
      <div>
        {CARE_SECTIONS.map((section, i) => {
          const data: CareBlock = plant[section.key];
          if (!data?.summary) return null;

          const isOpen = openIndex === i;
          const Icon = section.icon;

          return (
            <div key={section.key}>
              {i > 0 && <div className="h-px bg-stone-100 mx-5" />}

              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-4 px-5 hover:bg-stone-50/50 active:bg-stone-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${section.iconBg}`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${section.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-stone-800">
                      {section.label}
                    </p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {data.summary}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-[#FAFAFA] rounded-2xl border border-stone-100">
                    <p className="text-sm text-stone-700 leading-relaxed">
                      {data.detail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
