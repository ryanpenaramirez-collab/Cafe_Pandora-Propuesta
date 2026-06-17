import type { MenuItem, Table, Order, Expense, SystemAlert, StockItem, UserSession, ShiftState, TableStatus } from '../types';

export interface POSState {
  user: UserSession | null;
  menu: MenuItem[];
  tables: Table[];
  orders: Order[];
  expenses: Expense[];
  alerts: SystemAlert[];
  stock: StockItem[];
  shift: ShiftState;
}

export type POSAction =
  | { type: 'SET_USER'; payload: UserSession | null }
  | { type: 'SET_MENU'; payload: MenuItem[] }
  | { type: 'PLACE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }
  | { type: 'CANCEL_ORDER'; payload: string }
  | { type: 'CLEAR_TABLE'; payload: { tableId: number; cashSettled: boolean; finalAmount?: number } }
  | { type: 'UPDATE_TABLE_STATUS'; payload: { tableId: number; status: TableStatus; guestName?: string; totalAmount?: number } }
  | { type: 'ADD_TABLE'; payload: string }
  | { type: 'DELETE_TABLE'; payload: number }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_MENU_PRICE'; payload: { itemId: string; newPrice: number; isAvailable: boolean } }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; payload: MenuItem }
  | { type: 'DELETE_MENU_ITEM'; payload: string }
  | { type: 'ADD_STOCK'; payload: { stockId: string; addedQty: number } }
  | { type: 'ADD_RESERVATION'; payload: { tableId: number; guestName: string } }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'ADD_ALERT'; payload: SystemAlert }
  | { type: 'SET_TABLES'; payload: Table[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_ALERTS'; payload: SystemAlert[] }
  | { type: 'SET_STOCK'; payload: StockItem[] }
  | { type: 'SET_SHIFT'; payload: ShiftState };
