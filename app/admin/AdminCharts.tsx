"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type DataItem = { created_at: string };

interface AdminChartsProps {
  users: DataItem[];
  plants: DataItem[];
  rooms: DataItem[];
  scans: DataItem[];
}

export default function AdminCharts({ users, plants, rooms, scans }: AdminChartsProps) {
  // Fonction pour grouper les données par mois (ex: "2024-01")
  const processData = useMemo(() => {
    const countsByMonth: Record<string, any> = {};

    const addToMonth = (dateString: string, key: string) => {
      if (!dateString) return;
      const date = new Date(dateString);
      // Format YYYY-MM
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!countsByMonth[month]) {
        countsByMonth[month] = { name: month, users: 0, plants: 0, rooms: 0, scans: 0 };
      }
      countsByMonth[month][key] += 1;
    };

    users.forEach(u => addToMonth(u.created_at, 'users'));
    plants.forEach(p => addToMonth(p.created_at, 'plants'));
    rooms.forEach(r => addToMonth(r.created_at, 'rooms'));
    scans.forEach(s => addToMonth(s.created_at, 'scans'));

    // Trier chronologiquement
    return Object.values(countsByMonth).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, plants, rooms, scans]);

  // Petit composant interne pour éviter de répéter le code des 4 graphiques
  const ChartCard = ({ title, dataKey, color, data }: { title: string, dataKey: string, color: string, data: any[] }) => (
    <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col h-72">
      <h3 className="text-sm font-bold text-stone-600 mb-4">{title} (Évolution)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#78716c' }} 
              tickFormatter={(val) => {
                const [year, month] = val.split('-');
                const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                return `${months[parseInt(month) - 1]} ${year.substring(2)}`;
              }}
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis tick={{ fontSize: 12, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(val) => `Mois : ${val}`}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#color${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (processData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <ChartCard title="Nouveaux Utilisateurs" dataKey="users" color="#2563eb" data={processData} />
      <ChartCard title="Nouvelles Plantes" dataKey="plants" color="#059669" data={processData} />
      <ChartCard title="Nouvelles Pièces" dataKey="rooms" color="#d97706" data={processData} />
      <ChartCard title="Nouveaux Scans Rapides" dataKey="scans" color="#9333ea" data={processData} />
    </div>
  );
}
