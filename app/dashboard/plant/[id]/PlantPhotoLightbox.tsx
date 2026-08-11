"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Expand } from "lucide-react";

export default function PlantPhotoLightbox({
  imageUrl,
  alt,
}: {
  imageUrl: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  // Ferme au clavier (Echap) et bloque le scroll de fond pendant que la photo est ouverte
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Agrandir la photo"
        className="w-[34px] h-[34px] rounded-full border backdrop-blur-md transition-all active:scale-95 flex items-center justify-center text-white"
        style={{ background: "rgba(0,0,0,0.28)", borderColor: "rgba(255,255,255,0.22)" }}
      >
        <Expand className="w-4 h-4" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="relative w-full h-full max-w-3xl max-h-[85vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={imageUrl}
                alt={alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
