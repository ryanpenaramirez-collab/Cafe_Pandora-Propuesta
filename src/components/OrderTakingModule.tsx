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
    <div id="order_taking_module" className="bg-surface-card border border-border-default rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
      
      {showsSuccess ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center p-8 bg-pandora-success-bg"
        >
          <div className="w-16 h-16 bg-pandora-success-bg rounded-full flex items-center justify-center text-pandora-success mb-4 shadow-sm border border-pandora-success/40 animate-bounce">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-lg font-bold text-pandora-title uppercase tracking-wider">¡Pedido Confirmado!</h3>
          <p className="text-xs text-pandora-disabled mt-1.5 font-light text-center">La comanda ha sido enviada con éxito a la Cola de Preparaciones de la Cocina / Barra.</p>
        </motion.div>
      ) : selectedTableId === null && !customTableNumber ? (
        /* STEP 1: SELECT TABLE NUMBER Only ask for the table number, nothing else */
        <div className="p-5 flex flex-col gap-6">
          <div className="border-b border-pandora-border pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-serif text-sm font-bold text-pandora-title uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-pandora-gold" /> Seleccione la Mesa
              </h3>
              <p className="text-[11px] text-pandora-disabled mt-0.5">Elija una mesa del salón o registre una mesa alterna abajo.</p>
            </div>
          </div>

          {/* Table Grid Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map(t => {
              let statusText = "Vacía";
              let statusStyles = "bg-surface-card border-border-default hover:border-border-default text-text-muted shadow-xs";

              if (t.status === 'ocupada') {
                statusText = `Ocupada ($${t.totalAmount.toFixed(0)})`;
                statusStyles = "bg-pandora-error-bg border-pandora-danger/30 text-pandora-danger hover:bg-pandora-error-bg/80";
              } else if (t.status === 'reservada') {
                statusText = "Reservada";
                statusStyles = "bg-pandora-success-bg border-pandora-success/40 text-pandora-success hover:bg-pandora-success-bg/80";
              } else if (t.status === 'por_pagar') {
                statusText = `Por Pagar ($${t.totalAmount.toFixed(0)})`;
                statusStyles = "bg-pandora-warning-bg border-pandora-gold/30 text-pandora-gold hover:bg-pandora-warning-bg/80";
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
            <p className="text-[11px] text-pandora-disabled mb-3 text-center">¿No encuentra la mesa? Cree una personalizada al instante.</p>
            <button
              onClick={() => setIsNewTableModalOpen(true)}
              className="bg-pandora-primary hover:bg-pandora-primary/90 text-white font-mono uppercase text-[10px] font-bold tracking-wider px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
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
                  className="absolute inset-0 bg-pandora-dark/30 backdrop-blur-xs"
                />

                {/* Modal Content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-surface-card border border-pandora-border rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-2xl relative z-10 flex flex-col gap-4 text-pandora-title"
                >
                  <div>
                    <h3 className="font-serif text-base font-bold text-pandora-title uppercase tracking-wide flex items-center gap-2">
                      <Plus className="w-5 h-5 text-pandora-gold animate-pulse" />
                      Agregar Nueva Mesa
                    </h3>
                    <p className="text-[11px] text-pandora-disabled mt-1">Escriba el nombre o identificador único para la nueva mesa.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-pandora-disabled block mb-1">Nombre o Número de la Mesa</label>
                      <input
                        type="text"
                        placeholder="Ej. 14 o VIP"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        className="w-full bg-pandora-bg border border-pandora-border rounded-lg px-3.5 py-2.5 text-xs text-pandora-title focus:outline-none focus:ring-2 focus:ring-pandora-gold focus:border-pandora-gold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTableName.trim()) {
                            handleAddNewTable();
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-pandora-disabled block mb-1.5">Tipo de Mesa</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewTableType('Exterior')}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newTableType === 'Exterior'
                              ? 'bg-surface-input border-border-default text-white shadow-xs'
                              : 'bg-surface-card border-border-default hover:border-border-default text-text-muted'
                          }`}
                        >
                          Exterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTableType('Terraza')}
                          className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            newTableType === 'Terraza'
                              ? 'bg-surface-input border-border-default text-white shadow-xs'
                              : 'bg-surface-card border-border-default hover:border-border-default text-text-muted'
                          }`}
                        >
                          Terraza
                        </button>
                      </div>
                    </div>

                    <div className="bg-pandora-warning-bg border border-pandora-gold/30 rounded-xl p-3 mt-1.5">
                      <span className="text-[9px] uppercase font-mono tracking-wide text-pandora-gold font-bold block mb-1 select-none">Vista Previa Automática</span>
                      <p className="text-xs font-serif font-bold text-pandora-title">
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
                      className="px-4 py-2 border border-pandora-border hover:bg-pandora-elevated text-pandora-disabled rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={!newTableName.trim()}
                      onClick={handleAddNewTable}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-sm cursor-pointer ${
                        newTableName.trim()
                          ? 'bg-pandora-primary hover:bg-pandora-primary/90 text-white'
                          : 'bg-pandora-border text-pandora-disabled cursor-not-allowed'
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
        <div className="flex flex-col lg:flex-row min-h-0 flex-1">
          
          {/* CATALOG PANEL (LEFT/MID) */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-pandora-border flex flex-col min-w-0">
            
            {/* Catalog Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-3 border-b border-pandora-border mb-4">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-pandora-disabled block font-mono">Categoría Pedidos</span>
                <h4 className="font-serif text-sm font-bold text-pandora-title uppercase tracking-normal">
                  {tableDisplayName} &bull; Catálogo de Productos
                </h4>
              </div>
              <button 
                onClick={() => {
                  setSelectedTableId(null);
                  setCustomTableNumber('');
                  setCart([]);
                }}
                className="text-[10px] text-pandora-gold hover:underline font-bold tracking-wider font-mono cursor-pointer"
              >
                &larr; Cambiar Mesa
              </button>
            </div>

            {/* Selection tools: Tabs & Search — 2-row layout */}
            <div className="flex flex-col gap-2.5 mb-4 shrink-0">
              {/* Fila 1: 65% category tabs + 35% search (no icon) */}
              <div className="flex gap-2.5">
                <div className="w-[65%] bg-pandora-border p-0.5 rounded-lg border border-pandora-border flex items-center gap-1">
                  {(['todos', 'platillo', 'bebida'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveCatalogTab(tab); setActiveSubcategory(null); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all tracking-wider cursor-pointer flex-1 ${
                        activeCatalogTab === tab
                          ? 'bg-surface-elevated text-pandora-title shadow-xs border border-pandora-border'
                          : 'text-pandora-disabled hover:text-pandora-title'
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
                    className="w-full bg-pandora-bg border border-pandora-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-pandora-gold text-pandora-title placeholder:text-pandora-disabled"
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
                          ? 'bg-pandora-primary text-white shadow-xs'
                          : 'bg-surface-card text-pandora-disabled border border-pandora-border hover:border-pandora-gold'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>



            {/* Catalog Items lists grouped nicely */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              
              {/* FOOD GROUP */}
              {(activeCatalogTab === 'todos' || activeCatalogTab === 'platillo') && groupedCatalog.platillos.length > 0 && (
                <div>
                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-pandora-gold border-b border-dashed border-pandora-border pb-1 mb-2 font-mono flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 inline text-pandora-gold" /> {activeCatalogTab === 'todos' ? 'PLATILLOS & BEBIDAS' : 'PLATILLOS & ALIMENTOS'}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedCatalog.platillos.map(item => {
                      const cartItem = cart.find(i => i.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={`p-2.5 rounded-xl border transition-all hover:bg-pandora-elevated cursor-pointer text-left flex items-center gap-3 min-h-[90px] shrink-0 ${
                            cartItem 
                              ? 'border-pandora-gold bg-pandora-warning-bg shadow-xs' 
                              : 'border-pandora-border bg-surface-card hover:border-border-default'
                          }`}
                        >
                          {item.image && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-pandora-border shadow-xs">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div>
                              <span className="font-serif font-bold text-xs text-pandora-title line-clamp-1 block uppercase leading-tight">{item.name}</span>
                              <p className="text-[9.5px] text-pandora-muted font-light line-clamp-2 mt-0.5 leading-normal">{item.description}</p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-pandora-gold block mt-1">${item.price.toLocaleString('es-CO')}</span>
                          </div>
                          
                          {cartItem && (
                            <span className="bg-pandora-primary text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold shadow-xs shrink-0 self-center">
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
                  <h5 className="text-[10px] uppercase font-bold tracking-widest text-pandora-gold border-b border-dashed border-pandora-border pb-1 mb-2 font-mono flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 inline text-pandora-gold" /> Bebidas & Barra
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedCatalog.bebidas.map(item => {
                      const cartItem = cart.find(i => i.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={`p-2.5 rounded-xl border transition-all hover:bg-pandora-elevated cursor-pointer text-left flex items-center gap-3 min-h-[90px] shrink-0 ${
                            cartItem 
                              ? 'border-pandora-gold bg-pandora-warning-bg' 
                              : 'border-pandora-border bg-surface-card hover:border-border-default'
                          }`}
                        >
                          {item.image && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-pandora-border shadow-xs">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                            <div>
                              <span className="font-serif font-bold text-xs text-pandora-title line-clamp-1 block uppercase leading-tight">{item.name}</span>
                              <p className="text-[9.5px] text-pandora-muted font-light line-clamp-2 mt-0.5 leading-normal">{item.description}</p>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-pandora-gold block mt-1">${item.price.toLocaleString('es-CO')}</span>
                          </div>
                          
                          {cartItem && (
                            <span className="bg-pandora-primary text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold shadow-xs shrink-0 self-center">
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
                <div className="p-10 text-center text-pandora-disabled text-xs font-light bg-pandora-bg rounded-xl border border-dashed border-pandora-border">
                  Ningún producto disponible coincide con la búsqueda.
                </div>
              )}

            </div>
          </div>

          {/* ORDER SUMMARY PANEL (RIGHT) */}
          <div className="w-full lg:w-80 p-4 bg-pandora-bg/60 flex flex-col shrink-0">
            <div className="border-b border-slate-150 pb-2.5 mb-3">
              <h4 className="font-serif text-xs font-bold text-pandora-muted uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-pandora-gold" /> Resumen de {tableDisplayName}
              </h4>
            </div>

            {/* Cart Elements Scroll list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-pandora-disabled">
                  <ShoppingCart className="w-7 h-7 text-slate-350 stroke-[1.5] mb-2" />
                  <p className="text-[11px] font-serif font-medium text-pandora-disabled">Comanda vacía</p>
                  <p className="text-[10px] text-pandora-disabled font-light mt-1.5 text-center">Toque los productos de la izquierda para agregarlos a la comanda.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div 
                    key={item.menuItemId}
                    className="p-2.5 bg-surface-card border border-pandora-border rounded-lg flex justify-between items-center text-xs shadow-xs"
                  >
                    <div className="min-w-0 flex-1 pr-1.5">
                      <span className="font-serif font-bold text-pandora-title block leading-tight truncate uppercase text-[11px]">{item.name}</span>
                      <span className="text-[10px] text-pandora-gold font-mono block mt-0.5">${item.price.toLocaleString('es-CO')} c/u</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-pandora-border border border-pandora-border rounded-md">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="p-1 hover:bg-pandora-subtle text-pandora-disabled hover:text-pandora-title transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-[11px] text-pandora-muted">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="p-1 hover:bg-pandora-subtle text-pandora-disabled hover:text-pandora-title transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-1.5 text-pandora-disabled hover:text-pandora-danger hover:bg-pandora-error-bg rounded transition-all cursor-pointer"
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
            <div className="border-t border-pandora-border pt-3 mt-3">
              <div className="flex justify-between items-center text-xs text-pandora-disabled font-medium mb-1.5">
                <span>Subtotal:</span>
                <span className="font-mono text-pandora-muted">${cartTotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-550 font-bold border-b border-dashed border-pandora-border pb-2 mb-2">
                <span className="text-pandora-title">TOTAL PEDIDO:</span>
                <span className="font-mono text-pandora-gold text-sm">${cartTotal.toLocaleString('es-CO')}</span>
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
                      ? 'border-pandora-border hover:bg-pandora-error-bg text-pandora-disabled hover:text-pandora-danger'
                      : 'border-pandora-border text-pandora-body cursor-not-allowed bg-pandora-border/50'
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
                      ? 'bg-pandora-gold hover:bg-pandora-accent text-white'
                      : 'bg-pandora-subtle text-pandora-disabled cursor-not-allowed'
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
