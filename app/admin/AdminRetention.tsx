"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Ghost, Sprout, Droplets, Zap, BarChart2 } from "lucide-react";
import type { RetentionMetrics } from "./types";

type AdminRetentionProps = RetentionMetrics;

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatMonth(val: string) {
  const [year, month] = val.split("-");
  return `${MONTHS_FR[parseInt(month) - 1]} ${year.substring(2)}`;
}

function getBarColor(retention: number) {
  if (retention >= 50) return "#059669";
  if (retention >= 25) return "#d97706";
  return "#e11d48";
}

function getHealthColor(value: number, goodThreshold: number, badThreshold: number): string {
  if (value >= goodThreshold) return "text-emerald-600";
  if (value >= badThreshold) return "text-amber-600";
  return "text-rose-600";
}

function MetricCard({
  label, value, unit, sublabel, color, tooltip,
}: {
  label: string;
  value: number | string;
  unit?: string;
  sublabel?: string;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-1" title={tooltip}>
      <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-extrabold ${color ?? "text-stone-900"}`}>
        {value}
        {unit && <span className="text-lg font-bold ml-1">{unit}</span>}
      </p>
      {sublabel && <p className="text-xs text-stone-400 font-medium">{sublabel}</p>}
    </div>
  );
}

function StickinessGauge({ ratio }: { ratio: number }) {
  const color = ratio >= 20 ? "bg-emerald-500" : ratio >= 10 ? "bg-amber-400" : "bg-rose-500";
  const label = ratio >= 20 ? "Bonne rétention" : ratio >= 10 ? "Rétention correcte" : "À améliorer";
  const dot = ratio >= 20 ? "🟢" : ratio >= 10 ? "🟡" : "🔴";

  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-stone-500 text-xs font-bold uppercase tracking-wider">Stickiness (DAU / MAU)</p>
        <span className="text-xs font-bold text-stone-500">{dot} {label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${color}`}
            style={{ width: `${Math.min(ratio, 100)}%` }}
          />
        </div>
        <span className="text-2xl font-extrabold text-stone-900 w-14 text-right">{ratio}%</span>
      </div>
      <p className="text-[11px] text-stone-400 mt-2">Seuils : &gt;20% bon · 10–20% correct · &lt;10% à surveiller</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { total: number } }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-stone-700 mb-1">{formatMonth(label)}</p>
      <p className="text-stone-500">{payload[0].payload.total} inscrits</p>
      <p className="font-extrabold text-stone-900">{payload[0].value}% encore actifs</p>
    </div>
  );
}

export default function AdminRetention({
  DAU, WAU, MAU, stickinessRatio,
  activationRate, newActivationRate, ghostUsers,
  powerUsers, wateringEngagementRate, plantsPerActiveUser,
  cohortData,
}: AdminRetentionProps) {
  return (
    <div className="space-y-4">

      {/* SECTION 1 — ACTIVITÉ */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Activité</p>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="DAU"
            value={DAU}
            sublabel="actifs 24h"
            tooltip="Utilisateurs connectés dans les dernières 24h"
          />
          <MetricCard
            label="WAU"
            value={WAU}
            sublabel="actifs 7j"
            tooltip="Utilisateurs connectés dans les 7 derniers jours"
          />
          <MetricCard
            label="MAU"
            value={MAU}
            sublabel="actifs 30j"
            tooltip="Utilisateurs connectés dans les 30 derniers jours"
          />
        </div>
        <StickinessGauge ratio={stickinessRatio} />
      </div>

      {/* SECTION 2 — ACTIVATION */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Sprout className="w-3.5 h-3.5" /> Activation
        </p>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label="Activation globale"
            value={activationRate}
            unit="%"
            sublabel="ont ajouté 1+ plante"
            color={getHealthColor(activationRate, 60, 30)}
            tooltip="Pourcentage d'utilisateurs ayant ajouté au moins une plante"
          />
          <MetricCard
            label="Activation (7j)"
            value={newActivationRate}
            unit="%"
            sublabel="nouveaux inscrits"
            color={getHealthColor(newActivationRate, 60, 30)}
            tooltip="Taux d'activation des utilisateurs inscrits dans les 7 derniers jours"
          />
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-1" title="Comptes inscrits depuis +3j sans retour">
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ghost className="w-3.5 h-3.5" /> Comptes fantômes
            </p>
            <p className={`text-3xl font-extrabold ${ghostUsers > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {ghostUsers}
            </p>
            <p className="text-xs text-stone-400 font-medium">jamais revenus (&gt;3j)</p>
          </div>
        </div>
      </div>

      {/* SECTION 3 — ENGAGEMENT */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Engagement
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-1" title="Part des MAU ayant arrosé une plante dans les 30 derniers jours">
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" /> Arrosage 30j
            </p>
            <p className={`text-3xl font-extrabold ${getHealthColor(wateringEngagementRate, 50, 25)}`}>
              {wateringEngagementRate}%
            </p>
            <p className="text-xs text-stone-400 font-medium">des MAU ont arrosé</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col gap-1" title="Utilisateurs avec ≥3 plantes ET ≥1 pièce configurée">
            <p className="text-stone-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Power users
            </p>
            <p className="text-3xl font-extrabold text-stone-900">{powerUsers}</p>
            <p className="text-xs text-stone-400 font-medium">≥3 plantes + ≥1 pièce</p>
          </div>
          <MetricCard
            label="Plantes / MAU"
            value={plantsPerActiveUser}
            sublabel="par utilisateur actif"
            tooltip="Nombre moyen de plantes par utilisateur actif (30j)"
          />
        </div>
      </div>

      {/* SECTION 4 — RÉTENTION PAR COHORTE */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5" /> Rétention par cohorte d'inscription
        </p>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          {cohortData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-stone-400">
              <BarChart2 className="w-8 h-8 text-stone-200" />
              <p className="text-sm font-medium">Pas encore assez de données</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-400 font-medium mb-4">
                % d'utilisateurs encore actifs (connectés dans les 30 derniers jours) par mois d'inscription
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cohortData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: "#a8a29e", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "#a8a29e", fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f4", radius: 8 }} />
                  <Bar dataKey="retention" radius={[6, 6, 0, 0]}>
                    {cohortData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.retention)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 justify-end">
                <span className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" /> ≥50%
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> 25–49%
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 inline-block" /> &lt;25%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
