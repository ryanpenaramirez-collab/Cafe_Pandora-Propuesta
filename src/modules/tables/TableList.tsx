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
      <h4 className="text-xs font-bold text-atenuado uppercase tracking-widest">
        Listado de Mesas y Ocupación
      </h4>
      <div className="bg-tarjeta-fondo rounded-xl border border-borde overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 bg-borde p-3 text-[10px] font-bold text-inactivo uppercase tracking-wider select-none">
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
              className="grid grid-cols-12 items-center p-3 text-xs text-atenuado border-b border-borde hover:bg-tarjeta-hover/40 cursor-pointer transition-colors"
            >
              <span className="col-span-2 font-serif font-bold text-slate-900">{table.name}</span>
              <span className="col-span-1 text-center text-inactivo">{table.capacity}</span>
              <span className="col-span-2 text-inactivo truncate">{table.currentWaiter || '-'}</span>
              <span className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge}`}>
                  {table.status}
                </span>
              </span>
              <span className="col-span-2 text-center font-mono text-inactivo text-[10px]">
                {getElapsedTime(table.occupiedSince)}
              </span>
              <span className="col-span-2 text-right font-mono font-bold">
                {table.status === 'vacía' ? '-' : formatCOP(table.totalAmount)}
              </span>
              <span className="col-span-1 text-center">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectTable(table); }}
                  className="px-2 py-1 bg-borde hover:bg-borde text-acento rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Ver
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] text-inactivo px-1">
        <span>Total mesas ocupadas: <strong className="text-atenuado">{stats.occupied}</strong></span>
        <span>Ingresos acumulados: <strong className="text-atenuado">{formatCOP(stats.totalRevenue)}</strong></span>
      </div>
    </div>
  );
}
