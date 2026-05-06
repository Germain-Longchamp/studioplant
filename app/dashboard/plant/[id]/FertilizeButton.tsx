'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sprout } from 'lucide-react';
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
    <Button
      type="button"
      onClick={handleFertilize}
      disabled={isPending}
      variant="outline"
      className="w-full border border-amber-200 text-amber-700 hover:bg-amber-50 bg-white rounded-[1.25rem] h-10 font-semibold shadow-sm transition-all active:scale-95 text-sm gap-2"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sprout className="w-3.5 h-3.5" />
      )}
      Engrais ajouté aujourd'hui
    </Button>
  );
}
