import { useState } from 'react';
import { ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface AperturaCajaProps {
  shift: ShiftState;
  onSetShift: (shift: ShiftState) => void;
}

export default function AperturaCaja({ shift, onSetShift }: AperturaCajaProps) {
  const [floatAmount, setFloatAmount] = useState('');
  const [cashierName, setCashierName] = useState('Sofía Valenzuela');
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(floatAmount);
    if (isNaN(amountNum) || amountNum < 0) return;

    onSetShift({
      isOpen: true,
      openedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      openedBy: cashierName,
      initialFloat: amountNum,
      currentCash: amountNum,
      totalSales: 0.00,
      totalExpenses: 0.00
    });
    setFloatAmount('');
    triggerNotification('Turno de caja abierto con éxito');
  };

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

      <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-serif font-bold text-base text-slate-800 mb-1">Apertura / Reestablecer Turno de Trabajo</h4>
        <p className="text-xs text-slate-400 mb-5 font-light">Inicializa la base para dar vueltas al comensal.</p>

        {shift.isOpen ? (
          <div className="space-y-4">
            <div className="bg-cyan-50 p-4 border border-cyan-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">Estatus Turno:</span>
                <span className="text-cyan-700 font-bold uppercase tracking-wider">ABIERTO</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>Apertura por:</span>
                <span className="font-bold">{shift.openedBy}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>Base de cambio inicial:</span>
                <span className="font-bold">{formatCOP(shift.initialFloat)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>Registrado a las:</span>
                <span className="font-bold">{shift.openedAt || 'Activo'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseShift}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-md transition-colors text-center cursor-pointer"
            >
              Efectuar Cierre de Caja del Turno
            </button>
          </div>
        ) : (
          <form onSubmit={handleOpenShift} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cajero de Turno</label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Efectivo Inicial en Caja (Fondo Fijo)</label>
              <input
                type="number"
                placeholder="150000"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Aperturar Turno con Fondo Fijo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
