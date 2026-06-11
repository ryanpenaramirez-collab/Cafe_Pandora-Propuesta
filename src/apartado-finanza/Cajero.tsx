import { useState, useMemo } from 'react';
import { ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface CajeroProps {
  shift: ShiftState;
  onSetShift: (shift: ShiftState) => void;
}

export default function Cajero({ shift, onSetShift }: CajeroProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const activeBalance = useMemo(() => {
    return shift.initialFloat + shift.totalSales - shift.totalExpenses;
  }, [shift]);

  const handleCloseShift = () => {
    onSetShift({ ...shift, isOpen: false });
    triggerNotification('Turno de caja cerrado. Reporte generado.');
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs text-center py-2 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h4 className="font-serif font-bold text-slate-800 text-sm mb-1.5">Saldo en Efectivo — Arqueo Disponible</h4>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Base inicial + Ventas - Egresos</p>

            <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100 text-center mb-4">
              <span className="text-xs uppercase font-bold text-fuchsia-800 tracking-wider block">Neto en Cajón Monedero</span>
              <span className="font-mono text-3xl font-extrabold text-fuchsia-900 block mt-1">{formatCOP(activeBalance)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => triggerNotification('Apertura física de gaveta monedero efectuada.')}
              className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Abrir Cajón Físico
            </button>
            {shift.isOpen && (
              <button
                onClick={handleCloseShift}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Efectuar Cierre Caja
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="font-serif font-bold text-slate-800 text-sm mb-1.5">Retiro Parcial para Caja Fuerte</h4>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Retire excedente para mantener niveles seguros en caja monedero.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">Monto de retiro</label>
              <input
                type="number"
                placeholder="Ej. 100000"
                className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-fuchsia-500 font-mono"
              />
            </div>
            <button
              onClick={() => triggerNotification('Retiro registrado. Inserte el dinero en la bóveda.')}
              className="w-full bg-slate-800 hover:bg-slate-950 text-white py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Autorizar Retiro Seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
