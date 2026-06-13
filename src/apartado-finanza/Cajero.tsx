import { useState, useMemo } from 'react';
import { ShiftState, Expense } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface CajeroProps {
  shift: ShiftState;
  onSetShift: (shift: ShiftState) => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export default function Cajero({ shift, onSetShift, expenses, onAddExpense }: CajeroProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('Suministros');

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const activeBalance = useMemo(() => {
    return shift.initialFloat + shift.totalSales - shift.totalExpenses;
  }, [shift]);

  const handleOpenShift = () => {
    if (!shift.isOpen) {
      onSetShift({
        ...shift,
        isOpen: true,
        openedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        openedBy: 'Cajero',
      });
      triggerNotification('Caja abierta. Fondos iniciales registrados.');
    } else {
      triggerNotification('La caja ya se encuentra abierta.');
    }
  };

  const handleCloseShift = () => {
    onSetShift({ ...shift, isOpen: false });
    triggerNotification('Turno de caja cerrado. Reporte generado.');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amount) || amount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      description: expenseDesc.trim(),
      category: expenseCat,
      amount,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    onAddExpense(newExpense);
    triggerNotification(`Egreso registrado: ${formatCOP(amount)}`);
    setExpenseDesc('');
    setExpenseAmount('');
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs text-center py-1.5 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Estado de Caja */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Estado de Caja</h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  shift.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {shift.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Estado</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-bold text-slate-700 block">{shift.openedBy || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Responsable</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-bold text-slate-700 block">{shift.openedAt || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Apertura</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-bold text-slate-700 block font-mono">{formatCOP(shift.initialFloat)}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Saldo Inicial</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <span className="text-sm font-bold text-emerald-700 block font-mono">{formatCOP(activeBalance)}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-1">Saldo Actual</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-lg border border-emerald-100 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider block">Ingresos Turno</span>
                <span className="font-mono font-black text-base text-emerald-700 block mt-0.5">{formatCOP(shift.totalSales)}</span>
              </div>
              <div className="bg-rose-50 rounded-lg border border-rose-100 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-rose-600 tracking-wider block">Egresos</span>
                <span className="font-mono font-black text-base text-rose-600 block mt-0.5">-{formatCOP(shift.totalExpenses)}</span>
              </div>
              <div className="bg-amber-50 rounded-lg border border-amber-100 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider block">Efectivo Esperado</span>
                <span className="font-mono font-black text-base text-slate-800 block mt-0.5">{formatCOP(activeBalance)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenShift}
                className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  shift.isOpen
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {shift.isOpen ? '✓ Caja Abierta' : 'Abrir Caja'}
              </button>
              {shift.isOpen && (
                <button
                  onClick={handleCloseShift}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                >
                  Cerrar Caja
                </button>
              )}
            </div>
          </div>

          {/* Registrar Egreso */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Registrar Egreso</h4>

            <form onSubmit={handleCreateExpense} className="space-y-2.5">
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5 font-semibold">Descripción</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej. Compra de insumos"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5 font-semibold">Monto</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 mb-0.5 font-semibold">Categoría</label>
                  <select
                    value={expenseCat}
                    onChange={(e) => setExpenseCat(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  >
                    <option>Suministros</option>
                    <option>Servicios</option>
                    <option>Mantenimiento</option>
                    <option>Otros</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Registrar Egreso
              </button>
            </form>
          </div>
        </div>

        {/* Últimos Egresos */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h4 className="text-xs font-bold text-slate-800 mb-3">Últimos Egresos</h4>
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-2xl block mb-1">📋</span>
              <p className="text-[11px] text-slate-400">No hay egresos registrados en este turno.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {expenses.slice(0, 10).map((exp) => (
                <div key={exp.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="block text-[10px] text-slate-700 truncate font-medium">{exp.description}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">{exp.category} · {exp.timestamp}</span>
                  </div>
                  <span className="font-mono text-[11px] text-rose-600 font-bold shrink-0">-{formatCOP(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
