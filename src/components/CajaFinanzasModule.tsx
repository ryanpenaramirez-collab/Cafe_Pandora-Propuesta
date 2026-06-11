/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, Trash2, CreditCard, Percent, FileText, ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react';
import { Order, Table, TableStatus } from '../types';
import { jsPDF } from 'jspdf';

interface CajaFinanzasModuleProps {
  orders: Order[];
  tables: Table[];
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
}

export default function CajaFinanzasModule({
  orders,
  tables,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder
}: CajaFinanzasModuleProps) {
  // Filter for orders in 'caja' status (ready to bill)
  const billingOrders = useMemo(() => {
    return orders
      .filter(order => order.status === 'caja')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  // Track which card is showing the billing form
  const [billingOrderId, setBillingOrderId] = useState<string | null>(null);

  // Form states (managed per order when selected, or simple local values)
  const [bankEntity, setBankEntity] = useState<string>('Nequi');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Transferencia');
  const [applyTax, setApplyTax] = useState<boolean>(true);

  // Entities list helper
  const BANK_ENTITIES = ['Bancolombia', 'Nequi', 'Daviplata', 'Banco de Bogotá', 'Efectivo / Caja General'];

  const handleOpenBillingForm = (orderId: string) => {
    setBillingOrderId(orderId);
    // Defaults for selected order
    setBankEntity('Nequi');
    setPaymentMethod('Transferencia');
    setApplyTax(true);
  };

  const handleGenerateInvoice = (order: Order) => {
    const cleanId = order.id.replace('ord-', '').toUpperCase();
    const invoiceNumber = `FAC-${cleanId}`;
    
    const subtotalBruto = order.total;
    const taxRate = 0.08;
    const taxAmount = applyTax ? subtotalBruto * taxRate : 0;
    const finalTotal = subtotalBruto + taxAmount;

    // 1. Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica', 'normal');

    // Title - Café Pandora
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Cafe Pandora - Bistro Cafe Bar', 105, 25, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Experiencia Culinaria Unica & Cocteleria de Autor', 105, 31, { align: 'center' });

    // Divider Line
    doc.setDrawColor(196, 168, 130); // Wood-gold accent
    doc.setLineWidth(0.8);
    doc.line(20, 36, 190, 36);

    // Invoice Meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    // Left Details
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE LA FACTURA:', 20, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factura N°: ${invoiceNumber}`, 20, 51);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-ES')}`, 20, 56);
    doc.text(`Hora Registro: ${order.timestamp}`, 20, 61);

    // Right Details
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE PAGO:', 120, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mesa: Mesa ${order.tableId}`, 120, 51);
    doc.text(`Canal / Banco: ${bankEntity}`, 120, 56);
    doc.text(`Método de Pago: ${paymentMethod.toUpperCase()}`, 120, 61);

    // Table Header
    doc.setFillColor(245, 240, 230); // Cream light background
    doc.rect(20, 72, 170, 8, 'F');
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, 72, 190, 72);
    doc.line(20, 80, 190, 80);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Descripción Producto', 25, 77);
    doc.text('Cant.', 115, 77, { align: 'center' });
    doc.text('Precio Unit.', 145, 77, { align: 'center' });
    doc.text('Importe Total', 180, 77, { align: 'center' });

    // Draw Items
    let y = 86;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    order.items.forEach((item) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.name.toUpperCase(), 25, y);
      doc.text(`${item.quantity}`, 115, y, { align: 'center' });
      doc.text(`$${item.price.toLocaleString('es-CO')}`, 145, y, { align: 'center' });
      
      const itemSubtotal = item.price * item.quantity;
      doc.text(`$${itemSubtotal.toLocaleString('es-CO')}`, 180, y, { align: 'center' });
      
      doc.setDrawColor(241, 245, 249);
      doc.line(20, y + 2, 190, y + 2);
      y += 8;
    });

    // Totals Section
    y += 4;
    doc.setDrawColor(196, 168, 130);
    doc.setLineWidth(0.5);
    doc.line(110, y, 190, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUBTOTAL BRUTO:', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${subtotalBruto.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('IMPUESTO IMPOCONSUMO (8%):', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${taxAmount.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

    y += 7;
    // Total highlights block
    doc.setFillColor(212, 191, 160); // Pandora gold accent bg
    doc.rect(110, y - 4, 80, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 20, 10);
    doc.text('TOTAL FACTURADO (COP):', 113, y + 1);
    doc.text(`$${finalTotal.toLocaleString('es-CO')}`, 180, y + 1, { align: 'center' });

    // Footer
    y = Math.max(y + 25, 250);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, 190, y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Esta factura oficial ha sido procesada mediante la Mesa de Caja y Finanzas de Cafe Pandora.', 105, y + 5, { align: 'center' });
    doc.text('¡Gracias por deleitar tus sentidos en Cafe Pandora! Vuelve pronto.', 105, y + 9, { align: 'center' });

    doc.save(`Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`);

    // 2. Clear Table & register cash update
    onClearTable(order.tableId, true, finalTotal);

    // 3. Mark order as completely facturado/completed
    onUpdateOrderStatus(order.id, 'facturado');

    // 4. Close form
    setBillingOrderId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* List Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-pandora-wood/20">
        <div>
          <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            📊 Pedidos listos para facturar (Caja)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Comandas con pre-factura o recibo cocina expedido que están listas para cobrar.</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">
          {billingOrders.length} Pendientes de Factura
        </span>
      </div>

      {billingOrders.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border-2 border-dashed border-slate-350 p-6 text-center select-none">
          <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-serif font-bold text-slate-700 text-xs uppercase tracking-wider">¡Sin novedades en Caja!</h4>
          <p className="text-[10px] text-slate-500 mt-1">No hay comandas preparadas esperando por facturación de pago en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {billingOrders.map((order, idx) => {
            const isBillFormOpen = billingOrderId === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-pandora-dark text-pandora-cream rounded-xl border border-pandora-wood overflow-hidden flex flex-col justify-between shadow-md"
              >
                {/* Header with Turn and Time swapped: Top-left Table, Bottom-left Time, Top-right Turn, Bottom-right ID */}
                <div className="bg-[#1C1510] p-3.5 border-b border-pandora-wood/30 flex justify-between items-stretch shrink-0">
                  <div className="text-left flex flex-col justify-between">
                    <span className="font-serif font-extrabold text-sm text-pandora-gold block tracking-wider uppercase whitespace-nowrap">
                      MESA {order.tableId}
                    </span>
                    <span className="text-[10.5px] font-mono font-light text-pandora-cream flex items-center gap-1 mt-1 leading-none">
                      <Clock className="w-2.5 h-2.5 text-pandora-gold shrink-0" /> {order.timestamp}
                    </span>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <span className="text-[10.5px] font-mono font-bold text-pandora-cream/80 block leading-none">
                      Turno #{(idx ?? 0) + 1}
                    </span>
                    <span className="text-[8.5px] text-pandora-cream/40 font-mono block mt-1 uppercase leading-none">
                      ID: #{order.id.slice(-4)}
                    </span>
                  </div>
                </div>

                {/* Body (Either items list or the requested bank/tax payment form) */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  {!isBillFormOpen ? (
                    // 1. STANDARD ITEM LIST VIEW
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-gold/60 block font-mono">
                          🛒 Consumo a Facturar
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

                      <div className="pt-2 border-t border-pandora-wood/30 flex justify-between items-center bg-[#150E09]/40 p-2 rounded">
                        <span className="text-[9.5px] uppercase font-mono text-pandora-cream/50">Total Subtotal</span>
                        <span className="font-mono text-sm font-black text-pandora-gold">${order.total.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                  ) : (
                    // 2. DETAILED BILLING FORM
                    <div className="space-y-4 text-slate-800 bg-[#FAF5EE] p-3 rounded-lg border border-slate-300">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-1 shrink-0">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#8A7A6A] font-mono">
                          REGISTRO DE FACTURA
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillingOrderId(null)}
                          className="text-[9.5px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-black"
                        >
                          <ArrowLeft className="w-3 h-3" /> VOLVER
                        </button>
                      </div>

                      {/* Entidad Bancaria Select */}
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

                      {/* Método de Pago Segmented buttons */}
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase font-mono font-bold text-slate-600">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map(method => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-1 rounded border text-[10px] font-bold uppercase transition-all ${
                                paymentMethod === method
                                  ? 'bg-pandora-dark text-white border-pandora-dark'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {method === 'Transferencia' ? 'Trf.' : method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Impuesto consumo toggle */}
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

                      {/* Cash totals computation display */}
                      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 bg-white p-2 rounded">
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Subtotal:</span>
                          <span>${order.total.toLocaleString('es-CO')} COP</span>
                        </div>
                        {applyTax && (
                          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                            <span>Impuesto (8%):</span>
                            <span>+${(order.total * 0.08).toLocaleString('es-CO')} COP</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-black text-slate-800 border-t pt-1">
                          <span>TOTAL:</span>
                          <span className="font-mono text-emerald-700">${(order.total + (applyTax ? order.total * 0.08 : 0)).toLocaleString('es-CO')} COP</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-[#1C1510] border-t border-pandora-wood/30 p-2.5 grid grid-cols-2 gap-2 shrink-0">
                  {!isBillFormOpen ? (
                    <>
                      <button
                        onClick={() => handleOpenBillingForm(order.id)}
                        className="py-1.5 px-2 rounded-lg bg-[#2E7D32] hover:bg-[#25632a] text-white transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider text-center"
                        title="Generar Factura de Pago"
                      >
                        Generar Factura de Pago
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Está seguro de cancelar el pedido de la Mesa ${order.tableId}?`)) {
                            onCancelOrder(order.id);
                          }
                        }}
                        className="py-1.5 px-2 rounded-lg border border-rose-800 bg-[#3a1a1a]/65 hover:bg-rose-950 text-rose-200 transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider text-center"
                        title="Cancelar"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setBillingOrderId(null)}
                        className="py-1.5 px-2 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider text-center"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={() => handleGenerateInvoice(order)}
                        className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider text-center"
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
