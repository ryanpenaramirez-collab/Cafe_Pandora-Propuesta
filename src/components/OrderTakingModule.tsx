/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Minus, ShoppingCart, Check, Trash2, 
  Utensils, Coffee, ClipboardList, RefreshCw, Wine, Calendar 
} from 'lucide-react';
import { MenuItem, Table, Order, OrderItem } from '../types';

interface OrderTakingModuleProps {
  menu: MenuItem[];
  tables: Table[];
  waiterName: string;
  onPlaceOrder: (order: Order) => void;
  onAddTable?: (name: string) => void;
  onDeleteTable?: (tableId: number) => void;
  onAddReservation?: (tableId: number, guestName: string, date?: string, time?: string) => void;
}

export default function OrderTakingModule({ menu, tables, waiterName, onPlaceOrder, onAddTable, onAddReservation }: OrderTakingModuleProps) {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [customTableNumber, setCustomTableNumber] = useState<string>('');
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<'Exterior' | 'Terraza'>('Exterior');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reserveTableId, setReserveTableId] = useState<number | null>(null);
  const [reserveDate, setReserveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reserveTime, setReserveTime] = useState('19:00');
  const [reserveGuestName, setReserveGuestName] = useState('');
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

  const isTableBlocked = (table: Table): boolean => {
    if (table.status !== 'reservada' || !table.reservationTime || !table.reservationDate) return false;
    if (table.reservationDate !== new Date().toISOString().split('T')[0]) return false;

    const [resH, resM] = table.reservationTime.split(':').map(Number);
    const resMin = resH * 60 + resM;
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();

    return curMin >= (resMin - 10) && curMin < resMin;
  };

  // Submit order handling
  const handleConfirmOrder = () => {
    const finalTableId = selectedTableId || parseInt(customTableNumber, 10);
    if (!finalTableId || isNaN(finalTableId)) return;
    if (cart.length === 0) return;

    const targetTable = tables.find(t => t.id === finalTableId);

    if (targetTable && isTableBlocked(targetTable)) {
      alert('Esta mesa está reservada y próxima a ser ocupada. No se puede tomar el pedido.');
      return;
    }

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
      receiptStatus: 'recibido',
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

  const handleConfirmReservation = () => {
    if (reserveTableId === null) return;
    const table = tables.find(t => t.id === reserveTableId);
    if (onAddReservation) {
      onAddReservation(reserveTableId, reserveGuestName.trim() || `Cliente - ${reserveTime}`, reserveDate, reserveTime);
    }
    setIsReservationModalOpen(false);
    setReserveTableId(null);
    setReserveGuestName('');
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
              <h3 className="font-serif text-sm font-bold text-[#4E433F] uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-pandora-accent" /> Seleccione la Mesa
              </h3>
              <p className="text-[11px] text-[#8A7E77] mt-0.5">Elija una mesa del salón o registre una mesa alterna abajo.</p>
            </div>
          </div>

          {/* Table Grid Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tables.map(t => {
              const blocked = isTableBlocked(t);
              let statusText = "Vacía";
              let statusStyles = "bg-white border-[#E5DEC9] hover:border-slate-300 text-[#5A524C] shadow-xs";

              if (blocked) {
                statusText = "Bloqueada";
                statusStyles = "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60";
              } else if (t.status === 'ocupada') {
                statusText = "Ocupada";
                statusStyles = "bg-white border-[#B85A48] text-[#B85A48] border-t-4 border-t-[#B85A48]";
              } else if (t.status === 'reservada') {
                statusText = t.reservationTime ? `Reservada ${t.reservationTime}` : "Reservada";
                statusStyles = "bg-white border-[#556B2F] text-[#556B2F] border-t-4 border-t-[#556B2F]";
              } else if (t.status === 'por_pagar') {
                statusText = "Por Pagar";
                statusStyles = "bg-white border-[#C59B27] text-[#C59B27] border-t-4 border-t-[#C59B27]";
              }

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (blocked) {
                      alert('Esta mesa está reservada y próxima a ser ocupada.');
                      return;
                    }
                    setSelectedTableId(t.id);
                  }}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${statusStyles}`}
                >
                  <span className="font-serif text-xs font-bold truncate max-w-full px-1">{t.name}</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-light">{statusText}</span>
                </button>
              );
            })}
          </div>

          {/* Agregar nueva mesa and Reservar una Mesa buttons */}
          <div className="border-t border-slate-150 pt-5 mt-2 flex flex-col items-center gap-3">
            <p className="text-[11px] text-slate-400 text-center">¿No encuentra la mesa? Cree una personalizada o reserve una mesa.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNewTableModalOpen(true)}
                className="bg-[#2E7D32] hover:bg-[#25632a] text-white font-mono uppercase text-[10px] font-bold tracking-wider px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 animate-pulse" />
                Agregar nueva mesa
              </button>
              <button
                onClick={() => setIsReservationModalOpen(true)}
                className="bg-[#8B5E3C] hover:bg-[#6B4F3F] text-white font-mono uppercase text-[10px] font-bold tracking-wider px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 animate-pulse" />
                Reservar una Mesa
              </button>
            </div>
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

          {/* Modal para reservar una mesa */}
          <AnimatePresence>
            {isReservationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsReservationModalOpen(false);
                    setReserveTableId(null);
                  }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden p-6 shadow-2xl relative z-10 flex flex-col gap-4 text-slate-800"
                >
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#8B5E3C] animate-pulse" />
                      Reservar una Mesa
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">Seleccione la mesa, fecha y hora para la reserva.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Selector de mesa */}
                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1.5">Seleccionar Mesa</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                        {tables.map(t => {
                          const blocked = isTableBlocked(t);
                          let statusDisplay = t.status;
                          if (blocked) statusDisplay = 'bloqueada';
                          else if (t.status === 'reservada' && t.reservationTime) statusDisplay = `reservada ${t.reservationTime}`;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                if (blocked) {
                                  alert('Esta mesa está reservada y próxima a ser ocupada.');
                                  return;
                                }
                                setReserveTableId(t.id);
                              }}
                              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                blocked
                                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                  : reserveTableId === t.id
                                    ? 'border-[#8B5E3C] bg-[#FDF8F0] ring-1 ring-[#8B5E3C]'
                                    : 'border-slate-200 bg-white hover:border-[#8B5E3C] text-slate-700'
                              }`}
                            >
                              <span className="font-serif text-xs font-bold truncate max-w-full px-1">{t.name}</span>
                              <span className="text-[8px] uppercase font-mono tracking-wider font-light">{statusDisplay}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Fecha</label>
                        <input
                          type="date"
                          value={reserveDate}
                          onChange={(e) => setReserveDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/40 focus:border-[#8B5E3C]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Hora</label>
                        <input
                          type="time"
                          value={reserveTime}
                          onChange={(e) => setReserveTime(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Nombre del cliente */}
                    <div>
                      <label className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Nombre del Cliente <span className="text-slate-300 normal-case tracking-normal">(opcional)</span></label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        value={reserveGuestName}
                        onChange={(e) => setReserveGuestName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/40 focus:border-[#8B5E3C]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && reserveTableId !== null) {
                            handleConfirmReservation();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 mt-2 justify-end">
                    <button
                      onClick={() => {
                        setIsReservationModalOpen(false);
                        setReserveTableId(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={reserveTableId === null}
                      onClick={handleConfirmReservation}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-sm cursor-pointer ${
                        reserveTableId !== null
                          ? 'bg-[#8B5E3C] hover:bg-[#6B4F3F] text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Confirmar Reserva
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
