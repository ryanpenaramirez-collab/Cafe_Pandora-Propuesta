/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, MapPin, Users, DollarSign, Calendar, RefreshCw, Printer, CheckCircle } from 'lucide-react';
import { Table, TableStatus } from '../types';

interface TablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onUpdateTableStatus: (tableId: number, status: TableStatus, guestName?: string, totalAmount?: number) => void;
  onClearTable: (tableId: number, cashSettled: boolean) => void;
}

export default function TablesModal({ isOpen, onClose, tables, onUpdateTableStatus, onClearTable }: TablesModalProps) {
  const [activeTab, setActiveTab] = useState<'mapa' | 'lista'>('mapa');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customSpend, setCustomSpend] = useState<number>(10.00);
  const [customGuest, setCustomGuest] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);

  const selectedDetails = useMemo(() => {
    if (!selectedTable) return null;
    return tables.find(t => t.id === selectedTable.id) || null;
  }, [tables, selectedTable]);

  const handleSettle = () => {
    if (!selectedDetails) return;
    onClearTable(selectedDetails.id, true);
    setShowReceipt(true);
    setTimeout(() => {
      setShowReceipt(false);
      setSelectedTable(null);
    }, 4000);
  };

  const handleSetStatus = (status: TableStatus) => {
    if (!selectedDetails) return;
    let guest = undefined;
    if (status === 'reservada') {
      guest = customGuest || 'Cliente Incógnito - 19:30';
    }
    onUpdateTableStatus(selectedDetails.id, status, guest, status === 'vacía' ? 0 : undefined);
    setCustomGuest('');
  };

  const handleAddConsumption = () => {
    if (!selectedDetails) return;
    const currentCost = selectedDetails.totalAmount;
    onUpdateTableStatus(selectedDetails.id, 'ocupada', undefined, currentCost + customSpend);
  };

  const getStatusBadgeClass = (status: TableStatus) => {
    switch (status) {
      case 'vacía': return 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300';
      case 'ocupada': return 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300';
      case 'reservada': return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300';
      case 'por_pagar': return 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header Tab Actions */}
        <div className="bg-cyan-600 p-4 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-pandora-cream" />
            <div>
              <h3 className="font-serif text-lg font-bold">Distribución Física y Control de Mesas</h3>
              <p className="text-[11px] text-cyan-100 font-light">Estatus de servicio y facturaciones rápidas en salón</p>
            </div>
          </div>
          <div className="flex gap-1 bg-cyan-700/50 p-1 rounded-lg self-start">
            <button
              onClick={() => setActiveTab('mapa')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'mapa' ? 'bg-cyan-800 text-white shadow-sm' : 'text-cyan-200 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Mapa de Salón (Grid)
            </button>
            <button
              onClick={() => setActiveTab('lista')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'lista' ? 'bg-cyan-800 text-white shadow-sm' : 'text-cyan-200 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Lista Estatus Rápido
            </button>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-cyan-700 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Tables Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 flex flex-col">
            
            {activeTab === 'mapa' ? (
              <div id="map_visual" className="flex-1 flex flex-col">
                <div className="flex justify-between items-center text-slate-700 text-xs font-bold mb-4">
                  <span>🗺️ FLOOR PLAN — DISTRIBUCIÓN CAFÉ PANDORA</span>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-normal"><span className="w-2.5 h-2.5 bg-slate-200 rounded-full"></span> Vacía</span>
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
                      case 'vacía': colorStyle = 'border-slate-200 bg-white hover:border-slate-400 text-slate-700'; break;
                      case 'ocupada': colorStyle = 'border-rose-300 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-400 text-rose-800'; break;
                      case 'reservada': colorStyle = 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-800'; break;
                      case 'por_pagar': colorStyle = 'border-amber-300 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-400 text-amber-800'; break;
                    }

                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between h-28 transition-all ${colorStyle} ${
                          isSelected ? 'ring-2 ring-cyan-500 border-cyan-500 scale-95 shadow-md' : 'shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-serif font-bold text-sm block leading-tight">{table.name}</span>
                          <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full border border-slate-100 font-bold shrink-0">{table.status}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>Cap: {table.capacity} paxs</span>
                          </div>
                          
                          {table.status === 'ocupada' && (
                            <div className="text-[11px] font-mono font-bold text-rose-600 mt-1">
                              Suma: ${table.totalAmount.toFixed(2)} USD
                            </div>
                          )}
                          {table.status === 'por_pagar' && (
                            <div className="text-[11px] font-mono font-bold text-amber-600 mt-1 animate-pulse">
                              Cobro: ${table.totalAmount.toFixed(2)} USD
                            </div>
                          )}
                          {table.status === 'reservada' && (
                            <div className="text-[9px] text-emerald-600 truncate mt-1">
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
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">📋 Listado de Mesas y Ocupación</h4>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="grid grid-cols-5 bg-slate-100 p-2.5 text-xs font-bold text-slate-600">
                    <span className="col-span-2">Mesa</span>
                    <span>Capacidad</span>
                    <span>Estatus</span>
                    <span className="text-right">Acumulado</span>
                  </div>
                  {tables.map(table => (
                    <div 
                      key={table.id} 
                      onClick={() => setSelectedTable(table)}
                      className="grid grid-cols-5 items-center p-2.5 text-xs text-slate-700 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="col-span-2 font-serif font-bold text-slate-900">{table.name}</span>
                      <span>{table.capacity} personas</span>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          table.status === 'vacía' ? 'bg-slate-100 text-slate-600' :
                          table.status === 'ocupada' ? 'bg-rose-100 text-rose-700' :
                          table.status === 'reservada' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                      <span className="text-right font-mono font-bold">
                        {table.status === 'vacía' ? '-' : `$${table.totalAmount.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Interaction Controls */}
          <div className="w-full md:w-80 shrink-0 bg-slate-100 p-4 border-t md:border-t-0 md:border-l border-slate-200 overflow-y-auto flex flex-col justify-between">
            {selectedDetails ? (
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800">
                  <h4 className="font-serif font-bold text-base text-pandora-dark">{selectedDetails.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">ID: Mesa-{selectedDetails.id} • Capacidad: {selectedDetails.capacity} personas</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Estatus actual:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      selectedDetails.status === 'vacía' ? 'bg-slate-100 text-slate-700' :
                      selectedDetails.status === 'ocupada' ? 'bg-rose-100 text-rose-700' :
                      selectedDetails.status === 'reservada' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedDetails.status}
                    </span>
                  </div>

                  {selectedDetails.status !== 'vacía' && (
                    <div className="mt-2 bg-slate-50 p-2 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                      {selectedDetails.totalAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Consumo actual:</span>
                          <span className="font-bold text-rose-600">${selectedDetails.totalAmount.toFixed(2)} USD</span>
                        </div>
                      )}
                      {selectedDetails.guestName && (
                        <div>
                          <span className="block text-[10px] text-slate-400">Reserva titular:</span>
                          <span className="font-bold text-emerald-700 truncate block">{selectedDetails.guestName}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* State Toggles */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cambiar Estatus Mesa</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSetStatus('vacía')}
                      className="py-1.5 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      ⚪ Vacía (Reset)
                    </button>
                    <button
                      onClick={() => handleSetStatus('ocupada')}
                      className="py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold"
                    >
                      🔴 Ocupada
                    </button>
                    <button
                      onClick={() => handleSetStatus('por_pagar')}
                      className="py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold"
                    >
                      🟡 Por Pagar
                    </button>
                  </div>

                  {/* Add simulated reservation info */}
                  <div className="p-3 bg-white rounded-lg border border-slate-150">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Asignar Reserva</span>
                    <input 
                      type="text" 
                      value={customGuest}
                      onChange={(e) => setCustomGuest(e.target.value)}
                      placeholder="Nombre Cliente y hora"
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-700 mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSetStatus('reservada')}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                    >
                      🟢 Reservar Mesa
                    </button>
                  </div>
                </div>

                {/* Consumption simulator */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pruebas de Consumo</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      value={customSpend}
                      onChange={(e) => setCustomSpend(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded p-1 text-xs w-20 text-center font-mono font-bold"
                    />
                    <button
                      onClick={handleAddConsumption}
                      className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-semibold truncate"
                    >
                      ➕ Consumo
                    </button>
                  </div>
                </div>

                {/* Settle invoice trigger */}
                {selectedDetails.totalAmount > 0 && (
                  <button
                    onClick={handleSettle}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> Cobrar y Generar Boleta
                  </button>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 py-12">
                <Map className="w-12 h-12 opacity-30 mb-2" />
                <p className="text-xs">Seleccione una mesa para operar su estado.</p>
              </div>
            )}

            {/* Virtual receipt modal */}
            <AnimatePresence>
              {showReceipt && selectedDetails && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-pandora-dark/95 z-50 p-4 flex flex-col justify-center items-center text-slate-900"
                >
                  <div className="w-full max-w-xs thermal-paper p-5 rounded-lg border-2 border-slate-300 font-mono text-xs flex flex-col leading-tight relative shrink-0">
                    <div className="absolute top-0 right-0 p-2 text-[8px] bg-emerald-100 text-emerald-800 rounded font-sans uppercase font-bold tracking-widest">PAGADO</div>
                    
                    <div className="text-center pb-2 border-b border-dashed border-slate-300">
                      <h5 className="font-serif font-bold text-sm tracking-wider text-slate-900">CAFE PANDORA EST. 2024</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Av. Providencia #1904, Providencia</p>
                      <p className="text-[9px] text-slate-400 font-sans mt-0.5">POS TRANS RECONCILIATION</p>
                    </div>

                    <div className="py-2.5 space-y-1 text-[11px] text-slate-700">
                      <div className="flex justify-between">
                        <span>Boleta:</span>
                        <span className="font-bold">#BP-{Math.floor(1000 + Math.random()*9000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mesa:</span>
                        <span className="font-bold uppercase">{selectedDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cajero:</span>
                        <span>Sofía V. (Caja principal)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{new Date().toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-350 py-2.5">
                      <div className="flex justify-between font-bold text-slate-800 pb-1">
                        <span>Consumo Registro:</span>
                        <span>${selectedDetails.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>IVA (19% impl.):</span>
                        <span>${(selectedDetails.totalAmount * 0.19).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-dotted border-slate-300 pt-1.5 mt-2">
                        <span>TOTAL REC:</span>
                        <span>${(selectedDetails.totalAmount).toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px] mt-1">
                        <span>Efectivo Entregado:</span>
                        <span>${(selectedDetails.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
                      <p>✨ ¡Gracias por comer en Pandora! ✨</p>
                      <p className="mt-1 text-[8px] font-sans">IMPRESA VÍA SERVER DE PREDICCIONES DE COBRO</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <span className="text-[9px] font-mono text-slate-400 text-center mt-3 block">Sincronización de mesa en tiempo real</span>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
