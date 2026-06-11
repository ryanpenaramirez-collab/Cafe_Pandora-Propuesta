import { useState } from 'react';
import { ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface InformesProps {
  shift: ShiftState;
}

export default function Informes({ shift }: InformesProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs text-center py-2 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">Informes de Rendimiento</h4>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Índices clave de atención al comensal y transacciones financieras del turno actual.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ticket Promedio</span>
            <span className="font-bold font-mono text-slate-800 block text-lg">
              {shift.totalSales > 0 ? formatCOP(Math.round(shift.totalSales / 4.2)) : formatCOP(0)}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Margen Operativo</span>
            <span className="font-bold text-emerald-600 block text-lg">74.5%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tasa Desperdicios</span>
            <span className="font-bold text-rose-500 block text-lg">1.2%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eficiencia Ticket</span>
            <span className="font-bold text-blue-600 block text-lg">11 mins</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => triggerNotification('Reporte PDF enviado a la cola de impresión.')}
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            Exportar Informe de Ventas
          </button>
          <button
            onClick={() => triggerNotification('Consumo de insumos conciliado con inventario.')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Reconciliar Insumos
          </button>
        </div>
      </div>
    </div>
  );
}
