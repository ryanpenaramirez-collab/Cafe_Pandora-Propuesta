import { Table, TableStatus, Order } from '../../types';

export type ActiveView = 'map' | 'list' | 'stats';
export type PrintType = 'cooking' | 'payment' | null;
export type PaymentMethod = 'Efectivo' | 'Nequi' | 'Bancolombia' | 'Tarjeta';

export interface TableCardProps {
  table: Table;
  isSelected: boolean;
  onClick: (table: Table) => void;
}

export interface TableDetailProps {
  table: Table;
  orders: Order[];
  onStatusChange: (status: TableStatus, guestName?: string) => void;
  onOpenBilling: () => void;
  onAddConsumption: (amount: number) => void;
  onClose: () => void;
}

export interface BillingPanelProps {
  table: Table;
  orders: Order[];
  onConfirmPayment: (method: PaymentMethod, applyTax: boolean, finalTotal: number) => void;
  onBack: () => void;
}

export interface ReservationFormProps {
  tableId: number;
  tableName: string;
  onConfirm: (guestName: string, time: string, persons: number, notes: string) => void;
  onCancel: () => void;
}

export interface ReceiptPreviewProps {
  table: Table;
  orders: Order[];
  printType: 'cooking' | 'payment';
  paymentMethod: PaymentMethod;
  applyTax: boolean;
  onToggleTax: () => void;
  onPrint: () => void;
  onClose: () => void;
}

export interface TableStats {
  total: number;
  vacant: number;
  occupied: number;
  reserved: number;
  pendingPayment: number;
  totalRevenue: number;
}
