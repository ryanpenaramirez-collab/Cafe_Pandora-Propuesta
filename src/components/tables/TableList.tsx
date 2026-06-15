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
      <h4 className="text-xs font-bold text-[#5A7A9A] uppercase tracking-widest">
        Listado de Mesas y Ocupación
      </h4>
      <div className="bg-[#FFFFFF] rounded-xl border border-[#D0E8F8] overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-[#D0E8F8] p-3 text-[10px] font-bold text-[#8AAAC8] uppercase tracking-wider select-none">
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
              className="grid grid-cols-12 items-center p-3 text-xs text-[#5A7A9A] border-b border-[#E2EDF7] hover:bg-amber-50/40 cursor-pointer transition-colors"
            >
              <span className="col-span-2 font-serif font-bold text-slate-900">{table.name}</span>
              <span className="col-span-1 text-center text-[#8AAAC8]">{table.capacity}</span>
              <span className="col-span-2 text-[#8AAAC8] truncate">{table.currentWaiter || '-'}</span>
              <span className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge}`}>
                  {table.status}
                </span>
              </span>
              <span className="col-span-2 text-center font-mono text-[#8AAAC8] text-[10px]">
                {getElapsedTime(table.occupiedSince)}
              </span>
              <span className="col-span-2 text-right font-mono font-bold">
                {table.status === 'vacía' ? '-' : formatCOP(table.totalAmount)}
              </span>
              <span className="col-span-1 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectTable(table); }}
                  className="px-2 py-1 bg-[#D0E8F8] hover:bg-[#D0E8F8] text-[#5B9BD5] rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Ver
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-[#8AAAC8] px-1">
        <span>Total mesas ocupadas: <strong className="text-[#5A7A9A]">{stats.occupied}</strong></span>
        <span>Ingresos acumulados: <strong className="text-[#5A7A9A]">{formatCOP(stats.totalRevenue)}</strong></span>
      </div>
    </div>
  );
}
