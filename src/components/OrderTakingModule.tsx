/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, ShoppingCart, Check, Trash2, 
  Utensils, Coffee, ClipboardList, RefreshCw, Wine 
} from 'lucide-react';
import { MenuItem, Table, Order, OrderItem } from '../types';

interface OrderTakingModuleProps {
  menu: MenuItem[];
  tables: Table[];
  waiterName: string;
  onPlaceOrder: (order: Order) => void;
  onAddTable?: (name: string) => void;
}

export default function OrderTakingModule({ menu, tables, waiterName, onPlaceOrder, onAddTable }: OrderTakingModuleProps) {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [customTableNumber, setCustomTableNumber] = useState<string>('');
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<'Exterior' | 'Terraza'>('Exterior');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'todos' | 'platillo' | 'bebida'>('todos');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showsSuccess, setShowsSuccess] = useState(false);

  const selectedTable = useMemo(() => {
    return tables.find(t => t.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  const tableDisplayName = useMemo(() => {
    return selectedTable ? selectedTable.name : (customTableNumber ? `Mesa ${customTableNumber}` : '');
  }, [selectedTable, customTableNumber]);

  // Filter menu items
  const filteredCatalog = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCatalogTab === 'todos'
        || item.category === activeCatalogTab
        || (activeCatalogTab === 'bebida' && item.category === 'gaseosa');
      const matchesSubcategory = !activeSubcategory || item.subcategory === activeSubcategory;
      return matchesSearch && matchesCategory && matchesSubcategory && item.available;
    });
  }, [menu, searchTerm, activeCatalogTab, activeSubcategory]);

  // Catalog grouped by category
  const groupedCatalog = useMemo(() => {
    const platillos = filteredCatalog.filter(item => item.category === 'platillo');
    const bebidas = filteredCatalog.filter(item => item.category === 'bebida' || item.category === 'gaseosa');
    return { platillos, bebidas };
  }, [filteredCatalog]);

  // Cart operations
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
      }).filter((i): i is OrderItem => i !== null);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== itemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // Submit order handling
  const handleConfirmOrder = () => {
    const finalTableId = selectedTableId || parseInt(customTableNumber, 10);
    if (!finalTableId || isNaN(finalTableId)) return;
    if (cart.length === 0) return;

    const targetTable = tables.find(t => t.id === finalTableId);

    // Determine type: 'comida' | 'bebida' | 'mixto'
    const hasComida = cart.some(ci => menu.find(m => m.id === ci.menuItemId)?.category === 'platillo');
    const hasBebida = cart.some(ci => {
      const cat = menu.find(m => m.id === ci.menuItemId)?.category;
      return cat === 'bebida' || cat === 'gaseosa';
    });
    let type: 'comida' | 'bebida' | 'mixto' = 'mixto';
    if (hasComida && !hasBebida) type = 'comida';
    if (!hasComida && hasBebida) type = 'bebida';

    const newOrder: Order = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: finalTableId,
      tableName: targetTable?.name || `Mesa ${finalTableId}`,
      waiterName: waiterName || 'Mesero',
      items: cart,
      status: 'espera',
      type,
      total: cartTotal,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now()
    };

    onPlaceOrder(newOrder);
    setShowsSuccess(true);

    setTimeout(() => {
      setCart([]);
      setSelectedTableId(null);
      setCustomTableNumber('');
      setShowsSuccess(false);
    }, 1500);
  };

  const handleAddNewTable = () => {
    if (!newTableName.trim()) return;
    const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    
    let inputVal = newTableName.trim();
    if (inputVal.toLowerCase().startsWith('mesa')) {
      inputVal = inputVal.slice(4).trim();
    }
    const formattedName = `Mesa ${inputVal} (${newTableType})`;

    if (onAddTable) {
      onAddTable(formattedName);
    }
    setSelectedTableId(nextId);
    setIsNewTableModalOpen(false);
    setNewTableName('');
    setNewTableType('Exterior');
  };

  return (
    <div id="order_taking_module" className="bg-[#FDF8F0] border border-slate-300 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      
      {showsSuccess ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center p-8 bg-emerald-50/50"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm border border-emerald-200 animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-800 uppercase tracking-wider">¡Pedido Confirmado!</h3>
          <p className="text-xs text-slate-500 mt-1.5 font-light text-center">La comanda ha sido enviada con éxito a la Cola de Preparaciones de la Cocina / Barra.</p>
        </motion.div>
      ) : selectedTableId === null && !customTableNumber ? (
        /* STEP 1: SELECT TABLE NUMBER Only ask for the table number, nothing else */
        <div className="p-5 flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-pandora-accent" /> Seleccione la Mesa
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Elija una mesa del salón o registre una mesa alterna abajo.</p>
            </div>
          </div>

          {/* Table Grid Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map(t => {
              let statusText = "Vacía";
              let statusStyles = "bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs";

              if (t.status === 'ocupada') {
                statusText = `Ocupada ($${t.totalAmount.toFixed(0)})`;
                statusStyles = "bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50";
              } else if (t.status === 'reservada') {
                statusText = "Reservada";
                statusStyles = "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50";
              } else if (t.status === 'por_pagar') {
                statusText = `Por Pagar ($${t.totalAmount.toFixed(0)})`;
                statusStyles = "bg-amber-50/50 border-amber-200 text-amber-800 hover:bg-amber-50";
              }

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${statusStyles}`}
                >
                  <span className="font-serif text-xs font-bold truncate max-w-full px-1">{t.name}</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-light">{statusText}</span>
                </button>
              );
            })}
          </div>

          {/* Agregar nueva mesa button and modal */}
          <div className="border-t border-slate-150 pt-5 mt-2 flex flex-col items-center">
            <p className="text-[11px] text-slate-400 mb-3 text-center">¿No encuentra la mesa? Cree una personalizada al instante.</p>
            <button
              onClick={() => setIsNewTableModalOpen(true)}
              className="bg-pandora-accent hover:bg-pandora-accent/90 text-white font-mono uppercase text-[10px] font-bold tracking-wider px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 animate-pulse" />
              Agregar nueva mesa
            </button>
          </div>

          {/* Modal para agregar nueva mesa */}
          <AnimatePresence>
            {isNewTableModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsNewTableModalOpen(false);
                    setNewTableName('');
                  }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                />

                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl relative z-10 flex flex-col gap-4 text-slate-800"
                >
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Plus className="w-5 h-5 text-pandora-accent animate-pulse" />
                      Agregar Nueva Mesa
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">Escriba el nombre o identificador único para la nueva mesa.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Nombre o Número de la Mesa</label>
                      <input
                        type="text"
                        placeholder="Ej. 14 o VIP"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-pandora-accent/40 focus:border-pandora-accent"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTableName.trim()) {
                            handleAddNewTable();
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1.5">Tipo de Mesa</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewTableType('Exterior')}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newTableType === 'Exterior'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          Exterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTableType('Terraza')}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newTableType === 'Terraza'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          Terraza
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 mt-1.5">
                      <span className="text-[9px] uppercase font-mono tracking-wide text-amber-800 font-bold block mb-1 select-none">Vista Previa Automática</span>
                      <p className="text-xs font-serif font-bold text-slate-800">
                        {(() => {
                          let inputVal = newTableName.trim();
                          if (inputVal.toLowerCase().startsWith('mesa')) {
                            inputVal = inputVal.slice(4).trim();
                          }
                          return `Mesa ${inputVal || '___'} (${newTableType})`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2 justify-end">
                    <button
                      onClick={() => {
                        setIsNewTableModalOpen(false);
                        setNewTableName('');
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={!newTableName.trim()}
                      onClick={handleAddNewTable}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-sm cursor-pointer ${
                        newTableName.trim()
                          ? 'bg-pandora-accent hover:bg-pandora-accent/90 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Confirmar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* STEP 2: CATÁLOGOS Y SELECCIÓN DE PRODUCTOS */
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          
          {/* CATALOG PANEL (LEFT/MID) */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col min-w-0">
            
            {/* Catalog Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">Categoría Pedidos</span>
                <h4 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-normal">
                  {tableDisplayName} &bull; Catálogo de Productos
                </h4>
              </div>
              <button 
                onClick={() => {
                  setSelectedTableId(null);
                  setCustomTableNumber('');
                  setCart([]);
                }}
                className="text-[10px] text-pandora-accent hover:underline font-bold tracking-wider font-mono cursor-pointer"
              >
                &larr; Cambiar Mesa
              </button>
            </div>

            {/* Selection tools: Tabs & Search — 2-row layout */}
            <div className="flex flex-col gap-2.5 mb-4 shrink-0">
              {/* Fila 1: 65% category tabs + 35% search (no icon) */}
              <div className="flex gap-2.5">
                <div className="w-[65%] bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                  {(['todos', 'platillo', 'bebida'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveCatalogTab(tab); setActiveSubcategory(null); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all tracking-wider cursor-pointer flex-1 ${
                        activeCatalogTab === tab
                          ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'todos' ? 'Todos' : tab === 'platillo' ? 'Platillos' : 'Bebidas'}
                    </button>
                  ))}
                </div>
                <div className="w-[35%]">
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-accent text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
              {/* Fila 2: subcategorías dinámicas */}
              {activeCatalogTab !== 'todos' && (
                <div className="flex flex-wrap gap-1.5">
                  {(activeCatalogTab === 'platillo'
                    ? ['entradas', 'principales', 'ensaladas', 'postres']
                    : ['gaseosas', 'cervezas', 'vinos', 'café', 'té', 'jugos', 'agua']
                  ).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all tracking-wider cursor-pointer ${
                        activeSubcategory === sub
                          ? 'bg-pandora-accent text-white shadow-xs'
                          : 'bg-white text-slate-500 border border-slate-200 hover:border-pandora-accent'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>



            {/* Catalog Items lists grouped nicely */}
            <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 space-y-6">
              
              {/* FOOD GROUP */}
              {(activeCatalogTab === 'todos' || activeCatalogTab === 'platillo') && groupedCatalog.platillos.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] border-b border-dashed border-slate-200 pb-1 mb-2 font-mono flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 inline text-pandora-accent" /> {activeCatalogTab === 'todos' ? 'PLATILLOS & BEBIDAS' : 'PLATILLOS & ALIMENTOS'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedCatalog.platillos.map(item => {
                      const cartItem = cart.find(i => i.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={`p-2.5 rounded-xl border transition-all hover:bg-slate-50 cursor-pointer text-left flex items-center gap-3 min-h-[90px] shrink-0 ${
                            cartItem 
                              ? 'border-pandora-accent bg-amber-50/20 shadow-xs' 
                              : 'border-slate-200 bg-white hover:border-slate-350'
                          }`}
                        >
                          {item.image && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 shadow-xs">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div>
                              <span className="font-serif font-bold text-xs text-slate-850 line-clamp-1 block uppercase leading-tight">{item.name}</span>
                              <p className="text-[9.5px] text-slate-405 font-light line-clamp-2 mt-0.5 leading-normal">{item.description}</p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-pandora-accent block mt-1">${item.price.toLocaleString('es-CO')}</span>
                          </div>
                          
                          {cartItem && (
                            <span className="bg-pandora-accent text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold shadow-xs shrink-0 self-center">
                              {cartItem.quantity}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BEVERAGES GROUP */}
              {(activeCatalogTab === 'todos' || activeCatalogTab === 'bebida') && groupedCatalog.bebidas.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A6A] border-b border-dashed border-slate-200 pb-1 mb-2 font-mono flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 inline text-pandora-accent" /> Bebidas & Barra
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedCatalog.bebidas.map(item => {
                      const cartItem = cart.find(i => i.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={`p-2.5 rounded-xl border transition-all hover:bg-slate-50 cursor-pointer text-left flex items-center gap-3 min-h-[90px] shrink-0 ${
                            cartItem 
                              ? 'border-pandora-accent bg-amber-50/20' 
                              : 'border-slate-200 bg-white hover:border-slate-350'
                          }`}
                        >
                          {item.image && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 shadow-xs">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div>
                              <span className="font-serif font-bold text-xs text-slate-850 line-clamp-1 block uppercase leading-tight">{item.name}</span>
                              <p className="text-[9.5px] text-slate-405 font-light line-clamp-2 mt-0.5 leading-normal">{item.description}</p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-pandora-accent block mt-1">${item.price.toLocaleString('es-CO')}</span>
                          </div>
                          
                          {cartItem && (
                            <span className="bg-pandora-accent text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold shadow-xs shrink-0 self-center">
                              {cartItem.quantity}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredCatalog.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-xs font-light bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Ningún producto disponible coincide con la búsqueda.
                </div>
              )}

            </div>
          </div>

          {/* ORDER SUMMARY PANEL (RIGHT) */}
          <div className="w-full lg:w-80 p-4 bg-slate-50/60 flex flex-col shrink-0 min-h-[400px]">
            <div className="border-b border-slate-150 pb-2.5 mb-3">
              <h4 className="font-serif text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-pandora-accent" /> Resumen de {tableDisplayName}
              </h4>
            </div>

            {/* Cart Elements Scroll list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[280px]">
              {cart.length === 0 ? (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart className="w-7 h-7 text-slate-350 stroke-[1.5] mb-2" />
                  <p className="text-[11px] font-serif font-medium text-slate-500">Comanda vacía</p>
                  <p className="text-[10px] text-slate-400 font-light mt-1.5 text-center">Toque los productos de la izquierda para agregarlos a la comanda.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.menuItemId}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-xs shadow-xs"
                  >
                    <div className="min-w-0 flex-1 pr-1.5">
                      <span className="font-serif font-bold text-slate-850 block leading-tight truncate uppercase text-[11px]">{item.name}</span>
                      <span className="text-[10px] text-pandora-accent font-mono block mt-0.5">${item.price.toLocaleString('es-CO')} c/u</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-[11px] text-slate-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total summary calculations & confirm */}
            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1.5">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-700">${cartTotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-550 font-bold border-b border-dashed border-slate-200 pb-2 mb-2">
                <span className="text-slate-800">TOTAL PEDIDO:</span>
                <span className="font-mono text-pandora-accent text-sm">${cartTotal.toLocaleString('es-CO')}</span>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    if (confirm('¿Vaciar toda la comanda actual?')) {
                      setCart([]);
                    }
                  }}
                  className={`p-2 rounded-lg border text-xs transition-all flex items-center justify-center cursor-pointer ${
                    cart.length > 0
                      ? 'border-slate-250 hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                      : 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-100/50'
                  }`}
                  title="Vaciar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={handleConfirmOrder}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5 uppercase ${
                    cart.length > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" /> Confirmar Pedido
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
