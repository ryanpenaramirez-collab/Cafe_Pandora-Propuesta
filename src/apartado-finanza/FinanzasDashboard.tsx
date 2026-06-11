import { useState } from 'react';
import { Order, Table, Expense, ShiftState } from '../types';
import Facturacion from './Facturacion';
import VentasDia from './VentasDia';
import Informes from './Informes';
import Cajero from './Cajero';
import Egresos from './Egresos';
import AperturaCaja from './AperturaCaja';

export type FinanzasTab = 'facturacion' | 'ventas' | 'informes' | 'cajero' | 'egresos' | 'apertura';

interface FinanzasDashboardProps {
  orders: Order[];
  tables: Table[];
  shift: ShiftState;
  expenses: Expense[];
  activeTab: FinanzasTab;
  onTabChange: (tab: FinanzasTab) => void;
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
  onAddExpense: (expense: Expense) => void;
  onSetShift: (shift: ShiftState) => void;
}

const TABS: { id: FinanzasTab; label: string }[] = [
  { id: 'facturacion', label: 'Facturación' },
  { id: 'ventas', label: 'Ventas del Día' },
  { id: 'informes', label: 'Informes' },
  { id: 'cajero', label: 'Cajero' },
  { id: 'egresos', label: 'Egresos' },
  { id: 'apertura', label: 'Apertura de Caja' },
];

export default function FinanzasDashboard({
  orders,
  tables,
  shift,
  expenses,
  activeTab,
  onTabChange,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder,
  onAddExpense,
  onSetShift,
}: FinanzasDashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 p-1 bg-[#FAF5EE]/75 rounded-xl border border-slate-300 self-start shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#FDF8F0] text-slate-800 shadow-xs border border-slate-300/40'
                : 'text-slate-650 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'facturacion' && (
        <Facturacion
          orders={orders}
          tables={tables}
          onClearTable={onClearTable}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onCancelOrder={onCancelOrder}
        />
      )}
      {activeTab === 'ventas' && <VentasDia shift={shift} />}
      {activeTab === 'informes' && <Informes shift={shift} />}
      {activeTab === 'cajero' && <Cajero shift={shift} onSetShift={onSetShift} />}
      {activeTab === 'egresos' && <Egresos expenses={expenses} onAddExpense={onAddExpense} />}
      {activeTab === 'apertura' && <AperturaCaja shift={shift} onSetShift={onSetShift} />}
    </div>
  );
}
