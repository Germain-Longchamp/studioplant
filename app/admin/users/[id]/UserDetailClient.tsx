"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User, Sprout, MapPin, Trash2, Loader2, AlertTriangle,
  CalendarDays, Clock, ShieldCheck, ShieldOff,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { deleteUserAccount } from "../../actions";
import { getWateringStatus, getActiveWateringFrequency } from "@/lib/utils";
import { Droplets } from "lucide-react";

interface Plant {
  id: string;
  name: string | null;
  image_path: string | null;
  created_at: string;
  room: string | null;
  last_watered_at: string | null;
  snooze_days: number | null;
  watering_frequency: number | null;
  watering_freq_spring: number | null;
  watering_freq_summer: number | null;
  watering_freq_autumn: number | null;
  watering_freq_winter: number | null;
}

const wateringBadgeStyles: Record<string, string> = {
  red: "bg-rose-50 text-rose-700",
  orange: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
};

interface Room {
  id: string;
  name: string | null;
  created_at: string;
}

interface UserDetailClientProps {
  user: {
    id: string;
    email: string | undefined;
    created_at: string;
    last_seen_at: string | null;
    role: string | null;
  };
  plants: Plant[];
  rooms: Room[];
}

type Tab = "profil" | "plantes" | "pieces";

export default function UserDetailClient({ user, plants, rooms }: UserDetailClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAccount(user.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`L'utilisateur ${user.email} a été supprimé.`);
        router.push("/admin");
      }
    });
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "profil", label: "Profil", icon: <User className="w-4 h-4" /> },
    { key: "plantes", label: "Plantes", icon: <Sprout className="w-4 h-4" />, count: plants.length },
    { key: "pieces", label: "Pièces", icon: <MapPin className="w-4 h-4" />, count: rooms.length },
  ];

  return (
    <>
      {/* TAB BAR */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-6">
        <div className="flex divide-x divide-stone-100">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                tab === t.key
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${tab === t.key ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PROFIL TAB */}
      {tab === "profil" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100">
            <InfoRow icon={<User className="w-4 h-4 text-stone-400" />} label="Email" value={user.email ?? "—"} mono={false} />
            <InfoRow icon={<User className="w-4 h-4 text-stone-400" />} label="ID" value={user.id} mono />
            <InfoRow
              icon={<CalendarDays className="w-4 h-4 text-stone-400" />}
              label="Inscrit le"
              value={new Date(user.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
              mono={false}
            />
            <InfoRow
              icon={<Clock className="w-4 h-4 text-stone-400" />}
              label="Dernière activité"
              value={
                user.last_seen_at
                  ? new Date(user.last_seen_at).toLocaleString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "Jamais"
              }
              mono={false}
            />
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {user.role === "admin"
                  ? <ShieldCheck className="w-4 h-4 text-rose-500" />
                  : <ShieldOff className="w-4 h-4 text-stone-300" />}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 w-32 shrink-0">Rôle</p>
              <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                user.role === "admin"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-stone-100 text-stone-500"
              }`}>
                {user.role ?? "user"}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer ce compte
          </button>
        </div>
      )}

      {/* PLANTES TAB */}
      {tab === "plantes" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {plants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-400">
              <Sprout className="w-8 h-8 text-stone-200" />
              <p className="text-sm font-medium">Aucune plante</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {plants.map((plant) => {
                const status = plant.last_watered_at
                  ? getWateringStatus(
                      plant.last_watered_at,
                      getActiveWateringFrequency(plant),
                      plant.snooze_days || 0
                    )
                  : null;

                return (
                  <li key={plant.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                      {plant.image_path ? (
                        <Image
                          src={plant.image_path}
                          alt={plant.name ?? "plante"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sprout className="w-4 h-4 text-stone-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{plant.name ?? "Sans nom"}</p>
                      <p className="text-[10px] text-stone-400 font-mono truncate">{plant.id}</p>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0 ${
                        status ? wateringBadgeStyles[status.color] : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      <Droplets className="w-2.5 h-2.5" />
                      {status ? status.text : "—"}
                    </span>
                    <p className="text-xs text-stone-400 shrink-0">
                      {new Date(plant.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* PIÈCES TAB */}
      {tab === "pieces" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone-400">
              <MapPin className="w-8 h-8 text-stone-200" />
              <p className="text-sm font-medium">Aucune pièce</p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {rooms.map((room) => {
                const plantCount = plants.filter((p) => p.room === room.name).length;
                return (
                  <li key={room.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100/50">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-800 truncate">{room.name ?? "Sans nom"}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {plantCount} plante{plantCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-xs text-stone-400 shrink-0">
                      {new Date(room.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-stone-600 mb-6">
              Es-tu sûr de vouloir supprimer définitivement{" "}
              <strong>{user.email}</strong> et toutes ses plantes ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg font-medium text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  "Oui, supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({
  icon, label, value, mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="w-8 h-8 flex items-center justify-center shrink-0">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400 w-32 shrink-0">{label}</p>
      <p className={`text-sm text-stone-700 truncate ${mono ? "font-mono text-[11px]" : "font-medium"}`}>{value}</p>
    </div>
  );
}
