/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Plus, Minus, ShoppingCart, Check, Trash2, Utensils, Coffee } from 'lucide-react';
import { MenuItem, Table, Order, OrderItem } from '../../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: MenuItem[];
  tables: Table[];
  waiterName: string;
  onPlaceOrder: (order: Order) => void;
}

export default function OrderModal({ isOpen, onClose, menu, tables, waiterName, onPlaceOrder }: OrderModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'platillo' | 'bebida'>('todos');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderSent, setOrderSent] = useState(false);

  // Available interactive tables
  const availableTables = useMemo(() => {
    return tables;
  }, [tables]);

  const filteredItems = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.available;
    });
  }, [menu, searchTerm, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.menuItemId === item.id);
      if (exists) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.menuItemId === itemId) {
          const newQty = i.quantity + change;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== itemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const handleSendOrder = () => {
    if (!selectedTableId) return;
    if (cart.length === 0) return;

    const targetTable = tables.find(t => t.id === selectedTableId);
    
    // Determine order type based on elements in cart
    const hasComida = cart.some(ci => menu.find(m => m.id === ci.menuItemId)?.category === 'platillo');
    const hasBebida = cart.some(ci => menu.find(m => m.id === ci.menuItemId)?.category === 'bebida');
    let type: 'comida' | 'bebida' | 'mixto' = 'mixto';
    if (hasComida && !hasBebida) type = 'comida';
    if (!hasComida && hasBebida) type = 'bebida';

    const newOrder: Order = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: selectedTableId,
      tableName: targetTable?.name || `Mesa ${selectedTableId}`,
      waiterName: waiterName || 'Meseros',
      items: cart,
      status: 'espera',
      type,
      total: cartTotal,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    onPlaceOrder(newOrder);
    setOrderSent(true);

    setTimeout(() => {
      // Reset values
      setCart([]);
      setSelectedTableId(null);
      setOrderSent(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-acento/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-modal-fondo w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-borde/10"
      >
        {/* Header */}
        <div className="bg-oro p-4 shrink-0 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-serif text-lg font-bold">Tomar Pedido POS — Mesero: {waiterName}</h3>
              <p className="text-[11px] text-amber-100 font-light">Sincronizado con cocina y comensales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-acento-hover rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {orderSent && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-acento z-50 flex flex-col items-center justify-center text-center p-6 text-white"
            >
              <div className="w-16 h-16 rounded-full bg-exito flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                <Check className="w-8 h-8 text-white animate-bounce" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">¡Comprobante Enviado!</h4>
              <p className="text-sm text-cuerpo max-w-sm mt-2 font-light">
                La comanda ha sido enviada con éxito. Los chefs y bartenders verán la orden en sus paneles de inmediato.
              </p>
              <div className="mt-4 text-xs font-mono text-oro">
                Total acumulado: ${cartTotal.toLocaleString('es-CO')} COP
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content columns split */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Menu Selector */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-pagina-fondo border-r border-borde">
            
            {/* Table Selection */}
            <div className="mb-4 bg-acento p-3 rounded-xl border border-borde">
              <label className="block text-xs font-bold text-cuerpo uppercase tracking-widest mb-1.5">
                Seleccionar Mesa Destino <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableTables.map(t => {
                  let badgeColor = '';
                  let disabled = false;
                  
                  if (t.status === 'ocupada') badgeColor = 'bg-peligro-superficie border-peligro/30 text-peligro';
                  else if (t.status === 'por_pagar') badgeColor = 'bg-advertencia-superficie border-oro/30 text-oro';
                  else if (t.status === 'reservada') badgeColor = 'bg-exito-superficie border-exito/30 text-exito';
                  else badgeColor = 'bg-borde border-borde text-cuerpo';

                  const isSelected = selectedTableId === t.id;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTableId(t.id)}
                      className={`py-1.5 px-1 text-center rounded-lg border text-xs font-semibold uppercase flex flex-col items-center justify-center transition-all ${
                        isSelected 
                          ? 'ring-2 ring-amber-500 bg-oro border-amber-600 text-white' 
                          : badgeColor
                      }`}
                    >
                      <span className="text-[10px] block font-semibold">T-{t.id}</span>
                      <span className="text-[9px] scale-90 whitespace-nowrap opacity-80 font-normal">Cap: {t.capacity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Menu Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-atenuado absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar platillo o bebida..."
                  className="w-full bg-acento border border-borde rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-1 shrink-0">
                {(['todos', 'platillo', 'bebida'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium border transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-oro text-white border-amber-500' 
                        : 'bg-acento hover:bg-hover-fondo text-cuerpo border-borde'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos' : cat === 'platillo' ? 'Comida' : 'Bebidas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="bg-acento p-3 rounded-xl border border-borde flex flex-col justify-between hover:border-oro/30 transition-all shadow-sm group"
                >
                  <div className="flex justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        {item.category === 'platillo' ? (
                          <Utensils className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Coffee className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-titulo group-hover:text-oro transition-colors">{item.name}</h4>
                      </div>
                      <p className="text-[11px] text-atenuado mt-0.5 line-clamp-2 leading-snug">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                    <span className="text-xs font-mono font-bold text-cuerpo">${item.price.toLocaleString('es-CO')} COP</span>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="bg-oro-superficie hover:bg-oro hover:text-white text-oro text-[10px] uppercase tracking-wider font-bold py-1 px-3 rounded-full transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Agregar
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-atenuado text-xs">
                  Ningún elemento coincide con la búsqueda.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Ticket Cart Recap */}
          <div className="w-full md:w-80 shrink-0 bg-borde/50 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center pb-2 border-b border-borde mb-3 shrink-0">
                <span className="text-xs font-bold text-cuerpo uppercase tracking-wider">Detalles Orden</span>
                <span className="bg-borde text-titulo text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
              </div>

              {/* Table Alert Warn if missing */}
              {!selectedTableId && (
                <div className="bg-advertencia-superficie border border-oro/30 p-2.5 rounded-lg text-oro text-[11px] flex gap-2 mb-3 shrink-0">
                  <span>⚠️</span>
                  <span>Seleccione una mesa primero para habilitar la orden.</span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="bg-acento p-2 text-xs rounded-lg border border-borde flex items-center justify-between gap-1 group">
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="font-semibold text-titulo truncate">{item.name}</p>
                      <p className="text-[10px] text-atenuado font-mono">${item.price.toLocaleString('es-CO')} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="p-0.5 hover:bg-hover-fondo rounded text-cuerpo border border-borde"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-titulo text-center w-3">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="p-0.5 hover:bg-hover-fondo rounded text-cuerpo border border-borde"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1 text-atenuado hover:text-peligro hover:bg-peligro-superficie rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="h-44 flex flex-col justify-center items-center text-center text-atenuado py-12">
                    <ShoppingCart className="w-8 h-8 opacity-30 mb-2" />
                    <p className="text-xs">El carrito está vacío.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className="border-t border-borde pt-3 space-y-1.5 shrink-0">
              <div className="flex justify-between text-xs text-atenuado">
                <span>Subtotal</span>
                <span className="font-mono">${cartTotal.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-xs text-atenuado">
                <span>Servicio Impl. (10%)</span>
                <span className="font-mono">${Math.round(cartTotal * 0.1).toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-base font-bold text-titulo pt-1.5 border-t border-dashed border-borde">
                <span>Total Estimado</span>
                <span className="font-mono text-oro">${Math.round(cartTotal * 1.1).toLocaleString('es-CO')} COP</span>
              </div>

              <button
                type="button"
                onClick={handleSendOrder}
                disabled={!selectedTableId || cart.length === 0}
                className="w-full bg-oro disabled:opacity-50 disabled:cursor-not-allowed hover:bg-acento-hover text-white rounded-xl py-2.5 text-xs uppercase tracking-wider font-semibold shadow-lg shadow-amber-500/10 mt-3 transition-colors text-center"
              >
                🍳 Enviar Comanda a Prep.
              </button>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
