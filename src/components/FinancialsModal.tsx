/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, DollarSign, FileSpreadsheet, TrendingDown, Key, Plus, FileText, CheckCircle, Ticket } from 'lucide-react';
import { Expense, ShiftState } from '../types';

interface FinancialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabFocus: 'ventas' | 'informes' | 'cajero' | 'egresos' | 'apertura';
  shift: ShiftState;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onSetShift: (shift: ShiftState) => void;
}

export default function FinancialsModal({ isOpen, onClose, tabFocus, shift, expenses, onAddExpense, onSetShift }: FinancialsModalProps) {
  const [activeTab, setActiveTab] = useState<'ventas' | 'informes' | 'cajero' | 'egresos' | 'apertura'>(tabFocus);
  
  // Forms states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState('Suministros');
  const [floatAmount, setFloatAmount] = useState('');
  const [cashierName, setCashierName] = useState('Sofía Valenzuela');
  
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 2500);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return;

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newExpense: Expense = {
      id: `egr-${Math.floor(1000 + Math.random() * 9000)}`,
      description: expenseDesc,
      category: expenseCat,
      amount: amountNum,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    onAddExpense(newExpense);
    
    // Reset forms
    setExpenseDesc('');
    setExpenseAmount('');
    triggerNotification('Egreso de caja registrado exitosamente');
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(floatAmount);
    if (isNaN(amountNum) || amountNum < 0) return;

    onSetShift({
      isOpen: true,
      openedAt: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      openedBy: cashierName,
      initialFloat: amountNum,
      currentCash: amountNum,
      totalSales: 0.00,
      totalExpenses: 0.00
    });
    setFloatAmount('');
    triggerNotification('Se ha abierto el turno de caja con éxito');
  };

  const handleCloseShift = () => {
    onSetShift({
      ...shift,
      isOpen: false
    });
    triggerNotification('Se ha cerrado el turno de caja. Reporte generado.');
  };

  // Helper calculating net cash drawer balance
  const activeBalance = useMemo(() => {
    return shift.initialFloat + shift.totalSales - shift.totalExpenses;
  }, [shift]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header Tab Panel */}
        <div className="bg-fuchsia-700 p-4 shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-pandora-cream animate-bounce" />
            <div>
              <h3 className="font-serif text-lg font-bold">Consola Financiera y Contabilidad POS</h3>
              <p className="text-[11px] text-fuchsia-100 font-light">Gestión de caja registradora, retiros, compras y cierres fiscales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-fuchsia-800 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-fuchsia-50/60 p-2 shrink-0 border-b border-fuchsia-100 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'ventas' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-600 hover:text-fuchsia-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> VENTAS DIA (Caja)
          </button>
          <button
            onClick={() => setActiveTab('informes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'informes' ? 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300' : 'text-slate-600 hover:text-fuchsia-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-fuchsia-600" /> INFORMES (Métricas)
          </button>
          <button
            onClick={() => setActiveTab('cajero')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'cajero' ? 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300' : 'text-slate-600 hover:text-fuchsia-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-fuchsia-600" /> CAJERO (Saldos)
          </button>
          <button
            onClick={() => setActiveTab('egresos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'egresos' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'text-slate-600 hover:text-fuchsia-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> EGRESOS (Salidas)
          </button>
          <button
            onClick={() => setActiveTab('apertura')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'apertura' ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' : 'text-slate-600 hover:text-fuchsia-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-600" /> ABRIR CAJA (Turnos)
          </button>
        </div>

        {/* Global notification banner */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-550 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs text-center py-2 font-semibold"
            >
              ✅ {showNotification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* content panels */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          
          {/* TAB: VENTAS DIA */}
          {activeTab === 'ventas' && (
            <div className="space-y-6">
              
              {/* Cards Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Turno Apertura</span>
                  <span className="block font-mono font-bold text-lg text-slate-800">${shift.initialFloat.toFixed(2)} USD</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Base de cambios en caja</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-250 shadow-sm">
                  <span className="block text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Total Ventas Bruto (Hoy)</span>
                  <span className="block font-mono font-bold text-lg text-emerald-600">${shift.totalSales.toFixed(2)} USD</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Reconciliación de boletas POS cerradas</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-250 shadow-sm">
                  <span className="block text-[10px] uppercase font-bold text-rose-600 tracking-wider">Total Egresos Hoy</span>
                  <span className="block font-mono font-bold text-lg text-rose-600">-${shift.totalExpenses.toFixed(2)} USD</span>
                  <span className="block text-[10px] text-slate-500 mt-1">Gastos varios acreditados</span>
                </div>
              </div>

              {/* Little custom bar graph chart (Simulating with beautiful SVG) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="font-serif font-bold text-slate-800 text-sm mb-4">📊 GRAFICO DE VENTAS POR CATEGORIAS (Simulado)</h4>
                <div className="h-44 flex items-end justify-around gap-6 pt-4 px-8 border-b border-slate-100">
                  <div className="flex flex-col items-center flex-1 max-w-[80px]">
                    <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">${(shift.totalSales * 0.4).toFixed(1)}</span>
                    <div className="w-full bg-amber-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 100 : 5}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2">Café Expreso</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 max-w-[80px]">
                    <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">${(shift.totalSales * 0.3).toFixed(1)}</span>
                    <div className="w-full bg-emerald-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 70 : 5}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2">Desayunos</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 max-w-[80px]">
                    <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">${(shift.totalSales * 0.2).toFixed(1)}</span>
                    <div className="w-full bg-orange-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 45 : 5}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2">Repostería</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 max-w-[80px]">
                    <span className="text-[10px] font-mono text-slate-600 font-bold mb-1">${(shift.totalSales * 0.1).toFixed(1)}</span>
                    <div className="w-full bg-cyan-400 rounded-t-lg transition-all duration-500" style={{ height: `${shift.totalSales > 0 ? 25 : 5}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-700 mt-2">Tés / Infus.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: INFORMES */}
          {activeTab === 'informes' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">📈 INFORMES DE RENDIMIENTO Y RENDICIÓN</h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Consulte los índices clave de atención al comensal y transacciones financieras del cierre parcial de caja registrado.
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ticket Promedio</span>
                    <span className="font-bold font-mono text-slate-800 block text-lg">${shift.totalSales > 0 ? (shift.totalSales / 4.2).toFixed(2) : 0.00} USD</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Margen Operativo</span>
                    <span className="font-bold text-emerald-600 block text-lg">74.5%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tasa Desperdicios</span>
                    <span className="font-bold text-rose-500 block text-lg">1.2%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eficiencia Ticket</span>
                    <span className="font-bold text-blue-600 block text-lg">11 mins</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => triggerNotification('Reporte PDF preliminar enviado a la cola de impresión.')}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Exportar Informe de Ventas
                  </button>
                  <button
                    onClick={() => triggerNotification('Consumo de insumos conciliado con inventario.')}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                  >
                    Reconciliar Insumos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CAJERO */}
          {activeTab === 'cajero' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cash Balance Display */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm mb-1.5">💵 SALDO EN EFECTIVO — ARQUEO DISPONIBLE</h4>
                    <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Arqueo matemático del sistema (Base inicial + Ventas - Egresos)</p>
                    
                    <div className="bg-fuchsia-50 p-4 rounded-lg border border-fuchsia-100 text-center mb-4">
                      <span className="text-xs uppercase font-bold text-fuchsia-800 tracking-wider block">Neto en Cajón Monedero</span>
                      <span className="font-mono text-3xl font-extrabold text-fuchsia-900 block mt-1">${activeBalance.toFixed(2)} USD</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerNotification('Apertura física de gaveta monedero efectuada con éxito.')}
                      className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      🔓 Abrir Cajón Físico
                    </button>
                    {shift.isOpen && (
                      <button
                        onClick={handleCloseShift}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        🔒 Efectuar Cierre Caja
                      </button>
                    )}
                  </div>
                </div>

                {/* Safe Deposit Simulator */}
                <div className="bg-white p-5 rounded-xl border border-slate-200">
                  <h4 className="font-serif font-bold text-slate-800 text-sm mb-1.5">🛡️ RETIRO PARCIAL PARA CAJA FUERTE</h4>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Retire excedente para mantener niveles seguros en caja monedero.</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Monto de retiro ($)</label>
                      <input 
                        type="number" 
                        placeholder="ej. $100.00"
                        className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-fuchsia-500 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => triggerNotification('Retiro registrado. Inserte el dinero en la bóveda.')}
                      className="w-full bg-slate-800 hover:bg-slate-950 text-white py-2 text-xs font-semibold rounded-lg transition-colors"
                    >
                      🔑 Autorizar Retiro Seguro
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: EGRESOS */}
          {activeTab === 'egresos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Expense form */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
                  <h4 className="font-serif font-bold text-sm text-slate-800 mb-1.5">📝 NUEVA SALIDA (EGRESO)</h4>
                  <p className="text-[11px] text-slate-400 mb-4 font-light">Escriba el motivo e importe de la salida.</p>
                  
                  <form onSubmit={handleCreateExpense} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción Motivo</label>
                      <input 
                        type="text" 
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        placeholder="ej. Leche almendras x6 cajas"
                        className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Monto ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría</label>
                        <select 
                          className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                          value={expenseCat}
                          onChange={(e) => setExpenseCat(e.target.value)}
                        >
                          <option value="Suministros">Suministros</option>
                          <option value="Servicios">Servicios</option>
                          <option value="Limpieza">Limpieza</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-rose-550 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2.5 text-xs font-bold shadow-md shadow-rose-500/10 tracking-wide"
                    >
                      Registrar Egreso
                    </button>
                  </form>
                </div>

                {/* Expenses list history */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">📋 HISTORIAL DE MOVIDAS DE EGRESO (HOY)</h4>
                    
                    <div className="overflow-y-auto max-h-56 pr-1 divide-y divide-slate-100">
                      {expenses.map((exp) => (
                        <div key={exp.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{exp.description}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {exp.id} • Categoría: {exp.category} • {exp.timestamp}</span>
                          </div>
                          <span className="font-bold font-mono text-rose-600 text-xs">-${exp.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <div className="text-center text-slate-400 py-12 text-xs">
                          No se han acreditado egresos de caja registrados durante este turno de trabajo.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: ABRIR CAJA */}
          {activeTab === 'apertura' && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                
                <h4 className="font-serif font-bold text-base text-slate-800 mb-1">🔐 APERTURA / REESTABLECER TURNO DE TRABAJO</h4>
                <p className="text-xs text-slate-400 mb-5 font-light">Inicializa la base para dar vueltas/bajos al comensal.</p>

                {shift.isOpen ? (
                  <div className="space-y-4">
                    <div className="bg-cyan-50 p-4 border border-cyan-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-600">Estatus Turno:</span>
                        <span className="text-cyan-700 font-bold uppercase tracking-wider">🟢 ABIERTO</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Apertura por:</span>
                        <span className="font-bold">{shift.openedBy}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Base de cambio inicial:</span>
                        <span className="font-bold">${shift.initialFloat.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Registrado a las:</span>
                        <span className="font-bold">{shift.openedAt || 'Activo'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseShift}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-md transition-colors text-center"
                    >
                      Efectuar Cierre de Caja del Turno
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleOpenShift} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Cajero de Turno</label>
                      <input 
                        type="text" 
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 font-medium"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Efectivo Inicial en Caja (Fondo Fijo)</label>
                      <input 
                        type="number" 
                        placeholder="$150.00"
                        value={floatAmount}
                        onChange={(e) => setFloatAmount(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2.5 text-xs font-bold rounded-lg transition-colors"
                    >
                      Aperturar Turno con Fondo Fijo
                    </button>
                  </form>
                )}

              </div>
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
