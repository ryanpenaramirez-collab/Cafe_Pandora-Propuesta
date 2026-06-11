import { useState } from 'react';
import { Expense, ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

interface EgresosProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

export default function Egresos({ expenses, onAddExpense }: EgresosProps) {
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('Suministros');
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newExpense: Expense = {
      id: `egr-${Math.floor(1000 + Math.random() * 9000)}`,
      description: expenseDesc,
      category: expenseCat,
      amount: amountNum,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    onAddExpense(newExpense);
    setExpenseDesc('');
    setExpenseAmount('');
    triggerNotification('Egreso de caja registrado exitosamente');
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs text-center py-2 font-semibold rounded-lg">
          {notification}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
          <h4 className="font-serif font-bold text-sm text-slate-800 mb-1.5">Nueva Salida (Egreso)</h4>
          <p className="text-[11px] text-slate-400 mb-4 font-light">Registre el motivo e importe de la salida.</p>

          <form onSubmit={handleCreateExpense} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción Motivo</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="Ej. Leche almendras x6 cajas"
                className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría</label>
                <select
                  className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                >
                  <option value="Suministros">Suministros</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2.5 text-xs font-bold shadow-md cursor-pointer"
            >
              Registrar Egreso
            </button>
          </form>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">Historial de Egresos (Hoy)</h4>

            <div className="overflow-y-auto max-h-56 pr-1 divide-y divide-slate-100">
              {expenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{exp.description}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {exp.id} • Categoría: {exp.category} • {exp.timestamp}</span>
                  </div>
                  <span className="font-bold font-mono text-rose-600 text-xs">-{formatCOP(exp.amount)}</span>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center text-slate-400 py-12 text-xs">
                  No se han registrado egresos durante este turno.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
