import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react';
import { Order, Table } from '../types';
import { jsPDF } from 'jspdf';
import logoSrc from '../assets/images/logo-cafe-pandora.jpg';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

const BANK_ENTITIES = ['Bancolombia', 'Nequi', 'Daviplata', 'Banco de Bogotá', 'Efectivo / Caja General'];

type BillingStep = 'metodo' | 'form';
type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta';

interface FacturacionProps {
  orders: Order[];
  tables: Table[];
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
}

function getImageBase64(url: string): Promise<string> {
  return fetch(url)
    .then((res) => res.blob())
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

const METHODS: { id: PaymentMethod; label: string; desc: string }[] = [
  { id: 'Efectivo', label: 'Efectivo', desc: 'Pago en efectivo' },
  { id: 'Transferencia', label: 'Transferencia', desc: 'Transferencia bancaria digital' },
  { id: 'Tarjeta', label: 'Tarjeta', desc: 'Débito / Crédito — datáfono físico' },
];

export default function Facturacion({
  orders,
  tables,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder,
}: FacturacionProps) {
  const billingOrders = useMemo(() => {
    return orders
      .filter(order => order.status === 'caja')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  const [billingOrderId, setBillingOrderId] = useState<string | null>(null);
  const [billingStep, setBillingStep] = useState<BillingStep>('metodo');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Efectivo');
  const [bankEntity, setBankEntity] = useState<string>('Nequi');
  const [applyTax, setApplyTax] = useState<boolean>(true);

  const handleOpenBillingForm = (orderId: string) => {
    setBillingOrderId(orderId);
    setBillingStep('metodo');
    setSelectedMethod('Efectivo');
    setBankEntity('Nequi');
    setApplyTax(true);
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setBillingStep('form');
  };

  const handleBack = () => {
    if (billingStep === 'form') {
      setBillingStep('metodo');
    } else {
      setBillingOrderId(null);
    }
  };

  const handleGenerateInvoice = async (order: Order) => {
    const cleanId = order.id.replace('ord-', '').toUpperCase();
    const invoiceNumber = `FAC-${cleanId}`;

    const subtotalBruto = order.total;
    const taxRate = 0.08;
    const taxAmount = applyTax ? subtotalBruto * taxRate : 0;
    const finalTotal = subtotalBruto + taxAmount;

    const itemsHeight = order.items.length * 5;
    const extraForBanco = selectedMethod === 'Transferencia' ? 8 : 0;
    const pageHeight = Math.max(140, 120 + itemsHeight + extraForBanco);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, pageHeight],
    });

    const cx = 40;
    const ml = 8;
    const mr = 72;

    try {
      const logoData = await getImageBase64(logoSrc);
      doc.addImage(logoData, 'JPEG', cx - 10, 4, 20, 18);
    } catch {
      // continue
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Cafe Pandora', cx, 34, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Bistro Cafe Bar', cx, 39, { align: 'center' });

    doc.setDrawColor(196, 168, 130);
    doc.setLineWidth(0.6);
    doc.line(6, 44, 74, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text('DATOS DE LA FACTURA', ml, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Factura N: ${invoiceNumber}`, ml, 53);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, ml, 58);
    doc.text(`Hora: ${order.timestamp}`, ml, 63);

    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE PAGO', ml, 70);

    doc.setFont('helvetica', 'normal');
    doc.text(`Mesa: ${order.tableName || 'Mesa ' + order.tableId}`, ml, 75);
    doc.text(`Metodo: ${selectedMethod}`, ml, 80);
    if (selectedMethod === 'Transferencia') {
      doc.text(`Banco: ${bankEntity}`, ml, 85);
    }

    const detailEndY = selectedMethod === 'Transferencia' ? 89 : 84;
    const div1 = detailEndY + 3;

    doc.setDrawColor(196, 168, 130);
    doc.setLineWidth(0.3);
    doc.line(6, div1, 74, div1);

    let y = div1 + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Producto', ml, y);
    doc.text('Total', mr, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(226, 232, 240);
    doc.line(6, y, 74, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    order.items.forEach((item) => {
      const sub = item.price * item.quantity;
      const left = `${item.name} x${item.quantity}`;
      const displayLeft = left.length > 28 ? left.substring(0, 25) + '..' : left;
      doc.text(displayLeft, ml, y);
      doc.text(formatCOP(sub), mr, y, { align: 'right' });
      y += 5;
    });

    y += 2;
    doc.setDrawColor(196, 168, 130);
    doc.setLineWidth(0.3);
    doc.line(6, y, 74, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('SUBTOTAL:', ml, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCOP(subtotalBruto), mr, y, { align: 'right' });
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('IMPOCONSUMO 8%:', ml, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCOP(taxAmount), mr, y, { align: 'right' });
    y += 5;

    doc.setFillColor(212, 191, 160);
    doc.rect(6, y - 3, 68, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 20, 10);
    doc.text('TOTAL:', ml, y + 1);
    doc.text(formatCOP(finalTotal), mr, y + 1, { align: 'right' });
    y += 7;

    doc.setDrawColor(196, 168, 130);
    doc.setLineWidth(0.6);
    doc.line(6, y, 74, y);
    y += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('Gracias por visitarnos!', cx, y, { align: 'center' });
    y += 3;
    doc.text('Cafe Pandora POS', cx, y, { align: 'center' });

    doc.save(`Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`);

    onClearTable(order.tableId, true, finalTotal);
    onUpdateOrderStatus(order.id, 'facturado');
    setBillingOrderId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2.5 border-b border-pandora-wood/20">
        <div>
          <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            Pedidos listos para facturar
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Comandas preparadas que estan listas para cobrar.</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">
          {billingOrders.length} Pendientes
        </span>
      </div>

      {billingOrders.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center select-none">
          <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-serif font-bold text-slate-700 text-xs uppercase tracking-wider">Sin novedades en Caja</h4>
          <p className="text-[10px] text-slate-500 mt-1">No hay comandas preparadas esperando facturacion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingOrders.map((order, idx) => {
            const isActive = billingOrderId === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-pandora-dark text-pandora-cream rounded-xl border border-pandora-wood overflow-hidden flex flex-col justify-between shadow-md"
              >
                <div className="bg-[#1C1510] p-3.5 border-b border-pandora-wood/30 flex justify-between items-stretch shrink-0">
                  <div className="text-left flex flex-col justify-between">
                    <span className="font-serif font-extrabold text-sm text-pandora-gold block tracking-wider uppercase">
                      {order.tableName || `MESA ${order.tableId}`}
                    </span>
                    <span className="text-[10.5px] font-mono font-light text-pandora-cream flex items-center gap-1 mt-1 leading-none">
                      <Clock className="w-2.5 h-2.5 text-pandora-gold shrink-0" /> {order.timestamp}
                    </span>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <span className="text-[10.5px] font-mono font-bold text-pandora-cream/80 block leading-none">
                      Turno #{idx + 1}
                    </span>
                    <span className="text-[8.5px] text-pandora-cream/40 font-mono block mt-1 uppercase leading-none">
                      ID: #{order.id.slice(-4)}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between min-h-[220px]">
                  {!isActive ? (
                    <div className="space-y-4 h-full flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-gold/60 block font-mono">
                          Consumo a Facturar
                        </span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {order.items.map((item) => (
                            <div key={item.menuItemId} className="flex justify-between text-xs border-b border-white/5 pb-1">
                              <span className="truncate pr-2 uppercase">{item.name}</span>
                              <span className="font-mono text-pandora-gold shrink-0">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-pandora-wood/30 flex justify-between items-center bg-[#150E09]/40 p-2 rounded mt-auto">
                        <span className="text-[9.5px] uppercase font-mono text-pandora-cream/50">Total</span>
                        <span className="font-mono text-sm font-black text-pandora-gold">{formatCOP(order.total)}</span>
                      </div>
                    </div>
                  ) : billingStep === 'metodo' ? (
                    <div className="space-y-4 h-full flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-gold/60 font-mono">
                          Seleccione metodo de pago
                        </span>
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-[9.5px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-black cursor-pointer bg-transparent border-none"
                        >
                          <ArrowLeft className="w-3 h-3" /> VOLVER
                        </button>
                      </div>

                      <div className="space-y-2">
                        {METHODS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMethod(m.id)}
                            className={`group w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                              selectedMethod === m.id
                                ? 'border-pandora-accent bg-white'
                                : 'border-slate-200 bg-white hover:border-pandora-accent hover:bg-pandora-accent/10'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selectedMethod === m.id ? 'border-pandora-accent' : 'border-slate-300 group-hover:border-pandora-accent'
                            }`}>
                              <div className={`w-3 h-3 rounded-full transition-all ${
                                selectedMethod === m.id ? 'bg-pandora-accent' : 'bg-transparent group-hover:bg-pandora-accent'
                              }`} />
                            </div>
                            <div>
                              <span className={`block text-xs transition-all ${
                                selectedMethod === m.id ? 'font-black text-pandora-accent' : 'font-bold text-slate-800 group-hover:text-pandora-accent'
                              }`}>{m.label}</span>
                              <span className="block text-[9px] text-slate-400">{m.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-slate-800 bg-[#FAF5EE] p-3 rounded-lg border border-slate-300 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-1 shrink-0">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#8A7A6A] font-mono">
                          {selectedMethod === 'Efectivo' && 'PAGO EN EFECTIVO'}
                          {selectedMethod === 'Transferencia' && 'PAGO POR TRANSFERENCIA'}
                          {selectedMethod === 'Tarjeta' && 'PAGO CON TARJETA'}
                        </span>
                        <button
                          type="button"
                          onClick={handleBack}
                          className="text-[9.5px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-black cursor-pointer bg-transparent border-none"
                        >
                          <ArrowLeft className="w-3 h-3" /> CAMBIAR
                        </button>
                      </div>

                      {selectedMethod === 'Transferencia' && (
                        <div className="space-y-1">
                          <label className="block text-[10px] uppercase font-mono font-bold text-slate-600">Entidad Bancaria</label>
                          <select
                            value={bankEntity}
                            onChange={(e) => setBankEntity(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                          >
                            {BANK_ENTITIES.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedMethod === 'Tarjeta' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <CreditCard className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                          <p className="text-[11px] text-blue-700 font-semibold">Pagado con Tarjeta</p>
                          <p className="text-[9px] text-blue-500 mt-0.5">Procesado mediante datáfono físico</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-dashed border-slate-300 pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block uppercase">Impuesto Consumo (8%)</span>
                          <span className="text-[8px] text-slate-400 font-light block leading-none">Sumar gravamen fiscal</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={applyTax}
                          onChange={(e) => setApplyTax(e.target.checked)}
                          className="w-4 h-4 text-pandora-accent rounded border-slate-300 border focus:ring-pandora-accent cursor-pointer"
                        />
                      </div>

                      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 bg-white p-2 rounded">
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Subtotal:</span>
                          <span>{formatCOP(order.total)}</span>
                        </div>
                        {applyTax && (
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                            <span>Impuesto (8%):</span>
                            <span>+{formatCOP(order.total * 0.08)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-black text-slate-800 border-t pt-1">
                          <span>TOTAL:</span>
                          <span className="font-mono text-emerald-700">{formatCOP(order.total + (applyTax ? order.total * 0.08 : 0))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#1C1510] border-t border-pandora-wood/30 p-2.5 grid grid-cols-2 gap-2 shrink-0">
                  {!isActive ? (
                    <button
                      onClick={() => handleOpenBillingForm(order.id)}
                      className="col-span-2 py-1.5 px-2 rounded-lg bg-[#2E7D32] hover:bg-[#25632a] text-white transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider"
                    >
                      Generar Factura de Pago
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleBack}
                        className="py-1.5 px-2 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(order)}
                        className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider"
                      >
                        Facturar e Imprimir
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
