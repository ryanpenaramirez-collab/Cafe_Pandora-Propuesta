import type { POSState, POSAction } from './types';
import type { TableStatus, Table } from '../types';

export const initialShift = {
  isOpen: true,
  openedAt: '08:00',
  openedBy: 'Sofía Valenzuela',
  initialFloat: 150.00,
  currentCash: 150.00,
  totalSales: 85.60,
  totalExpenses: 0.00,
};

export function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_MENU':
      return { ...state, menu: action.payload };

    case 'PLACE_ORDER': {
      const newOrder = action.payload;
      const newTables = state.tables.map(t => {
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
      });

      const newStock = state.stock.map(s => {
        const matched = newOrder.items.find(oi =>
          s.name.toLowerCase().includes(oi.name.toLowerCase().substring(0, 5))
        );
        if (matched) {
          const decremented = s.quantity - (matched.quantity * 0.2);
          return { ...s, quantity: Math.max(0, decremented) };
        }
        return s;
      });

      return {
        ...state,
        orders: [newOrder, ...state.orders],
        tables: newTables,
        stock: newStock,
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = action.payload;
      const newOrders = state.orders.map(o =>
        o.id === orderId ? { ...o, status } : o
      );

      let newTables = state.tables;
      if (status === 'listo') {
        const targetOrder = state.orders.find(o => o.id === orderId);
        if (targetOrder) {
          newTables = state.tables.map(t =>
            t.id === targetOrder.tableId
              ? { ...t, status: 'por_pagar' as TableStatus }
              : t
          );
        }
      }

      return { ...state, orders: newOrders, tables: newTables };
    }

    case 'CANCEL_ORDER': {
      const orderId = action.payload;
      const targetOrder = state.orders.find(o => o.id === orderId);
      if (!targetOrder) return state;

      const newTables = state.tables.map(t => {
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
      });

      return {
        ...state,
        orders: state.orders.filter(o => o.id !== orderId),
        tables: newTables,
      };
    }

    case 'CLEAR_TABLE': {
      const { tableId, cashSettled, finalAmount } = action.payload;
      const targetTable = state.tables.find(t => t.id === tableId);
      if (!targetTable) return state;

      let newShift = state.shift;
      if (cashSettled) {
        const amountToRegister = finalAmount !== undefined ? finalAmount : targetTable.totalAmount;
        newShift = {
          ...state.shift,
          totalSales: state.shift.totalSales + amountToRegister,
          currentCash: state.shift.currentCash + amountToRegister
        };
      }

      const newTables = state.tables.map(t => {
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
      });

      const newOrders = state.orders.map(o =>
        o.tableId === tableId ? { ...o, status: 'listo' as const } : o
      );

      return { ...state, tables: newTables, orders: newOrders, shift: newShift };
    }

    case 'UPDATE_TABLE_STATUS': {
      const { tableId, status, guestName, totalAmount } = action.payload;
      const newTables = state.tables.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status,
            guestName: guestName !== undefined ? guestName : t.guestName,
            totalAmount: totalAmount !== undefined ? totalAmount : t.totalAmount
          };
        }
        return t;
      });
      return { ...state, tables: newTables };
    }

    case 'ADD_TABLE': {
      const tableName = action.payload;
      const nextId = state.tables.length > 0 ? Math.max(...state.tables.map(t => t.id)) + 1 : 1;
      const newTable: Table = {
        id: nextId,
        name: tableName,
        capacity: 4,
        status: 'vacía',
        totalAmount: 0,
        ordersCount: 0
      };
      return { ...state, tables: [...state.tables, newTable] };
    }

    case 'DELETE_TABLE':
      return { ...state, tables: state.tables.filter(t => t.id !== action.payload) };

    case 'ADD_EXPENSE': {
      const newExpense = action.payload;
      return {
        ...state,
        expenses: [newExpense, ...state.expenses],
        shift: {
          ...state.shift,
          totalExpenses: state.shift.totalExpenses + newExpense.amount,
          currentCash: state.shift.currentCash - newExpense.amount
        }
      };
    }

    case 'UPDATE_MENU_PRICE': {
      const { itemId, newPrice, isAvailable } = action.payload;
      return {
        ...state,
        menu: state.menu.map(m =>
          m.id === itemId ? { ...m, price: newPrice, available: isAvailable } : m
        )
      };
    }

    case 'ADD_MENU_ITEM':
      return { ...state, menu: [...state.menu, action.payload] };

    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menu: state.menu.map(m => m.id === action.payload.id ? action.payload : m)
      };

    case 'DELETE_MENU_ITEM':
      return { ...state, menu: state.menu.filter(m => m.id !== action.payload) };

    case 'ADD_STOCK': {
      const { stockId, addedQty } = action.payload;
      return {
        ...state,
        stock: state.stock.map(s =>
          s.id === stockId ? { ...s, quantity: s.quantity + addedQty } : s
        )
      };
    }

    case 'ADD_RESERVATION': {
      const { tableId, guestName } = action.payload;
      return {
        ...state,
        tables: state.tables.map(t =>
          t.id === tableId ? { ...t, status: 'reservada' as TableStatus, guestName } : t
        )
      };
    }

    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a =>
          a.id === action.payload ? { ...a, resolved: true } : a
        )
      };

    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };

    case 'SET_TABLES':
      return { ...state, tables: action.payload };

    case 'SET_ORDERS':
      return { ...state, orders: action.payload };

    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'SET_STOCK':
      return { ...state, stock: action.payload };

    case 'SET_SHIFT':
      return { ...state, shift: action.payload };

    default:
      return state;
  }
}
