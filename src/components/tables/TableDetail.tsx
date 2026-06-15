import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Users, Clock, Receipt } from 'lucide-react';
import { TableStatus } from '../../types';
import { TableDetailProps } from './types';
import { formatCOP, getTableStatusColor, getElapsedTime } from './utils';

const STATUS_ACTIONS: { status: TableStatus; label: string; color: string }[] = [
  { status: 'vacía', label: 'Vacía', color: 'bg-pandora-border hover:bg-surface-card-hover text-pandora-muted border-pandora-border' },
  { status: 'ocupada', label: 'Ocupada', color: 'bg-pandora-error-bg hover:bg-pandora-danger/20 text-pandora-danger border-pandora-danger/30' },
  { status: 'por_pagar', label: 'Por Pagar', color: 'bg-pandora-warning-bg hover:bg-pandora-gold/20 text-pandora-gold border-pandora-gold/30' },
  { status: 'reservada', label: 'Reservada', color: 'bg-pandora-success-bg hover:bg-pandora-success/20 text-pandora-success border-pandora-success/30' },
];

export default function TableDetail({ table, orders, onStatusChange, onOpenBilling, onAddConsumption, onClose }: TableDetailProps) {
  const colors = getTableStatusColor(table.status);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(10000);
  const [guestName, setGuestName] = useState('');
  const [reserveTime, setReserveTime] = useState('19:00');

  const tableOrders = useMemo(
    () => orders.filter(o => o.tableId === table.id),
    [orders, table.id],
  );

  const handleStatusClick = (status: TableStatus) => {
    if (status === 'reservada') {
      setShowReservationForm(true);
      return;
    }
    setShowReservationForm(false);
    onStatusChange(status, undefined);
  };

  const handleConfirmReservation = () => {
    const guest = guestName || `Cliente - ${reserveTime}`;
    onStatusChange('reservada', guest);
    setShowReservationForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <div className="p-4 border-b border-pandora-border flex justify-between items-start">
        <div>
          <h4 className="font-serif font-bold text-base text-pandora-title">{table.name}</h4>
          <p className="text-[10px] text-pandora-disabled font-mono">
            ID: Mesa-{table.id} · Cap: {table.capacity} pax
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-card-hover rounded-full text-pandora-disabled hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge}`}>
            {table.status}
          </span>
          {table.currentWaiter && (
            <span className="text-[10px] text-pandora-disabled">Mesero: {table.currentWaiter}</span>
          )}
        </div>

        {table.occupiedSince && (
          <div className="flex items-center gap-1.5 text-[11px] text-pandora-disabled">
            <Clock className="w-3 h-3" />
            <span>Tiempo: {getElapsedTime(table.occupiedSince)}</span>
          </div>
        )}

        <div className="bg-pandora-bg rounded-lg p-3 border border-pandora-border">
          <span className="text-[10px] text-pandora-muted uppercase tracking-wider font-bold">Consumo Acumulado</span>
          <p className="text-xl font-bold font-mono text-pandora-danger mt-1">{formatCOP(table.totalAmount)}</p>
        </div>

        {tableOrders.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-pandora-muted uppercase tracking-wider mb-2">
              Órdenes Activas ({tableOrders.length})
            </h5>
            <div className="space-y-2">
              {tableOrders.map(order => (
                <div key={order.id} className="bg-surface-card border border-pandora-border rounded-lg p-2.5 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-pandora-muted">{order.type}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      order.status === 'espera' ? 'bg-pandora-warning-bg text-pandora-gold' :
                      order.status === 'preparacion' ? 'bg-blue-100 text-blue-700' :
                      'bg-pandora-success-bg text-pandora-success'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-pandora-disabled space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-mono">{formatCOP(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right font-bold font-mono text-pandora-muted mt-1 pt-1 border-t border-pandora-border">
                    Total: {formatCOP(order.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h5 className="text-[10px] font-bold text-pandora-muted uppercase tracking-wider mb-2">Cambiar Estado</h5>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ACTIONS.map(action => (
              <button
                key={action.status}
                onClick={() => handleStatusClick(action.status)}
                className={`py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${action.color} ${
                  table.status === action.status ? 'ring-2 ring-slate-400' : ''
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {showReservationForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-pandora-success-bg border border-pandora-success/40 rounded-lg p-3 space-y-2"
          >
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full bg-surface-card border border-pandora-success/40 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={reserveTime}
                onChange={e => setReserveTime(e.target.value)}
                className="flex-1 bg-surface-card border border-pandora-success/40 rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleConfirmReservation}
                className="px-3 py-1.5 bg-pandora-success hover:bg-green-700 text-white rounded text-xs font-bold cursor-pointer transition-colors"
              >
                Reservar
              </button>
            </div>
          </motion.div>
        )}

        <div>
          <h5 className="text-[10px] font-bold text-pandora-muted uppercase tracking-wider mb-2">Agregar Consumo Manual</h5>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={e => setCustomAmount(Number(e.target.value))}
              className="w-24 bg-surface-card border border-pandora-border rounded p-1.5 text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-pandora-accent"
            />
            <button
              onClick={() => onAddConsumption(customAmount)}
              className="flex-1 py-1.5 bg-pandora-primary hover:bg-pandora-primary-hover text-white rounded text-xs font-bold cursor-pointer transition-colors"
            >
              + Consumo
            </button>
          </div>
        </div>
      </div>

      {table.totalAmount > 0 && (
        <div className="p-4 border-t border-pandora-border">
          <button
            onClick={onOpenBilling}
            className="w-full py-3 bg-pandora-success hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Receipt className="w-4 h-4" />
            Cobrar Mesa
          </button>
        </div>
      )}
    </motion.div>
  );
}
