import { useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import { X, Check, ArrowLeft, Wallet, Smartphone, CreditCard } from 'lucide-react';
import { Order } from '../types';
import { jsPDF } from 'jspdf';

interface BillingModalProps {
  order: Order;
  onCompleteOrder: (orderId: string) => void;
  onClose: () => void;
}

export default function BillingModal({ order, onCompleteOrder, onClose }: BillingModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo');
  const [transferEntity, setTransferEntity] = useState<'Nequi' | 'Daviplata' | 'Nu'>('Nequi');
  const [includeTax, setIncludeTax] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  const cleanId = order.id.replace('ord-', '').toUpperCase();
  const invoiceNumber = `FAC-${cleanId}`;
  const subtotalBruto = order.total;
  const taxRate = 0.08;
  const taxAmount = includeTax ? subtotalBruto * taxRate : 0;
  const finalTotal = subtotalBruto + taxAmount;
  const cambio = cashReceived ? Math.max(0, parseFloat(cashReceived) - finalTotal) : 0;

  const methodIcons: Record<string, ReactNode> = {
    Efectivo: <Wallet className="w-5 h-5" />,
    Transferencia: <Smartphone className="w-5 h-5" />,
    Tarjeta: <CreditCard className="w-5 h-5" />,
  };

  const handleGenerateInvoice = () => {
    setIsProcessing(true);

    if (paymentMethod !== 'Tarjeta') {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      doc.setFont('helvetica', 'normal');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('Cafe Pandora - Bistro Cafe Bar', 105, 25, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Experiencia Culinaria Unica & Cocteleria de Autor', 105, 31, { align: 'center' });

      doc.setDrawColor(214, 108, 80);
      doc.setLineWidth(0.8);
      doc.line(20, 36, 190, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DE LA FACTURA:', 20, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Factura N°: ${invoiceNumber}`, 20, 51);
      doc.text(`Fecha de Emision: ${new Date().toLocaleDateString('es-ES')}`, 20, 56);
      doc.text(`Hora de Registro: ${order.timestamp}`, 20, 61);

      doc.setFont('helvetica', 'bold');
      doc.text('DETALLES DE SERVICIO:', 120, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mesa Asignada: Mesa ${order.tableId}`, 120, 51);
      doc.text(`Mesero Atendiendo: ${order.waiterName}`, 120, 56);
      doc.text(`Metodo de Pago: ${paymentMethod === 'Transferencia' ? `TRANSFERENCIA - ${transferEntity}` : paymentMethod.toUpperCase()}`, 120, 61);

      doc.setFillColor(248, 250, 252);
      doc.rect(20, 72, 170, 8, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, 72, 190, 72);
      doc.line(20, 80, 190, 80);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Descripcion Producto', 25, 77);
      doc.text('Cant.', 115, 77, { align: 'center' });
      doc.text('Precio Unit.', 145, 77, { align: 'center' });
      doc.text('Importe Total', 180, 77, { align: 'center' });

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
      doc.setFillColor(254, 243, 199);
      doc.rect(110, y - 4, 80, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(146, 64, 14);
      doc.text('TOTAL FACTURADO:', 115, y + 1);
      doc.text(`$${finalTotal.toLocaleString('es-CO')}`, 180, y + 1, { align: 'center' });

      y = Math.max(y + 25, 250);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Esta es una reproduccion digital de comanda de facturacion de Cafe Pandora.', 105, y + 5, { align: 'center' });
      doc.text('Gracias por su visita al Bistro Cafe Bar! Le esperamos pronto.', 105, y + 9, { align: 'center' });

      const filename = `Factura-${invoiceNumber}-Mesa${order.tableId}.pdf`;
      doc.save(filename);
    }

    onCompleteOrder(order.id);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-pandora-dark text-pandora-cream p-4 shrink-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pandora-accent flex items-center justify-center text-xs font-serif font-extrabold text-white">
              {order.tableId}
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-pandora-gold uppercase tracking-wider">
                Mesa {order.tableId}
              </h3>
              <p className="text-[9px] text-slate-400 font-mono">
                {new Date().toLocaleDateString('es-ES')} &mdash; {order.timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">

          {/* Mesa + Total destacado */}
          <div className="flex justify-between items-center bg-slate-50 -mx-5 -mt-5 px-5 py-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Mesa</span>
              <p className="text-xl font-bold font-serif text-slate-800">Mesa {order.tableId}</p>
              <p className="text-[10px] text-slate-500 font-mono">{order.waiterName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Total</span>
              <p className="text-2xl font-black text-pandora-accent font-mono">${finalTotal.toLocaleString('es-CO')}</p>
            </div>
          </div>

          {/* MÉTODO DE PAGO - square cards with icons */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block font-mono mb-2.5">
              M&eacute;todo de Pago
            </span>
            <div className="grid grid-cols-3 gap-3">
              {(['Efectivo', 'Transferencia', 'Tarjeta'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setPaymentMethod(method); setCashReceived(''); }}
                  className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'border-pandora-accent bg-pandora-accent/5 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    paymentMethod === method
                      ? 'bg-pandora-accent text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {methodIcons[method]}
                  </div>
                  <span className={`text-[10px] font-bold uppercase font-mono tracking-wider transition-colors ${
                    paymentMethod === method ? 'text-pandora-accent' : 'text-slate-500'
                  }`}>
                    {method}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Entidad de Transferencia */}
          {paymentMethod === 'Transferencia' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wide text-slate-600">
                Entidad de Transferencia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Nequi', 'Daviplata', 'Nu'] as const).map((entity) => (
                  <button
                    key={entity}
                    type="button"
                    onClick={() => setTransferEntity(entity)}
                    className={`py-2 px-3 text-[11px] font-bold rounded-lg border uppercase font-mono tracking-wider transition-all cursor-pointer ${
                      transferEntity === entity
                        ? 'bg-[#1C1510] text-[#FDF8F0] border-[#1C1510]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {entity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recibido + Cambio (solo Efectivo) */}
          {paymentMethod === 'Efectivo' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-600 block mb-1">
                  Recibido
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-6 pr-3 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-600 block mb-1">
                  Cambio
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    value={cambio}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-6 pr-3 text-xs font-mono font-bold text-emerald-600 outline-none cursor-default"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Impuesto Consumo Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex-1 pr-4">
              <span className="text-[11px] font-bold text-slate-800 block uppercase leading-tight">
                Cobrar Impuesto de Consumo (8%)
              </span>
              <span className="text-[9.5px] text-slate-400 font-light block mt-0.5">
                Calcula y suma el 8% al subtotal del pedido
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncludeTax(!includeTax)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center relative shrink-0 ${
                includeTax ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-sm block transition-all" />
            </button>
          </div>

          {/* Desglose */}
          <div className="border-t border-slate-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono font-medium">${subtotalBruto.toLocaleString('es-CO')}</span>
            </div>
            {includeTax && (
              <div className="flex justify-between text-slate-600">
                <span>Impuesto (8%)</span>
                <span className="font-mono font-semibold text-amber-700">+${taxAmount.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base font-bold">
              <span className="text-slate-800">Total</span>
              <span className="font-mono text-emerald-600">${finalTotal.toLocaleString('es-CO')}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="py-3 px-3.5 rounded-lg font-mono text-[10px] font-extrabold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 border border-slate-300 bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerateInvoice}
            disabled={isProcessing}
            className="bg-[#2E7D32] hover:bg-emerald-700 text-white py-3 px-3.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            title={paymentMethod === 'Tarjeta' ? 'Confirmar cobro sin generar PDF' : 'Generar factura de pago oficial detallada'}
          >
            <Check className="w-3.5 h-3.5" /> {isProcessing ? 'Procesando...' : paymentMethod === 'Tarjeta' ? 'Confirmar Cobro' : 'Generar Factura'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
