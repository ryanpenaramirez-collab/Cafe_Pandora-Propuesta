import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, X, MapPin, BarChart3 } from 'lucide-react';
import { Table, TableStatus, Order } from '../../types';
import { ActiveView, PrintType, PaymentMethod } from './types';
import { calculateTableStats, formatCOP } from './utils';
import TableMap from './TableMap';
import TableList from './TableList';
import TableStats from './TableStats';
import TableDetail from './TableDetail';
import BillingPanel from './BillingPanel';
import ReceiptPreview from './ReceiptPreview';

interface TablesModuleProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  orders: Order[];
  onUpdateTableStatus: (tableId: number, status: TableStatus, guestName?: string, totalAmount?: number) => void;
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
}

const VIEW_TABS: { key: ActiveView; icon: typeof Map; label: string }[] = [
  { key: 'map', icon: Map, label: 'Mapa' },
  { key: 'list', icon: MapPin, label: 'Lista' },
  { key: 'stats', icon: BarChart3, label: 'Estadísticas' },
];

export default function TablesModule({
  isOpen, onClose, tables, orders, onUpdateTableStatus, onClearTable,
}: TablesModuleProps) {
  const [activeView, setActiveView] = useState<ActiveView>('map');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isBillingActive, setIsBillingActive] = useState(false);
  const [printType, setPrintType] = useState<PrintType>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [applyTax, setApplyTax] = useState(true);

  const stats = useMemo(() => calculateTableStats(tables), [tables]);

  const liveTable = useMemo(
    () => (selectedTable ? tables.find(t => t.id === selectedTable.id) || null : null),
    [tables, selectedTable],
  );

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setIsBillingActive(false);
  };

  const handleStatusChange = (status: TableStatus, guestName?: string) => {
    if (!liveTable) return;
    onUpdateTableStatus(
      liveTable.id,
      status,
      guestName,
      status === 'vacía' ? 0 : undefined,
    );
    if (status === 'vacía') {
      setIsBillingActive(false);
    }
  };

  const handleOpenBilling = () => {
    setIsBillingActive(true);
  };

  const handleAddConsumption = (amount: number) => {
    if (!liveTable) return;
    onUpdateTableStatus(liveTable.id, 'ocupada', undefined, liveTable.totalAmount + amount);
  };

  const handleConfirmPayment = (method: PaymentMethod, taxApplied: boolean, finalTotal: number) => {
    if (!liveTable) return;
    onClearTable(liveTable.id, true, finalTotal);
    setIsBillingActive(false);
    setSelectedTable(null);
  };

  const handleCloseDetail = () => {
    setSelectedTable(null);
    setIsBillingActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        <div className="bg-pandora-dark p-4 shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-pandora-gold" />
            <div>
              <h3 className="font-serif text-lg font-bold text-pandora-gold">
                Gestión de Mesas — Café Pandora
              </h3>
              <p className="text-[10px] text-slate-400 font-light">
                Estatus de servicio y facturación en salón
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            {VIEW_TABS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveView(key);
                  setIsBillingActive(false);
                }}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === key && !isBillingActive
                    ? 'bg-pandora-gold text-pandora-dark shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
              {stats.occupied} ocup
            </span>
            <span className="text-[10px] bg-slate-500/20 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {stats.vacant} libres
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
            {activeView === 'map' && (
              <TableMap
                tables={tables}
                selectedTableId={liveTable?.id ?? null}
                onSelectTable={handleSelectTable}
              />
            )}
            {activeView === 'list' && (
              <TableList
                tables={tables}
                onSelectTable={handleSelectTable}
              />
            )}
            {activeView === 'stats' && (
              <TableStats
                tables={tables}
                orders={orders}
              />
            )}
          </div>

          <div className="w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
            {isBillingActive && liveTable ? (
              <BillingPanel
                table={liveTable}
                orders={orders}
                onConfirmPayment={handleConfirmPayment}
                onBack={() => setIsBillingActive(false)}
              />
            ) : liveTable ? (
              <TableDetail
                table={liveTable}
                orders={orders}
                onStatusChange={handleStatusChange}
                onOpenBilling={handleOpenBilling}
                onAddConsumption={handleAddConsumption}
                onClose={handleCloseDetail}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Map className="w-16 h-16 opacity-20 mb-3" />
                <p className="text-sm font-medium">Seleccione una mesa</p>
                <p className="text-[11px] mt-1">para ver sus detalles y operaciones</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {printType && liveTable && (
            <ReceiptPreview
              table={liveTable}
              orders={orders}
              printType={printType}
              paymentMethod={paymentMethod}
              applyTax={applyTax}
              onToggleTax={() => setApplyTax(!applyTax)}
              onPrint={() => setPrintType(null)}
              onClose={() => setPrintType(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
