import { useState, useMemo } from 'react';
import { ShiftState, Expense } from '../../types';
import { formatMiles, parseMiles } from '../../utils';

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
    const amount = parseMiles(expenseAmount);
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
        <div className="bg-exito-superficie text-exito border border-exito/30 text-xs text-center py-1.5 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Estado de Caja */}
          <div className="bg-tarjeta-fondo rounded-lg border border-borde p-4">
            <h4 className="text-xs font-bold text-titulo mb-3">Estado de Caja</h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-tarjeta-hover">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  shift.isOpen ? 'bg-exito-superficie text-exito' : 'bg-peligro-superficie text-peligro'
                }`}>
                  {shift.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
                <span className="text-[9px] uppercase font-bold text-atenuado tracking-wider block mt-1">Estado</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-tarjeta-hover">
                <span className="text-sm font-bold text-titulo block">{shift.openedBy || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-atenuado tracking-wider block mt-1">Responsable</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-tarjeta-hover">
                <span className="text-sm font-bold text-titulo block">{shift.openedAt || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-atenuado tracking-wider block mt-1">Apertura</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-tarjeta-hover">
                <span className="text-sm font-bold text-titulo block font-mono">{formatCOP(shift.initialFloat)}</span>
                <span className="text-[9px] uppercase font-bold text-atenuado tracking-wider block mt-1">Saldo Inicial</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-tarjeta-hover">
                <span className="text-sm font-bold text-exito block font-mono">{formatCOP(activeBalance)}</span>
                <span className="text-[9px] uppercase font-bold text-atenuado tracking-wider block mt-1">Saldo Actual</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-exito-superficie rounded-lg border border-exito/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-exito tracking-wider block">Ingresos Turno</span>
                <span className="font-mono font-black text-base text-exito block mt-0.5">{formatCOP(shift.totalSales)}</span>
              </div>
              <div className="bg-peligro-superficie rounded-lg border border-peligro/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-peligro tracking-wider block">Egresos</span>
                <span className="font-mono font-black text-base text-peligro block mt-0.5">-{formatCOP(shift.totalExpenses)}</span>
              </div>
              <div className="bg-oro-superficie rounded-lg border border-oro/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-texto-acento tracking-wider block">Efectivo Esperado</span>
                <span className="font-mono font-black text-base text-titulo block mt-0.5">{formatCOP(activeBalance)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenShift}
                className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  shift.isOpen
                    ? 'bg-exito-superficie text-exito border border-exito/30 cursor-default'
                    : 'bg-exito hover:bg-exito-hover text-white'
                }`}
              >
                {shift.isOpen ? '✓ Caja Abierta' : 'Abrir Caja'}
              </button>
              {shift.isOpen && (
                <button
                  onClick={handleCloseShift}
                  className="flex-1 bg-peligro hover:bg-peligro-hover text-white text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                >
                  Cerrar Caja
                </button>
              )}
            </div>
          </div>

          {/* Registrar Egreso */}
          <div className="bg-tarjeta-fondo rounded-lg border border-borde p-4">
            <h4 className="text-xs font-bold text-titulo mb-3">Registrar Egreso</h4>

            <form onSubmit={handleCreateExpense} className="space-y-2.5">
              <div>
                <label className="block text-[10px] text-cuerpo mb-0.5 font-semibold">Descripción</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej. Compra de insumos"
                  className="w-full border border-borde bg-input-fondo rounded-lg p-2 text-xs text-titulo focus:ring-2 focus:ring-peligro focus:border-peligro outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-cuerpo mb-0.5 font-semibold">Monto</label>
                  <input
                    type="text"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(formatMiles(e.target.value))}
                    placeholder="0"
                    className="w-full border border-borde bg-input-fondo rounded-lg p-2 text-xs font-mono text-titulo focus:ring-2 focus:ring-peligro focus:border-peligro outline-none"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-cuerpo mb-0.5 font-semibold">Categoría</label>
                  <select
                    value={expenseCat}
                    onChange={(e) => setExpenseCat(e.target.value)}
                    className="w-full border border-borde bg-input-fondo rounded-lg p-2 text-xs text-titulo focus:ring-2 focus:ring-peligro focus:border-peligro outline-none"
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
                className="w-full bg-peligro hover:bg-peligro-hover text-white py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Registrar Egreso
              </button>
            </form>
          </div>
        </div>

        {/* Últimos Egresos */}
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-4">
          <h4 className="text-xs font-bold text-titulo mb-3">Últimos Egresos</h4>
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-2xl block mb-1">📋</span>
              <p className="text-[11px] text-atenuado">No hay egresos registrados en este turno.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center py-2 border-b border-borde/30 last:border-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="block text-[10px] text-titulo truncate font-medium">{exp.description}</span>
                    <span className="block text-[9px] text-atenuado font-mono">{exp.category} · {exp.timestamp}</span>
                  </div>
                  <span className="font-mono text-[11px] text-peligro font-bold shrink-0">-{formatCOP(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
