/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, Trash2, Utensils, AlertCircle, ShoppingBag, MapPin, X, FileText } from 'lucide-react';
import { Order } from '../types';
import { jsPDF } from 'jspdf';

interface PendingOrdersModuleProps {
  orders: Order[];
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export default function PendingOrdersModule({ orders, onCompleteOrder, onCancelOrder }: PendingOrdersModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter and sort pending orders: status !== 'listo'
  // Sorted chronologically oldest first: smallest createdAt first. We default a.createdAt to 0 if undefined.
  const pendingOrders = useMemo(() => {
    return orders
      .filter(order => order.status !== 'listo')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  // Generate clean thermal / standard Invoice PDF via jsPDF
  const handleGenerateInvoice = (order: Order) => {
    const cleanId = order.id.replace('ord-', '').toUpperCase();
    const invoiceNumber = `FAC-${cleanId}`;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Base font setup
    doc.setFont('helvetica', 'normal');

    // Title - Café Pandora - Bistro Café Bar (Sanitized to avoid raw font encodings)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Cafe Pandora - Bistro Cafe Bar', 105, 25, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Gray
    doc.text('Experiencia Culinaria Unica & Cocteleria de Autor', 105, 31, { align: 'center' });

    // Divider Line (Terracotta #d66c50 -> RGB 214, 108, 80)
    doc.setDrawColor(214, 108, 80);
    doc.setLineWidth(0.8);
    doc.line(20, 36, 190, 36);

    // Invoice Details Info Columns
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate
    
    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE LA FACTURA:', 20, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factura N°: ${invoiceNumber}`, 20, 51);
    doc.text(`Fecha de Emision: ${new Date().toLocaleDateString('es-ES')}`, 20, 56);
    doc.text(`Hora de Registro: ${order.timestamp}`, 20, 61);

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE SERVICIO:', 120, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mesa Asignada: Mesa ${order.tableId}`, 120, 51);
    doc.text(`Mesero Atendiendo: ${order.waiterName}`, 120, 56);
    doc.text('Estado Pago: Pendiente - Cuenta de Mesa', 120, 61);

    // Table header background box
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 72, 170, 8, 'F');
    
    // Table header lines
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, 72, 190, 72);
    doc.line(20, 80, 190, 80);

    // Column Headers Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('Descripcion Producto', 25, 77);
    doc.text('Cant.', 115, 77, { align: 'center' });
    doc.text('Precio Unit.', 145, 77, { align: 'center' });
    doc.text('Importe Total', 180, 77, { align: 'center' });

    // Draw Items rows
    let y = 86;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    order.items.forEach((item) => {
      // Bounds containment check
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(item.name.toUpperCase(), 25, y);
      doc.text(`${item.quantity}`, 115, y, { align: 'center' });
      doc.text(`$${item.price.toFixed(2)}`, 145, y, { align: 'center' });
      
      const subtotal = item.price * item.quantity;
      doc.text(`$${subtotal.toFixed(2)}`, 180, y, { align: 'center' });
      
      // row separator
      doc.setDrawColor(241, 245, 249);
      doc.line(20, y + 2, 190, y + 2);
      
      y += 8;
    });

    // Totals Section divider
    y += 4;
    doc.setDrawColor(214, 108, 80);
    doc.setLineWidth(0.5);
    doc.line(110, y, 190, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('SUBTOTAL BRUTO:', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${order.total.toFixed(2)}`, 180, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('DESCUENTO APLICADO:', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text('$0.00', 180, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('I.V.A. TRASLADADO (0%):', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text('$0.00', 180, y, { align: 'center' });

    y += 7;
    // Total Row highlights block
    doc.setFillColor(254, 243, 199); // Light amber bg
    doc.rect(110, y - 4, 80, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(146, 64, 14); // Dark brown-gold
    doc.text('TOTAL FACTURADO:', 115, y + 1);
    doc.text(`$${order.total.toFixed(2)}`, 180, y + 1, { align: 'center' });

    // Footer lines
    y = Math.max(y + 25, 250);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Esta es una reproduccion digital de comanda de facturacion de Cafe Pandora.', 105, y + 5, { align: 'center' });
    doc.text('Gracias por su visita al Bistro Cafe Bar! Le esperamos pronto.', 105, y + 9, { align: 'center' });

    // Exact filename format: Factura-[invoice number]-Mesa[table number].pdf
    const filename = `Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`;
    doc.save(filename);
  };

  return (
    <div id="pending_orders_module" className="flex flex-col gap-5 min-h-[500px]">
      
      {/* Header section with count */}
      <div className="flex justify-between items-center pb-2.5 border-b border-pandora-wood/20">
        <div>
          <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-pandora-accent" /> Cola de Comandas Pendientes
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Control de despachos en cocina y barra ordenados por orden de llegada.</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-pandora-accent/15 text-pandora-accent border border-pandora-accent/30 font-mono text-[10px] font-bold">
          {pendingOrders.length} {pendingOrders.length === 1 ? 'Pedido' : 'Pedidos'}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {pendingOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-pandora-dark/5 border border-dashed border-pandora-wood/20 rounded-2xl"
          >
            <div className="w-12 h-12 bg-pandora-cream rounded-full flex items-center justify-center text-pandora-accent/50 mb-3 border border-pandora-wood/10">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-serif font-bold text-slate-700 text-sm tracking-wider uppercase">¡No hay pedidos pendientes!</p>
            <p className="text-[11px] text-slate-400 font-light mt-1 text-center max-w-xs">Todos los servicios de mesa están despachados y al día.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order, idx) => {
              // Time elapsed since order creation
              const placedTime = order.timestamp;
              
              // Get item colors depending on order type
              let tagColorStyles = "bg-pandora-accent/10 border-pandora-accent/20 text-pandora-accent";
              if (order.type === 'comida') {
                tagColorStyles = "bg-amber-100 text-amber-800 border-amber-200";
              } else if (order.type === 'bebida') {
                tagColorStyles = "bg-cyan-50 text-cyan-800 border-cyan-200";
              }

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-pandora-dark border border-pandora-wood shadow-lg rounded-xl flex flex-col justify-between overflow-hidden group text-pandora-cream cursor-pointer hover:border-pandora-accent transition-all duration-300 transform hover:scale-[1.01]"
                >
                  {/* Card Header in Dark Wood Style Theme */}
                  <div className="bg-[#1C1510] p-3.5 border-b border-pandora-wood/30 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-pandora-accent flex items-center justify-center text-xs font-serif font-extrabold text-white">
                        {order.tableId}
                      </div>
                      <div>
                        <span className="font-serif font-bold text-xs text-pandora-gold block tracking-wider uppercase">
                          MESA {order.tableId}
                        </span>
                        <span className="text-[9px] font-mono font-light text-pandora-cream flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-pandora-gold" /> {placedTime}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-pandora-gold block">
                        #{order.id.slice(-4)}
                      </span>
                      {/* Priority Tag Index */}
                      <span className="text-[8px] uppercase tracking-wider font-mono px-1 py-0.5 rounded bg-black/40 text-pandora-cream/70 mt-1 inline-block border border-white/5">
                        TURNO #{(idx ?? 0) + 1}
                      </span>
                    </div>
                  </div>

                  {/* Card Body (ItemList) */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 mb-4">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-gold/60 block font-mono">
                        📝 ÍTEMS EN COMANDA
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {order.items.map((item) => (
                          <div 
                            key={item.menuItemId}
                            className="flex justify-between items-start text-xs border-b border-white/5 pb-1 last:border-0"
                          >
                            <span className="text-pandora-cream leading-tight flex gap-2 font-serif">
                              <span className="font-mono text-pandora-gold font-bold">x{item.quantity}</span> 
                              <span className="uppercase tracking-wide">{item.name}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total billing detail */}
                    <div className="pt-2 border-t border-pandora-wood/30 flex justify-between items-center">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-pandora-cream/50 block font-mono">Atendió: {order.waiterName}</span>
                        <div className={`text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-1 font-mono ${tagColorStyles}`}>
                          {order.type === 'mixto' ? 'Mixto' : order.type === 'comida' ? 'Platillos' : 'Bebidas'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider text-pandora-cream/50 block font-mono">Total cargo</span>
                        <span className="font-mono text-sm font-extrabold text-pandora-gold">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (Completado + Cancelar) - stop propagation to avoid opening modal */}
                  <div className="bg-[#1C1510] border-t border-pandora-wood/30 p-2.5 grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Está seguro de cancelar el pedido #${order.id.slice(-4)} de la Mesa ${order.tableId}?`)) {
                          onCancelOrder(order.id);
                        }
                      }}
                      className="py-1.5 px-3 rounded-lg border border-rose-800 bg-[#3a1a1a]/60 hover:bg-rose-950 text-rose-200 hover:text-white transition-all text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs uppercase tracking-wider"
                      title="Cancelar pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteOrder(order.id);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm uppercase tracking-wider"
                      title="Finalizar preparación"
                    >
                      <Check className="w-3.5 h-3.5" /> Completado
                    </button>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Order View Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-pandora-dark text-pandora-cream p-5 shrink-0 flex justify-between items-center border-b border-pandora-wood/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pandora-accent flex items-center justify-center text-sm font-serif font-extrabold text-white">
                    {selectedOrder.tableId}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-pandora-gold uppercase tracking-wider font-display">Mesa {selectedOrder.tableId} &bull; Detalles</h3>
                    <p className="text-[10px] text-slate-300 font-mono">Comanda #{selectedOrder.id.slice(-4).toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">Hora Comanda</span>
                    <span className="font-semibold block text-slate-700 mt-0.5">{selectedOrder.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">Mesero Atiende</span>
                    <span className="font-semibold block text-slate-700 mt-0.5">{selectedOrder.waiterName}</span>
                  </div>
                </div>

                {/* Items details */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-pandora-wood block font-mono border-b border-slate-100 pb-1">
                    Productos Solicitados
                  </span>
                  
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                        <div>
                          <span className="font-serif font-bold text-slate-800 uppercase tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">${item.price.toFixed(2)} c/u &times; {item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                  <span className="font-serif text-sm font-bold text-slate-800 uppercase tracking-widest">Monto Total Pedido:</span>
                  <span className="font-mono text-xl font-black text-pandora-accent">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Single Action Footer Button */}
              <div className="p-4.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleGenerateInvoice(selectedOrder)}
                  className="w-full bg-[#d66c50] hover:bg-[#be593e] text-white py-3.5 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-colors text-center flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-pandora-accent/10 active:scale-[0.99] cursor-pointer"
                >
                  <FileText className="w-4.5 h-4.5" /> Generar Factura
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

