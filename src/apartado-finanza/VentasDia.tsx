import { useMemo } from 'react';
import { ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface VentasDiaProps {
  shift: ShiftState;
}

export default function VentasDia({ shift }: VentasDiaProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Turno Apertura</span>
          <span className="block font-mono font-bold text-lg text-slate-800">{formatCOP(shift.initialFloat)}</span>
          <span className="block text-[10px] text-slate-500 mt-1">Base de cambios en caja</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
          <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Total Ventas Bruto (Hoy)</span>
          <span className="block font-mono font-bold text-lg text-emerald-600">{formatCOP(shift.totalSales)}</span>
          <span className="block text-[10px] text-slate-500 mt-1">Reconciliación de boletas POS cerradas</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="block text-[10px] uppercase font-bold text-rose-600 tracking-wider">Total Egresos Hoy</span>
          <span className="block font-mono font-bold text-lg text-rose-600">-{formatCOP(shift.totalExpenses)}</span>
          <span className="block text-[10px] text-slate-500 mt-1">Gastos varios acreditados</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-serif font-bold text-slate-800 text-sm mb-4">Ventas por Categorías</h4>
        <div className="h-44 flex items-end justify-around gap-6 pt-4 px-8 border-b border-slate-100">
          <div className="flex flex-col items-center flex-1 max-w-[80px]">
            <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">{formatCOP(Math.round(shift.totalSales * 0.4))}</span>
            <div className="w-full bg-amber-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 100 : 5}px` }}></div>
            <span className="text-[10px] font-bold text-slate-700 mt-2">Café Expreso</span>
          </div>
          <div className="flex flex-col items-center flex-1 max-w-[80px]">
            <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">{formatCOP(Math.round(shift.totalSales * 0.3))}</span>
            <div className="w-full bg-emerald-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 70 : 5}px` }}></div>
            <span className="text-[10px] font-bold text-slate-700 mt-2">Desayunos</span>
          </div>
          <div className="flex flex-col items-center flex-1 max-w-[80px]">
            <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">{formatCOP(Math.round(shift.totalSales * 0.2))}</span>
            <div className="w-full bg-orange-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 45 : 5}px` }}></div>
            <span className="text-[10px] font-bold text-slate-700 mt-2">Repostería</span>
          </div>
          <div className="flex flex-col items-center flex-1 max-w-[80px]">
            <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">{formatCOP(Math.round(shift.totalSales * 0.1))}</span>
            <div className="w-full bg-cyan-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 25 : 5}px` }}></div>
            <span className="text-[10px] font-bold text-slate-700 mt-2">Tés / Infus.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
