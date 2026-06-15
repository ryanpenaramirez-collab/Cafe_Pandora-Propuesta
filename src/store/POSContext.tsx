import { createContext, useReducer, useEffect, type ReactNode } from 'react';
import type { POSState, POSAction } from './types';
import { posReducer, initialShift } from './posReducer';
import { getItem, setItem, removeItem } from '../services/storage';
import { DEFAULT_MENU } from '../services/menuService';
import { INITIAL_TABLES, INITIAL_ALERTS, INITIAL_STOCK } from '../data';

const STORAGE_KEYS = {
  user: 'pandora_user',
  menu: 'pandora_menu',
  tables: 'pandora_tables',
  orders: 'pandora_orders',
  expenses: 'pandora_expenses',
  alerts: 'pandora_alerts',
  stock: 'pandora_stock',
  shift: 'pandora_shift',
} as const;

function loadTables(): POSState['tables'] {
  const stored = getItem<POSState['tables']>(STORAGE_KEYS.tables, INITIAL_TABLES);
  const initIds = new Set(INITIAL_TABLES.map(t => t.id));
  const merged = INITIAL_TABLES.map(initial => {
    const storedT = stored.find(s => s.id === initial.id);
    if (!storedT) return initial;
    return { ...initial, status: storedT.status, totalAmount: storedT.totalAmount, ordersCount: storedT.ordersCount, currentWaiter: storedT.currentWaiter, occupiedSince: storedT.occupiedSince, guestName: storedT.guestName };
  });
  const customTables = stored.filter(s => !initIds.has(s.id));
  return [...merged, ...customTables];
}

function initialState(): POSState {
  const storedUser = getItem<POSState['user']>(STORAGE_KEYS.user, null);
  return {
    user: storedUser,
    menu: getItem<POSState['menu']>(STORAGE_KEYS.menu, DEFAULT_MENU),
    tables: loadTables(),
    orders: getItem<POSState['orders']>(STORAGE_KEYS.orders, []),
    expenses: getItem<POSState['expenses']>(STORAGE_KEYS.expenses, []),
    alerts: getItem<POSState['alerts']>(STORAGE_KEYS.alerts, INITIAL_ALERTS),
    stock: getItem<POSState['stock']>(STORAGE_KEYS.stock, INITIAL_STOCK),
    shift: getItem<POSState['shift']>(STORAGE_KEYS.shift, initialShift),
  };
}

export const POSContext = createContext<{
  state: POSState;
  dispatch: React.Dispatch<POSAction>;
} | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, undefined, initialState);

  useEffect(() => {
    const hasClearedInitial = sessionStorage.getItem('pandora_initial_roles_clear');
    if (!hasClearedInitial) {
      sessionStorage.setItem('pandora_initial_roles_clear', 'true');
      dispatch({ type: 'SET_USER', payload: null });
      removeItem(STORAGE_KEYS.user);
    }
  }, []);

  useEffect(() => {
    if (state.user) {
      setItem(STORAGE_KEYS.user, state.user);
    } else {
      removeItem(STORAGE_KEYS.user);
    }
  }, [state.user]);

  useEffect(() => { setItem(STORAGE_KEYS.menu, state.menu); }, [state.menu]);
  useEffect(() => { setItem(STORAGE_KEYS.tables, state.tables); }, [state.tables]);
  useEffect(() => { setItem(STORAGE_KEYS.orders, state.orders); }, [state.orders]);
  useEffect(() => { setItem(STORAGE_KEYS.expenses, state.expenses); }, [state.expenses]);
  useEffect(() => { setItem(STORAGE_KEYS.alerts, state.alerts); }, [state.alerts]);
  useEffect(() => { setItem(STORAGE_KEYS.stock, state.stock); }, [state.stock]);
  useEffect(() => { setItem(STORAGE_KEYS.shift, state.shift); }, [state.shift]);

  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
}
