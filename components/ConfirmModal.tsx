"use client";

import { useEffect } from "react";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isProcessing = false,
}: ConfirmModalProps) {
  // Empêche le défilement de la page quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? "Suppression..." : "Confirmer la suppression"}
          </button>
        </div>
      </div>
    </div>
  );
}
