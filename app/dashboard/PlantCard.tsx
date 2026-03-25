import Link from "next/link";
import Image from "next/image";
import { MapPin, Leaf, Droplets } from "lucide-react";
import { getWateringStatus } from "@/lib/utils";
import WaterButton from "./WaterButton";
import CardSnoozeButton from "./CardSnoozeButton";

export default function PlantCard({ plant }: { plant: any }) {
  const snoozeDays = plant.snooze_days || 0;
  const history = plant.watering_history || [];
  const status = getWateringStatus(plant.last_watered_at, plant.watering_frequency, snoozeDays);

  let timeText = status.text;
  if (timeText.toLowerCase() === "aujourd'hui") {
    timeText = "Auj.";
  }

  const statusBadge =
    status.color === "red"
      ? "bg-rose-500 text-white"
      : status.color === "orange"
      ? "bg-amber-400 text-white"
      : "bg-emerald-500/90 text-white";

  return (
    <div className="group relative bg-white rounded-[2rem] overflow-hidden shadow-md shadow-stone-200/50 border border-stone-100/80 transition-all duration-300 hover:shadow-xl hover:shadow-stone-300/40 hover:-translate-y-0.5 active:scale-[0.99]">
      <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />

      {/* IMAGE */}
      <div className="relative w-full h-44 bg-stone-100 overflow-hidden">
        {plant.image_path ? (
          <Image
            src={plant.image_path}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 448px) calc(100vw - 40px), 408px"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-emerald-50">
            <Leaf className="w-12 h-12 text-emerald-200" />
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* Badges overlaid on photo */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          {plant.room ? (
            <span className="inline-flex items-center gap-1 bg-black/30 backdrop-blur-sm border border-white/15 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
              <MapPin className="w-2.5 h-2.5" />
              {plant.room}
            </span>
          ) : (
            <span />
          )}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${statusBadge}`}>
            <Droplets className={`w-2.5 h-2.5 ${status.urgent ? "animate-pulse" : ""}`} />
            {status.text}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pt-3.5 pb-1">
        <h3 className="font-black text-stone-900 text-[17px] leading-tight line-clamp-1 tracking-tight">
          {plant.name}
        </h3>
        <p className="text-xs text-stone-400 italic mt-0.5 line-clamp-1 font-medium">
          {plant.species}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="px-4 pb-4 pt-3 flex items-center gap-2 relative z-20">
        <div className="flex-1 min-w-0">
          <WaterButton
            plantId={plant.id}
            history={history}
            urgent={status.urgent}
            timeText={timeText}
          />
        </div>
        {status.urgent && (
          <div className="shrink-0">
            <CardSnoozeButton plantId={plant.id} snoozeDays={snoozeDays} />
          </div>
        )}
      </div>
    </div>
  );
}
