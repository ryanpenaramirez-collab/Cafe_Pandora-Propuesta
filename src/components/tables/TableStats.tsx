import { useMemo } from 'react';
import { Table, Order } from '../../types';
import { calculateTableStats, formatCOP, getElapsedTime } from './utils';

interface TableStatsProps {
  tables: Table[];
  orders: Order[];
}

export default function TableStats({ tables, orders }: TableStatsProps) {
  const stats = useMemo(() => calculateTableStats(tables), [tables]);

  const avgOccupationTime = useMemo(() => {
    const occupied = tables.filter(t => t.status === 'ocupada' || t.status === 'por_pagar');
    if (occupied.length === 0) return '0 min';
    const totalMinutes = occupied.reduce((acc, t) => {
      if (!t.occupiedSince) return acc;
      const [h, m] = t.occupiedSince.split(':').map(Number);
      const now = new Date();
      const occDate = new Date();
      occDate.setHours(h, m, 0, 0);
      return acc + Math.floor((now.getTime() - occDate.getTime()) / 60000);
    }, 0);
    const avg = Math.round(totalMinutes / occupied.length);
    if (avg < 60) return `${avg} min`;
    return `${Math.floor(avg / 60)}h ${avg % 60}min`;
  }, [tables]);

  const zoneOccupation = useMemo(() => {
    const zones: Record<string, { total: number; occupied: number; revenue: number }> = {} as Record<string, { total: number; occupied: number; revenue: number }>;
    tables.forEach(t => {
      const lower = t.name.toLowerCase();
      let zone = 'Salón Interior';
      if (lower.includes('terraza')) zone = 'Terraza';
      else if (lower.includes('barra') || lower.includes('vip')) zone = 'Barra';
      if (!zones[zone]) zones[zone] = { total: 0, occupied: 0, revenue: 0 };
      zones[zone].total += 1;
      if (t.status !== 'vacía') zones[zone].occupied += 1;
      zones[zone].revenue += t.totalAmount;
    });
    return zones;
  }, [tables]);

  const topTables = useMemo(() => {
    return [...tables]
      .filter(t => t.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 3);
  }, [tables]);

  const inUse = stats.occupied + stats.pendingPayment;
  const usagePercent = Math.round((inUse / stats.total) * 100);

  const cardClass = 'bg-white rounded-xl border border-slate-200 p-4 shadow-sm';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={cardClass}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Mesas</span>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className={cardClass}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ocupadas</span>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">{stats.occupied}</p>
        </div>
        <div className={cardClass}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Turno</span>
          <p className="text-lg font-bold font-mono text-emerald-600 mt-1">{formatCOP(stats.totalRevenue)}</p>
        </div>
        <div className={cardClass}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiempo Promedio</span>
          <p className="text-lg font-bold font-mono text-pandora-gold mt-1">{avgOccupationTime}</p>
        </div>
      </div>

      <div className={cardClass}>
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ocupación por Zona</h5>
        <div className="space-y-3">
          {(Object.entries(zoneOccupation) as [string, { total: number; occupied: number; revenue: number }][]).map(([zone, data]) => {
            const pct = data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;
            return (
              <div key={zone}>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold">{zone}</span>
                  <span>{data.occupied}/{data.total} · {formatCOP(data.revenue)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: pct > 60 ? '#D4A017' : pct > 30 ? '#e5b974' : '#cbd5e1' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {topTables.length > 0 && (
        <div className={cardClass}>
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Top 3 Mesas Más Rentables</h5>
          <div className="space-y-2">
            {topTables.map((t, i) => (
              <div key={t.id} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="font-serif font-bold text-slate-800">{t.name}</span>
                  <span className="text-slate-400">· {t.ordersCount} orden(es)</span>
                </div>
                <span className="font-bold font-mono text-emerald-600">{formatCOP(t.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Capacidad Global</h5>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{inUse} de {stats.total} mesas en uso</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%`, backgroundColor: usagePercent > 75 ? '#d66c50' : usagePercent > 40 ? '#D4A017' : '#22c55e' }}
          />
        </div>
      </div>
    </div>
  );
}
