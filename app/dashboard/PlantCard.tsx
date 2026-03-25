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
      ? "bg-rose-50 text-rose-400 border border-rose-200"
      : status.color === "orange"
      ? "bg-amber-50 text-amber-500 border border-amber-200"
      : "bg-emerald-50 text-emerald-600 border border-emerald-200";

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-stone-200/60 border border-stone-100/80 flex items-stretch transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
      <Link href={`/dashboard/plant/${plant.id}`} className="absolute inset-0 z-10" />

      {/* IMAGE — left square */}
      <div className="relative w-24 shrink-0 bg-stone-100">
        {plant.image_path ? (
          <Image
            src={plant.image_path}
            alt={plant.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-emerald-50">
            <Leaf className="w-8 h-8 text-emerald-200" />
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col justify-between px-3.5 py-3">
        {/* Top row: name + status badge */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-stone-900 text-[15px] leading-tight line-clamp-1 tracking-tight">
              {plant.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {plant.room && (
                <span className="inline-flex items-center gap-0.5 text-stone-400 text-[10px] font-medium">
                  <MapPin className="w-2.5 h-2.5" />
                  {plant.room}
                </span>
              )}
              {plant.species && (
                <p className="text-[11px] text-stone-400 italic line-clamp-1 font-medium">
                  {plant.room ? `· ${plant.species}` : plant.species}
                </p>
              )}
            </div>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${statusBadge}`}>
            <Droplets className={`w-2.5 h-2.5 ${status.urgent ? "animate-pulse" : ""}`} />
            {timeText}
          </span>
        </div>

        {/* Bottom row: water + snooze */}
        <div className="flex items-center gap-1.5 mt-2.5 relative z-20">
          <div className="flex-1 min-w-0">
            <WaterButton
              plantId={plant.id}
              history={history}
              urgent={status.urgent}
            />
          </div>
          {status.urgent && (
            <div className="shrink-0">
              <CardSnoozeButton plantId={plant.id} snoozeDays={snoozeDays} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
