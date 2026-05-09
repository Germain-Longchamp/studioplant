'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fertilizePlant } from '@/server/actions';

export default function FertilizeButton({ plantId }: { plantId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleFertilize = () => {
    startTransition(async () => {
      const result = await fertilizePlant(plantId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Engrais ajouté ! 🌿');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleFertilize}
      disabled={isPending}
      className="flex items-center gap-1 text-[10px] font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1 transition-colors active:scale-95 shrink-0"
    >
      {isPending
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <span>+ Engrais</span>
      }
    </button>
  );
}
