import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, User, CreditCard, Tag } from 'lucide-react';
import { Order, Table, MenuItem, ShiftState, Expense } from '../../types';
import Facturacion from './Facturacion';
import Cajero from './Cajero';
import Ventas from './Ventas';

export type FinanzasTab = 'facturacion' | 'movimientos' | 'cajero';

type SelectedMovement =
  | { type: 'ingreso'; order: Order }
  | { type: 'egreso'; expense: Expense }
  | null;

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
  const [selectedMovement, setSelectedMovement] = useState<SelectedMovement>(null);

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
          <h2 className="font-serif text-sm font-bold text-text-primary">Caja y Finanzas</h2>
          <p className="text-[11px] text-text-secondary mt-0.5">Gestión de caja, ventas y facturación</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-pandora-success leading-none">{formatCOP(metrics.ventasHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Ventas Hoy</span>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-pandora-gold leading-none">{formatCOP(metrics.cajaActual)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Caja Actual</span>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-pandora-gold leading-none">{metrics.pedidosPendientes}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Pendientes</span>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-pandora-danger leading-none">{formatCOP(metrics.egresosHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Egresos Hoy</span>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className={`text-[18px] font-mono font-black leading-none ${shift.isOpen ? 'text-pandora-success' : 'text-pandora-danger'}`}>
            {shift.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Caja Estado</span>
        </div>
        <div className="bg-surface-card rounded-lg border border-border-default p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-text-primary leading-none truncate max-w-full">
            {shift.openedBy || '—'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-text-muted mt-0.5">Responsable</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border-default">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === tab.id
                ? 'text-text-primary border-pandora-gold'
                : 'text-text-muted border-transparent hover:text-text-secondary'
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
        <MovimientosList orders={orders} expenses={expenses} tables={tables} onSelectMovement={setSelectedMovement} />
      )}
      {activeTab === 'cajero' && (
        <Cajero shift={shift} onSetShift={onSetShift} expenses={expenses} onAddExpense={onAddExpense} />
      )}

      {/* Movement Detail Modals */}
      <AnimatePresence>
        {selectedMovement?.type === 'ingreso' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMovement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pandora-dark to-pandora-hover p-5 shrink-0 flex justify-between items-center border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pandora-success-bg flex items-center justify-center text-sm font-serif font-extrabold text-pandora-success border border-pandora-success/20">
                    {selectedMovement.order.tableId}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-pandora-gold uppercase tracking-wider font-display">
                      {selectedMovement.order.tableName || `Mesa ${selectedMovement.order.tableId}`} · Detalles
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono">
                      Comanda #{selectedMovement.order.id.slice(-4).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="p-1.5 hover:bg-pandora-gold/20 rounded-full transition-colors text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-surface-content p-3.5 rounded-xl border border-border-default text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted block font-mono">Hora Comanda</span>
                    <span className="font-semibold block text-text-primary mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-text-muted" />
                      {selectedMovement.order.timestamp}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted block font-mono">Mesero Atiende</span>
                    <span className="font-semibold block text-text-primary mt-0.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-text-muted" />
                      {selectedMovement.order.waiterName}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block font-mono border-b border-border-default pb-1">
                    Productos
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedMovement.order.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-border-default/50 last:border-0">
                        <div>
                          <span className="font-serif font-bold text-text-primary uppercase tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-text-muted block mt-0.5 font-mono">
                            {formatCOP(item.price)} c/u × {item.quantity}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-text-primary">
                          {formatCOP(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border-default pt-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text-primary uppercase tracking-wide">TOTAL</span>
                    <span className="font-mono text-lg font-black text-pandora-success">
                      {formatCOP(selectedMovement.order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-surface-content border-t border-border-default flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="px-5 py-2.5 bg-surface-card hover:bg-surface-card-hover text-text-primary border border-border-default rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                >
                  Cerrar Detalles
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedMovement?.type === 'egreso' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMovement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-surface-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pandora-dark to-pandora-hover p-5 shrink-0 flex justify-between items-center border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pandora-error-bg flex items-center justify-center text-sm font-serif font-extrabold text-pandora-danger border border-pandora-danger/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-pandora-danger uppercase tracking-wider font-display">
                      Detalle de Egreso
                    </h3>
                    <p className="text-[10px] text-text-muted font-mono">
                      #{selectedMovement.expense.id.slice(-4).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="p-1.5 hover:bg-pandora-gold/20 rounded-full transition-colors text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Description */}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted block font-mono">Descripción</span>
                  <p className="font-semibold text-sm text-text-primary mt-1 leading-relaxed">
                    {selectedMovement.expense.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 bg-surface-content p-3.5 rounded-xl border border-border-default text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted block font-mono flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Categoría
                    </span>
                    <span className="font-semibold block text-text-primary mt-0.5">{selectedMovement.expense.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted block font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hora
                    </span>
                    <span className="font-semibold block text-text-primary mt-0.5">{selectedMovement.expense.timestamp}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-pandora-error-bg border border-pandora-danger/30 rounded-xl p-4 text-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-danger block font-mono">Monto del Egreso</span>
                  <span className="font-mono text-2xl font-black text-pandora-danger block mt-1">
                    -{formatCOP(selectedMovement.expense.amount)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-surface-content border-t border-border-default flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="px-5 py-2.5 bg-surface-card hover:bg-surface-card-hover text-text-primary border border-border-default rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                >
                  Cerrar Detalles
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MovimientosList({ orders, expenses, tables, onSelectMovement }: { orders: Order[]; expenses: Expense[]; tables: Table[]; onSelectMovement: (m: SelectedMovement) => void }) {
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

    const parseTimeToMs = (ts: string) => {
      const [h, m] = ts.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return 0;
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.getTime();
    };

    const egresos = expenses.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      createdAt: parseTimeToMs(e.timestamp),
      descripcion: e.description,
      monto: e.amount,
      tipo: 'egreso' as const,
    }));

    return [...ventas, ...egresos]
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, expenses]);

  if (movimientos.length === 0) {
    return (
      <p className="text-xs text-text-muted py-4 text-center">
        No hay movimientos registrados hoy.
      </p>
    );
  }

  return (
    <div className="bg-surface-card rounded-lg border border-border-default overflow-hidden">
      <div className="px-4 py-3 border-b border-border-default">
        <h4 className="text-xs font-bold text-text-primary">Movimientos</h4>
        <p className="text-[10px] text-text-muted">Todos los movimientos del día</p>
      </div>
      <div className="max-h-[500px] overflow-y-auto divide-y divide-border-default/30">
        {movimientos.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-card-hover transition-colors cursor-pointer"
            onClick={() => {
              if (m.tipo === 'ingreso') {
                const order = orders.find(o => o.id === m.id);
                if (order) onSelectMovement({ type: 'ingreso', order });
              } else {
                const expense = expenses.find(e => e.id === m.id);
                if (expense) onSelectMovement({ type: 'egreso', expense });
              }
            }}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-[10px] font-mono text-text-muted shrink-0 w-10">{m.timestamp}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                m.tipo === 'ingreso'
                  ? 'bg-pandora-success-bg text-pandora-success'
                  : 'bg-pandora-error-bg text-pandora-danger'
              }`}>
                {m.tipo === 'ingreso' ? 'Venta' : 'Egreso'}
              </span>
              <span className="text-[11px] text-text-primary truncate">{m.descripcion}</span>
            </div>
            <span className={`font-mono text-[11px] font-bold shrink-0 ml-3 ${
              m.tipo === 'ingreso' ? 'text-pandora-success' : 'text-pandora-danger'
            }`}>
              {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
