/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, ChefHat, Wine, Users, TrendingUp, MapPin, 
  Utensils, Calendar, FileText, DollarSign, AlertTriangle, 
  Printer, Archive, TrendingDown, LogOut, Map, 
  Key, Clock, Sparkles, Bell, Play, FileSpreadsheet, Lock,
  ChevronLeft, ChevronRight, Shield, ClipboardList
} from 'lucide-react';

import { MenuItem, Table, Order, Expense, SystemAlert, StockItem, UserSession, ShiftState, TableStatus } from './types';
import { INITIAL_MENU, INITIAL_BEVERAGES, INITIAL_TABLES, INITIAL_ALERTS, INITIAL_STOCK } from './data';

import LoginView from './components/LoginView';
import OrderModal from './components/OrderModal';
import KitchenBarModal from './components/KitchenBarModal';
import TablesModal from './components/TablesModal';
import FinancialsModal from './components/FinancialsModal';
import InventoryMenuModal from './components/InventoryMenuModal';
import SystemModal from './components/SystemModal';
import OrderTakingModule from './components/OrderTakingModule';
import PendingOrdersModule from './components/PendingOrdersModule';

const CATEGORIES = [
  { id: 'pedidos', name: 'Pedidos', label: 'Toma de Pedidos', icon: ClipboardList, buttonIds: ['crear_pedido', 'pedidos_pendientes'] },
  { id: 'servicio_mesa', name: 'Servicio de Mesa', label: 'Mesero, Chef, Barman', icon: ChefHat, buttonIds: ['mesero', 'chef', 'barman'] },
  { id: 'menu', name: 'Menú', label: 'Platos y Bebidas', icon: Sparkles, buttonIds: ['platos', 'bebidas'] },
  { id: 'caja_finanzas', name: 'Caja y Finanzas', label: 'Contabilidad y Caja', icon: DollarSign, buttonIds: ['cajero', 'abrir_caja', 'ventas_dia', 'egresos', 'facturas'] },
  { id: 'mesas_salon', name: 'Mesas y Salón', label: 'Reservación y Salón', icon: Map, buttonIds: ['mesas', 'mapa_mesas', 'reserva'] },
  { id: 'administracion', name: 'Administración', label: 'Personal, Inventario', icon: Users, buttonIds: ['usuarios', 'informes', 'activador', 'inventario'] },
  { id: 'sistema', name: 'Sistema', label: 'Avisos y Sesión', icon: AlertTriangle, buttonIds: ['alerta', 'salir'] }
];

export default function App() {
  // --- REAL-TIME POS LOCAL PERSISTENT STATES ---
  const [user, setUser] = useState<UserSession | null>(() => {
    const stored = localStorage.getItem('pandora_user');
    if (stored && stored !== 'null' && stored !== 'undefined') {
      try {
        return JSON.parse(stored);
      } catch (e) {
        localStorage.removeItem('pandora_user');
        return null;
      }
    }
    return null;
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const stored = localStorage.getItem('pandora_menu');
    return stored ? JSON.parse(stored) : [...INITIAL_MENU, ...INITIAL_BEVERAGES];
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const stored = localStorage.getItem('pandora_tables');
    return stored ? JSON.parse(stored) : INITIAL_TABLES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem('pandora_orders');
    return stored ? JSON.parse(stored) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem('pandora_expenses');
    return stored ? JSON.parse(stored) : [];
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>(() => {
    const stored = localStorage.getItem('pandora_alerts');
    return stored ? JSON.parse(stored) : INITIAL_ALERTS;
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    const stored = localStorage.getItem('pandora_stock');
    return stored ? JSON.parse(stored) : INITIAL_STOCK;
  });

  const [shift, setShift] = useState<ShiftState>(() => {
    const stored = localStorage.getItem('pandora_shift');
    return stored ? JSON.parse(stored) : {
      isOpen: true,
      openedAt: '08:00',
      openedBy: 'Sofía Valenzuela',
      initialFloat: 150.00,
      currentCash: 150.00,
      totalSales: 85.60,
      totalExpenses: 0.00,
    };
  });

  // --- LOCALTIME RUNNING CLOCK ---
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- SYNC STATE TO LOCALSTORAGE ON MUTATION ---
  // Forzar cierre de sesión único para permitir al usuario cambiar de rol inmediatamente al recargar
  useEffect(() => {
    const hasClearedInitial = sessionStorage.getItem('pandora_initial_roles_clear');
    if (!hasClearedInitial) {
      sessionStorage.setItem('pandora_initial_roles_clear', 'true');
      setUser(null);
      localStorage.removeItem('pandora_user');
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pandora_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pandora_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('pandora_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    localStorage.setItem('pandora_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('pandora_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pandora_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pandora_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('pandora_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('pandora_shift', JSON.stringify(shift));
  }, [shift]);

  // --- RECALCULATE ACTIVE SALES TOTALS METRICS ---
  const activeUnresolvedAlertsCount = useMemo(() => {
    return alerts.filter(a => !a.resolved).length;
  }, [alerts]);

  const activeChefOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'listo' && (o.type === 'comida' || o.type === 'mixto')).length;
  }, [orders]);

  const activeBarmanOrdersCount = useMemo(() => {
    return orders.filter(o => o.status !== 'listo' && (o.type === 'bebida' || o.type === 'mixto')).length;
  }, [orders]);

  // --- DETAILED MODAL CONTROLLERS ---
  const [modalFocus, setModalFocus] = useState<string | null>(null);
  const [tabFocusParam, setTabFocusParam] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePedidosTab, setActivePedidosTab] = useState<'nuevo' | 'pendientes'>('nuevo');



  // --- SHARED POS SYSTEM STATE MUTATOR CALLBACKS ---

  // 1. Placing active waiter orders
  const handlePlaceOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    // Update the targets table status
    setTables(prev => prev.map(t => {
      if (t.id === newOrder.tableId) {
        return {
          ...t,
          status: 'ocupada' as TableStatus,
          currentWaiter: newOrder.waiterName,
          totalAmount: t.totalAmount + newOrder.total,
          ordersCount: t.ordersCount + 1,
          occupiedSince: t.occupiedSince || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return t;
    }));

    // Deduct stock for items ordered
    newOrder.items.forEach(orderItem => {
      // Find matching item ingredents or decrement simple portions
      setStock(prev => prev.map(s => {
        if (s.name.toLowerCase().includes(orderItem.name.toLowerCase().substring(0, 5))) {
          const decremented = s.quantity - (orderItem.quantity * 0.2);
          return { ...s, quantity: Math.max(0, decremented) };
        }
        return s;
      }));
    });
  };

  // 2. Kitchen order chef prep toggles
  const handleUpdateOrderStatus = (orderId: string, status: 'espera' | 'preparacion' | 'listo') => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // Auto alerts on low inventory components when order completes
    if (status === 'listo') {
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        // Switch Table status to 'por_pagar' or keep 'ocupada'
        setTables(prev => prev.map(t => {
          if (t.id === targetOrder.tableId) {
            return {
              ...t,
              status: 'por_pagar' as TableStatus
            };
          }
          return t;
        }));
      }
    }
  };

  // 2b. Cancel an active order
  const handleCancelOrder = (orderId: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;
    
    setTables(prev => prev.map(t => {
      if (t.id === targetOrder.tableId) {
        const newOrdersCount = Math.max(0, t.ordersCount - 1);
        return {
          ...t,
          status: newOrdersCount === 0 ? 'vacía' as TableStatus : t.status,
          totalAmount: Math.max(0, t.totalAmount - targetOrder.total),
          ordersCount: newOrdersCount,
          occupiedSince: newOrdersCount === 0 ? undefined : t.occupiedSince,
          currentWaiter: newOrdersCount === 0 ? undefined : t.currentWaiter
        };
      }
      return t;
    }));

    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // 3. Clear/Settle Table to vacant
  const handleClearTable = (tableId: number, cashSettled: boolean) => {
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return;

    if (cashSettled) {
      // Accumulate sales in Cash shift state
      setShift(prev => ({
        ...prev,
        totalSales: prev.totalSales + targetTable.totalAmount,
        currentCash: prev.currentCash + targetTable.totalAmount
      }));
    }

    // Set vacant
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'vacía' as TableStatus,
          totalAmount: 0.00,
          ordersCount: 0,
          occupiedSince: undefined,
          currentWaiter: undefined,
          guestName: undefined
        };
      }
      return t;
    }));

    // Mark associated orders as complete/prepared (cleaning pipeline)
    setOrders(prev => prev.map(o => o.tableId === tableId ? { ...o, status: 'listo' } : o));
  };

  // 4. Set/Update manual table details
  const handleUpdateTableStatus = (tableId: number, status: TableStatus, guestName?: string, totalAmount?: number) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status,
          guestName: guestName !== undefined ? guestName : t.guestName,
          totalAmount: totalAmount !== undefined ? totalAmount : t.totalAmount
        };
      }
      return t;
    }));
  };

  // 5. Create new expense
  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [newExpense, ...prev]);
    setShift(prev => ({
      ...prev,
      totalExpenses: prev.totalExpenses + newExpense.amount,
      currentCash: prev.currentCash - newExpense.amount
    }));
  };

  // 6. Menu price configurations
  const handleUpdateMenuPrice = (itemId: string, newPrice: number, isAvailable: boolean) => {
    setMenu(prev => prev.map(m => m.id === itemId ? { ...m, price: newPrice, available: isAvailable } : m));
  };

  // 7. Stock refills
  const handleAddStock = (stockId: string, addedQty: number) => {
    setStock(prev => prev.map(s => s.id === stockId ? { ...s, quantity: s.quantity + addedQty } : s));
  };

  // 8. Create table reservation from log
  const handleAddReservation = (tableId: number, guestName: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          status: 'reservada' as TableStatus,
          guestName
        };
      }
      return t;
    }));
  };

  // 9. Resolve alert notifications
  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  };

  // 10. Force alert creation
  const handleAddAlert = (alert: SystemAlert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  // Logging out
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pandora_user');
  };

  // --- BUTTON GRID DATA DICTIONARY ---
  const BUTTONS = [
    // Amarillo: MESERO, CHEF, BARMAN, USUARIOS, VENTAS DIA, MAPA MESAS
    { id: 'mesero', name: 'MESERO', color: 'yellow', icon: Utensils, label: 'Tomar Pedido', modal: 'order', param: null, count: 0 },
    { id: 'chef', name: 'CHEF', color: 'yellow', icon: ChefHat, label: 'Cocina Prep.', modal: 'kitchen', param: 'chef', count: activeChefOrdersCount },
    { id: 'barman', name: 'BARMAN', color: 'yellow', icon: Coffee, label: 'Barra café', modal: 'kitchen', param: 'barman', count: activeBarmanOrdersCount },
    { id: 'usuarios', name: 'USUARIOS', color: 'yellow', icon: Users, label: 'Estatus Personal', modal: 'system', param: 'usuarios', count: 0 },
    { id: 'ventas_dia', name: 'VENTAS DIA', color: 'yellow', icon: TrendingUp, label: 'Efectivo Caja', modal: 'financials', param: 'ventas', count: 0 },
    { id: 'mapa_mesas', name: 'MAPA MESAS', color: 'yellow', icon: Map, label: 'Layout Salón', modal: 'tables', param: 'mapa', count: 0 },

    // Verde: PLATOS, BEBIDAS, RESERVA
    { id: 'platos', name: 'PLATOS', color: 'green', icon: Sparkles, label: 'Comidas Menú', modal: 'menu_inventory', param: 'platos', count: 0 },
    { id: 'bebidas', name: 'BEBIDAS', color: 'green', icon: Wine, label: 'Bebidas Menú', modal: 'menu_inventory', param: 'bebidas', count: 0 },
    { id: 'reserva', name: 'RESERVA', color: 'green', icon: Calendar, label: 'Reserva Agenda', modal: 'menu_inventory', param: 'reserva', count: 0 },

    // Magenta/Púrpura: INFORMES, CAJERO, ALERTA
    { id: 'informes', name: 'INFORMES', color: 'magenta', icon: FileSpreadsheet, label: 'Rendimiento', modal: 'financials', param: 'informes', count: 0 },
    { id: 'cajero', name: 'CAJERO', color: 'magenta', icon: DollarSign, label: 'Gaveta Arqueo', modal: 'financials', param: 'cajero', count: 0 },
    { id: 'alerta', name: 'ALERTA', color: 'magenta', icon: AlertTriangle, label: 'Errores / Avisos', modal: 'system', param: 'alerta', count: activeUnresolvedAlertsCount },

    // Rojo: FACTURAS, EGRESOS, SALIR
    { id: 'facturas', name: 'FACTURAS', color: 'red', icon: FileText, label: 'Boletas Historial', modal: 'tables', param: 'lista', count: 0 },
    { id: 'egresos', name: 'EGRESOS', color: 'red', icon: TrendingDown, label: 'Salidas Caja', modal: 'financials', param: 'egresos', count: 0 },
    { id: 'salir', name: 'SALIR', color: 'red', icon: LogOut, label: 'Cerrar Sesión', modal: 'logout', param: null, count: 0 },

    // Cyan/Azul claro: MESAS, ABRIR CAJA
    { id: 'mesas', name: 'MESAS', color: 'cyan', icon: MapPin, label: 'Estatus Rápido', modal: 'tables', param: 'lista', count: 0 },
    { id: 'abrir_caja', name: 'ABRIR CAJA', color: 'cyan', icon: Key, label: 'Fijar Shift Base', modal: 'financials', param: 'apertura', count: 0 },

    // Naranja/Marrón: ACTIVADOR, INVENTARIO, PEDIDOS
    { id: 'crear_pedido', name: 'NUEVO PEDIDO', color: 'orange', icon: ClipboardList, label: 'Toma de Pedidos', modal: 'custom_pedidos', param: null, count: 0 },
    { id: 'pedidos_pendientes', name: 'PEDIDOS PENDIENTES', color: 'orange', icon: Clock, label: 'Cola de Pedidos', modal: 'custom_pedidos_pendientes', param: null, count: orders.filter(o => o.status !== 'listo').length },
    { id: 'activador', name: 'ACTIVADOR', color: 'orange', icon: Play, label: 'Periféricos Test', modal: 'system', param: 'activador', count: 0 },
    { id: 'inventario', name: 'INVENTARIO', color: 'orange', icon: Archive, label: 'Stock Almacén', modal: 'menu_inventory', param: 'inventario', count: stock.filter(s => s.quantity <= s.minQuantity).length },
  ];

  const visibleButtons = useMemo(() => {
    if (user?.role === 'mesero') {
      return BUTTONS.filter(btn => ['mesero', 'mesas', 'mapa_mesas', 'reserva', 'bebidas', 'platos', 'crear_pedido', 'pedidos_pendientes', 'salir'].includes(btn.id));
    }
    return BUTTONS;
  }, [user, stock, activeChefOrdersCount, activeBarmanOrdersCount, activeUnresolvedAlertsCount, orders]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      return cat.buttonIds.some(id => visibleButtons.some(btn => btn.id === id));
    });
  }, [visibleButtons]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      let sum = 0;
      cat.buttonIds.forEach(id => {
        const btn = BUTTONS.find(b => b.id === id);
        if (btn) {
          sum += btn.count;
        }
      });
      counts[cat.id] = sum;
    });
    return counts;
  }, [BUTTONS]);

  const selectedCategory = useMemo(() => {
    return CATEGORIES.find(cat => cat.id === activeCategory) || null;
  }, [activeCategory]);

  const activeCategoryButtons = useMemo(() => {
    if (!selectedCategory) return [];
    return visibleButtons.filter(btn => selectedCategory.buttonIds.includes(btn.id));
  }, [selectedCategory, visibleButtons]);



  // Map click triggers logic
  const handleButtonClick = (btn: typeof BUTTONS[0]) => {
    if (btn.modal === 'logout') {
      if (confirm('¿Está seguro de cerrar sesión de Cafe Pandora?')) {
        handleLogout();
      }
      return;
    }
    if (btn.id === 'crear_pedido') {
      setActiveCategory('pedidos');
      setActivePedidosTab('nuevo');
      setModalFocus(null);
      return;
    }
    if (btn.id === 'pedidos_pendientes') {
      setActiveCategory('pedidos');
      setActivePedidosTab('pendientes');
      setModalFocus(null);
      return;
    }
    setTabFocusParam(btn.param);
    setModalFocus(btn.modal);
  };

  // --- BUTTON COLOR STYLING MAPS ---
  const getButtonColorStyles = (color: string) => {
    switch(color) {
      case 'yellow': return 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 focus:ring-amber-400 border-l-4 border-l-amber-500';
      case 'green': return 'bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-900 focus:ring-emerald-400 border-l-4 border-l-emerald-600';
      case 'magenta': return 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-250 text-fuchsia-950 focus:ring-fuchsia-400 border-l-4 border-l-fuchsia-600';
      case 'red': return 'bg-rose-50 hover:bg-rose-100 border-rose-250 text-rose-900 focus:ring-rose-400 border-l-4 border-l-rose-600';
      case 'cyan': return 'bg-cyan-50 hover:bg-cyan-100 border-cyan-250 text-cyan-900 focus:ring-cyan-400 border-l-4 border-l-cyan-600';
      case 'orange': return 'bg-orange-50 hover:bg-orange-100 border-orange-255 border-orange-200 text-orange-950 focus:ring-orange-400 border-l-4 border-l-orange-600';
      default: return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  // If user not authenticated, show gorgeous background side screen
  if (!user) {
    return <LoginView onLoginSuccess={(session) => setUser(session)} />;
  }

  return (
    <div className="h-screen max-h-screen bg-pandora-cream wood-grain font-sans text-slate-800 flex flex-col selection:bg-pandora-accent selection:text-white p-2 sm:p-3 overflow-hidden">
      
      {/* CONTENEDOR PRINCIPAL CON DISEÑO DE MARCO (CON BORDES CLAROS COMO EL WIREFRAME) */}
      <div className="flex-1 w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border-2 border-pandora-dark h-full md:h-[calc(100vh-2.5rem)] lg:h-[calc(100vh-2rem)]">
        
        {/* FILA DE CONTENIDO MULTICOLUMNA INTEGRADA */}
        <div className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden h-full">
          
          {/* COLUMNA 1: IZQUIERDA ANGOSTA (Estática, nunca hace scroll) */}
          <div id="col_left" className="w-full md:w-60 bg-pandora-dark text-slate-100 border-b-2 md:border-b-0 md:border-r-2 border-pandora-wood shrink-0 flex flex-col justify-between p-5 overflow-hidden md:h-full h-auto">
            
            {/* Logo de la app dentro de un marco circular arriba */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-pandora-accent flex items-center justify-center border-4 border-pandora-wood/30 shadow-lg mx-auto mb-3.5 relative overflow-hidden">
                <img 
                  src="https://i.imgur.com/ARe5rPr.jpeg" 
                  alt="Logo Café Pandora" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="font-serif text-sm font-extrabold tracking-widest text-pandora-gold uppercase">
                Café Pandora
              </h2>
              <p className="text-[8px] text-slate-400 font-mono tracking-wider mt-1 uppercase">POS Sistema Administrativo</p>
            </div>

            {/* Decoración central de atmósfera */}
            <div className="hidden md:block my-4 text-center px-2 py-3 rounded bg-white/5 border border-white/5">
              <span className="block text-[10px] font-serif italic text-pandora-cream">
                "Más que un lugar, una experiencia para tus sentidos."
              </span>
            </div>

            {/* Rol de usuario en la esquina inferior izquierda */}
            <div className="mt-6 md:mt-auto flex flex-col gap-2 shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block font-mono">ROL DE ACCESOS</span>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                <div id="user_avatar" className="w-8 h-8 rounded-full bg-pandora-accent flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <span className="text-xs font-semibold text-pandora-cream block truncate leading-tight">{user.name}</span>
                  <span className="text-[9px] text-pandora-gold uppercase tracking-wider block font-bold mt-0.5 capitalize">{user.role}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-center py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg text-[10px] font-bold text-rose-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono tracking-wider shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión (Salir)
              </button>
            </div>

          </div>

          {/* CONTENEDOR DE HEADER SUPERIOR + COLUMNA CENTRAL Y DERECHA */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            
            {/* BARRA SUPERIOR CON EL NOMBRE 'Cafe Pandora' */}
            <header id="main_header" className="bg-pandora-dark text-white border-b-2 border-pandora-wood py-3.5 px-5 flex flex-col sm:flex-row justify-between items-center gap-2.5 shrink-0">
              <div className="text-center sm:text-left">
                <h1 className="font-serif text-lg font-bold tracking-widest text-pandora-cream uppercase leading-none">
                  Cafe Pandora
                </h1>
                <span className="text-[8px] text-pandora-gold font-mono block tracking-wider uppercase mt-1">Bistro - Café Bar</span>
              </div>

              {/* Indicadores rápidos de la barra superior */}
              <div className="flex flex-wrap items-center gap-2.5">

                {/* Botón de salida rápido */}
                <button 
                  onClick={() => {
                    if (confirm('¿Está seguro de cerrar sesión de Cafe Pandora?')) {
                      handleLogout();
                    }
                  }}
                  className="p-1 text-slate-300 hover:text-rose-450 hover:bg-white/5 rounded transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 text-rose-450" />
                </button>
              </div>
            </header>

            {/* SECCIÓN INTERNA EN DOS COLUMNAS: COLUMNA CENTRAL DE MENÚ Y COLUMNA CONTENIDO DERECHA */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 h-full">
              
              {/* COLUMNA CENTRAL: BOTONES DEL MENÚ DE NAVEGACIÓN (Columna central con botones) */}
              <div id="col_center" className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-pandora-wood/15 p-4 flex flex-col shrink-0 overflow-y-auto md:h-full">
                
                <div className="mb-3.5 text-[9px] uppercase font-bold tracking-widest text-slate-400 font-mono flex justify-between items-center shrink-0">
                  <span>🎯 CATEGORÍAS</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-205 bg-slate-200 text-slate-600 border border-slate-300 font-mono">
                    {visibleCategories.length}
                  </span>
                </div>

                {/* Lista vertical de categorías */}
                <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                  {visibleCategories.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-light">
                      Ninguna categoría activa.
                    </div>
                  ) : (
                    visibleCategories.map((cat) => {
                      const IconComponent = cat.icon;
                      const isActive = activeCategory === cat.id;
                      const count = categoryCounts[cat.id] || 0;

                      return (
                        <motion.button
                          key={cat.id}
                          id={`cat_${cat.id}`}
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => {
                            setActiveCategory(isActive ? null : cat.id);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all overflow-hidden group focus:outline-none cursor-pointer w-full shrink-0 ${
                            isActive 
                              ? 'bg-pandora-dark border-pandora-dark text-white' 
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-705 text-slate-700 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`p-1.5 rounded-md border flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200 ${
                              isActive ? 'bg-pandora-accent border-pandora-accent text-white' : 'bg-slate-100 border-slate-200/80 text-slate-600'
                            }`}>
                              <IconComponent className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="truncate">
                              <span className="font-serif font-bold text-xs block tracking-wider uppercase truncate leading-tight">
                                {cat.name}
                              </span>
                              <span className={`text-[10px] font-light block truncate mt-0.5 ${
                                isActive ? 'text-slate-200' : 'text-slate-500'
                              }`}>
                                {cat.label}
                              </span>
                            </div>
                          </div>

                          {count > 0 && (
                            <span className="h-5 min-w-[20px] px-1 rounded-full bg-rose-600 border border-white text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse shrink-0">
                              {count}
                            </span>
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: AREA DE CONTENIDO PRINCIPAL INTEGRADO (Columna derecha grande) */}
              <div id="col_right_content" className="flex-1 bg-pandora-cream/30 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 md:h-full justify-start">
                
                {activeCategory ? (
                  <div className="flex flex-col gap-4">
                    {/* Breadcrumb / Back button */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <button 
                        onClick={() => setActiveCategory(null)}
                        className="flex items-center gap-1.5 text-pandora-accent hover:text-pandora-accent-hover font-extrabold transition-all cursor-pointer bg-transparent border-none outline-none"
                      >
                        <ChevronLeft className="w-4 h-4 text-pandora-accent" /> Volver al Inicio
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="text-slate-500 font-extrabold uppercase">{selectedCategory?.name}</span>
                    </div>

                    {/* Hero/Visual category description */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
                      <div className="p-2.5 bg-pandora-accent/10 rounded-lg border border-pandora-accent/20 flex items-center justify-center">
                        {(() => {
                          const IconComp = selectedCategory?.icon || Sparkles;
                          return <IconComp className="w-5 h-5 text-pandora-accent" />;
                        })()}
                      </div>
                      <div>
                        <h2 className="font-serif text-sm font-bold text-slate-800 uppercase tracking-wider">{selectedCategory?.name}</h2>
                        <p className="text-[11px] text-slate-500 font-light mt-0.5">Acceda a los servicios de {selectedCategory?.name.toLowerCase()} de Cafe Pandora</p>
                      </div>
                    </div>

                    {/* Render content based on whether active category is 'pedidos' */}
                    {activeCategory === 'pedidos' ? (
                      <div className="flex flex-col gap-4">
                        {/* Selector de subcategorías para Pedidos */}
                        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start shrink-0">
                          <button
                            onClick={() => setActivePedidosTab('nuevo')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${
                              activePedidosTab === 'nuevo'
                                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <ClipboardList className="w-4 h-4 text-pandora-accent" />
                            Nuevo Pedido
                          </button>
                          
                          <button
                            onClick={() => setActivePedidosTab('pendientes')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${
                              activePedidosTab === 'pendientes'
                                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Clock className="w-4 h-4 text-pandora-accent" />
                            Pedidos Pendientes
                            {orders.filter(o => o.status !== 'listo').length > 0 && (
                              <span className="bg-rose-600 text-white font-mono text-[9px] font-extrabold h-4.5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                                {orders.filter(o => o.status !== 'listo').length}
                              </span>
                            )}
                          </button>
                        </div>

                        {activePedidosTab === 'nuevo' ? (
                          <OrderTakingModule 
                            menu={menu}
                            tables={tables}
                            waiterName={user?.name || 'Mesero'}
                            onPlaceOrder={(order) => {
                              handlePlaceOrder(order);
                              setActivePedidosTab('pendientes');
                            }}
                          />
                        ) : (
                          <PendingOrdersModule
                            orders={orders}
                            onCompleteOrder={(id) => handleUpdateOrderStatus(id, 'listo')}
                            onCancelOrder={(id) => handleCancelOrder(id)}
                          />
                        )}
                      </div>
                    ) : (
                      /* Subcategory buttons Grid rendering */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
                        {activeCategoryButtons.map((btn) => {
                          const IconComponent = btn.icon;
                          const styleString = getButtonColorStyles(btn.color);

                          return (
                            <motion.button
                              key={btn.id}
                              id={`sub_btn_${btn.id}`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleButtonClick(btn)}
                              className={`flex items-center justify-between p-4 rounded-xl shadow-sm border text-left transition-all overflow-hidden group focus:outline-none cursor-pointer w-full shrink-0 ${styleString}`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                                  <IconComponent className="w-5 h-5 shrink-0 text-slate-800" />
                                </div>
                                <div className="truncate">
                                  <span className="font-serif font-bold text-xs block tracking-wider uppercase truncate leading-tight">
                                    {btn.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-light block truncate mt-1">
                                    {btn.label}
                                  </span>
                                </div>
                              </div>

                              {btn.count > 0 && (
                                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-rose-600 border border-white text-[9px] font-extrabold text-white flex items-center justify-center animate-pulse shrink-0">
                                  {btn.count}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Banner de Bienvenida y Resumen Operacional en Vivo */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase font-mono tracking-widest bg-pandora-accent/10 text-pandora-accent px-2 py-0.5 rounded-full font-bold border border-pandora-accent/20">
                            Servicio en Vivo
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                        <h2 className="font-serif text-base sm:text-lg font-bold text-slate-800 mt-1.5">
                          ¡Hola, {user.name}! ☕
                        </h2>
                        <p className="text-[11px] text-slate-500 font-light mt-0.5">
                          Bienvenido al panel general de Café Pandora. Control de comandas, distribución de mesas y almacén.
                        </p>
                      </div>

                      {/* Micro Bento Módulos de Estadística */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        {/* Indicador 1: Mesas */}
                        <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Mesa Activa</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 block mt-0.5">
                              {tables.filter(t => t.status === 'ocupada').length} / {tables.length}
                            </span>
                          </div>
                        </div>

                        {/* Indicador 2: Pedidos Activos */}
                        <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Coffee className="w-4 h-4 text-amber-500 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Comandas</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 block mt-0.5">
                              {orders.filter(o => o.status !== 'listo').length} en cola
                            </span>
                          </div>
                        </div>

                        {/* Indicador 3: Alertas */}
                        <div className="flex-1 min-w-[110px] bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                            stock.filter(s => s.quantity <= s.minQuantity).length > 0 
                              ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' 
                              : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 block tracking-wider">Stock Bajo</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700 block mt-0.5">
                              {stock.filter(s => s.quantity <= s.minQuantity).length} ítems
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cuadros de Monitoreo Interactivo del Salón y Comandas */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      
                      {/* Monitor Rápido de Distribución de Mesas */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-[280px]">
                        <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-100 shrink-0">
                          <h3 className="font-serif text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                            <MapPin className="w-4 h-4 text-cyan-600" /> Distribución de Mesas (Salón)
                          </h3>
                          <button 
                            onClick={() => { setModalFocus('tables'); setTabFocusParam('mapa'); }}
                            className="text-[10px] text-cyan-600 hover:underline font-bold font-sans cursor-pointer bg-transparent border-none"
                          >
                            Ver mapa completo &rarr;
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 overflow-y-auto flex-grow pr-1">
                          {tables.map(t => {
                            let tableBg = "bg-slate-100/65 text-slate-700 border-slate-200 hover:bg-slate-100";
                            if (t.status === 'ocupada') tableBg = "bg-rose-50 text-rose-800 border-rose-250 hover:bg-rose-100/50";
                            else if (t.status === 'reservada') tableBg = "bg-emerald-50 text-emerald-800 border-emerald-250 hover:bg-emerald-100/50";
                            else if (t.status === 'por_pagar') tableBg = "bg-amber-50 text-amber-800 border-amber-250 hover:bg-amber-100/50";

                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setModalFocus('tables');
                                  setTabFocusParam('mapa');
                                }}
                                className={`p-2 rounded gap-1 cursor-pointer border flex flex-col items-center justify-center transition-all h-[76px] shrink-0 ${tableBg}`}
                                title={`Mesa ${t.id} - ${t.status}`}
                              >
                                <span className="text-[10px] font-bold">Mesa {t.id}</span>
                                <span className="text-[8px] uppercase font-mono bg-white/50 px-1 rounded block-inline text-slate-600">
                                  ${t.totalAmount.toFixed(0)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Panel Virtual de Comandas Activas */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col h-[280px]">
                        <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-100 shrink-0">
                          <h3 className="font-serif text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-amber-500 animate-bounce" /> Cola de Preparaciones
                          </h3>
                          <button 
                            onClick={() => { setModalFocus('kitchen'); setTabFocusParam('chef'); }}
                            className="text-[10px] text-amber-600 hover:underline font-bold font-sans cursor-pointer bg-transparent border-none"
                          >
                            Ver Cocina / Barra &rarr;
                          </button>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-2 pr-1 flex flex-col justify-start">
                          {orders.filter(o => o.status !== 'listo').length === 0 ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                              <Coffee className="w-6 h-6 text-pandora-accent/40 mb-1.5 animate-pulse" />
                              <p className="text-[11px] font-medium font-serif text-slate-500">¡Ninguna comanda pendiente!</p>
                            </div>
                          ) : (
                            orders.filter(o => o.status !== 'listo').map(order => (
                              <div key={order.id} className="p-2 bg-slate-50 border border-slate-200/80 rounded flex justify-between items-center text-xs shrink-0">
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <span className="bg-slate-200 px-1 py-0.5 rounded text-[9px] font-mono">Mesa {order.tableId}</span>
                                    <span className="text-[11px] uppercase font-mono text-slate-500">#{order.id.slice(-4)}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[150px] mt-0.5">
                                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                  </span>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 ${
                                  order.status === 'preparacion' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {order.status === 'preparacion' ? 'Preparando' : 'Espera'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Avisos rápidos de stock o Alertas administrativas */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-2 font-mono">⚠️ ÚLTIMOS AVISOS DE STOCK O ALERTAS</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {alerts.slice(0, 2).map((alert) => (
                          <div key={alert.id} className="p-2 border border-slate-200 rounded-lg bg-white flex items-start gap-2 text-xs">
                            <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-800">{alert.type === 'baja_cocina' || alert.type === 'baja_barra' ? 'Advertencia de Stock' : 'Alerta de Sistema'}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{alert.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>

        </div>


      </div>

      {/* 4. MODULAR MODAL PORTALS (SLIDING OVERLAYS DEFINED SAFELY) */}
      <AnimatePresence>
        
        {/* Tomar Pedidos: MESERO */}
        {modalFocus === 'order' && (
          <motion.div key="order_modal" className="contents">
            <OrderModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              menu={menu}
              tables={tables}
              waiterName={user.name}
              onPlaceOrder={handlePlaceOrder}
            />
          </motion.div>
        )}

        {/* Cocina o Bar: CHEF | BARMAN */}
        {modalFocus === 'kitchen' && (
          <motion.div key="kitchen_modal" className="contents">
            <KitchenBarModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              orders={orders}
              role={tabFocusParam}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          </motion.div>
        )}

        {/* Estatus / Mapa Mesas: MAPA MESAS | MESAS */}
        {modalFocus === 'tables' && (
          <motion.div key="tables_modal" className="contents">
            <TablesModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              tables={tables}
              onUpdateTableStatus={handleUpdateTableStatus}
              onClearTable={handleClearTable}
            />
          </motion.div>
        )}

        {/* Finanzas / Caja: VENTAS DIA | INFORMES | CAJERO | EGRESOS | ABRIR CAJA */}
        {modalFocus === 'financials' && (
          <motion.div key="financials_modal" className="contents">
            <FinancialsModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              tabFocus={tabFocusParam}
              shift={shift}
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onSetShift={(updatedShift) => setShift(updatedShift)}
            />
          </motion.div>
        )}

        {/* Menú y Almacén: PLATOS | BEBIDAS | INVENTARIO | RESERVA */}
        {modalFocus === 'menu_inventory' && (
          <motion.div key="inventory_modal" className="contents">
            <InventoryMenuModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              tabFocus={tabFocusParam}
              menu={menu}
              stock={stock}
              tables={tables}
              onUpdateMenuPrice={handleUpdateMenuPrice}
              onAddStock={handleAddStock}
              onAddReservation={handleAddReservation}
            />
          </motion.div>
        )}

        {/* Diagnósticos / Personal: USUARIOS | ALERTA | ACTIVADOR */}
        {modalFocus === 'system' && (
          <motion.div key="system_modal" className="contents">
            <SystemModal
              isOpen={true}
              onClose={() => setModalFocus(null)}
              tabFocus={tabFocusParam}
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
              onAddAlert={handleAddAlert}
            />
          </motion.div>
        )}

      </AnimatePresence>


    </div>
  );
}
