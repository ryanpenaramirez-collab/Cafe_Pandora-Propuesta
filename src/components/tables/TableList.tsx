import { useMemo } from 'react';
import { Table } from '../../types';
import { getTableStatusColor, formatCOP, calculateTableStats, getElapsedTime } from './utils';

interface TableListProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
}

export default function TableList({ tables, onSelectTable }: TableListProps) {
  const stats = useMemo(() => calculateTableStats(tables), [tables]);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
        Listado de Mesas y Ocupación
      </h4>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-slate-100 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
          <span className="col-span-2">Mesa</span>
          <span className="col-span-1 text-center">Cap.</span>
          <span className="col-span-2">Mesero</span>
          <span className="col-span-2">Estado</span>
          <span className="col-span-2 text-center">Tiempo</span>
          <span className="col-span-2 text-right">Consumo</span>
          <span className="col-span-1 text-center">Acción</span>
        </div>
        {tables.map(table => {
          const colors = getTableStatusColor(table.status);
          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className="grid grid-cols-12 items-center p-3 text-xs text-slate-700 border-b border-slate-100 hover:bg-amber-50/40 cursor-pointer transition-colors"
            >
              <span className="col-span-2 font-serif font-bold text-slate-900">{table.name}</span>
              <span className="col-span-1 text-center text-slate-500">{table.capacity}</span>
              <span className="col-span-2 text-slate-500 truncate">{table.currentWaiter || '-'}</span>
              <span className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge}`}>
                  {table.status}
                </span>
              </span>
              <span className="col-span-2 text-center font-mono text-slate-400 text-[10px]">
                {getElapsedTime(table.occupiedSince)}
              </span>
              <span className="col-span-2 text-right font-mono font-bold">
                {table.status === 'vacía' ? '-' : formatCOP(table.totalAmount)}
              </span>
              <span className="col-span-1 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectTable(table); }}
                  className="px-2 py-1 bg-pandora-accent/10 hover:bg-pandora-accent/20 text-pandora-accent rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Ver
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-slate-500 px-1">
        <span>Total mesas ocupadas: <strong className="text-slate-700">{stats.occupied}</strong></span>
        <span>Ingresos acumulados: <strong className="text-slate-700">{formatCOP(stats.totalRevenue)}</strong></span>
      </div>
    </div>
  );
}
