import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee, ChefHat, Wine, Users, TrendingUp, MapPin,
  Utensils, Calendar, FileText, DollarSign, AlertTriangle,
  Printer, Archive, TrendingDown, LogOut, Map,
  Key, Clock, Sparkles, Bell, Play, FileSpreadsheet, Lock,
  ChevronLeft, ClipboardList, Menu, Plus
} from 'lucide-react';

import { POSProvider } from './store/POSContext';
import { usePOS } from './hooks/usePOS';
import { useClock } from './hooks/useClock';

import Sidebar from './layouts/Sidebar';
import CategoryNav from './layouts/CategoryNav';
import WelcomeBanner from './layouts/WelcomeBanner';

import { LoginView } from './modules/auth';
import { OrderTakingModule, PendingOrdersModule, OrderModal } from './modules/orders';
import { MenuTabContent, InventoryMenuModal } from './modules/menu';
import { FinanzasDashboard, type FinanzasTab } from './modules/finances';
import { KitchenModule } from './modules/kitchen';
import { TablesModule } from './modules/tables';
import { SystemModule } from './modules/system';

const CATEGORIES = [
  { id: 'pedidos', name: 'Pedidos', label: 'Toma de Pedidos', icon: ClipboardList, buttonIds: ['crear_pedido', 'pedidos_pendientes'] },
  { id: 'menu', name: 'Menú', label: 'Platillos, Bebidas y Más', icon: Sparkles, buttonIds: ['platos', 'bebidas'] },
  { id: 'caja_finanzas', name: 'Caja y Finanzas', label: 'Contabilidad y Caja', icon: DollarSign, buttonIds: ['abrir_caja', 'ventas_dia', 'facturas'] }
];

function AppContent() {
  const {
    state, dispatch,
    activeUnresolvedAlertsCount, activeChefOrdersCount,
    activeBarmanOrdersCount, pendingOrdersCount, lowStockCount
  } = usePOS();
  const timeStr = useClock();

  const [modalFocus, setModalFocus] = useState<string | null>(null);
  const [tabFocusParam, setTabFocusParam] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePedidosTab, setActivePedidosTab] = useState<'nuevo' | 'pendientes'>('nuevo');
  const [activeMenuTab, setActiveMenuTab] = useState<'platos' | 'bebidas'>('platos');
  const [activeFinanzasTab, setActiveFinanzasTab] = useState<FinanzasTab>('facturacion');

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  const BUTTONS = useMemo(() => [
    { id: 'mesero', name: 'MESERO', color: 'yellow', icon: Utensils, label: 'Tomar Pedido', modal: 'order', param: null, count: 0 },
    { id: 'chef', name: 'CHEF', color: 'yellow', icon: ChefHat, label: 'Cocina Prep.', modal: 'kitchen', param: 'chef', count: activeChefOrdersCount },
    { id: 'barman', name: 'BARMAN', color: 'yellow', icon: Coffee, label: 'Barra café', modal: 'kitchen', param: 'barman', count: activeBarmanOrdersCount },
    { id: 'usuarios', name: 'USUARIOS', color: 'yellow', icon: Users, label: 'Estatus Personal', modal: 'system', param: 'usuarios', count: 0 },
    { id: 'ventas_dia', name: 'VENTAS DIA', color: 'yellow', icon: TrendingUp, label: 'Efectivo Caja', modal: 'financials', param: 'ventas', count: 0 },
    { id: 'mapa_mesas', name: 'MAPA MESAS', color: 'yellow', icon: Map, label: 'Layout Salón', modal: 'tables', param: 'mapa', count: 0 },
    { id: 'platos', name: 'PLATILLOS', color: 'green', icon: Sparkles, label: 'Comidas Menú', modal: 'menu_inventory', param: 'platos', count: 0 },
    { id: 'bebidas', name: 'BEBIDAS', color: 'green', icon: Wine, label: 'Bebidas Menú', modal: 'menu_inventory', param: 'bebidas', count: 0 },
    { id: 'reserva', name: 'RESERVA', color: 'green', icon: Calendar, label: 'Reserva Agenda', modal: 'menu_inventory', param: 'reserva', count: 0 },
    { id: 'informes', name: 'INFORMES', color: 'magenta', icon: FileSpreadsheet, label: 'Rendimiento', modal: 'financials', param: 'informes', count: 0 },
    { id: 'cajero', name: 'CAJERO', color: 'magenta', icon: DollarSign, label: 'Gaveta Arqueo', modal: 'financials', param: 'cajero', count: 0 },
    { id: 'alerta', name: 'ALERTA', color: 'magenta', icon: AlertTriangle, label: 'Errores / Avisos', modal: 'system', param: 'alerta', count: activeUnresolvedAlertsCount },
    { id: 'facturas', name: 'FACTURAS', color: 'red', icon: FileText, label: 'Boletas Historial', modal: 'tables', param: 'lista', count: 0 },
    { id: 'egresos', name: 'EGRESOS', color: 'red', icon: TrendingDown, label: 'Salidas Caja', modal: 'financials', param: 'egresos', count: 0 },
    { id: 'salir', name: 'SALIR', color: 'red', icon: LogOut, label: 'Cerrar Sesión', modal: 'logout', param: null, count: 0 },
    { id: 'mesas', name: 'MESAS', color: 'cyan', icon: MapPin, label: 'Estatus Rápido', modal: 'tables', param: 'lista', count: 0 },
    { id: 'abrir_caja', name: 'ABRIR CAJA', color: 'cyan', icon: Key, label: 'Fijar Shift Base', modal: 'financials', param: 'apertura', count: 0 },
    { id: 'crear_pedido', name: 'NUEVO PEDIDO', color: 'orange', icon: ClipboardList, label: 'Toma de Pedidos', modal: 'custom_pedidos', param: null, count: 0 },
    { id: 'pedidos_pendientes', name: 'PEDIDOS PENDIENTES', color: 'orange', icon: Clock, label: 'Cola de Pedidos', modal: 'custom_pedidos_pendientes', param: null, count: state.orders.filter(o => o.status !== 'listo').length },
    { id: 'activador', name: 'ACTIVADOR', color: 'orange', icon: Play, label: 'Periféricos Test', modal: 'system', param: 'activador', count: 0 },
    { id: 'inventario', name: 'INVENTARIO', color: 'orange', icon: Archive, label: 'Stock Almacén', modal: 'menu_inventory', param: 'inventario', count: lowStockCount },
  ], [activeChefOrdersCount, activeBarmanOrdersCount, activeUnresolvedAlertsCount, state.orders, lowStockCount]);

  const visibleButtons = useMemo(() => {
    if (state.user?.role === 'mesero') {
      return BUTTONS.filter(btn => ['crear_pedido', 'pedidos_pendientes', 'salir'].includes(btn.id));
    }
    return BUTTONS;
  }, [state.user, BUTTONS]);

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(cat =>
      cat.buttonIds.some(id => visibleButtons.some(btn => btn.id === id))
    );
  }, [visibleButtons]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      let sum = 0;
      cat.buttonIds.forEach(id => {
        const btn = BUTTONS.find(b => b.id === id);
        if (btn) sum += btn.count;
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
    if (['platos', 'bebidas'].includes(btn.id)) {
      setActiveCategory('menu');
      setActiveMenuTab(btn.id as 'platos' | 'bebidas');
      return;
    }
    if (['ventas_dia', 'abrir_caja', 'informes', 'cajero', 'egresos', 'facturas'].includes(btn.id)) {
      const tabMap: Record<string, FinanzasTab> = {
        'ventas_dia': 'movimientos',
        'cajero': 'cajero',
        'facturas': 'facturacion',
      };
      setActiveCategory('caja_finanzas');
      setActiveFinanzasTab(tabMap[btn.id] || 'facturacion');
      setModalFocus(null);
      return;
    }
    setTabFocusParam(btn.param);
    setModalFocus(btn.modal);
  };

  const getButtonColorStyles = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-module-yellow-bg hover:bg-module-yellow-bg/80 border-module-yellow-border text-module-yellow-text focus:ring-module-yellow-text border-l-4 border-l-module-yellow-accent';
      case 'green': return 'bg-module-green-bg hover:bg-module-green-bg/80 border-module-green-border text-module-green-text focus:ring-module-green-text border-l-4 border-l-module-green-accent';
      case 'magenta': return 'bg-module-magenta-bg hover:bg-module-magenta-bg/80 border-module-magenta-border text-module-magenta-text focus:ring-module-magenta-text border-l-4 border-l-module-magenta-accent';
      case 'red': return 'bg-module-red-bg hover:bg-module-red-bg/80 border-module-red-border text-module-red-text focus:ring-module-red-text border-l-4 border-l-module-red-accent';
      case 'cyan': return 'bg-module-cyan-bg hover:bg-module-cyan-bg/80 border-module-cyan-border text-module-cyan-text focus:ring-module-cyan-text border-l-4 border-l-module-cyan-accent';
      case 'orange': return 'bg-module-orange-bg hover:bg-module-orange-bg/80 border-module-orange-border text-module-orange-text focus:ring-module-orange-text border-l-4 border-l-module-orange-accent';
      default: return 'bg-pandora-accent hover:bg-pandora-hover border-pandora-border text-pandora-title shadow-sm';
    }
  };

  if (!state.user) {
    return <LoginView onLoginSuccess={(session) => dispatch({ type: 'SET_USER', payload: session })} />;
  }

  return (
    <div className="h-screen max-h-screen bg-pandora-dark wood-grain font-sans text-pandora-body flex flex-col selection:bg-pandora-gold selection:text-pandora-title p-0 overflow-hidden">
      <div className="flex-1 w-full max-w-full bg-pandora-hover flex flex-col overflow-hidden">
        <div className="flex-grow flex flex-col md:flex-row min-h-0 overflow-hidden h-full">
          <Sidebar user={state.user} onLogout={handleLogout} />

          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <header className="bg-pandora-accent text-pandora-title border-b-2 border-pandora-border py-3.5 px-5 flex flex-col sm:flex-row justify-between items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-left">
                  <h1 className="font-serif text-xl font-bold tracking-widest text-pandora-gold uppercase leading-none">Cafe Pandora</h1>
                  <span className="text-xs text-pandora-cream font-mono block tracking-wider uppercase mt-1">Bistro - Café Bar</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5"></div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5 md:h-full justify-start bg-pandora-bg">
              <CategoryNav
                categories={visibleCategories}
                activeCategory={activeCategory}
                categoryCounts={categoryCounts}
                onSelect={setActiveCategory}
              />

              {activeCategory ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="flex items-center gap-1.5 text-pandora-body hover:text-pandora-gold font-extrabold transition-all cursor-pointer bg-transparent border-none outline-none"
                    >
                      <ChevronLeft className="w-4 h-4 text-pandora-gold" /> Volver al Inicio
                    </button>
                    <span className="text-pandora-muted">/</span>
                    <span className="text-pandora-title font-extrabold uppercase">{selectedCategory?.name}</span>
                  </div>

                  <div className="p-4 bg-pandora-accent border border-pandora-border rounded-xl flex items-center gap-3 shadow-sm">
                    <div className="p-2.5 bg-pandora-gold-bg rounded-lg border border-pandora-gold/20 flex items-center justify-center">
                      {(() => { const IconComp = selectedCategory?.icon || Sparkles; return <IconComp className="w-5 h-5 text-pandora-gold" />; })()}
                    </div>
                    <div>
                      <h2 className="font-serif text-sm font-bold text-pandora-title uppercase tracking-wider">{selectedCategory?.name}</h2>
                      <p className="text-[11px] text-pandora-muted font-light mt-0.5 font-sans">Acceda a los servicios de {selectedCategory?.name.toLowerCase()} de Cafe Pandora</p>
                    </div>
                  </div>

                  {activeCategory === 'menu' ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2 p-1 bg-pandora-accent/50 rounded-xl border border-pandora-border self-start shrink-0">
                        {(['platos', 'bebidas'] as const).map((tab) => (
                          <button key={tab} onClick={() => setActiveMenuTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${activeMenuTab === tab ? 'bg-pandora-accent text-pandora-title shadow-sm border border-pandora-border' : 'text-pandora-disabled hover:text-pandora-title'}`}
                          >
                            {tab === 'platos' ? 'PLATILLOS' : 'BEBIDAS'}
                          </button>
                        ))}
                      </div>
                      <MenuTabContent tab={activeMenuTab} menu={state.menu}
                        onUpdateMenuPrice={(itemId, newPrice, isAvailable) => dispatch({ type: 'UPDATE_MENU_PRICE', payload: { itemId, newPrice, isAvailable } })}
                        onAddMenuItem={(item) => dispatch({ type: 'ADD_MENU_ITEM', payload: item })}
                        onUpdateMenuItem={(item) => dispatch({ type: 'UPDATE_MENU_ITEM', payload: item })}
                        onDeleteMenuItem={(itemId) => dispatch({ type: 'DELETE_MENU_ITEM', payload: itemId })}
                      />
                    </div>
                  ) : activeCategory === 'pedidos' ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-2 p-1 bg-pandora-accent/50 rounded-xl border border-pandora-border self-start shrink-0">
                        <button onClick={() => setActivePedidosTab('nuevo')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${activePedidosTab === 'nuevo' ? 'bg-pandora-accent text-pandora-title shadow-sm border border-pandora-border' : 'text-pandora-disabled hover:text-pandora-title'}`}
                        >
                          <ClipboardList className="w-4 h-4 text-pandora-gold" /> Nuevo Pedido
                        </button>
                        <button onClick={() => setActivePedidosTab('pendientes')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${activePedidosTab === 'pendientes' ? 'bg-pandora-accent text-pandora-title shadow-sm border border-pandora-border' : 'text-pandora-disabled hover:text-pandora-title'}`}
                        >
                          <Clock className="w-4 h-4 text-pandora-gold" /> Pedidos Pendientes
                          {state.orders.filter(o => o.status !== 'listo').length > 0 && (
                            <span className="bg-pandora-gold-badge text-pandora-title font-mono text-[9px] font-extrabold h-4.5 px-1.5 rounded-full flex items-center justify-center">
                              {state.orders.filter(o => o.status !== 'listo').length}
                            </span>
                          )}
                        </button>
                      </div>
                      {activePedidosTab === 'nuevo' ? (
                        <OrderTakingModule menu={state.menu} tables={state.tables} waiterName={state.user?.name || 'Mesero'}
                          onPlaceOrder={(order) => { dispatch({ type: 'PLACE_ORDER', payload: order }); setActivePedidosTab('pendientes'); }}
                          onAddTable={(name) => dispatch({ type: 'ADD_TABLE', payload: name })}
                        />
                      ) : (
                        <PendingOrdersModule orders={state.orders}
                          onCompleteOrder={(id) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: id, status: 'caja' } })}
                          onCancelOrder={(id) => dispatch({ type: 'CANCEL_ORDER', payload: id })}
                          userRole={state.user?.role}
                        />
                      )}
                    </div>
                  ) : activeCategory === 'caja_finanzas' ? (
                    <FinanzasDashboard orders={state.orders} tables={state.tables} menu={state.menu}
                      shift={state.shift} activeTab={activeFinanzasTab} onTabChange={setActiveFinanzasTab}
                      onClearTable={(tableId, cashSettled, finalAmount) => dispatch({ type: 'CLEAR_TABLE', payload: { tableId, cashSettled, finalAmount } })}
                      onUpdateOrderStatus={(orderId, status) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } })}
                      onCancelOrder={(orderId) => dispatch({ type: 'CANCEL_ORDER', payload: orderId })}
                      onSetShift={(s) => dispatch({ type: 'SET_SHIFT', payload: s })}
                      expenses={state.expenses}
                      onAddExpense={(expense) => dispatch({ type: 'ADD_EXPENSE', payload: expense })}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <WelcomeBanner user={state.user} pendingOrdersCount={pendingOrdersCount}
                    onNewOrder={() => { setActiveCategory('pedidos'); setActivePedidosTab('nuevo'); }}
                  />
                  <div className="bg-pandora-accent border border-pandora-border rounded-2xl p-4 sm:p-5 shadow-sm">
                    <PendingOrdersModule orders={state.orders}
                      onCompleteOrder={(id) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: id, status: 'caja' } })}
                      onCancelOrder={(id) => dispatch({ type: 'CANCEL_ORDER', payload: id })}
                      userRole={state.user?.role}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalFocus === 'order' && (
          <motion.div key="order_modal" className="contents">
            <OrderModal isOpen={true} onClose={() => setModalFocus(null)}
              menu={state.menu} tables={state.tables} waiterName={state.user?.name || 'Mesero'}
              onPlaceOrder={(order) => dispatch({ type: 'PLACE_ORDER', payload: order })}
            />
          </motion.div>
        )}
        {modalFocus === 'kitchen' && (
          <motion.div key="kitchen_modal" className="contents">
            <KitchenModule isOpen={true} onClose={() => setModalFocus(null)} orders={state.orders} role={tabFocusParam}
              onUpdateOrderStatus={(orderId, status) => dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } })}
            />
          </motion.div>
        )}
        {modalFocus === 'tables' && (
          <motion.div key="tables_modal" className="contents">
            <TablesModule isOpen={true} onClose={() => setModalFocus(null)} tables={state.tables} orders={state.orders}
              onUpdateTableStatus={(tableId, status, guestName, totalAmount) => dispatch({ type: 'UPDATE_TABLE_STATUS', payload: { tableId, status, guestName, totalAmount } })}
              onClearTable={(tableId, cashSettled, finalAmount) => dispatch({ type: 'CLEAR_TABLE', payload: { tableId, cashSettled, finalAmount } })}
            />
          </motion.div>
        )}
        {modalFocus === 'menu_inventory' && (
          <motion.div key="inventory_modal" className="contents">
            <InventoryMenuModal isOpen={true} onClose={() => setModalFocus(null)}
              tabFocus={tabFocusParam} menu={state.menu}
              onUpdateMenuPrice={(itemId, newPrice, isAvailable) => dispatch({ type: 'UPDATE_MENU_PRICE', payload: { itemId, newPrice, isAvailable } })}
              onAddMenuItem={(item) => dispatch({ type: 'ADD_MENU_ITEM', payload: item })}
              onUpdateMenuItem={(item) => dispatch({ type: 'UPDATE_MENU_ITEM', payload: item })}
              onDeleteMenuItem={(itemId) => dispatch({ type: 'DELETE_MENU_ITEM', payload: itemId })}
            />
          </motion.div>
        )}
        {modalFocus === 'system' && (
          <motion.div key="system_modal" className="contents">
            <SystemModule isOpen={true} onClose={() => setModalFocus(null)} tabFocus={tabFocusParam}
              alerts={state.alerts}
              onResolveAlert={(alertId) => dispatch({ type: 'RESOLVE_ALERT', payload: alertId })}
              onAddAlert={(alert) => dispatch({ type: 'ADD_ALERT', payload: alert })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
}
