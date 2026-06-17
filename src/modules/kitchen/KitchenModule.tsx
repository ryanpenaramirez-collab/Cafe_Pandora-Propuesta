/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChefHat, Coffee, Clock, Check, Play, AlertCircle } from 'lucide-react';
import { Order } from '../../types';

interface KitchenBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  role: 'chef' | 'barman';
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
}

export default function KitchenBarModal({ isOpen, onClose, orders, role, onUpdateOrderStatus }: KitchenBarModalProps) {
  const isChef = role === 'chef';

  // Filter orders according to role.
  // Chef handles food plates or mixed dishes. Barman handles drinks or mixed.
  const activeOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.status === 'listo') return false;
      if (isChef) {
        return order.type === 'comida' || order.type === 'mixto';
      } else {
        return order.type === 'bebida' || order.type === 'mixto';
      }
    });
  }, [orders, isChef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-sidebar-fondo/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-modal-fondo w-full max-w-4xl h-[75vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-borde"
      >
        {/* Header */}
        <div className={`p-4 text-white shrink-0 flex justify-between items-center ${isChef ? 'bg-acento' : 'bg-tarjeta-hover'}`}>
          <div className="flex items-center gap-2">
            {isChef ? (
              <ChefHat className="w-6 h-6 text-white animate-pulse" />
            ) : (
              <Coffee className="w-6 h-6 text-white animate-pulse" />
            )}
            <div>
              <h3 className="font-serif text-lg font-bold">
                {isChef ? 'Estación de Cocina — Principal Chef' : 'Controles de Barra — Bartender Laura'}
              </h3>
              <p className="text-[11px] opacity-90 font-light">
                {isChef ? 'Despacho de alimentos calientes y repostería' : 'Preparación expresa de café y bebidas tónicas'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full font-bold">
              {activeOrders.length} Pendientes
            </span>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 bg-pagina-fondo p-6 overflow-y-auto">
          {activeOrders.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-atenuado py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-borde flex items-center justify-center mb-3">
                <Check className="w-8 h-8 text-exito" />
              </div>
              <h4 className="font-serif text-lg font-bold text-atenuado">¡Todo al día!</h4>
              <p className="text-xs text-inactivo max-w-xs mt-1 leading-relaxed">
                No hay comandas entrantes pendientes de preparación en este momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {activeOrders.map((ord, idx) => (
                  <motion.div
                    key={ord.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl shadow-sm border flex flex-col justify-between bg-tarjeta-fondo relative overflow-hidden ${
                      ord.status === 'preparacion' 
                        ? 'border-oro ring-1 ring-oro/20' 
                        : 'border-borde'
                    }`}
                  >
                    {/* Urgency Badge Indicator */}
                    <div className={`absolute top-0 right-0 left-0 h-1.5 ${
                      ord.status === 'preparacion' ? 'bg-oro animate-pulse' : 'bg-text-muted/30'
                    }`}></div>

                    <div>
                      {/* Top bar info */}
                      <div className="flex justify-between items-center mb-3 mt-1 text-cuerpo">
                        <div>
                          <span className="font-serif font-bold text-base text-titulo">{ord.tableName}</span>
                          <span className="text-[10px] text-inactivo block font-mono">Pedigo: {ord.id} • Servido por {ord.waiterName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-atenuado bg-borde px-2 py-1 rounded-full font-mono font-medium shrink-0">
                          <Clock className="w-3.5 h-3.5 text-inactivo" />
                          <span>{ord.timestamp}</span>
                        </div>
                      </div>

                      {/* Items recipes lists */}
                      <div className="space-y-1.5 border-t border-b border-dashed border-borde py-3 mb-4">
                        {ord.items.map((item, ci) => (
                          <div key={ci} className="flex justify-between text-xs text-cuerpo font-medium">
                            <span className="flex items-center gap-2">
                              <span className="bg-borde text-atenuado w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono">
                                {item.quantity}
                              </span>
                              <span className="text-cuerpo font-sans">{item.name}</span>
                            </span>
                            <span className="text-inactivo text-[10px] font-mono">Prep: Standard</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {ord.status === 'espera' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(ord.id, 'preparacion')}
                          className="flex-1 bg-oro hover:bg-acento text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" /> Comenzar Preparación
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(ord.id, 'listo')}
                          className="flex-1 bg-exito hover:bg-exito-hover text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/15"
                        >
                          <Check className="w-4 h-4 text-white" /> ¡Listo para Despachar!
                        </button>
                      )}
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div className="bg-borde p-3 shrink-0 flex items-center gap-2 text-atenuado text-[11px] font-mono border-t border-borde">
          <AlertCircle className="w-4 h-4 text-atenuado" />
          <span>Las comandas listas notifican automáticamente al mesero para retirar el pedido de estación.</span>
        </div>
      </motion.div>
    </div>
  );
}
