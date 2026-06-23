/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Check, Trash2, Utensils, AlertCircle, ShoppingBag, MapPin, X, FileText, CheckSquare, Square, ArrowLeft, Plus, Minus, Split, Merge, Move } from 'lucide-react';
import { Order, ReceiptStatus, MenuItem, Table, OrderItem, BillSplit } from '../types';
import { jsPDF } from 'jspdf';

interface PendingOrdersModuleProps {
  orders: Order[];
  tables: Table[];
  menu: MenuItem[];
  onCompleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onUpdateReceiptStatus: (orderId: string, status: ReceiptStatus) => void;
  onAddItemsToOrder: (orderId: string, items: OrderItem[]) => void;
  onSplitBill: (orderId: string, splits: BillSplit[]) => void;
  onMergeTables: (sourceOrderId: string, targetTableId: number) => void;
  onChangeTable: (orderId: string, newTableId: number) => void;
  userRole?: 'administrador' | 'mesero';
}

export default function PendingOrdersModule({ orders, tables, menu, onCompleteOrder, onCancelOrder, onUpdateReceiptStatus, onAddItemsToOrder, onSplitBill, onMergeTables, onChangeTable, userRole = 'administrador' }: PendingOrdersModuleProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Nequi' | 'Bancolombia'>('Efectivo');
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [showBillingConfig, setShowBillingConfig] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<'none' | 'addProducts' | 'splitBill' | 'mergeTables' | 'changeTable'>('none');
  const [addCart, setAddCart] = useState<OrderItem[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [addTab, setAddTab] = useState<'todos' | 'platillo' | 'bebida'>('todos');
  const [addSubcategory, setAddSubcategory] = useState<string | null>(null);
  const [splitMap, setSplitMap] = useState<Record<string, number>>({});
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);
  const [changeNewTableId, setChangeNewTableId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      setPaymentMethod('Efectivo');
      setIncludeTax(false);
      setShowBillingConfig(false);
      setActiveAction('none');
      setAddCart([]);
      setAddSearch('');
      setAddTab('todos');
      setAddSubcategory(null);
      setSplitMap({});
      setMergeTargetId(null);
      setChangeNewTableId(null);
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
                  className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-between overflow-hidden group text-slate-800 cursor-pointer hover:border-pandora-accent transition-all duration-300 transform hover:scale-[1.01]"
                >
                  {/* Card Header: Mesa | Estado Recibo | Turno */}
                  <div className="bg-white p-3.5 border-b border-slate-200 flex justify-between items-stretch shrink-0">
                    <div className="text-left flex flex-col justify-between">
                      <span className="font-serif font-extrabold text-xs text-slate-800 block tracking-wider uppercase">
                        MESA {order.tableId}
                      </span>
                      <span className="text-[10.5px] font-mono font-light text-slate-500 flex items-center gap-1 mt-1 leading-none">
                        <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {placedTime}
                      </span>
                    </div>

                    {/* Receipt status badge */}
                    <div className="flex items-center justify-center px-2">
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        (order.receiptStatus ?? 'recibido') === 'recibido'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : (order.receiptStatus ?? 'recibido') === 'pendiente'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {(order.receiptStatus ?? 'recibido') === 'recibido' ? 'RECIBIDO' :
                         (order.receiptStatus ?? 'recibido') === 'pendiente' ? 'PENDIENTE' : 'HECHO'}
                      </span>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end">
                      <span className="text-[10.5px] font-mono font-bold text-slate-600 block leading-none">
                        Turno #{turnNumber}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block mt-1 uppercase leading-none">
                        ID: #{order.id.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body (ItemList) displaying products with their quantity only, no totals */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block font-mono">
                        ÍTEMS EN COMANDA
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {order.items.map((item) => (
                          <div 
                            key={item.menuItemId}
                            className="flex justify-between items-center text-xs border-b border-slate-100 pb-1 select-none last:border-0"
                          >
                            <span className="text-slate-700 leading-tight uppercase font-medium">
                              {item.name}
                            </span>
                            <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              Cant: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic action button based on receipt status */}
                  {userRole !== 'mesero' && (
                  <div className="bg-slate-50 border-t border-slate-200 p-2.5 grid grid-cols-2 gap-2 shrink-0">
                    {(order.receiptStatus ?? 'recibido') === 'recibido' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateKitchenReceipt(order, turnNumber);
                          onUpdateReceiptStatus(order.id, 'pendiente');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-[#2E7D32] hover:bg-[#25632a] text-white font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider transition-all text-center leading-none"
                        title="Generar Recibo Cocina"
                      >
                        Generar Recibo Cocina
                      </button>
                    )}
                    {(order.receiptStatus ?? 'recibido') === 'pendiente' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateReceiptStatus(order.id, 'hecho');
                        }}
                        className="py-1.5 px-2 rounded-lg bg-[#B85A48] hover:bg-[#9c4a3a] text-white font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider transition-all text-center leading-none"
                        title="Cambiar Estado Pedido"
                      >
                        Cambiar Estado Pedido
                      </button>
                    )}
                    {(order.receiptStatus ?? 'recibido') === 'hecho' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateInvoice(order, 'Efectivo', false);
                          onCompleteOrder(order.id);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-[#25632a] hover:bg-[#1d4f22] text-white font-mono font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm uppercase tracking-wider transition-all text-center leading-none"
                        title="Generar Factura Pago"
                      >
                        Generar Factura Pago
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Está seguro de cancelar el pedido #${order.id.slice(-4)} de la Mesa ${order.tableId}?`)) {
                          onCancelOrder(order.id);
                        }
                      }}
                      className="py-1.5 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs uppercase tracking-wider text-center"
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
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                        <div>
                          <span className="font-serif font-bold text-slate-800 uppercase tracking-wide">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">${item.price.toLocaleString('es-CO')} c/u &times; {item.quantity}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selection or Configuration Option */}
                {activeAction === 'none' && !showBillingConfig ? (
                  <div className="space-y-3.5 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono border-b border-slate-100 pb-1">
                      Acciones del Pedido
                    </span>
                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setActiveAction('addProducts')}
                        className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Agregar más productos al pedido actual"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-105 transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Agregar Productos</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Añade más items desde el catálogo al pedido actual.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const initialSplit: Record<string, number> = {};
                          selectedOrder.items.forEach(item => { initialSplit[item.menuItemId] = 1; });
                          setSplitMap(initialSplit);
                          setActiveAction('splitBill');
                        }}
                        className="p-4 rounded-xl border-2 border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Dividir el pedido en cuentas separadas"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-purple-600 group-hover:scale-105 transition-all">
                          <Split className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Separar Cuentas</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Divide el cobro en montos distintos entre comensales.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveAction('mergeTables')}
                        className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Fusionar pedido de otra mesa con este"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-amber-600 group-hover:scale-105 transition-all">
                          <Merge className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Unir Mesas</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Fusiona el pedido de otra mesa en un solo recibo.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveAction('changeTable')}
                        className="p-4 rounded-xl border-2 border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Cambiar el pedido a otra mesa"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-teal-600 group-hover:scale-105 transition-all">
                          <Move className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Cambiar Mesa</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Reasigna el pedido a una mesa disponible.
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedOrder) {
                            handleGenerateKitchenReceipt(selectedOrder, selectedOrderIndex);
                            onUpdateReceiptStatus(selectedOrder.id, 'pendiente');
                            setSelectedOrder(null);
                          }
                        }}
                        className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-pandora-accent bg-slate-50 hover:bg-amber-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Imprimir comanda para personal de cocina (Sin precios)"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-pandora-cream flex items-center justify-center group-hover:bg-pandora-accent group-hover:scale-105 transition-all">
                          <Utensils className="w-4 h-4 text-pandora-gold" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Recibo de Cocina</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Descarga la comanda de preparación directa sin precios para cocina.
                          </p>
                        </div>
                      </button>

                      {userRole !== 'mesero' && (
                      <button
                        type="button"
                        onClick={() => setShowBillingConfig(true)}
                        className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/10 text-left transition-all duration-200 group flex flex-col justify-between min-h-[120px] cursor-pointer"
                        title="Configurar factura de pago oficial detallada"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:bg-emerald-600 group-hover:scale-105 transition-all">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="mt-2.5">
                          <h4 className="font-serif font-bold text-slate-800 uppercase tracking-wide text-[11px]">Generar Factura</h4>
                          <p className="text-[9.5px] text-slate-450 font-light mt-0.5 leading-normal">
                            Abre la configuración de medios de pago, impuestos consumo 8% y totales.
                          </p>
                        </div>
                      </button>
                      )}
                    </div>
                  </div>
                ) : activeAction === 'addProducts' ? (
                  <div className="bg-[#FAF5EE] border border-slate-250 p-4 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono">
                        Agregar Productos
                      </span>
                      <button
                        type="button"
                        onClick={() => { setActiveAction('none'); setAddCart([]); }}
                        className="text-[10px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" /> VOLVER
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                          {(['todos', 'platillo', 'bebida'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => { setAddTab(tab); setAddSubcategory(null); }}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all tracking-wider cursor-pointer flex-1 ${
                                addTab === tab
                                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {tab === 'todos' ? 'Todos' : tab === 'platillo' ? 'Platillos' : 'Bebidas'}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={addSearch}
                          onChange={(e) => setAddSearch(e.target.value)}
                          className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-pandora-accent"
                        />
                      </div>
                      {addTab !== 'todos' && (
                        <div className="flex flex-wrap gap-1">
                          {(addTab === 'platillo'
                            ? ['entradas', 'principales', 'ensaladas', 'postres']
                            : ['gaseosas', 'cervezas', 'vinos', 'café', 'té', 'jugos', 'agua']
                          ).map(sub => (
                            <button
                              key={sub}
                              onClick={() => setAddSubcategory(addSubcategory === sub ? null : sub)}
                              className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                                addSubcategory === sub
                                  ? 'bg-pandora-accent text-white'
                                  : 'bg-white text-slate-500 border border-slate-200'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {menu.filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(addSearch.toLowerCase());
                        const matchesTab = addTab === 'todos'
                          || item.category === addTab
                          || (addTab === 'bebida' && item.category === 'gaseosa');
                        const matchesSub = !addSubcategory || item.subcategory === addSubcategory;
                        return matchesSearch && matchesTab && matchesSub && item.available;
                      }).map(item => {
                        const inCart = addCart.find(c => c.menuItemId === item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setAddCart(prev => {
                                const exists = prev.find(i => i.menuItemId === item.id);
                                if (exists) return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                                return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
                              });
                            }}
                            className={`flex justify-between items-center p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                              inCart ? 'border-pandora-accent bg-amber-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <span className="font-serif font-bold text-slate-800 uppercase text-[10px] block">{item.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">${item.price.toLocaleString('es-CO')}</span>
                            </div>
                            {inCart ? (
                              <span className="bg-pandora-accent text-white px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">{inCart.quantity}</span>
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        );
                      })}
                      {menu.filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(addSearch.toLowerCase());
                        const matchesTab = addTab === 'todos'
                          || item.category === addTab
                          || (addTab === 'bebida' && item.category === 'gaseosa');
                        const matchesSub = !addSubcategory || item.subcategory === addSubcategory;
                        return matchesSearch && matchesTab && matchesSub && item.available;
                      }).length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4">Sin resultados</p>
                      )}
                    </div>
                    {addCart.length > 0 && (
                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-500">{addCart.reduce((s, i) => s + i.quantity, 0)} items nuevos</span>
                        <span className="text-[10px] font-mono font-bold text-slate-700">+${addCart.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                ) : activeAction === 'splitBill' ? (
                  <div className="bg-[#FAF5EE] border border-slate-250 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono">
                        Separar Cuentas
                      </span>
                      <button
                        type="button"
                        onClick={() => { setActiveAction('none'); setSplitMap({}); }}
                        className="text-[10px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" /> VOLVER
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">Asigne cada producto a una cuenta (1, 2, 3...). Los que tengan la misma cuenta se agruparán.</p>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                      {selectedOrder.items.map((item) => (
                        <div key={item.menuItemId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="text-[10px] font-serif font-bold text-slate-800 uppercase block truncate">{item.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono">x{item.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3].map(n => (
                              <button
                                key={n}
                                onClick={() => setSplitMap(prev => ({ ...prev, [item.menuItemId]: prev[item.menuItemId] === n ? 1 : n }))}
                                className={`w-6 h-6 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer ${
                                  (splitMap[item.menuItemId] || 1) === n
                                    ? 'bg-pandora-accent text-white border-pandora-accent'
                                    : 'bg-white text-slate-400 border-slate-200 hover:border-pandora-accent'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {(() => {
                      const groups = new Map<number, OrderItem[]>();
                      selectedOrder.items.forEach(item => {
                        const g = splitMap[item.menuItemId] || 1;
                        if (!groups.has(g)) groups.set(g, []);
                        const existing = groups.get(g)!.find(i => i.menuItemId === item.menuItemId);
                        if (existing) {
                          existing.quantity += item.quantity;
                        } else {
                          groups.get(g)!.push({ ...item });
                        }
                      });
                      return groups.size > 1 && (
                        <div className="border-t border-slate-200 pt-2 space-y-1">
                          {Array.from(groups.entries()).map(([g, its]) => (
                            <div key={g} className="flex justify-between text-[10px] font-mono">
                              <span className="font-bold text-slate-700">Cuenta {g}</span>
                              <span className="text-slate-500">${its.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('es-CO')}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : activeAction === 'mergeTables' ? (
                  <div className="bg-[#FAF5EE] border border-slate-250 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono">
                        Unir Mesas
                      </span>
                      <button
                        type="button"
                        onClick={() => { setActiveAction('none'); setMergeTargetId(null); }}
                        className="text-[10px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" /> VOLVER
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">Seleccione una mesa ocupada para fusionar su pedido con la Mesa {selectedOrder.tableId}.</p>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {tables.filter(t => t.status === 'ocupada' && t.id !== selectedOrder.tableId && orders.some(o => o.tableId === t.id && o.status !== 'facturado')).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setMergeTargetId(mergeTargetId === t.id ? null : t.id)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-mono font-bold ${
                            mergeTargetId === t.id
                              ? 'bg-amber-100 border-amber-400 text-amber-800'
                              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-600'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                      {tables.filter(t => t.status === 'ocupada' && t.id !== selectedOrder.tableId && orders.some(o => o.tableId === t.id && o.status !== 'facturado')).length === 0 && (
                        <p className="col-span-3 text-[10px] text-slate-400 text-center py-4">No hay otras mesas ocupadas con pedidos activos.</p>
                      )}
                    </div>
                  </div>
                ) : activeAction === 'changeTable' ? (
                  <div className="bg-[#FAF5EE] border border-slate-250 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono">
                        Cambiar Mesa
                      </span>
                      <button
                        type="button"
                        onClick={() => { setActiveAction('none'); setChangeNewTableId(null); }}
                        className="text-[10px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" /> VOLVER
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">Seleccione una mesa disponible para reasignar el pedido.</p>
                    <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {tables.filter(t => t.status === 'vacía').map(t => (
                        <button
                          key={t.id}
                          onClick={() => setChangeNewTableId(changeNewTableId === t.id ? null : t.id)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer text-[10px] font-mono font-bold ${
                            changeNewTableId === t.id
                              ? 'bg-teal-100 border-teal-400 text-teal-800'
                              : 'bg-white border-slate-200 hover:border-teal-300 text-slate-600'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                      {tables.filter(t => t.status === 'vacía').length === 0 && (
                        <p className="col-span-3 text-[10px] text-slate-400 text-center py-4">No hay mesas disponibles.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Billing Configuration Form */}
                    <div className="bg-[#FAF5EE] border border-slate-250 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center border-b border-[#FAF5EE]/70 pb-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] block font-mono">
                          Configuración de Facturación
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowBillingConfig(false)}
                          className="text-[10px] text-pandora-accent hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" /> VOLVER
                        </button>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wide text-slate-600">Método de Pago</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Efectivo', 'Nequi', 'Bancolombia'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border uppercase font-mono tracking-wider transition-all cursor-pointer ${
                                paymentMethod === method
                                  ? 'bg-[#1C1510] text-[#FDF8F0] border-[#1C1510]'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Consumption tax Toggle Switch */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                        <div>
                          <span className="text-[11px] font-bold text-slate-800 block uppercase">Cobrar Impuesto de Consumo (8%)</span>
                          <span className="text-[9.5px] text-slate-400 font-light block">Calcula y suma el 8% al subtotal del pedido</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIncludeTax(!includeTax)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center relative ${
                            includeTax ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white shadow-sm block transition-all" />
                        </button>
                      </div>
                    </div>

                    {/* Totals Summary */}
                    <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-550">
                        <span>Subtotal Neto:</span>
                        <span className="font-mono font-medium">${selectedOrder.total.toLocaleString('es-CO')}</span>
                      </div>
                      {includeTax && (
                        <div className="flex justify-between text-slate-550">
                          <span>Impuestos (8% Consumo):</span>
                          <span className="font-mono font-medium text-amber-700">+ ${(selectedOrder.total * 0.08).toLocaleString('es-CO')}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-slate-800 font-black">
                        <span className="font-serif text-[13px] uppercase tracking-wide">TOTAL FACTURA (COP):</span>
                        <span className="font-mono text-base text-pandora-accent">
                          ${(selectedOrder.total + (includeTax ? selectedOrder.total * 0.08 : 0)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons Footer dynamic content based on state */}
              {activeAction !== 'none' ? (
                <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction('none');
                      setAddCart([]);
                      setSplitMap({});
                      setMergeTargetId(null);
                      setChangeNewTableId(null);
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-755 py-3 px-3.5 rounded-lg font-mono text-[10px] font-extrabold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver
                  </button>
                  {activeAction === 'addProducts' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOrder && addCart.length > 0) {
                          onAddItemsToOrder(selectedOrder.id, addCart);
                          setActiveAction('none');
                          setAddCart([]);
                          setSelectedOrder(null);
                        }
                      }}
                      disabled={addCart.length === 0}
                      className={`py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        addCart.length > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Agregar al Pedido
                    </button>
                  )}
                  {activeAction === 'splitBill' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOrder) {
                          const groups = new Map<number, OrderItem[]>();
                          selectedOrder.items.forEach(item => {
                            const g = splitMap[item.menuItemId] || 1;
                            if (!groups.has(g)) groups.set(g, []);
                            const existing = groups.get(g)!.find(i => i.menuItemId === item.menuItemId);
                            if (existing) {
                              existing.quantity += item.quantity;
                            } else {
                              groups.get(g)!.push({ ...item });
                            }
                          });
                          const splits: BillSplit[] = Array.from(groups.entries()).map(([g, its]) => ({
                            id: `split-${g}`,
                            items: its,
                          }));
                          if (splits.length > 1) {
                            onSplitBill(selectedOrder.id, splits);
                            setActiveAction('none');
                            setSplitMap({});
                            setSelectedOrder(null);
                          }
                        }
                      }}
                      disabled={new Set(Object.values(splitMap)).size <= 1}
                      className={`py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        new Set(Object.values(splitMap)).size > 1
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Confirmar División
                    </button>
                  )}
                  {activeAction === 'mergeTables' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOrder && mergeTargetId) {
                          const sourceOrders = orders.filter(o => o.tableId === mergeTargetId && o.status !== 'facturado');
                          const sourceOrder = sourceOrders.reduce((latest, o) =>
                            !latest || (o.createdAt || 0) > (latest.createdAt || 0) ? o : latest
                          , null as Order | null);
                          if (sourceOrder) {
                            onMergeTables(sourceOrder.id, selectedOrder.tableId);
                            setActiveAction('none');
                            setMergeTargetId(null);
                            setSelectedOrder(null);
                          }
                        }
                      }}
                      disabled={!mergeTargetId}
                      className={`py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        mergeTargetId
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Fusionar Mesas
                    </button>
                  )}
                  {activeAction === 'changeTable' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedOrder && changeNewTableId) {
                          onChangeTable(selectedOrder.id, changeNewTableId);
                          setActiveAction('none');
                          setChangeNewTableId(null);
                          setSelectedOrder(null);
                        }
                      }}
                      disabled={!changeNewTableId}
                      className={`py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        changeNewTableId
                          ? 'bg-teal-600 hover:bg-teal-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" /> Cambiar Mesa
                    </button>
                  )}
                </div>
              ) : !showBillingConfig ? (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all text-center cursor-pointer"
                  >
                    Cerrar Detalles
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBillingConfig(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-755 py-3 px-3.5 rounded-lg font-mono text-[10px] font-extrabold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleGenerateInvoice(selectedOrder, paymentMethod, includeTax);
                      onCompleteOrder(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    className="bg-[#2E7D32] hover:bg-emerald-700 text-white py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
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

