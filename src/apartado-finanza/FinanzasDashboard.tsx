import { Order, Table, MenuItem, ShiftState } from '../types';
import Facturacion from './Facturacion';
import Ventas from './Ventas';
import Cajero from './Cajero';

export type FinanzasTab = 'facturacion' | 'ventas' | 'cajero';

interface FinanzasDashboardProps {
  orders: Order[];
  tables: Table[];
  menu: MenuItem[];
  shift: ShiftState;
  activeTab: FinanzasTab;
  onTabChange: (tab: FinanzasTab) => void;
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
  onUpdateOrderStatus: (orderId: string, status: 'espera' | 'preparacion' | 'listo' | 'caja' | 'facturado') => void;
  onCancelOrder: (orderId: string) => void;
  onSetShift: (shift: ShiftState) => void;
}

const TABS: { id: FinanzasTab; label: string }[] = [
  { id: 'facturacion', label: 'Facturación' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'cajero', label: 'Cajero' },
];

export default function FinanzasDashboard({
  orders,
  tables,
  menu,
  shift,
  activeTab,
  onTabChange,
  onClearTable,
  onUpdateOrderStatus,
  onCancelOrder,
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
      {activeTab === 'ventas' && <Ventas orders={orders} menu={menu} shift={shift} />}
      {activeTab === 'cajero' && <Cajero shift={shift} onSetShift={onSetShift} />}
    </div>
  );
}
