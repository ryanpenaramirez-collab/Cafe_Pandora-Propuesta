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
          <h2 className="font-serif text-sm font-bold text-titulo">Caja y Finanzas</h2>
          <p className="text-[11px] text-cuerpo mt-0.5">Gestión de caja, ventas y facturación</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-exito leading-none">{formatCOP(metrics.ventasHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Ventas Hoy</span>
        </div>
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-oro leading-none">{formatCOP(metrics.cajaActual)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Caja Actual</span>
        </div>
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-oro leading-none">{metrics.pedidosPendientes}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Pendientes</span>
        </div>
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-peligro leading-none">{formatCOP(metrics.egresosHoy)}</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Egresos Hoy</span>
        </div>
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className={`text-[18px] font-mono font-black leading-none ${shift.isOpen ? 'text-exito' : 'text-peligro'}`}>
            {shift.isOpen ? 'Abierta' : 'Cerrada'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Caja Estado</span>
        </div>
        <div className="bg-tarjeta-fondo rounded-lg border border-borde p-2.5 flex flex-col items-center text-center">
          <span className="text-[18px] font-mono font-black text-titulo leading-none truncate max-w-full">
            {shift.openedBy || '—'}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-atenuado mt-0.5">Responsable</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-borde">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-xs font-semibold pb-2 border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === tab.id
                ? 'text-titulo border-oro'
                : 'text-atenuado border-transparent hover:text-cuerpo'
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
              className="bg-tarjeta-fondo w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-borde"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-sidebar-fondo to-hover-fondo p-5 shrink-0 flex justify-between items-center border-b border-borde">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-exito-superficie flex items-center justify-center text-sm font-serif font-extrabold text-exito border border-exito/20">
                    {selectedMovement.order.tableId}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-oro uppercase tracking-wider font-display">
                      {selectedMovement.order.tableName || `Mesa ${selectedMovement.order.tableId}`} · Detalles
                    </h3>
                    <p className="text-[10px] text-atenuado font-mono">
                      Comanda #{selectedMovement.order.id.slice(-4).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="p-1.5 hover:bg-oro/20 rounded-full transition-colors text-atenuado hover:text-titulo cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-contenido-fondo p-3.5 rounded-xl border border-borde text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-atenuado block font-mono">Hora Comanda</span>
                    <span className="font-semibold block text-titulo mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-atenuado" />
                      {selectedMovement.order.timestamp}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-atenuado block font-mono">Mesero Atiende</span>
                    <span className="font-semibold block text-titulo mt-0.5 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-atenuado" />
                      {selectedMovement.order.waiterName}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-atenuado block font-mono border-b border-borde pb-1">
                    Productos
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedMovement.order.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-xs py-1.5 border-b border-dashed border-borde/50 last:border-0">
                        <div>
                          <span className="font-serif font-bold text-titulo uppercase tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-atenuado block mt-0.5 font-mono">
                            {formatCOP(item.price)} c/u × {item.quantity}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-titulo">
                          {formatCOP(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-borde pt-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-titulo uppercase tracking-wide">TOTAL</span>
                    <span className="font-mono text-lg font-black text-exito">
                      {formatCOP(selectedMovement.order.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-contenido-fondo border-t border-borde flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="px-5 py-2.5 bg-tarjeta-fondo hover:bg-tarjeta-hover text-titulo border border-borde rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
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
              className="bg-tarjeta-fondo w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-borde"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-sidebar-fondo to-hover-fondo p-5 shrink-0 flex justify-between items-center border-b border-borde">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-peligro-superficie flex items-center justify-center text-sm font-serif font-extrabold text-peligro border border-peligro/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-peligro uppercase tracking-wider font-display">
                      Detalle de Egreso
                    </h3>
                    <p className="text-[10px] text-atenuado font-mono">
                      #{selectedMovement.expense.id.slice(-4).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="p-1.5 hover:bg-oro/20 rounded-full transition-colors text-atenuado hover:text-titulo cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Description */}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-atenuado block font-mono">Descripción</span>
                  <p className="font-semibold text-sm text-titulo mt-1 leading-relaxed">
                    {selectedMovement.expense.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 bg-contenido-fondo p-3.5 rounded-xl border border-borde text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-atenuado block font-mono flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Categoría
                    </span>
                    <span className="font-semibold block text-titulo mt-0.5">{selectedMovement.expense.category}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-atenuado block font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hora
                    </span>
                    <span className="font-semibold block text-titulo mt-0.5">{selectedMovement.expense.timestamp}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-peligro-superficie border border-peligro/30 rounded-xl p-4 text-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-peligro block font-mono">Monto del Egreso</span>
                  <span className="font-mono text-2xl font-black text-peligro block mt-1">
                    -{formatCOP(selectedMovement.expense.amount)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-contenido-fondo border-t border-borde flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="px-5 py-2.5 bg-tarjeta-fondo hover:bg-tarjeta-hover text-titulo border border-borde rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
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
      <p className="text-xs text-atenuado py-4 text-center">
        No hay movimientos registrados hoy.
      </p>
    );
  }

  return (
    <div className="bg-tarjeta-fondo rounded-lg border border-borde overflow-hidden">
      <div className="px-4 py-3 border-b border-borde">
        <h4 className="text-xs font-bold text-titulo">Movimientos</h4>
        <p className="text-[10px] text-atenuado">Todos los movimientos del día</p>
      </div>
      <div className="max-h-[500px] overflow-y-auto divide-y divide-borde/30">
        {movimientos.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-tarjeta-hover transition-colors cursor-pointer"
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
              <span className="text-[10px] font-mono text-atenuado shrink-0 w-10">{m.timestamp}</span>
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                m.tipo === 'ingreso'
                  ? 'bg-exito-superficie text-exito'
                  : 'bg-peligro-superficie text-peligro'
              }`}>
                {m.tipo === 'ingreso' ? 'Venta' : 'Egreso'}
              </span>
              <span className="text-[11px] text-titulo truncate">{m.descripcion}</span>
            </div>
            <span className={`font-mono text-[11px] font-bold shrink-0 ml-3 ${
              m.tipo === 'ingreso' ? 'text-exito' : 'text-peligro'
            }`}>
              {m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
