import Link from "next/link";
import Image from "next/image";
import { MapPin, Leaf } from "lucide-react";
import { getWateringStatus } from "@/lib/utils";
import WaterButton from "./WaterButton";

export default function PlantCard({ plant }: { plant: any }) {
  const snoozeDays = plant.snooze_days || 0;
  const history = plant.watering_history || [];
  const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);

  return (
    <div className="group relative flex flex-row bg-white rounded-[1.75rem] overflow-hidden shadow-lg shadow-stone-200/40 border border-stone-100/60 transition-all duration-300 hover:shadow-xl hover:border-emerald-200">
      <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />
      
      <div className="relative w-[35%] min-w-[120px] max-w-[140px] bg-stone-100 shrink-0 border-r border-stone-100/50">
        {plant.image_path ? (
          <Image src={plant.image_path} alt={plant.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 33vw, 25vw" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-stone-300 bg-emerald-50/50">
            <Leaf className="w-8 h-8 opacity-40 text-emerald-600" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1 p-4">
        <div className="flex-1">
          <h3 className="font-bold text-stone-800 text-lg leading-tight line-clamp-1 pr-2">{plant.name}</h3>
          <p className="text-sm text-stone-500 italic mt-0.5 line-clamp-1">{plant.species}</p>
          {plant.room && (
            <div className="inline-flex items-center gap-1 mt-2.5 bg-[#FDFCF8] px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-200/60">
              <MapPin className="w-3 h-3 text-emerald-700" /> {plant.room}
            </div>
          )}
        </div>
        
        {/* LE NOUVEAU BOUTON COMPOSITE EST ICI */}
        <div className="mt-4 pt-3 border-t border-stone-100 relative z-20">
          <WaterButton 
            plantId={plant.id} 
            history={history} 
            urgent={status.urgent} 
            timeText={status.text} 
          />
        </div>
      </div>
    </div>
  );
}
