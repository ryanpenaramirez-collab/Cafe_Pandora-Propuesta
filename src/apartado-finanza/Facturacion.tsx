import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Clock, FileText } from 'lucide-react';
import { Order } from '../types';

interface FacturacionProps {
  orders: Order[];
}

export default function Facturacion({
  orders,
}: FacturacionProps) {
  const billedOrders = useMemo(() => {
    return orders
      .filter(order => order.status === 'facturado')
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [orders]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center pb-2.5 border-b border-pandora-wood/20">
        <div>
          <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-pandora-accent" /> Pedidos Finalizados
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Comandas finalizadas que pasaron por facturación (solo lectura).</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[10px] font-bold">
          {billedOrders.length} Finalizados
        </span>
      </div>

      {billedOrders.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 text-center select-none">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-serif font-bold text-slate-700 text-xs uppercase tracking-wider">Sin recibos finalizados</h4>
          <p className="text-[10px] text-slate-500 mt-1">No hay pedidos finalizados aún. Los recibos facturados aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {billedOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white text-[#2A2A2A] rounded-xl border border-[#E5E0D8] overflow-hidden flex flex-col justify-between shadow-md"
            >
              <div className="p-3.5 border-b border-[#E5E0D8] flex justify-between items-stretch shrink-0">
                <div className="text-left flex flex-col justify-between">
                  <span className="font-serif font-extrabold text-sm text-[#1A1A1A] block tracking-wider uppercase">
                    {order.tableName || `MESA ${order.tableId}`}
                  </span>
                  <span className="text-[10.5px] font-mono font-light text-[#6B6B6B] flex items-center gap-1 mt-1 leading-none">
                    <Clock className="w-2.5 h-2.5 text-[#6B6B6B] shrink-0" /> {order.timestamp}
                  </span>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                    FINALIZADO
                  </span>
                  <span className="text-[8.5px] text-[#6B6B6B] font-mono block mt-1 uppercase leading-none">
                    ID: #{order.id.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-[#5A5A5A] block font-mono">
                      Consumo Finalizado
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <div key={item.menuItemId} className="flex justify-between text-xs border-b border-[#E5E0D8] pb-1">
                          <span className="truncate pr-2 uppercase text-[#2A2A2A]">{item.name}</span>
                          <span className="font-mono text-[#2A2A2A] shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E0D8] flex justify-between items-center p-2 rounded mt-auto">
                    <span className="text-[9.5px] uppercase font-mono text-[#6B6B6B]">Total Finalizado</span>
                    <span className="font-mono text-sm font-black text-[#1A1A1A]">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
