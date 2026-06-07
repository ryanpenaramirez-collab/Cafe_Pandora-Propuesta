/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'platillo' | 'bebida';
  image?: string;
  description: string;
  available: boolean;
  stock?: number;
}

export type TableStatus = 'vacía' | 'ocupada' | 'reservada' | 'por_pagar';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
  currentWaiter?: string;
  guestName?: string;
  totalAmount: number;
  ordersCount: number;
  occupiedSince?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: number;
  tableName: string;
  waiterName: string;
  items: OrderItem[];
  status: 'espera' | 'preparacion' | 'listo';
  type: 'comida' | 'bebida' | 'mixto';
  total: number;
  timestamp: string;
  createdAt?: number;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  timestamp: string;
}

export interface SystemAlert {
  id: string;
  level: 'warning' | 'critical' | 'info';
  message: string;
  resolved: boolean;
  timestamp: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: string;
}

export interface UserSession {
  email: string;
  role: 'administrador' | 'mesero';
  name: string;
}

export interface ShiftState {
  isOpen: boolean;
  openedAt?: string;
  openedBy?: string;
  initialFloat: number;
  currentCash: number;
  totalSales: number;
  totalExpenses: number;
}
