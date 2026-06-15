import { Table, Order, OrderItem } from '../../types';
import { TableStats } from './types';

export function calculateTableStats(tables: Table[]): TableStats {
  return {
    total: tables.length,
    vacant: tables.filter(t => t.status === 'vacía').length,
    occupied: tables.filter(t => t.status === 'ocupada').length,
    reserved: tables.filter(t => t.status === 'reservada').length,
    pendingPayment: tables.filter(t => t.status === 'por_pagar').length,
    totalRevenue: tables.reduce((acc, t) => acc + t.totalAmount, 0),
  };
}

export function combineOrderItems(orders: Order[]): { name: string; price: number; quantity: number }[] {
  const itemMap: Record<string, { name: string; price: number; quantity: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.menuItemId || item.name;
      if (itemMap[key]) {
        itemMap[key].quantity += item.quantity;
      } else {
        itemMap[key] = {
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        };
      }
    });
  });
  return Object.values(itemMap);
}

export function calculateBilling(
  items: { price: number; quantity: number }[],
  applyTax: boolean,
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = applyTax ? subtotal * 0.08 : 0;
  return { subtotal, total: subtotal + tax, tax };
}

export function formatCOP(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('es-CO');
}

export function getTableStatusColor(status: string): { border: string; bg: string; text: string; badge: string } {
  switch (status) {
    case 'vacía':
      return {
        border: 'border-slate-300',
        bg: 'bg-white',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    case 'ocupada':
      return {
        border: 'border-rose-300',
        bg: 'bg-rose-50/60',
        text: 'text-rose-800',
        badge: 'bg-rose-100 text-rose-700 border-rose-200',
      };
    case 'reservada':
      return {
        border: 'border-emerald-300',
        bg: 'bg-emerald-50/60',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    case 'por_pagar':
      return {
        border: 'border-amber-300',
        bg: 'bg-amber-50/60',
        text: 'text-amber-800',
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    default:
      return {
        border: 'border-slate-300',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        badge: 'bg-slate-100 text-slate-500 border-slate-200',
      };
  }
}

export function generateInvoiceNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BP-${num}`;
}

export function getElapsedTime(occupiedSince?: string): string {
  if (!occupiedSince) return '-';
  const now = new Date();
  const [hours, minutes] = occupiedSince.split(':').map(Number);
  const occupiedDate = new Date();
  occupiedDate.setHours(hours, minutes, 0, 0);
  const diffMs = now.getTime() - occupiedDate.getTime();
  if (diffMs < 0) return '0 min';
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hrs}h ${mins}min`;
}
