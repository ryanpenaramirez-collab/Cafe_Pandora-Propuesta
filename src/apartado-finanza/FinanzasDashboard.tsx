import { useMemo, useState } from 'react';
import { Order, Table, MenuItem, ShiftState, Expense } from '../types';
import Facturacion from './Facturacion';
import Cajero from './Cajero';
import Ventas from './Ventas';

export type FinanzasTab = 'facturacion' | 'movimientos' | 'cajero';

interface FinanzasDashboardProps {
  orders: Order[];
  tables: Table[];
  menu: MenuItem[];
  shift: ShiftState;
  activeTab: FinanzasTab;
  onTabChange: (tab: FinanzasTab) => void;
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
  onSetShift: (shift: ShiftState) => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
}

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

function isToday(d: number | undefined): boolean {
  if (!d) return false;
  const date = new Date(d);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

const TABS: { id: FinanzasTab; label: string }[] = [
  { id: 'facturacion', label: 'Facturación' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'cajero', label: 'Caja' },
];

export default function FinanzasDashboard({
  orders,
  tables,
  menu,
  shift,
  activeTab,
  onTabChange,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder,
  onSetShift,
  expenses,
  onAddExpense,
}: FinanzasDashboardProps) {
  const [selectedBillingOrderId, setSelectedBillingOrderId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const todayOrders = orders.filter((o) => o.status !== 'espera' && isToday(o.createdAt));
    const ventasHoy = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const pedidosPendientes = orders.filter((o) => o.status === 'caja').length;
    const egresosHoy = shift.totalExpenses;
    const cajaActual = shift.initialFloat + shift.totalSales - shift.totalExpenses;
    return { ventasHoy, pedidosPendientes, egresosHoy, cajaActual };
  }, [orders, shift]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-sm font-bold text-slate-800">Caja y Finanzas</h2>
          <p className="text-[11px] text-slate-600 mt-0.5">Gestión de caja, ventas y facturación</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-emerald-600 leading-none">{formatCOP(metrics.ventasHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Ventas Hoy</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-sky-600 leading-none">{formatCOP(metrics.cajaActual)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Caja Actual</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-amber-600 leading-none">{metrics.pedidosPendientes}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Pendientes</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-rose-600 leading-none">{formatCOP(metrics.egresosHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Egresos Hoy</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className={`text-[18px] font-mono font-black leading-none ${shift.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
            {shift.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Caja Estado</span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-slate-700 leading-none truncate max-w-full">
            {shift.openedBy || '—'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Responsable</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === tab.id
                ? 'text-slate-800 border-pandora-accent'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'facturacion' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className={selectedBillingOrderId ? 'lg:col-span-3' : 'lg:col-span-5'}>
            <Facturacion
              orders={orders}
              tables={tables}
              onClearTable={onClearTable}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onCancelOrder={onCancelOrder}
              selectedOrderId={selectedBillingOrderId}
              onSelectOrder={setSelectedBillingOrderId}
            />
          </div>
          {selectedBillingOrderId && (
            <div className="lg:col-span-2">
              <Facturacion
                orders={orders}
                tables={tables}
                onClearTable={onClearTable}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onCancelOrder={onCancelOrder}
                selectedOrderId={selectedBillingOrderId}
                onSelectOrder={setSelectedBillingOrderId}
                panelOnly
              />
            </div>
          )}
        </div>
      )}
      {activeTab === 'movimientos' && (
        <MovimientosList orders={orders} expenses={expenses} tables={tables} />
      )}
      {activeTab === 'cajero' && (
        <Cajero shift={shift} onSetShift={onSetShift} expenses={expenses} onAddExpense={onAddExpense} />
      )}
    </div>
  );
}

function MovimientosList({ orders, expenses, tables }: { orders: Order[]; expenses: Expense[]; tables: Table[] }) {
  const movimientos = useMemo(() => {
    const ventas = orders
      .filter((o) => o.status === 'facturado' || o.status === 'caja')
      .map((o) => ({
        id: o.id,
        timestamp: o.timestamp,
        createdAt: o.createdAt || 0,
        descripcion: `Venta ${o.tableName || 'Mesa ' + o.tableId}`,
        monto: o.total,
        tipo: 'ingreso' as const,
      }));

    const egresos = expenses.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      createdAt: new Date().getTime(),
      descripcion: e.description,
      monto: e.amount,
      tipo: 'egreso' as const,
    }));

    return [...ventas, ...egresos]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [orders, expenses]);

  if (movimientos.length === 0) {
    return (
      <p className="text-xs text-slate-500 py-4 text-center">
        No hay movimientos registrados hoy.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-800">Movimientos Recientes</h4>
        <p className="text-[10px] text-slate-400">Últimos 10 movimientos del día</p>
      </div>
      <div className="divide-y divide-slate-50">
        {movimientos.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-slate-400 shrink-0 w-10">{m.timestamp}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                m.tipo === 'ingreso'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {m.tipo === 'ingreso' ? 'Venta' : 'Egreso'}
              </span>
              <span className="text-[11px] text-slate-700 truncate">{m.descripcion}</span>
            </div>
            <span className={`font-mono text-[11px] font-bold shrink-0 ml-3 ${
              m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
