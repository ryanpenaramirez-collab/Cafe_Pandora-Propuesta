import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Printer, CheckCircle, DollarSign } from 'lucide-react';
import { BillingPanelProps, PaymentMethod } from './types';
import { formatCOP, combineOrderItems, calculateBilling, generateInvoiceNumber } from './utils';

const PAYMENT_METHODS: { method: PaymentMethod; icon: string; label: string }[] = [
  { method: 'Efectivo', icon: '💵', label: 'Efectivo' },
  { method: 'Nequi', icon: '📱', label: 'Nequi' },
  { method: 'Bancolombia', icon: '🏦', label: 'Bancolombia' },
  { method: 'Tarjeta', icon: '💳', label: 'Tarjeta' },
];

export default function BillingPanel({ table, orders, onConfirmPayment, onBack }: BillingPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [applyTax, setApplyTax] = useState(true);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const invoiceNumber = useMemo(() => generateInvoiceNumber(), []);

  const displayTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('es-CO', { dateStyle: 'medium' }) + ' ' +
           now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const combinedItems = useMemo(() => {
    const items = combineOrderItems(orders.filter(o => o.tableId === table.id));
    if (items.length === 0 && table.totalAmount > 0) {
      return [{ name: 'Consumo general', price: table.totalAmount, quantity: 1 }];
    }
    return items;
  }, [orders, table]);

  const { subtotal, tax, total } = useMemo(
    () => calculateBilling(combinedItems, applyTax),
    [combinedItems, applyTax],
  );

  const change = useMemo(() => {
    if (paymentMethod !== 'Efectivo') return 0;
    return Math.max(0, cashReceived - total);
  }, [paymentMethod, cashReceived, total]);

  const handleConfirm = () => {
    onConfirmPayment(paymentMethod, applyTax, total);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center gap-2 p-3 border-b border-borde bg-advertencia-superficie shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-tarjeta-hover rounded-lg text-atenuado cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h4 className="font-serif font-bold text-xs text-titulo uppercase tracking-wide">
            Facturación — {table.name}
          </h4>
          <p className="text-[9px] text-inactivo font-mono">#{invoiceNumber}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="text-[10px] text-inactivo font-mono space-y-1 bg-tarjeta-fondo rounded-lg p-3 border border-borde">
          <div className="flex justify-between">
            <span>Factura:</span>
            <span className="font-bold text-atenuado">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Mesa:</span>
            <span className="font-bold text-atenuado">{table.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Mesero:</span>
            <span className="font-bold text-atenuado">{table.currentWaiter || 'Cajero'}</span>
          </div>
          <div className="flex justify-between">
            <span>Emisión:</span>
            <span className="font-bold text-atenuado">{displayTime}</span>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-12 text-[9px] font-bold text-inactivo uppercase tracking-wider py-1 border-b border-borde">
            <span className="col-span-5">Producto</span>
            <span className="col-span-2 text-center">Cant</span>
            <span className="col-span-2 text-right">Unit.</span>
            <span className="col-span-3 text-right">Subtotal</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
            {combinedItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-xs py-2 text-atenuado items-center">
                <span className="col-span-5 font-serif font-bold text-titulo truncate">{item.name}</span>
                <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                <span className="col-span-2 text-right font-mono">{formatCOP(item.price)}</span>
                <span className="col-span-3 text-right font-mono font-bold">{formatCOP(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-bold text-atenuado pt-2 border-t border-borde mt-1">
            <span>Subtotal Neto</span>
            <span className="font-mono">{formatCOP(subtotal)}</span>
          </div>
        </div>

        <div>
          <h5 className="text-[10px] font-bold text-atenuado uppercase tracking-wider mb-2">Método de Pago</h5>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(({ method, icon, label }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  paymentMethod === method
                    ? 'border-oro bg-advertencia-superficie text-titulo shadow-sm'
                    : 'border-borde bg-tarjeta-fondo hover:bg-hover-fondo text-atenuado'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === 'Efectivo' && (
          <div className="bg-tarjeta-fondo border border-borde rounded-lg p-3 space-y-2">
            <label className="text-[10px] font-bold text-atenuado uppercase tracking-wider">
              Monto Recibido
            </label>
            <input
              type="number"
              value={cashReceived || ''}
              onChange={e => setCashReceived(Number(e.target.value))}
              placeholder="0"
              className="w-full border border-borde rounded-lg p-2 text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-oro"
            />
            {cashReceived > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-inactivo">Cambio:</span>
                <span className="font-bold font-mono text-exito">{formatCOP(change)}</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-tarjeta-fondo border border-oro/40 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-atenuado">Impuesto al Consumo (8%)</span>
              <p className="text-[9px] text-inactivo">Aplicar gravamen</p>
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setApplyTax(true)}
                className={`px-3 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                  applyTax ? 'bg-exito text-white' : 'bg-tarjeta-fondo text-inactivo hover:text-atenuado'
                }`}
              >
                SÍ
              </button>
              <button
                onClick={() => setApplyTax(false)}
                className={`px-3 py-1 text-[10px] font-bold cursor-pointer transition-colors ${
                  !applyTax ? 'bg-acento text-white' : 'bg-tarjeta-fondo text-inactivo hover:text-atenuado'
                }`}
              >
                NO
              </button>
            </div>
          </div>
          {applyTax && (
            <div className="flex justify-between text-xs text-atenuado pt-2 border-t border-dashed border-oro/40">
              <span>Impuesto (8%)</span>
              <span className="font-mono font-bold">+ {formatCOP(tax)}</span>
            </div>
          )}
        </div>

        <div className="bg-exito-superficie border border-exito/40 rounded-lg p-4 text-center">
          <span className="text-[10px] text-exito uppercase tracking-wider font-bold">Total Final</span>
          <p className="text-2xl font-bold font-mono text-exito mt-1">{formatCOP(total)}</p>
          <p className="text-[9px] text-emerald-500">
            {applyTax ? 'Impuesto incluido (8%)' : 'Sin impuesto'}
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-borde space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {}}
            className="py-2 bg-slate-800 hover:bg-input-fondo text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Printer className="w-3 h-3" /> Cocina
          </button>
          <button
            onClick={() => {}}
            className="py-2 bg-cyan-700 hover:bg-input-fondo text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Printer className="w-3 h-3" /> Factura
          </button>
        </div>
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-exito hover:bg-exito-hover text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <CheckCircle className="w-4 h-4" />
          Registrar Pago y Liberar Mesa
        </button>
      </div>
    </motion.div>
  );
}
