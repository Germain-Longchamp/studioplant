"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deletePlant } from "@/server/actions";
import { toast } from "sonner";

export default function DeleteButton({ 
  plantId, 
  imageUrl 
}: { 
  plantId: string, 
  imageUrl: string | null 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Alerte de confirmation native du navigateur
    if (!window.confirm("Voulez-vous vraiment supprimer cette plante ? Cette action est irréversible.")) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Suppression en cours...");

    const result = await deletePlant(plantId, imageUrl);

    if (result?.error) {
      toast.error(result.error, { id: toastId });
      setIsDeleting(false);
    } else {
      toast.success("Plante supprimée avec succès.", { id: toastId });
      // Pas besoin de setIsDeleting(false) ici car la Server Action va rediriger la page
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-100 mt-8"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <Trash2 className="w-5 h-5 mr-2" />
      )}
      Supprimer cette plante
    </Button>
  );
}