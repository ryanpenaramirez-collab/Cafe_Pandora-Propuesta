import { useMemo } from 'react';
import { Table } from '../../types';
import TableCard from './TableCard';
import { calculateTableStats, formatCOP } from './utils';

interface TableMapProps {
  tables: Table[];
  selectedTableId: number | null;
  onSelectTable: (table: Table) => void;
}

const ZONE_LABELS: Record<string, string> = {
  terraza: 'Terraza',
  interior: 'Salón Interior',
  barra: 'Barra',
};

const ZONE_ORDER = ['terraza', 'interior', 'barra'];

function getTableZone(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('terraza')) return 'terraza';
  if (lower.includes('interior') || lower.includes('ventana') || lower.includes('sofá')) return 'interior';
  if (lower.includes('barra') || lower.includes('vip')) return 'barra';
  return 'interior';
}

export default function TableMap({ tables, selectedTableId, onSelectTable }: TableMapProps) {
  const stats = useMemo(() => calculateTableStats(tables), [tables]);

  const zones = useMemo(() => {
    const grouped: Record<string, Table[]> = {};
    tables.forEach(t => {
      const zone = getTableZone(t.name);
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(t);
    });
    return grouped;
  }, [tables]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider">Leyenda:</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Vacía</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-300" /> Ocupada</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-300" /> Reservada</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Por pagar</span>
        <span className="ml-auto text-[10px] text-slate-400 font-mono">
          {stats.occupied} ocup · {stats.vacant} libres
        </span>
      </div>

      {ZONE_ORDER.map(zoneKey => {
        const zoneTables = zones[zoneKey];
        if (!zoneTables || zoneTables.length === 0) return null;
        return (
          <div key={zoneKey}>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-serif font-bold text-xs uppercase tracking-widest text-pandora-dark">
                {ZONE_LABELS[zoneKey]}
              </span>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] text-slate-400 font-mono">{zoneTables.length} mesa(s)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {zoneTables.map(t => (
                <div key={t.id}>
                  <TableCard
                    table={t}
                    isSelected={selectedTableId === t.id}
                    onClick={onSelectTable}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-2 pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500">
        <span>{stats.occupied} ocupadas · {stats.vacant} libres</span>
        <span className="font-bold text-slate-700">Total acumulado: {formatCOP(stats.totalRevenue)}</span>
      </div>
    </div>
  );
}
