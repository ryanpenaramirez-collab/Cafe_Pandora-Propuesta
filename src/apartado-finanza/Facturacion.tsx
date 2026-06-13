import { useState, useMemo } from 'react';
import { CreditCard, Banknote, ArrowLeft } from 'lucide-react';
import { Order, Table } from '../types';
import { jsPDF } from 'jspdf';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const BANK_ENTITIES = ['Bancolombia', 'Nequi', 'Daviplata', 'Banco de Bogotá', 'Efectivo / Caja General'];

type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta';

interface FacturacionProps {
  orders: Order[];
  tables: Table[];
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
  selectedOrderId?: string | null;
  onSelectOrder?: (id: string | null) => void;
  panelOnly?: boolean;
}

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'Efectivo', label: 'Efectivo', icon: '💵' },
  { id: 'Transferencia', label: 'Transferencia', icon: '🏦' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: '💳' },
];

export default function Facturacion({
  orders,
  tables,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder,
  selectedOrderId,
  onSelectOrder,
  panelOnly,
}: FacturacionProps) {
  const billingOrders = useMemo(() => {
    return orders
      .filter(order => order.status === 'caja')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Efectivo');
  const [bankEntity, setBankEntity] = useState<string>('Nequi');
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const currentOrder = selectedOrderId ? billingOrders.find((o) => o.id === selectedOrderId) : null;

  const getGuestName = (tableId: number) => {
    const table = tables.find((t) => t.id === tableId);
    return table?.guestName || '—';
  };

  const handleOpenBillingForm = (orderId: string) => {
    setSelectedMethod('Efectivo');
    setBankEntity('Nequi');
    setApplyTax(true);
    setReceivedAmount('');
    onSelectOrder?.(orderId);
  };

  const handleBack = () => {
    onSelectOrder?.(null);
    setReceivedAmount('');
  };

  const subtotal = currentOrder?.total || 0;
  const taxRate = 0.08;
  const taxAmount = applyTax ? subtotal * taxRate : 0;
  const finalTotal = subtotal + taxAmount;
  const received = parseFloat(receivedAmount) || 0;
  const cambio = received >= finalTotal ? received - finalTotal : 0;

  const handleGenerateInvoice = async (order: Order) => {
    const cleanId = order.id.replace('ord-', '').toUpperCase();
    const invoiceNumber = `FAC-${cleanId}`;

    const itemLines = order.items.length;
    const extraDetail = selectedMethod === 'Transferencia' ? 1 : 0;
    const pageHeight = Math.max(120, 40 + itemLines * 5 + extraDetail * 4 + 45);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, pageHeight],
    });

    const cx = 40;
    const ml = 6;
    const mr = 74;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CAFÉ PANDORA', cx, 12, { align: 'center' });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(4, 16, 76, 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 51, 51);
    doc.text(invoiceNumber, ml, 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date().toLocaleDateString('es-ES')}  -  ${order.timestamp}`, ml, 27);
    doc.text(`${order.tableName || 'Mesa ' + order.tableId}  ·  ${selectedMethod}${selectedMethod === 'Transferencia' ? ' - ' + bankEntity : ''}`, ml, 32);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(4, 36, 76, 36);

    let y = 42;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 51, 51);
    doc.text('PRODUCTO', ml, y);
    doc.text('TOTAL', mr, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(4, y, 76, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 51, 51);

    order.items.forEach((item) => {
      const sub = item.price * item.quantity;
      const left = `${item.name} x${item.quantity}`;
      const displayLeft = left.length > 30 ? left.substring(0, 27) + '..' : left;
      doc.text(displayLeft, ml, y);
      doc.text(formatCOP(sub), mr, y, { align: 'right' });
      y += 5;
    });

    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(4, y, 76, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('SUBTOTAL', ml, y);
    doc.text(formatCOP(subtotal), mr, y, { align: 'right' });
    y += 4;
    doc.text('IMPOCONSUMO 8%', ml, y);
    doc.text(formatCOP(taxAmount), mr, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(4, y, 76, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL', ml, y + 4);
    doc.text(formatCOP(finalTotal), mr, y + 4, { align: 'right' });
    y += 8;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(4, y, 76, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Cafe Pandora POS', cx, y, { align: 'center' });

    doc.save(`Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`);

    onClearTable(order.tableId, true, finalTotal);
    onUpdateOrderStatus(order.id, 'facturado');
    handleBack();
  };

  const getZoneColor = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return 'static';
    const zone = (table as any).zone || 'static';
    if (zone === 'barra') return 'bg-amber-100 text-amber-800';
    if (zone === 'terraza') return 'bg-sky-100 text-sky-800';
    if (zone === 'salon_principal') return 'bg-emerald-100 text-emerald-800';
    if (zone === 'vip') return 'bg-purple-100 text-purple-800';
    return 'bg-slate-100 text-slate-600';
  };

  const getZoneName = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return '';
    const zone = (table as any).zone || '';
    const names: Record<string, string> = {
      barra: 'Barra',
      terraza: 'Terraza',
      salon_principal: 'Salón',
      vip: 'VIP',
    };
    return names[zone] || '';
  };

  // --- PAYMENT PANEL VIEW ---
  if (panelOnly && currentOrder) {
    const tableZone = getZoneName(currentOrder.tableId);
    const zoneColor = getZoneColor(currentOrder.tableId);

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header: Table info card */}
        <div className="bg-gradient-to-r from-pandora-dark to-[#2a1b10] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-pandora-gold">
                {currentOrder.tableName || `Mesa ${currentOrder.tableId}`}
              </h3>
              {tableZone && (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${zoneColor}`}>
                  {tableZone}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-pandora-cream/60 font-mono">{currentOrder.timestamp}</span>
              <div className="text-xl font-black text-pandora-gold font-mono mt-0.5">{formatCOP(currentOrder.total)}</div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Payment method selection */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2 font-mono">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedMethod === m.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className={`text-[10px] font-bold ${
                    selectedMethod === m.id ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional fields based on payment method */}
          {selectedMethod === 'Efectivo' && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Recibido</label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="$0"
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Cambio</label>
                  <div className="w-full border border-slate-100 bg-slate-50 rounded-lg p-2 text-sm font-mono font-bold text-emerald-600">
                    {received >= finalTotal ? formatCOP(cambio) : '$0'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'Transferencia' && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Entidad Bancaria</label>
              <select
                value={bankEntity}
                onChange={(e) => setBankEntity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {BANK_ENTITIES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {selectedMethod === 'Tarjeta' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
              <CreditCard className="w-6 h-6 text-sky-600 mx-auto mb-1" />
              <p className="text-[11px] font-bold text-sky-800">Pago con Tarjeta</p>
              <p className="text-[10px] text-sky-600">Procesar con datáfono físico</p>
            </div>
          )}

          {/* Tax toggle */}
          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Impuesto Consumo (8%)</span>
              <span className="text-[9px] text-slate-400">Gravamen fiscal aplicable</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => setApplyTax(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono text-slate-700">{formatCOP(subtotal)}</span>
            </div>
            {applyTax && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Impuesto (8%)</span>
                <span className="font-mono text-slate-700">+{formatCOP(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1 mt-1">
              <span className="text-slate-800">Total</span>
              <span className="font-mono text-emerald-700">{formatCOP(finalTotal)}</span>
            </div>
            {selectedMethod === 'Efectivo' && received >= finalTotal && (
              <div className="flex justify-between text-[11px] border-t border-slate-200 pt-1 mt-1">
                <span className="text-slate-600">Cambio</span>
                <span className="font-mono text-emerald-600 font-bold">{formatCOP(cambio)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleBack}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleGenerateInvoice(currentOrder)}
              disabled={selectedMethod === 'Efectivo' && received < finalTotal}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              Confirmar Cobro
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TABLE VIEW (default) ---
  const handleCancelOrder = (orderId: string) => {
    if (confirm('¿Está seguro de cancelar este pedido?')) {
      onCancelOrder(orderId);
    }
  };

  return (
    <div>
      {billingOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">No hay facturas pendientes</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Los pedidos en estado "Caja" aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800">Facturaciones Pendientes</h4>
            <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {billingOrders.length} pendiente{billingOrders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Mesa</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Cliente</th>
                  <th className="text-left py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Hora</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Total</th>
                  <th className="text-center py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Estado</th>
                  <th className="text-right py-2.5 px-4 text-[10px] uppercase font-bold text-slate-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {billingOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-b border-slate-50 hover:bg-amber-50/50 transition-colors cursor-pointer ${
                      selectedOrderId === order.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''
                    }`}
                    onClick={() => handleOpenBillingForm(order.id)}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {order.tableName || `Mesa ${order.tableId}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{getGuestName(order.tableId)}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{order.timestamp}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {formatCOP(order.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                        Pendiente
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenBillingForm(order.id); }}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Cobrar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                          className="px-2 py-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] transition-all cursor-pointer bg-transparent border-none"
                          title="Cancelar pedido"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
