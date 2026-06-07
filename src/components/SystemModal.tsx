/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, AlertTriangle, Play, Printer, Bell, Shield, Sparkles, RefreshCw } from 'lucide-react';
import { SystemAlert } from '../types';
import { STAFF_USERS } from '../data';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabFocus: 'usuarios' | 'alerta' | 'activador';
  alerts: SystemAlert[];
  onResolveAlert: (alertId: string) => void;
  onAddAlert: (alert: SystemAlert) => void;
}

export default function SystemModal({ isOpen, onClose, tabFocus, alerts, onResolveAlert, onAddAlert }: SystemModalProps) {
  const [activeTab, setActiveTab] = useState<'usuarios' | 'alerta' | 'activador'>(tabFocus);
  
  // Quick pin validator demo
  const [typedPin, setTypedPin] = useState('');
  const [pinValidationMsg, setPinValidationMsg] = useState('');

  // Hardware state simulation
  const [printerOnline, setPrinterOnline] = useState(true);
  const [hasSoundBuzzer, setHasSoundBuzzer] = useState(true);
  
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const userMatch = STAFF_USERS.find(u => u.pin === typedPin);
    if (userMatch) {
      const roleCapitalized = userMatch.role.charAt(0).toUpperCase() + userMatch.role.slice(1);
      setPinValidationMsg(`✅ AUTORIZADO: PIN pertenece a ${userMatch.name} (${roleCapitalized})`);
    } else {
      setPinValidationMsg('❌ DENEGADO: PIN ingresado no coincide con ningún empleado registrado.');
    }
    setTypedPin('');
  };

  const handleTestPrinter = () => {
    triggerNotification('🖨️ Enviando archivo de sincronización de prueba a la impresora térmica #1');
  };

  const handleTestBuzzer = () => {
    triggerNotification('🔊 Sonido de llamada e indicador sónico emitido.');
  };

  const handleTriggerMockAlertDetail = () => {
    const newAlert: SystemAlert = {
      id: `alt-${Math.floor(1000 + Math.random() * 9000)}`,
      level: 'warning',
      message: 'Llamada de asistencia rápida en Mesa 3 por demoras.',
      resolved: false,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    onAddAlert(newAlert);
    triggerNotification('Alerta simulada añadida para testing.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-5xl h-[75vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header Title */}
        <div className="bg-slate-750 bg-slate-800 p-4 shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-pandora-accent" />
            <div>
              <h3 className="font-serif text-lg font-bold">Consola de Control de Seguridad y Periféricos</h3>
              <p className="text-[11px] text-slate-300 font-light">Estatus de hardware, control de credenciales, y resolución de alertas del restaurante</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-slate-700 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-2 shrink-0 border-b border-slate-200 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'usuarios' ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" /> USUARIOS (Personal)
          </button>
          <button
            onClick={() => setActiveTab('alerta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'alerta' ? 'bg-fuchsia-100 text-fuchsia-950 border border-fuchsia-300' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-fuchsia-500" /> ALERTA ({alerts.filter(a=>!a.resolved).length} activas)
          </button>
          <button
            onClick={() => setActiveTab('activador')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'activador' ? 'bg-orange-100 text-orange-950 border border-orange-300' : 'text-slate-600 hover:text-slate-805'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-orange-500" /> ACTIVADOR (Hardware)
          </button>
        </div>

        {/* Action toast notifies */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-800 text-pandora-accent text-xs text-center py-2 font-bold select-none border-b border-white/5"
            >
              ⚙️ {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Container Panels */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          
          {/* TAB: USUARIOS (STAF LIST) */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Staff list panel */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                  <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">👥 NOMINA DE PERSONAL AUTORIZADO (PIN ACCESO Y ROL)</h4>
                  
                  <div className="divide-y divide-slate-100 overflow-y-auto max-h-80 pr-1">
                    {STAFF_USERS.map(employee => (
                      <div key={employee.id} className="py-2.5 flex justify-between items-center text-xs text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{employee.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Rol base: <span className="font-bold underline capitalize">{employee.role}</span> • Correo: {employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">PIN: {employee.pin}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo en Estación"></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Demo simulator */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
                  <h4 className="font-serif font-semibold text-sm text-slate-800 mb-1.5">🔑 TESTEADOR DE PIN</h4>
                  <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Simule la validación de comanda de caja ingresando el PIN numérico.</p>

                  <form onSubmit={handleVerifyPin} className="space-y-3.5">
                    <div>
                      <input 
                        type="password" 
                        maxLength={4}
                        placeholder="ej. 1111..."
                        value={typedPin}
                        onChange={(e) => setTypedPin(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-2 text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded py-2 text-xs font-semibold"
                    >
                      Autenticar PIN Empleado
                    </button>
                  </form>

                  {pinValidationMsg && (
                    <div className="mt-3 p-2.5 bg-slate-50 border rounded text-[10px] text-slate-700 font-medium leading-relaxed">
                      {pinValidationMsg}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB: ALERTA */}
          {activeTab === 'alerta' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-serif font-bold text-sm text-slate-800">📋 MENSAJES Y ANOMALIAS DETECTADAS EN RESTAURANTE</h4>
                <button
                  type="button"
                  onClick={handleTriggerMockAlertDetail}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded text-[10px] font-bold"
                >
                  ➕ Simular Anomalía
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {alerts.filter(a => !a.resolved).map((item) => (
                  <div key={item.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    item.level === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span className="text-[9px] uppercase tracking-wider font-extrabold font-mono opacity-80">{item.level} PRIORITY • {item.timestamp}</span>
                      </div>
                      <p className="text-xs font-medium font-sans leading-relaxed">{item.message}</p>
                    </div>
                    <button
                      onClick={() => onResolveAlert(item.id)}
                      className="py-1 px-3 bg-white border rounded shadow-sm text-[10px] font-bold text-slate-800 hover:bg-slate-50 self-start sm:self-center uppercase tracking-wider whitespace-nowrap shrink-0"
                    >
                      ✔ Resolver Alerta
                    </button>
                  </div>
                ))}
                {alerts.filter(a => !a.resolved).length === 0 && (
                  <div className="text-center text-slate-400 py-12 text-xs">
                    Ninguna anomalía reportada. Todo el sistema POS de Cafe Pandora funciona estable.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ACTIVADOR */}
          {activeTab === 'activador' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hardware Toggle items */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-800">🔌 CONECTORES PERIFERICOS LOCALES</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div>
                      <span className="font-bold text-xs text-slate-850 block">Conector Impresora Térmica #1 (Caja)</span>
                      <span className="text-[10px] text-slate-500 font-mono">USB Emulated Print System</span>
                    </div>
                    <button
                      onClick={() => setPrinterOnline(!printerOnline)}
                      className={`text-[10px] py-1 px-2.5 rounded font-bold uppercase transition-all ${
                        printerOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {printerOnline ? 'Online' : 'Offline'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div>
                      <span className="font-bold text-xs text-slate-850 block">Zumbador Sónico de Comanda (Kitchen Buzzer)</span>
                      <span className="text-[10px] text-slate-500 font-mono">Simulate beep acoustic feedback</span>
                    </div>
                    <button
                      onClick={() => setHasSoundBuzzer(!hasSoundBuzzer)}
                      className={`text-[10px] py-1 px-2.5 rounded font-bold uppercase transition-all ${
                        hasSoundBuzzer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {hasSoundBuzzer ? 'Activado' : 'Silenciado'}
                    </button>
                  </div>
                </div>

                {/* Tester scripts */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-800">🩺 PRUEBAS DE RESPUESTA SENSORIAL</h4>
                  <p className="text-xs text-slate-400 font-light">Accione triggers directos para diagnosticar papel de ticket o silbatos acusticos en estante.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={handleTestPrinter}
                      className="p-3 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-800"
                    >
                      <Printer className="w-4 h-4 text-orange-500" /> Testear Impresora T-1
                    </button>
                    <button
                      onClick={handleTestBuzzer}
                      className="p-3 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-xs font-semibold text-slate-800"
                    >
                      <Bell className="w-4 h-4 text-orange-500 animate-swing" /> Zumbador Cocina
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
