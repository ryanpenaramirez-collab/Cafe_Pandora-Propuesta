import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import { ReceiptPreviewProps } from './types';
import { formatCOP, combineOrderItems, calculateBilling, generateInvoiceNumber } from './utils';

export default function ReceiptPreview({
  table, orders, printType, paymentMethod, applyTax, onToggleTax, onPrint, onClose,
}: ReceiptPreviewProps) {
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

  const handlePrint = () => {
    const typeLabel = printType === 'cooking' ? 'comanda de cocina' : 'factura de cobro';
    alert(`¡Impresión física iniciada exitosamente! Se ha transferido el ticket de ${typeLabel} a la impresora térmica de Café Pandora.`);
    onPrint();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-[#FAF8F5] rounded-2xl shadow-2xl relative border-t-8 border-pandora-gold max-h-[90vh] flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="overflow-y-auto p-5 pt-8">
            {printType === 'cooking' ? (
              <>
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
                    TICKET DE COCINA
                  </span>
                  <h5 className="font-serif font-black text-sm tracking-widest text-[#2D2A26] uppercase leading-none">
                    PANDORA COMANDA
                  </h5>
                </div>

                <div className="py-3 space-y-1.5 text-xs text-slate-700 font-mono border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>Mesa:</span>
                    <span className="font-bold">No. {table.id} - {table.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha/Hora:</span>
                    <span className="font-bold">{displayTime}</span>
                  </div>
                </div>

                <div className="py-3">
                  <div className="grid grid-cols-12 text-[10px] font-bold uppercase text-slate-500 pb-2 border-b select-none">
                    <span className="col-span-9">Producto</span>
                    <span className="col-span-3 text-right">Cantidad</span>
                  </div>
                  <div className="divide-y divide-dotted pt-2">
                    {combinedItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-sm py-2">
                        <span className="col-span-9 font-serif font-bold text-[#2D2A26]">{item.name}</span>
                        <span className="col-span-3 text-right font-mono font-black text-lg">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400 italic">
                  <p>Control de Servicio Interno — Café Pandora</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-2 inline-block">
                    FACTURA POS
                  </span>
                  <h5 className="font-serif font-black text-sm tracking-widest text-[#2D2A26] uppercase leading-none">
                    CAFÉ PANDORA
                  </h5>
                  <p className="text-[9px] text-slate-500 mt-1">Dirección local · NIT 901.381.189-4</p>
                </div>

                <div className="py-3 space-y-1.5 text-xs text-slate-700 font-mono border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>Factura No:</span>
                    <span className="font-bold">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesa:</span>
                    <span className="font-bold">No. {table.id} ({table.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha/Hora:</span>
                    <span className="font-bold">{displayTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método de Pago:</span>
                    <span className="font-bold uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{paymentMethod}</span>
                  </div>
                </div>

                <div className="py-3">
                  <div className="grid grid-cols-12 text-[9px] font-bold uppercase text-slate-500 pb-2 border-b border-dashed select-none">
                    <span className="col-span-5">Producto</span>
                    <span className="col-span-2 text-center">Cant</span>
                    <span className="col-span-2 text-right">Unit.</span>
                    <span className="col-span-3 text-right">Subtotal</span>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {combinedItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-xs items-center text-[#2D2A26]">
                        <span className="col-span-5 font-serif font-bold truncate">{item.name}</span>
                        <span className="col-span-2 text-center font-mono">x{item.quantity}</span>
                        <span className="col-span-2 text-right font-mono">{formatCOP(item.price)}</span>
                        <span className="col-span-3 text-right font-mono font-bold">{formatCOP(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 py-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Neto:</span>
                    <span>{formatCOP(subtotal)}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Impuesto Consumo (8%):</span>
                      <span>+{formatCOP(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-extrabold text-[#2D2A26] border-t border-dotted pt-2 mt-2">
                    <span>TOTAL CLIENTE:</span>
                    <span className="text-emerald-700">{formatCOP(total)}</span>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
                  <p>¡Gracias por su visita! ☕</p>
                  <p className="text-[8px] font-sans uppercase font-bold">
                    Impuesto: {applyTax ? 'Habilitado (8%)' : 'Deshabilitado'}
                  </p>

                  <button
                    onClick={onToggleTax}
                    className="mt-2 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-bold cursor-pointer transition-colors"
                  >
                    {applyTax ? 'DESACTIVAR' : 'ACTIVAR'} IMPUESTO
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handlePrint}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] transition-all ${
                printType === 'cooking' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-cyan-700 hover:bg-cyan-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              Enviar a Impresora Térmica
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
