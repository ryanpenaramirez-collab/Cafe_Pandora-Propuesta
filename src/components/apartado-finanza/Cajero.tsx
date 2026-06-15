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
        <div className="bg-pandora-success-bg text-pandora-success border border-pandora-success/30 text-xs text-center py-1.5 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Estado de Caja */}
          <div className="bg-surface-card rounded-lg border border-border-default p-4">
            <h4 className="text-xs font-bold text-text-primary mb-3">Estado de Caja</h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-surface-card-hover">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  shift.isOpen ? 'bg-pandora-success-bg text-pandora-success' : 'bg-pandora-error-bg text-pandora-danger'
                }`}>
                  {shift.isOpen ? 'Abierta' : 'Cerrada'}
                </span>
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block mt-1">Estado</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-card-hover">
                <span className="text-sm font-bold text-text-primary block">{shift.openedBy || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block mt-1">Responsable</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-card-hover">
                <span className="text-sm font-bold text-text-primary block">{shift.openedAt || '—'}</span>
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block mt-1">Apertura</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-card-hover">
                <span className="text-sm font-bold text-text-primary block font-mono">{formatCOP(shift.initialFloat)}</span>
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block mt-1">Saldo Inicial</span>
              </div>
              <div className="text-center p-2 rounded-lg bg-surface-card-hover">
                <span className="text-sm font-bold text-pandora-success block font-mono">{formatCOP(activeBalance)}</span>
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider block mt-1">Saldo Actual</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-pandora-success-bg rounded-lg border border-pandora-success/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-pandora-success tracking-wider block">Ingresos Turno</span>
                <span className="font-mono font-black text-base text-pandora-success block mt-0.5">{formatCOP(shift.totalSales)}</span>
              </div>
              <div className="bg-pandora-error-bg rounded-lg border border-pandora-danger/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-pandora-danger tracking-wider block">Egresos</span>
                <span className="font-mono font-black text-base text-pandora-danger block mt-0.5">-{formatCOP(shift.totalExpenses)}</span>
              </div>
              <div className="bg-pandora-gold-bg rounded-lg border border-pandora-gold/30 p-3 text-center">
                <span className="text-[9px] uppercase font-bold text-text-accent tracking-wider block">Efectivo Esperado</span>
                <span className="font-mono font-black text-base text-text-primary block mt-0.5">{formatCOP(activeBalance)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenShift}
                className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  shift.isOpen
                    ? 'bg-pandora-success-bg text-pandora-success border border-pandora-success/30 cursor-default'
                    : 'bg-pandora-success hover:bg-pandora-success-hover text-white'
                }`}
              >
                {shift.isOpen ? '✓ Caja Abierta' : 'Abrir Caja'}
              </button>
              {shift.isOpen && (
                <button
                  onClick={handleCloseShift}
                  className="flex-1 bg-pandora-danger hover:bg-pandora-danger-hover text-white text-[11px] font-bold py-2 px-3 rounded-lg transition-all cursor-pointer"
                >
                  Cerrar Caja
                </button>
              )}
            </div>
          </div>

          {/* Registrar Egreso */}
          <div className="bg-surface-card rounded-lg border border-border-default p-4">
            <h4 className="text-xs font-bold text-text-primary mb-3">Registrar Egreso</h4>

            <form onSubmit={handleCreateExpense} className="space-y-2.5">
              <div>
                <label className="block text-[10px] text-text-secondary mb-0.5 font-semibold">Descripción</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej. Compra de insumos"
                  className="w-full border border-border-default bg-surface-input rounded-lg p-2 text-xs text-text-primary focus:ring-2 focus:ring-pandora-danger focus:border-pandora-danger outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-text-secondary mb-0.5 font-semibold">Monto</label>
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-full border border-border-default bg-surface-input rounded-lg p-2 text-xs font-mono text-text-primary focus:ring-2 focus:ring-pandora-danger focus:border-pandora-danger outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-0.5 font-semibold">Categoría</label>
                  <select
                    value={expenseCat}
                    onChange={(e) => setExpenseCat(e.target.value)}
                    className="w-full border border-border-default bg-surface-input rounded-lg p-2 text-xs text-text-primary focus:ring-2 focus:ring-pandora-danger focus:border-pandora-danger outline-none"
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
                className="w-full bg-pandora-danger hover:bg-pandora-danger-hover text-white py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Registrar Egreso
              </button>
            </form>
          </div>
        </div>

        {/* Últimos Egresos */}
        <div className="bg-surface-card rounded-lg border border-border-default p-4">
          <h4 className="text-xs font-bold text-text-primary mb-3">Últimos Egresos</h4>
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-2xl block mb-1">📋</span>
              <p className="text-[11px] text-text-muted">No hay egresos registrados en este turno.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {expenses.slice(0, 10).map((exp) => (
                <div key={exp.id} className="flex justify-between items-center py-2 border-b border-border-default/30 last:border-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="block text-[10px] text-text-primary truncate font-medium">{exp.description}</span>
                    <span className="block text-[9px] text-text-muted font-mono">{exp.category} · {exp.timestamp}</span>
                  </div>
                  <span className="font-mono text-[11px] text-pandora-danger font-bold shrink-0">-{formatCOP(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
