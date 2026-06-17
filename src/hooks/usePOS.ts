import { useContext, useMemo } from 'react';
import { POSContext } from '../store/POSContext';

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) {
    throw new Error('usePOS must be used within a POSProvider');
  }

  const { state, dispatch } = ctx;

  const derived = useMemo(() => ({
    activeUnresolvedAlertsCount: state.alerts.filter(a => !a.resolved).length,
    activeChefOrdersCount: state.orders.filter(o => o.status !== 'listo' && (o.type === 'comida' || o.type === 'mixto')).length,
    activeBarmanOrdersCount: state.orders.filter(o => o.status !== 'listo' && (o.type === 'bebida' || o.type === 'mixto')).length,
    pendingOrdersCount: state.orders.filter(o => o.status !== 'listo' && o.status !== 'caja' && o.status !== 'facturado').length,
    lowStockCount: state.stock.filter(s => s.quantity <= s.minQuantity).length,
  }), [state.alerts, state.orders, state.stock]);

  return { state, dispatch, ...derived };
}
