/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, MapPin, Users, DollarSign, Calendar, RefreshCw, Printer, CheckCircle, ArrowLeft, Receipt } from 'lucide-react';
import { Table, TableStatus, Order } from '../types';

interface TablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  orders: Order[];
  onUpdateTableStatus: (tableId: number, status: TableStatus, guestName?: string, totalAmount?: number) => void;
  onClearTable: (tableId: number, cashSettled: boolean, finalAmount?: number) => void;
}

export default function TablesModal({ isOpen, onClose, tables, orders, onUpdateTableStatus, onClearTable }: TablesModalProps) {
  const [activeTab, setActiveTab] = useState<'mapa' | 'lista'>('mapa');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customSpend, setCustomSpend] = useState<number>(10.00);
  const [customGuest, setCustomGuest] = useState<string>('');
  
  // New billing & invoicing states
  const [isBillingActive, setIsBillingActive] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Nequi' | 'Bancolombia'>('Efectivo');
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [fixedBillingTime, setFixedBillingTime] = useState<string>('');
  const [printType, setPrintType] = useState<'cooking' | 'payment' | null>(null);

  // Fallback display date and time to guarantee values are never empty or blank in rendering
  const displayTime = useMemo(() => {
    if (fixedBillingTime) return fixedBillingTime;
    const now = new Date();
    return now.toLocaleDateString('es-CO', { dateStyle: 'medium' }) + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }, [fixedBillingTime]);

  const selectedDetails = useMemo(() => {
    if (!selectedTable) return null;
    return tables.find(t => t.id === selectedTable.id) || null;
  }, [tables, selectedTable]);

  // Gather active orders for the selected table
  const activeOrdersForTable = useMemo(() => {
    if (!selectedDetails) return [];
    return orders.filter(o => o.tableId === selectedDetails.id);
  }, [orders, selectedDetails]);

  // Combine multiple orders into a singular items view
  const combinedItems = useMemo(() => {
    const itemMap: { [key: string]: { name: string; price: number; quantity: number } } = {};
    activeOrdersForTable.forEach(ord => {
      ord.items.forEach(it => {
        const key = it.menuItemId || it.name;
        if (itemMap[key]) {
          itemMap[key].quantity += it.quantity;
        } else {
          itemMap[key] = {
            name: it.name,
            price: it.price,
            quantity: it.quantity
          };
        }
      });
    });

    const list = Object.values(itemMap);
    // Fallback if table status says there is consumption but we don't have registered orders (for manual "+ Consumo" test)
    if (list.length === 0 && selectedDetails && selectedDetails.totalAmount > 0) {
      list.push({
        name: 'Comidas y Bebidas Café Pandora',
        price: selectedDetails.totalAmount,
        quantity: 1
      });
    }
    return list;
  }, [activeOrdersForTable, selectedDetails]);

  // Automatically calculate subtotal, consumption tax (8% in Colombia), and final total
  const calculatedSubtotal = useMemo(() => {
    return combinedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [combinedItems]);

  const taxAmount = useMemo(() => {
    return applyTax ? calculatedSubtotal * 0.08 : 0;
  }, [applyTax, calculatedSubtotal]);

  const finalTotal = useMemo(() => {
    return calculatedSubtotal + taxAmount;
  }, [calculatedSubtotal, taxAmount]);

  const handleOpenBilling = () => {
    if (!selectedDetails) return;
    const now = new Date();
    const formatted = now.toLocaleDateString('es-CO', { dateStyle: 'medium' }) + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setFixedBillingTime(formatted);
    setIsBillingActive(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedDetails) return;
    onClearTable(selectedDetails.id, true, finalTotal);
    setIsBillingActive(false);
    setSelectedTable(null);
  };

  const handleSetStatus = (status: TableStatus) => {
    if (!selectedDetails) return;
    let guest = undefined;
    if (status === 'reservada') {
      guest = customGuest || 'Cliente Incógnito - 19:30';
    }
    onUpdateTableStatus(selectedDetails.id, status, guest, status === 'vacía' ? 0 : undefined);
    setCustomGuest('');
    // If table status was reset to Vacía, ensure billing state is turned off
    if (status === 'vacía') {
      setIsBillingActive(false);
    }
  };

  const handleAddConsumption = () => {
    if (!selectedDetails) return;
    const currentCost = selectedDetails.totalAmount;
    onUpdateTableStatus(selectedDetails.id, 'ocupada', undefined, currentCost + customSpend);
  };

  const getStatusBadgeClass = (status: TableStatus) => {
    switch (status) {
      case 'vacía': return 'bg-pandora-border hover:bg-pandora-hover text-pandora-body border-pandora-border';
      case 'ocupada': return 'bg-pandora-error-bg hover:bg-pandora-danger/15 text-pandora-danger border-pandora-danger/30';
      case 'reservada': return 'bg-pandora-success-bg hover:bg-pandora-success/15 text-pandora-success border-pandora-success/30';
      case 'por_pagar': return 'bg-pandora-gold-bg hover:bg-pandora-gold/15 text-pandora-gold border-pandora-gold/30';
      default: return 'bg-pandora-border text-pandora-body';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-pandora-gold/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-pandora-accent w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-pandora-border relative"
      >
        {/* Header Tab Actions */}
        <div className="bg-pandora-primary p-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-white animate-pulse" />
            <div>
              <h3 className="font-serif text-lg font-bold">Distribución Física y Control de Mesas</h3>
              <p className="text-[11px] text-cyan-100 font-light">Estatus de servicio y facturaciones rápidas en salón</p>
            </div>
          </div>
          <div className="flex gap-1 bg-pandora-gold/30 p-1 rounded-lg self-start">
            <button
              id="tab-btn-map"
              onClick={() => {
                setIsBillingActive(false);
                setActiveTab('mapa');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'mapa' && !isBillingActive ? 'bg-cyan-800 text-white shadow-sm' : 'text-cyan-200 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Mapa de Salón (Grid)
            </button>
            <button
              id="tab-btn-list"
              onClick={() => {
                setIsBillingActive(false);
                setActiveTab('lista');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'lista' && !isBillingActive ? 'bg-cyan-800 text-white shadow-sm' : 'text-cyan-200 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Lista Estatus Rápido
            </button>
          </div>
          <button 
            id="btn-close-tables-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-pandora-primary-hover rounded-full text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Main Panel Content (Table Map, Quick List or spacious Billing workspace) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-pandora-hover flex flex-col">
            
            {isBillingActive && selectedDetails ? (
              // ----- SECCION DE FACTURACION (FORMULARIO Y DETALLES) -----
              <div id="billing-workspace" className="space-y-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center bg-pandora-warning-bg/50 border border-pandora-gold/30/60 p-3.5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <button
                      id="btn-back-to-tables"
                      onClick={() => setIsBillingActive(false)}
                      className="bg-pandora-border hover:bg-slate-300 text-pandora-title px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver a Mesas
                    </button>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-pandora-title uppercase tracking-wide">
                        SISTEMA DE FACTURACIÓN: {selectedDetails.name}
                      </h4>
                      <p className="text-[10px] text-pandora-muted">Verifique los consumos y aplique impuestos correspondientes antes de cerrar.</p>
                    </div>
                  </div>
                  <span className="text-xs bg-pandora-border px-3 py-1 rounded-full font-mono font-bold text-pandora-body select-none">
                    Mesa-{selectedDetails.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
                  
                  {/* Left Column: Client orders summary */}
                  <div className="bg-pandora-accent p-5 rounded-2xl border border-pandora-border shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-xs font-bold text-pandora-muted uppercase tracking-wide">📋 RESUMEN DE CONSUMOS</span>
                        <span className="text-[10.5px] text-pandora-muted font-mono bg-pandora-border px-1.5 py-0.5 rounded font-bold">FACTURA POS</span>
                      </div>
                      
                      <div className="py-2.5 space-y-1.5 text-xs text-pandora-body border-b">
                        <div className="flex justify-between">
                          <span>Fecha y Hora de Emisión:</span>
                          <span className="font-bold text-pandora-title font-mono">{displayTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mesa asociada:</span>
                          <span className="font-bold text-pandora-title uppercase">{selectedDetails.name} (Cap. {selectedDetails.capacity} paxs)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mesero asignado:</span>
                          <span className="font-semibold text-pandora-body">{selectedDetails.currentWaiter || 'Administrador de Caja'}</span>
                        </div>
                      </div>

                      {/* Food & beverage products list */}
                      <div className="mt-3 overflow-y-auto max-h-56 divide-y divide-slate-100 pr-1">
                        <div className="grid grid-cols-12 text-[10px] font-bold text-pandora-muted uppercase py-1 select-none">
                          <span className="col-span-6">Producto / Rubro</span>
                          <span className="col-span-2 text-center">Cant</span>
                          <span className="col-span-2 text-right">Unitario</span>
                          <span className="col-span-2 text-right">Subtotal</span>
                        </div>

                        {combinedItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 text-xs py-2 text-pandora-body font-medium items-center">
                            <span className="col-span-6 font-serif font-bold text-pandora-title">{item.name}</span>
                            <span className="col-span-2 text-center font-mono font-bold text-pandora-title">x{item.quantity}</span>
                            <span className="col-span-2 text-right font-mono">${item.price.toLocaleString('es-CO')}</span>
                            <span className="col-span-2 text-right font-mono font-bold text-pandora-title">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t bg-pandora-hover p-3 rounded-lg flex justify-between items-center select-none">
                      <span className="text-xs font-bold text-pandora-body">Subtotal Neto calculado:</span>
                      <span className="text-base font-bold font-mono text-pandora-title">${calculatedSubtotal.toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>

                  {/* Right Column: Payment controls */}
                  <div className="bg-pandora-accent p-5 rounded-2xl border border-pandora-border shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      
                      {/* Método de pago selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-pandora-muted uppercase tracking-wide">💳 MÉTODO DE PAGO *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Efectivo', 'Nequi', 'Bancolombia'] as const).map((method) => {
                            const isChosen = paymentMethod === method;
                            return (
                              <button
                                id={`pay-method-${method.toLowerCase()}`}
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`py-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                                  isChosen 
                                    ? 'bg-pandora-hover border-cyan-400 text-cyan-800 shadow-sm ring-1 ring-cyan-400 scale-[0.98]' 
                                    : 'bg-pandora-accent border-pandora-border hover:bg-pandora-hover text-pandora-body'
                                }`}
                              >
                                <span className="text-lg">
                                  {method === 'Efectivo' ? '💵' : method === 'Nequi' ? '📱' : '🏦'}
                                </span>
                                <span className="truncate max-w-full text-[11px]">
                                  {method === 'Bancolombia' ? 'Bancolombia' : method}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Impuesto al consumo toggle (switch) */}
                      <div className="space-y-2 bg-pandora-accent border border-pandora-gold/30 p-4 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="block text-xs font-bold text-pandora-title">Impuesto al Consumo (8%)</span>
                            <span className="text-[10px] text-pandora-muted font-light block leading-none">Aplicar gravamen culinario</span>
                          </div>
                          <div className="flex border rounded-lg overflow-hidden shrink-0 border-pandora-border bg-pandora-accent">
                            <button
                              id="tax-toggle-on"
                              type="button"
                              onClick={() => setApplyTax(true)}
                              className={`px-3 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                                applyTax ? 'bg-pandora-success text-white' : 'bg-pandora-hover hover:bg-pandora-hover text-pandora-muted'
                              }`}
                            >
                              SÍ
                            </button>
                            <button
                              id="tax-toggle-off"
                              type="button"
                              onClick={() => setApplyTax(false)}
                              className={`px-3 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                                !applyTax ? 'bg-pandora-primary text-white' : 'bg-pandora-hover hover:bg-pandora-hover text-pandora-muted'
                              }`}
                            >
                              NO
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-pandora-gold/30 text-[11px] text-pandora-body">
                          <span>Suma de Impuesto (8%):</span>
                          <span className="font-mono font-bold text-pandora-title">
                            {applyTax ? `+$${taxAmount.toLocaleString('es-CO')} COP` : '$0 COP'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Final results display */}
                    <div className="pt-4 border-t space-y-1 select-none">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-pandora-muted uppercase tracking-widest">TOTAL FINAL A PAGAR:</span>
                        <div className="text-right">
                          <span className="text-2xl font-mono font-extrabold text-pandora-success block" id="final-total-display">
                            ${finalTotal.toLocaleString('es-CO')} COP
                          </span>
                          <span className="text-[9px] text-pandora-muted font-light block">
                            Impuesto al consumo {applyTax ? 'aplicado (8%)' : 'no aplicado (0%)'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : activeTab === 'mapa' ? (
              <div id="map_visual" className="flex-1 flex flex-col">
                <div className="flex justify-between items-center text-pandora-body text-xs font-bold mb-4 select-none">
                  <span>🗺️ FLOOR PLAN — DISTRIBUCIÓN CAFÉ PANDORA</span>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-normal"><span className="w-2.5 h-2.5 bg-pandora-border rounded-full"></span> Vacía</span>
                    <span className="flex items-center gap-1 text-[10px] font-normal"><span className="w-2.5 h-2.5 bg-rose-200 rounded-full"></span> Ocupada</span>
                    <span className="flex items-center gap-1 text-[10px] font-normal"><span className="w-2.5 h-2.5 bg-emerald-200 rounded-full"></span> Reservada</span>
                    <span className="flex items-center gap-1 text-[10px] font-normal"><span className="w-2.5 h-2.5 bg-amber-200 rounded-full"></span> Por Pagar</span>
                  </div>
                </div>

                {/* Simulated physical layout coffee shop (12 Tables) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 flex-1">
                  {tables.map(table => {
                    const isSelected = selectedTable?.id === table.id;
                    let colorStyle = '';
                    switch (table.status) {
                      case 'vacía': colorStyle = 'border-pandora-border bg-pandora-accent hover:border-slate-400 text-pandora-body'; break;
                      case 'ocupada': colorStyle = 'border-pandora-danger/30 bg-pandora-error-bg/40 hover:bg-pandora-error-bg hover:border-rose-400 text-rose-800'; break;
                      case 'reservada': colorStyle = 'border-pandora-success/30 bg-pandora-success-bg/40 hover:bg-pandora-success-bg hover:border-emerald-400 text-pandora-success'; break;
                      case 'por_pagar': colorStyle = 'border-pandora-gold/30 bg-pandora-warning-bg/40 hover:bg-pandora-warning-bg hover:border-amber-400 text-amber-800'; break;
                    }

                    return (
                      <button
                        key={table.id}
                        onClick={() => {
                          setIsBillingActive(false);
                          setSelectedTable(table);
                        }}
                        className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between h-28 transition-all ${colorStyle} ${
                          isSelected ? 'ring-2 ring-cyan-500 border-cyan-500 scale-95 shadow-md' : 'shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-serif font-bold text-sm block leading-tight">{table.name}</span>
                          <span className="text-[10px] bg-pandora-accent px-1.5 py-0.5 rounded-full border border-pandora-border font-bold shrink-0">{table.status}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-pandora-muted">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>Cap: {table.capacity} paxs</span>
                          </div>
                          
                          {table.status === 'ocupada' && (
                            <div className="text-[11px] font-mono font-bold text-pandora-danger mt-1">
                              Suma: ${table.totalAmount.toLocaleString('es-CO')} COP
                            </div>
                          )}
                          {table.status === 'por_pagar' && (
                            <div className="text-[11px] font-mono font-bold text-pandora-gold mt-1 animate-pulse">
                              Cobro: ${table.totalAmount.toLocaleString('es-CO')} COP
                            </div>
                          )}
                          {table.status === 'reservada' && (
                            <div className="text-[9px] text-pandora-success truncate mt-1">
                              📝 {table.guestName}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Quick List Status */
              <div id="quick_list" className="space-y-2">
                <h4 className="text-xs font-bold text-pandora-body uppercase tracking-widest mb-3 select-none">📋 Listado de Mesas y Ocupación</h4>
                <div className="bg-pandora-accent rounded-xl border border-pandora-border overflow-hidden">
                  <div className="grid grid-cols-5 bg-pandora-border p-2.5 text-xs font-bold text-pandora-body select-none">
                    <span className="col-span-2">Mesa</span>
                    <span>Capacidad</span>
                    <span>Estatus</span>
                    <span className="text-right">Acumulado</span>
                  </div>
                  {tables.map(table => (
                    <div 
                      key={table.id} 
                      onClick={() => {
                        setIsBillingActive(false);
                        setSelectedTable(table);
                      }}
                      className="grid grid-cols-5 items-center p-2.5 text-xs text-pandora-body border-b border-pandora-border hover:bg-pandora-hover cursor-pointer"
                    >
                      <span className="col-span-2 font-serif font-bold text-slate-900">{table.name}</span>
                      <span>{table.capacity} personas</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          table.status === 'vacía' ? 'bg-pandora-border text-pandora-body' :
                          table.status === 'ocupada' ? 'bg-pandora-error-bg text-pandora-danger' :
                          table.status === 'reservada' ? 'bg-pandora-success-bg text-pandora-success' :
                          'bg-pandora-gold-bg text-pandora-gold'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      <span className="text-right font-mono font-bold">
                        {table.status === 'vacía' ? '-' : `$${table.totalAmount.toLocaleString('es-CO')} COP`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Interaction Controls & Direct Actions */}
          <div className="w-full md:w-80 shrink-0 bg-pandora-border p-4 border-t md:border-t-0 md:border-l border-pandora-border overflow-y-auto flex flex-col justify-between">
            {isBillingActive && selectedDetails ? (
              // ----- SECCION DE FACTURACION (CONTROLES DE COBRO) -----
              <div id="billing-actions" className="space-y-4 flex flex-col h-full justify-between">
                <div className="space-y-3">
                  <h5 className="text-[11px] font-bold text-pandora-muted uppercase tracking-widest leading-none select-none">IMP PREVIAS / ACCIONES</h5>
                  
                  {/* Realtime updating visual indicator widget */}
                  <div className="bg-pandora-accent p-4 rounded-xl border border-pandora-border text-pandora-body space-y-2 select-none shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-pandora-success-bg animate-ping"></span>
                      <span className="text-[9px] font-bold text-pandora-success uppercase tracking-wide">CAJA COBRO ACTIVO</span>
                    </div>
                    <p className="text-[10px] text-pandora-muted leading-relaxed">
                      La mesa <strong className="text-pandora-title font-bold">{selectedDetails.name}</strong> tiene un consumo acumulado de <strong className="text-slate-900 font-bold">${calculatedSubtotal.toLocaleString('es-CO')} COP</strong>. Proceda a previsualizar e imprimir.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t">
                  {/* Kitchen ticket printing */}
                  <button
                    id="btn-print-kitchen-ticket"
                    onClick={() => setPrintType('cooking')}
                    className="w-full py-2.5 bg-pandora-hover hover:bg-pandora-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
                  >
                    <Printer className="w-3.5 h-3.5" /> Recibo de Cocina
                  </button>

                  {/* Payment Invoice printing */}
                  <button
                    id="btn-print-payment-invoice"
                    onClick={() => setPrintType('payment')}
                    className="w-full py-2.5 bg-pandora-primary hover:bg-cyan-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
                  >
                    <Printer className="w-3.5 h-3.5" /> Factura de Pago
                  </button>

                  <div className="pt-2 border-t border-dashed mt-2">
                    {/* Primary confirmation trigger */}
                    <button
                      id="btn-confirm-payment-settle"
                      onClick={handleConfirmPayment}
                      className="w-full py-3 bg-pandora-success hover:bg-pandora-success-hover text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      <CheckCircle className="w-4 h-4" /> Registrar Pago y Liberar
                    </button>
                    <span className="block text-[8px] text-pandora-muted text-center mt-1 select-none">
                      Esta operación registrará con éxito ${finalTotal.toLocaleString('es-CO')} COP en su consola fiscal general.
                    </span>
                  </div>
                </div>
              </div>
            ) : selectedDetails ? (
              // ----- SECCION ESTÁNDAR CONTROL DE MESAS -----
              <div id="standard-table-controls" className="space-y-4">
                <div className="p-3 bg-pandora-accent rounded-xl border border-pandora-border text-pandora-title">
                  <h4 className="font-serif font-bold text-base text-pandora-title">{selectedDetails.name}</h4>
                  <p className="text-[10px] text-pandora-muted font-mono select-none">ID: Mesa-{selectedDetails.id} • Cap: {selectedDetails.capacity} personas</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-pandora-border flex justify-between items-center text-xs">
                    <span className="font-semibold text-pandora-body select-none">Estatus actual:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] select-none ${
                      selectedDetails.status === 'vacía' ? 'bg-pandora-border text-pandora-body' :
                      selectedDetails.status === 'ocupada' ? 'bg-pandora-error-bg text-pandora-danger' :
                      selectedDetails.status === 'reservada' ? 'bg-pandora-success-bg text-pandora-success' :
                      'bg-pandora-gold-bg text-pandora-gold'
                    }`}>
                      {selectedDetails.status}
                    </span>
                  </div>

                  {selectedDetails.status !== 'vacía' && (
                    <div className="mt-2 bg-pandora-hover p-2 rounded-lg text-xs font-mono text-pandora-body space-y-1">
                      {selectedDetails.totalAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Consumo actual:</span>
                          <span className="font-bold text-pandora-danger">${selectedDetails.totalAmount.toLocaleString('es-CO')} COP</span>
                        </div>
                      )}
                      {selectedDetails.guestName && (
                        <div>
                          <span className="block text-[10px] text-pandora-muted select-none">Reserva titular:</span>
                          <span className="font-bold text-pandora-success truncate block">{selectedDetails.guestName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* State Toggles */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-pandora-muted uppercase tracking-widest select-none">Cambiar Estatus Mesa</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-status-vacant"
                      onClick={() => handleSetStatus('vacía')}
                      className="py-1.5 bg-pandora-accent border hover:bg-pandora-hover text-pandora-body rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      ⚪ Vacía (Reset)
                    </button>
                    <button
                      id="btn-status-occupied"
                      onClick={() => handleSetStatus('ocupada')}
                      className="py-1.5 bg-pandora-error-bg border border-pandora-danger/30 hover:bg-pandora-error-bg text-pandora-danger rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🔴 Ocupada
                    </button>
                    <button
                      id="btn-status-toward-pay"
                      onClick={() => handleSetStatus('por_pagar')}
                      className="py-1.5 bg-pandora-warning-bg border border-pandora-gold/30 hover:bg-pandora-gold-bg text-pandora-gold rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🟡 Por Pagar
                    </button>
                  </div>

                  {/* Add simulated reservation info */}
                  <div className="p-3 bg-pandora-accent rounded-lg border border-slate-150">
                    <span className="block text-[10px] font-bold text-pandora-muted uppercase tracking-widest mb-2 select-none">Asignar Reserva</span>
                    <input 
                      id="input-reservation-guest"
                      type="text" 
                      value={customGuest}
                      onChange={(e) => setCustomGuest(e.target.value)}
                      placeholder="Nombre Cliente y hora"
                      className="w-full bg-pandora-hover border border-pandora-border rounded p-1.5 text-xs text-pandora-body mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      id="btn-submit-reservation"
                      onClick={() => handleSetStatus('reservada')}
                      className="w-full py-1.5 bg-pandora-success hover:bg-pandora-success-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                    >
                      🟢 Reservar Mesa
                    </button>
                  </div>
                </div>

                {/* Consumption simulator */}
                <div className="bg-pandora-accent p-3 rounded-xl border border-pandora-border space-y-2">
                  <span className="block text-[10px] font-bold text-pandora-muted uppercase tracking-widest select-none">Pruebas de Consumo</span>
                  <div className="flex gap-1.5">
                    <input 
                      id="input-custom-spend-test"
                      type="number" 
                      value={customSpend}
                      onChange={(e) => setCustomSpend(Number(e.target.value))}
                      className="bg-pandora-hover border border-pandora-border rounded p-1 text-xs w-20 text-center font-mono font-bold"
                    />
                    <button
                      id="btn-add-spend-test"
                      onClick={handleAddConsumption}
                      className="flex-1 py-1 bg-pandora-primary hover:bg-pandora-primary-hover text-white rounded text-xs font-semibold truncate cursor-pointer transition-colors"
                    >
                      ➕ Consumo
                    </button>
                  </div>
                </div>

                {/* Settle billing form trigger */}
                {selectedDetails.totalAmount > 0 && (
                  <button
                    id="btn-open-billing-form-trigger"
                    onClick={handleOpenBilling}
                    className="w-full py-2.5 bg-pandora-success hover:bg-pandora-success-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <Receipt className="w-4 h-4" /> Cobrar y Facturar Mesa
                  </button>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-pandora-muted py-12 select-none">
                <Map className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-xs">Seleccione una mesa física de salón para operar su estado o generar cobros.</p>
              </div>
            )}

            <span className="text-[9px] font-mono text-pandora-muted text-center mt-3 block select-none">Sincronización de mesa en tiempo real</span>
          </div>

        </div>

        {/* IN-APP HIGH FIDELITY THERMAL TICKET PREVIEW OVERLAY */}
        <AnimatePresence>
          {printType && selectedDetails && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-pandora-gold/10 z-50 p-4 flex flex-col justify-center items-center text-slate-900"
            >
              <motion.div
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.95 }}
                className="w-full max-w-sm bg-pandora-hover p-6 rounded-2xl shadow-2xl relative border-t-8 border-cyan-600 flex flex-col leading-tight max-h-[90vh] overflow-y-auto"
                id="simulated-receipt-card"
              >
                {/* Close action */}
                <button
                  id="btn-close-print-preview"
                  onClick={() => setPrintType(null)}
                  className="absolute top-3 right-3 p-1.5 hover:bg-pandora-hover rounded-full text-pandora-body font-bold transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col justify-between items-center h-full space-y-4">
                  
                  {/* Dynamic interactive option to toggle the Consumption Tax (Impuesto al Consumo 8%) directly inside the receipt! */}
                  {printType === 'payment' && (
                    <div className="w-full bg-pandora-hover border border-cyan-200 p-2.5 rounded-xl flex justify-between items-center select-none text-xs">
                      <div className="flex flex-col leading-tight">
                        <span className="font-extrabold text-cyan-900 flex items-center gap-1">
                          ⚖️ Impuesto Consumo (8%)
                        </span>
                        <span className="text-[9px] text-cyan-700">Cambiar estado del impuesto</span>
                      </div>
                      <button
                        id="btn-toggle-tax-receipt-overlay"
                        onClick={() => setApplyTax(!applyTax)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer ${
                          applyTax 
                            ? 'bg-pandora-success hover:bg-pandora-success-hover text-white' 
                            : 'bg-pandora-accent hover:bg-pandora-hover text-pandora-body border border-pandora-border'
                        }`}
                      >
                        {applyTax ? 'DESACTIVAR' : 'ACTIVAR'}
                      </button>
                    </div>
                  )}

                  {/* Ticket representation */}
                  <div className="w-full thermal-paper pt-2">
                    {printType === 'cooking' ? (
                      <>
                        <div className="text-center pb-3 border-b border-dashed border-pandora-border">
                          <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider mb-2 inline-block select-none">
                            TICKET DE COCINA
                          </span>
                          <h5 className="font-serif font-black text-sm tracking-widest text-pandora-title uppercase leading-none">PANDORA COMANDA</h5>
                          <p className="text-[8px] text-pandora-muted mt-1 uppercase font-mono tracking-widest select-none">PREPARACIÓN EN COCINA</p>
                        </div>

                        <div className="py-2.5 space-y-1.5 text-xs text-pandora-body font-mono border-b border-dashed border-slate-350">
                          <div className="flex justify-between">
                            <span>NÚMERO DE MESA:</span>
                            <span className="font-bold text-pandora-title text-sm uppercase">Mesa No. {selectedDetails.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mesa Nombre:</span>
                            <span className="font-semibold text-pandora-title uppercase">{selectedDetails.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FECHA Y HORA:</span>
                            <span className="text-pandora-title font-bold">{displayTime}</span>
                          </div>
                        </div>

                        <div className="py-3">
                          <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-pandora-muted pb-2 border-b font-mono select-none">
                            <span className="col-span-9">PRODUCTOS / DETALLE</span>
                            <span className="col-span-3 text-right">CANTIDAD</span>
                          </div>

                          <div className="divide-y divide-dotted pt-1 font-mono">
                            {combinedItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 text-sm text-pandora-title font-bold py-2">
                                <span className="col-span-9 font-serif">{item.name}</span>
                                <span className="col-span-3 text-right font-mono font-black text-slate-900 text-base">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-center pt-3 border-t border-dashed border-pandora-border text-[10px] text-pandora-muted italic font-mono select-none">
                          <p>✨ - Control de Servicio Interno - ✨</p>
                          <p className="mt-1 text-[8px] font-sans uppercase font-bold">Café Pandora S.A.S.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center pb-3 border-b border-dashed border-pandora-border">
                          <span className="text-[10px] bg-pandora-success-bg text-pandora-success px-2.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider mb-2 inline-block select-none">
                            FACTURA DE COBRO / POS
                          </span>
                          <h5 className="font-serif font-black text-sm tracking-widest text-pandora-title uppercase leading-none">CAFÉ PANDORA SLATE</h5>
                          <p className="text-[9px] text-pandora-muted mt-1">Av. Providencia #1904 - Reconciliación Fiscal</p>
                          <p className="text-[8px] text-pandora-muted leading-none font-mono">NIT. 901.381.189-4</p>
                        </div>

                        <div className="py-2.5 space-y-1.5 text-xs text-pandora-body font-mono border-b border-dashed border-slate-350 leading-none">
                          <div className="flex justify-between">
                            <span>Factura No:</span>
                            <span className="font-bold text-pandora-title">#BP-{Math.floor(100000 + Math.random()*900000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>NÚMERO DE MESA:</span>
                            <span className="font-bold text-pandora-title">No. {selectedDetails.id} ({selectedDetails.name})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>FECHA Y HORA:</span>
                            <span className="font-bold text-pandora-title">{displayTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Medio de Pago:</span>
                            <span className="font-bold text-pandora-title uppercase text-[10px] bg-pandora-border px-1.5 py-0.5 rounded">{paymentMethod}</span>
                          </div>
                        </div>

                        <div className="py-3 font-mono">
                          <div className="grid grid-cols-12 text-[9px] font-black uppercase text-pandora-muted pb-1.5 border-b border-dashed select-none">
                            <span className="col-span-6">PRODUCTOS</span>
                            <span className="col-span-2 text-center">CANT</span>
                            <span className="col-span-2 text-right">UNITARIO</span>
                            <span className="col-span-2 text-right">PRECIO</span>
                          </div>

                          <div className="space-y-1.5 pt-2 font-mono">
                            {combinedItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 text-xs text-pandora-title items-center">
                                <span className="col-span-6 font-serif font-bold text-slate-900 truncate leading-tight">{item.name}</span>
                                <span className="col-span-2 text-center">x{item.quantity}</span>
                                <span className="col-span-2 text-right">${item.price.toLocaleString('es-CO')}</span>
                                <span className="col-span-2 text-right font-bold">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-350 py-2.5 text-xs font-mono space-y-1">
                          <div className="flex justify-between text-pandora-body">
                            <span>Subtotal Neto:</span>
                            <span>${calculatedSubtotal.toLocaleString('es-CO')} COP</span>
                          </div>
                          {applyTax && (
                            <div className="flex justify-between text-pandora-title font-semibold">
                              <span>Impuesto Consumo (8%):</span>
                              <span>+${taxAmount.toLocaleString('es-CO')} COP</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between text-pandora-title font-extrabold text-sm border-t border-dotted border-pandora-border pt-2 mt-2 leading-none">
                            <span>TOTAL CLIENTE:</span>
                            <span className="text-pandora-success text-base">${finalTotal.toLocaleString('es-CO')} COP</span>
                          </div>
                        </div>

                        <div className="text-center pt-3 border-t border-dashed border-pandora-border text-[10px] text-pandora-muted space-y-1 select-none">
                          <p>☕️ ¡Muchísimas gracias por su visita! 🌿</p>
                          <p className="text-[8px] font-sans tracking-wide uppercase font-bold">Impuesto al Consumo: {applyTax ? 'Habilitado (8%)' : 'Deshabilitado (-)'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Simulated completion action */}
                  <div className="w-full pt-1">
                    <button
                      id="btn-simulate-complete-print"
                      onClick={() => {
                        alert(`¡Impresión física iniciada exitosamente! Se ha transferido el ticket de ${printType === 'cooking' ? 'comanda de cocina' : 'factura con impuesto al consumo'} a la ticketera de Café Pandora.`);
                        setPrintType(null);
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] transition-all relative z-50 ${
                        printType === 'cooking' ? 'bg-pandora-hover hover:bg-slate-950' : 'bg-pandora-primary hover:bg-cyan-750'
                      }`}
                    >
                      <Printer className="w-4 h-4" /> Enviar a Impr. Térmica
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
