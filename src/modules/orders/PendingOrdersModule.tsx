/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, Trash2, Utensils, AlertCircle, ShoppingBag, MapPin, X, FileText, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { Order } from '../../types';
import { jsPDF } from 'jspdf';

interface PendingOrdersModuleProps {
  orders: Order[];
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  userRole?: 'administrador' | 'mesero';
}

export default function PendingOrdersModule({ orders, onCompleteOrder, onCancelOrder, userRole = 'administrador' }: PendingOrdersModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Nequi' | 'Bancolombia'>('Efectivo');
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [showBillingConfig, setShowBillingConfig] = useState<boolean>(false);

  useEffect(() => {
    if (selectedOrder) {
      setPaymentMethod('Efectivo');
      setIncludeTax(false);
      setShowBillingConfig(false);
    }
  }, [selectedOrder]);

  // Filter and sort pending orders: status !== 'listo', 'caja', or 'facturado'
  // Sorted chronologically oldest first: smallest createdAt first. We default a.createdAt to 0 if undefined.
  const pendingOrders = useMemo(() => {
    return orders
      .filter(order => order.status !== 'listo' && order.status !== 'caja' && order.status !== 'facturado')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  const selectedOrderIndex = useMemo(() => {
    if (!selectedOrder) return 1;
    const idx = pendingOrders.findIndex(o => o.id === selectedOrder.id);
    return idx !== -1 ? idx + 1 : 1;
  }, [selectedOrder, pendingOrders]);

  // Generate clean thermal / standard Invoice PDF via jsPDF
  const handleGenerateInvoice = (order: Order, paymentMethod: string, includeTax: boolean) => {
    const cleanId = order.id.replace('ord-', '').toUpperCase();
    const invoiceNumber = `FAC-${cleanId}`;
    
    const subtotalBruto = order.total;
    const taxRate = 0.08;
    const taxAmount = includeTax ? subtotalBruto * taxRate : 0;
    const finalTotal = subtotalBruto + taxAmount;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Base font setup
    doc.setFont('helvetica', 'normal');

    // Title - Café Pandora - Bistro Café Bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Cafe Pandora - Bistro Cafe Bar', 105, 25, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Gray
    doc.text('Experiencia Culinaria Unica & Cocteleria de Autor', 105, 31, { align: 'center' });

    // Divider Line
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
    doc.text(`Metodo de Pago: ${paymentMethod.toUpperCase()}`, 120, 61);

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
      doc.text(`$${item.price.toLocaleString('es-CO')}`, 145, y, { align: 'center' });
      
      const itemSubtotal = item.price * item.quantity;
      doc.text(`$${itemSubtotal.toLocaleString('es-CO')}`, 180, y, { align: 'center' });
      
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
    doc.text(`$${subtotalBruto.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('IMPUESTO CONSUMO (8%):', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`$${taxAmount.toLocaleString('es-CO')}`, 180, y, { align: 'center' });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('I.V.A. TRASLADADO (0%):', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.text('$0', 180, y, { align: 'center' });

    y += 7;
    // Total Row highlights block
    doc.setFillColor(254, 243, 199); // Light amber bg
    doc.rect(110, y - 4, 80, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(146, 64, 14); // Dark brown-gold
    doc.text('TOTAL FACTURADO:', 115, y + 1);
    doc.text(`$${finalTotal.toLocaleString('es-CO')}`, 180, y + 1, { align: 'center' });

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

  // Generate clean thermal/ticket Kitchen PDF via jsPDF
  const handleGenerateKitchenReceipt = (order: Order, turnNumber: number) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // thermal card dimension 80mm roll width
    });

    doc.setFont('helvetica', 'normal');

    // Title - COMANDA DE COCINA (No formatting prices or subtotals)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('COMANDA DE COCINA', 40, 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text('CAFÉ PANDORA', 40, 17, { align: 'center' });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(5, 21, 75, 21);

    // Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`MESA: ${order.tableId}`, 5, 27);
    doc.text(`TURNO: #${turnNumber}`, 50, 27);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Comanda N°: ${order.id.toUpperCase()}`, 5, 33);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 5, 38);
    doc.text(`Hora: ${order.timestamp}`, 5, 43);
    doc.text(`Atendió: ${order.waiterName}`, 5, 48);

    doc.line(5, 52, 75, 52);

    // Items list header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PRODUCTO', 5, 57);
    doc.text('CANTIDAD', 55, 57);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let y = 63;

    order.items.forEach((item) => {
      if (y > 140) {
        doc.addPage();
        y = 15;
      }
      doc.text(item.name.toUpperCase(), 5, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`x${item.quantity}`, 60, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });

    doc.line(5, y + 2, 75, y + 2);
    
    y += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('* Solo preparacion en cocina *', 40, y, { align: 'center' });

    const filename = `ComandaCocina-Mesa${order.tableId}-${order.id.slice(-4)}.pdf`;
    doc.save(filename);
  };

  return (
    <div id="pending_orders_module" className="flex flex-col gap-5 min-h-[500px]">
      
      {/* Header section with count */}
      <div className="flex justify-between items-center pb-2.5 border-b border-borde">
        <div>
          <h3 className="font-serif text-sm font-bold text-titulo uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-oro" /> Cola de Comandas Pendientes
          </h3>
          <p className="text-[11px] text-inactivo mt-0.5">Control de despachos en cocina y barra ordenados por orden de llegada.</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-oro-insignia/20 text-oro border border-oro/30 font-mono text-[10px] font-bold">
          {pendingOrders.length} {pendingOrders.length === 1 ? 'Pedido' : 'Pedidos'}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {pendingOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center py-20 px-4 bg-hover-fondo/30 border border-dashed border-borde rounded-2xl"
          >
            <div className="w-12 h-12 bg-superficie-elevada rounded-full flex items-center justify-center text-oro/50 mb-3 border border-borde">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-serif font-bold text-cuerpo text-sm tracking-wider uppercase">¡No hay pedidos pendientes!</p>
            <p className="text-[11px] text-inactivo font-light mt-1 text-center max-w-xs">Todos los servicios de mesa están despachados y al día.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order, idx) => {
              // Time elapsed since order creation
              const placedTime = order.timestamp;
              const turnNumber = idx + 1;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  onClick={() => {
  if (userRole === 'mesero') return;
  setSelectedOrder(order);
}}
                  className="bg-tarjeta-fondo border border-borde shadow-sm rounded-xl flex flex-col justify-between overflow-hidden group text-titulo cursor-pointer hover:border-oro transition-all duration-300 transform hover:scale-[1.01]"
                >
                  {/* Card Header with Turn and Time swapped: Top-left Table, Bottom-left Time, Top-right Turn, Bottom-right ID */}
                  <div className="bg-tarjeta-fondo p-3.5 border-b border-borde flex justify-between items-stretch shrink-0">
                    <div className="text-left flex flex-col justify-between">
                      <span className="font-serif font-extrabold text-xs text-titulo block tracking-wider uppercase">
                        MESA {order.tableId}
                      </span>
                      <span className="text-[10.5px] font-mono font-light text-inactivo flex items-center gap-1 mt-1 leading-none">
                        <Clock className="w-2.5 h-2.5 text-inactivo shrink-0" /> {placedTime}
                      </span>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end">
                      <span className="text-[10.5px] font-mono font-bold text-cuerpo block leading-none">
                        Turno #{turnNumber}
                      </span>
                      <span className="text-[8px] text-inactivo font-mono block mt-1 uppercase leading-none">
                        ID: #{order.id.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body (ItemList) displaying products with their quantity only, no totals */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-inactivo block font-mono">
                        ÍTEMS EN COMANDA
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {order.items.map((item) => (
                          <div 
                            key={item.menuItemId}
                            className="flex justify-between items-center text-xs border-b border-borde pb-1 select-none last:border-0"
                          >
                            <span className="text-cuerpo leading-tight uppercase font-medium">
                              {item.name}
                            </span>
                            <span className="font-mono text-cuerpo font-bold bg-borde px-2 py-0.5 rounded text-[11px]">
                              Cant: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons matching exact layout: Generar Recibo Cocina left, Cancelar right */}
                  {userRole !== 'mesero' && (
                  <div className="bg-hover-fondo border-t border-borde p-2.5 grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 1. Generate kitchen receipt PDF
                        handleGenerateKitchenReceipt(order, turnNumber);
                        // 2. Perform transition to 'caja' state to disappear from Pedidos Pendientes
                        onCompleteOrder(order.id);
                      }}
                      className="py-1.5 px-2 rounded-lg bg-exito hover:bg-exito-hover text-white font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider transition-all text-center leading-none"
                      title="Generar Recibo Cocina"
                    >
                      Generar Recibo Cocina
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Está seguro de cancelar el pedido #${order.id.slice(-4)} de la Mesa ${order.tableId}?`)) {
                          onCancelOrder(order.id);
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg border border-borde bg-tarjeta-fondo hover:bg-hover-fondo text-cuerpo hover:text-titulo transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider text-center"
                      title="Cancelar"
                    >
                      Cancelar
                    </button>
                  </div>
                  )}

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
              className="bg-tarjeta-fondo w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-borde"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-acento text-white p-5 shrink-0 flex justify-between items-center border-b border-madera/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-acento flex items-center justify-center text-sm font-serif font-extrabold text-white">
                    {selectedOrder.tableId}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-oro uppercase tracking-wider font-display">Mesa {selectedOrder.tableId} &bull; Detalles</h3>
                    <p className="text-[10px] text-inactivo font-mono">Comanda #{selectedOrder.id.slice(-4).toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-tarjeta-fondo/10 rounded-full transition-colors text-inactivo hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-hover-fondo p-3.5 rounded-xl border border-borde text-xs text-cuerpo">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-inactivo block font-mono">Hora Comanda</span>
                    <span className="font-semibold block text-cuerpo mt-0.5">{selectedOrder.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-inactivo block font-mono">Mesero Atiende</span>
                    <span className="font-semibold block text-cuerpo mt-0.5">{selectedOrder.waiterName}</span>
                  </div>
                </div>

                {/* Items details */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-madera block font-mono border-b border-borde pb-1">
                    Productos Solicitados
                  </span>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-borde last:border-0 pb-1 last:pb-0">
                        <div>
                          <span className="font-serif font-bold text-titulo uppercase tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-inactivo block mt-0.5 font-mono">${item.price.toLocaleString('es-CO')} c/u &times; {item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-cuerpo">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection or Configuration Option */}
                {!showBillingConfig ? (
                  <div className="space-y-3.5 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-oro block font-mono border-b border-borde pb-1">
                      Seleccione una opción para continuar
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Option 1: Kitchen receipt (Direct printing) */}
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedOrder) {
                            handleGenerateKitchenReceipt(selectedOrder, selectedOrderIndex);
                            onCompleteOrder(selectedOrder.id);
                            setSelectedOrder(null);
                          }
                        }}
                        className="p-4 rounded-xl border-2 border-dashed border-borde hover:border-oro bg-hover-fondo hover:bg-amber-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Imprimir comanda para personal de cocina (Sin precios)"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-crema flex items-center justify-center group-hover:bg-oro group-hover:scale-105 transition-all">
                          <Utensils className="w-4 h-4 text-oro" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-titulo uppercase tracking-wide text-[11px]">Recibo de Cocina</h4>
                          <p className="text-[9.5px] text-atenuado font-light mt-0.5 leading-normal">
                            Descarga la comanda de preparación directa sin precios para cocina.
                          </p>
                        </div>
                      </button>

                      {userRole !== 'mesero' && (
                      // Option 2: Show Bill Config (Transit into pay flow)
                      <button
                        type="button"
                        onClick={() => setShowBillingConfig(true)}
                        className="p-4 rounded-xl border-2 border-borde hover:border-emerald-500 bg-hover-fondo hover:bg-emerald-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Configurar factura de pago oficial detallada"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-105 transition-all">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-titulo uppercase tracking-wide text-[11px]">Generar Factura</h4>
                          <p className="text-[9.5px] text-atenuado font-light mt-0.5 leading-normal">
                            Abre la configuración de medios de pago, impuestos consumo 8% y totales.
                          </p>
                        </div>
                      </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Billing Configuration Form */}
                    <div className="bg-[#FAF5EE] border border-borde p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-oro block font-mono">
                          Configuración de Facturación
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBillingConfig(false)}
                          className="text-[10px] text-oro hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" /> VOLVER
                        </button>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wide text-cuerpo">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Efectivo', 'Nequi', 'Bancolombia'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border uppercase font-mono tracking-wider transition-all cursor-pointer ${
                                paymentMethod === method
                                  ? 'bg-oro/20 text-oro border-oro'
                                  : 'bg-tarjeta-fondo text-cuerpo border-borde hover:bg-hover-fondo'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Consumption tax Toggle Switch */}
                      <div className="flex items-center justify-between pt-2 border-t border-borde/50">
                        <div>
                          <span className="text-[11px] font-bold text-titulo block uppercase">Cobrar Impuesto de Consumo (8%)</span>
                          <span className="text-[9.5px] text-inactivo font-light block">Calcula y suma el 8% al subtotal del pedido</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIncludeTax(!includeTax)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center relative ${
                            includeTax ? 'bg-exito justify-end' : 'bg-borde justify-start'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-tarjeta-fondo shadow-sm block transition-all" />
                        </button>
                      </div>
                    </div>

                    {/* Totals Summary */}
                    <div className="border-t border-borde pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-atenuado">
                        <span>Subtotal Neto:</span>
                        <span className="font-mono font-medium">${selectedOrder.total.toLocaleString('es-CO')}</span>
                      </div>
                      {includeTax && (
                        <div className="flex justify-between text-atenuado">
                          <span>Impuestos (8% Consumo):</span>
                          <span className="font-mono font-medium text-oro">+ ${(selectedOrder.total * 0.08).toLocaleString('es-CO')}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-dashed border-borde pt-2 text-titulo font-black">
                        <span className="font-serif text-[13px] uppercase tracking-wide">TOTAL FACTURA (COP):</span>
                        <span className="font-mono text-base text-oro">
                          ${(selectedOrder.total + (includeTax ? selectedOrder.total * 0.08 : 0)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons Footer dynamic content based on state */}
              {!showBillingConfig ? (
                <div className="p-4 bg-hover-fondo border-t border-borde flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-acento hover:bg-hover-fondo text-cuerpo border border-borde rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all text-center cursor-pointer"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-hover-fondo border-t border-borde grid grid-cols-2 gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBillingConfig(false)}
                    className="bg-acento hover:bg-hover-fondo text-cuerpo py-3 px-3.5 rounded-lg font-mono text-[10px] font-extrabold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 border border-borde cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateInvoice(selectedOrder, paymentMethod, includeTax)}
                    className="bg-exito hover:bg-emerald-700 text-white py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                    title="Generar factura de pago oficial detallada"
                  >
                    <Check className="w-3.5 h-3.5" /> Generar Factura
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

