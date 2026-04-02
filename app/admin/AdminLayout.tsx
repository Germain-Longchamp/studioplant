"use client";

import { useState } from "react";
import { TrendingUp, Heart, Users, ClipboardList } from "lucide-react";
import AdminCharts from "./AdminCharts";
import AdminRetention from "./AdminRetention";
import AdminTable from "./AdminTable";
import AdminLogs from "./AdminLogs";
import type { EnrichedUser, AdminLog, RetentionMetrics } from "./types";

type Tab = "croissance" | "retention" | "users";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "croissance", label: "Croissance",    icon: TrendingUp },
  { key: "retention",  label: "Rétention",     icon: Heart      },
  { key: "users",      label: "Utilisateurs",  icon: Users      },
];

interface AdminLayoutProps {
  chartData: {
    users:  { created_at: string }[];
    plants: { created_at: string }[];
    rooms:  { created_at: string }[];
    scans:  { created_at: string }[];
  };
  retention: RetentionMetrics;
  enrichedUsers: EnrichedUser[];
  adminLogs: AdminLog[];
}

export default function AdminLayout({ chartData, retention, enrichedUsers, adminLogs }: AdminLayoutProps) {
  const [tab, setTab] = useState<Tab>("croissance");

  return (
    <div className="flex gap-6 items-start">

      {/* LEFT TAB NAV */}
      <div className="w-48 shrink-0 sticky top-6">
        <nav className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-bold transition-colors border-l-2 ${
                  active
                    ? "bg-stone-50 border-emerald-500 text-stone-900"
                    : "border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-700"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-emerald-600" : ""}`} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">

        {tab === "croissance" && (
          <AdminCharts
            users={chartData.users}
            plants={chartData.plants}
            rooms={chartData.rooms}
            scans={chartData.scans}
          />
        )}

        {tab === "retention" && (
          <AdminRetention {...retention} />
        )}

        {tab === "users" && (
          <div className="space-y-8">
            <AdminTable users={enrichedUsers} />
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Journal d'activité
              </h3>
              <AdminLogs logs={adminLogs} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
