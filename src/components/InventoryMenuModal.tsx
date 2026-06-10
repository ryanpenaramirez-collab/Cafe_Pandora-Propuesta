/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Utensils, Coffee, Archive, Calendar, Edit, Check, EyeOff, Plus, PlayCircle, Trash2 } from 'lucide-react';
import { MenuItem, StockItem, Table } from '../types';

interface InventoryMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabFocus: 'platos' | 'bebidas' | 'reserva' | 'inventario';
  menu: MenuItem[];
  stock: StockItem[];
  tables: Table[];
  onUpdateMenuPrice: (itemId: string, newPrice: number, isAvailable: boolean) => void;
  onAddStock: (stockId: string, addedQty: number) => void;
  onAddReservation: (tableId: number, guestName: string) => void;
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
}

export default function InventoryMenuModal({ 
  isOpen, onClose, tabFocus, menu, stock, tables, 
  onUpdateMenuPrice, onAddStock, onAddReservation,
  onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem
}: InventoryMenuModalProps) {
  const [activeTab, setActiveTab] = useState<'platos' | 'bebidas' | 'reserva' | 'inventario'>(tabFocus);

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  
  // New full product CRUD states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'platillo' | 'bebida'>('platillo');
  const [formAvailable, setFormAvailable] = useState(true);

  // Stock add state
  const [stockAddId, setStockAddId] = useState<string | null>(null);
  const [stockAddQty, setStockAddQty] = useState<string>('5');

  // Reservation states
  const [resTableId, setResTableId] = useState<number>(() => tables[0]?.id || 1);
  const [resName, setResName] = useState('');
  const [resHour, setResHour] = useState('19:00');

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2200);
  };

  const dishesList = useMemo(() => {
    return menu.filter(item => item.category === 'platillo');
  }, [menu]);

  const beveragesList = useMemo(() => {
    return menu.filter(item => item.category === 'bebida');
  }, [menu]);

  const handleStartEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingPrice(item.price.toFixed(2));
  };

  const handleFinishEdit = (item: MenuItem, isAvailable: boolean) => {
    const priceNum = parseFloat(editingPrice);
    if (!isNaN(priceNum) && priceNum >= 0) {
      onUpdateMenuPrice(item.id, priceNum, isAvailable);
      triggerNotification(`Información de ${item.name} cambiada con éxito`);
    }
    setEditingItemId(null);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    onUpdateMenuPrice(item.id, item.price, !item.available);
    triggerNotification(`Estado de disponible cambiado para ${item.name}`);
  };

  const handleIntakeStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAddId) return;
    const qty = parseFloat(stockAddQty);
    if (isNaN(qty) || qty <= 0) return;

    onAddStock(stockAddId, qty);
    
    const matched = stock.find(s => s.id === stockAddId);
    triggerNotification(`Ingreso de stock: +${qty} ${matched?.unit} a ${matched?.name}`);
    
    setStockAddId(null);
    setStockAddQty('5');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice);
    if (!formName || isNaN(priceNum) || priceNum < 0) {
      triggerNotification('Por favor, ingrese un nombre y precio válidos.');
      return;
    }

    if (isEditingItem) {
      const updated: MenuItem = {
        ...isEditingItem,
        name: formName,
        price: priceNum,
        description: formDescription,
        category: formCategory,
        available: formAvailable
      };
      onUpdateMenuItem(updated);
      triggerNotification(`Producto "${formName}" actualizado con éxito`);
    } else {
      const newItem: MenuItem = {
        id: `prod_${Date.now()}`,
        name: formName,
        price: priceNum,
        description: formDescription,
        category: formCategory,
        available: formAvailable
      };
      onAddMenuItem(newItem);
      triggerNotification(`Producto "${formName}" agregado con éxito`);
    }

    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormCategory('platillo');
    setFormAvailable(true);
    setIsAdding(false);
    setIsEditingItem(null);
  };

  const handleDeleteProduct = (item: MenuItem) => {
    if (confirm(`¿Está seguro de eliminar el producto "${item.name}"?`)) {
      onDeleteMenuItem(item.id);
      triggerNotification(`Producto "${item.name}" eliminado con éxito`);
    }
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName) return;

    onAddReservation(resTableId, `${resName} - ${resHour}`);
    triggerNotification(`Agenda reservada mesa ${resTableId} a nombre de ${resName}`);
    
    setResName('');
    setResHour('19:00');
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
        {/* Header Title */}
        <div className="bg-emerald-750 bg-emerald-650 bg-emerald-600 p-4 shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-pandora-cream" />
            <div>
              <h3 className="font-serif text-lg font-bold">Gestión de Menú, Inventario e Insumos</h3>
              <p className="text-[11px] text-emerald-100 font-light">Administración de precios, disponibilidad de cocina y reservas de mesa</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-emerald-700 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="bg-emerald-50/50 p-2 shrink-0 border-b border-emerald-100 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('platos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'platos' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-600" /> PLATOS (Comida)
          </button>
          <button
            onClick={() => setActiveTab('bebidas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'bebidas' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-600" /> BEBIDAS (Café)
          </button>
          <button
            onClick={() => setActiveTab('reserva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'reserva' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> RESERVAS comensales
          </button>
          <button
            onClick={() => setActiveTab('inventario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'inventario' ? 'bg-orange-100 text-orange-950 border border-orange-300' : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-orange-600" /> INVENTARIO (Insumos)
          </button>
        </div>

        {/* Sync panel notices */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-50 text-emerald-800 border-b border-rose-100 text-xs text-center py-2 font-bold"
            >
              🎉 {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Container Panels */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          
          {/* TAB: PLATOS & BEBIDAS */}
          {(activeTab === 'platos' || activeTab === 'bebidas') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FAF5EE] border border-slate-200 p-4 rounded-xl gap-3 text-xs font-bold text-slate-700 shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase text-slate-800 tracking-wider font-serif">GESTIÓN DE CARTA ({activeTab === 'platos' ? 'Platillos (Comidas)' : 'Bebidas (Café)'})</span>
                  <span className="text-[10px] text-slate-500 font-light font-sans normal-case">Administración de productos (crear, editar, eliminar) para el MVP</span>
                </div>
                {!isAdding && !isEditingItem && (
                  <button
                    onClick={() => {
                      setFormName('');
                      setFormPrice('');
                      setFormDescription('');
                      setFormCategory(activeTab === 'platos' ? 'platillo' : 'bebida');
                      setFormAvailable(true);
                      setIsEditingItem(null);
                      setIsAdding(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono leading-none py-2 px-3 rounded-lg transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Producto
                  </button>
                )}
              </div>

              {/* Product Create/Edit Form */}
              {(isAdding || isEditingItem) ? (
                <form onSubmit={handleSaveProduct} className="bg-white p-5 rounded-2xl border border-slate-300 shadow-md max-w-lg mx-auto space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-serif font-bold text-sm text-slate-800 uppercase tracking-wide">
                      {isEditingItem ? `Editar Producto: ${isEditingItem.name}` : `Agregar Nuevo Producto (${activeTab === 'platos' ? 'Plato' : 'Bebida'})`}
                    </h4>
                    <p className="text-[10px] text-slate-400">Complete los campos obligatorios para actualizar el menú.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ej. Panini de Pavo Especial o Espresso Macchiato"
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio (USD) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría *</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as 'platillo' | 'bebida')}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 outline-none"
                        >
                          <option value="platillo">Platillo / Comida</option>
                          <option value="bebida">Bebida / Café</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="ej. Con queso mozzarella fundido, jamón de pavo y aderezo especial de pesto."
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none h-20 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="formAvailable"
                        checked={formAvailable}
                        onChange={(e) => setFormAvailable(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <label htmlFor="formAvailable" className="text-[11px] font-bold text-slate-700 select-none">
                        Habilitar producto para ventas de inmediato
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setIsEditingItem(null);
                      }}
                      className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer focus:outline-none"
                    >
                      {isEditingItem ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(activeTab === 'platos' ? dishesList : beveragesList).map((item) => {
                    const isEditing = editingItemId === item.id;
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-sm text-slate-900">{item.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.available ? 'Activo' : 'Pausado'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 pb-3 border-b leading-relaxed">{item.description}</p>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-1">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs font-bold text-slate-600">$</span>
                              <input 
                                type="number" 
                                step="0.10"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="w-16 bg-slate-550 bg-slate-50 border rounded p-1 text-xs font-mono font-bold text-slate-800 text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                              />
                              <button
                                onClick={() => handleFinishEdit(item, item.available)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-[10px] text-slate-500">Precio:</span>
                              <span className="font-bold text-slate-800 text-xs">${item.price.toFixed(2)} USD</span>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="text-emerald-600 hover:text-emerald-750 hover:bg-slate-50 hover:border-slate-100 p-1 rounded"
                                title="Editar precio"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="flex gap-1 items-center">
                            {/* Edit Detail Button */}
                            <button
                              onClick={() => {
                                setFormName(item.name);
                                setFormPrice(item.price.toString());
                                setFormDescription(item.description);
                                setFormCategory(item.category);
                                setFormAvailable(item.available);
                                setIsEditingItem(item);
                                setIsAdding(false);
                              }}
                              className="text-amber-600 hover:text-amber-700 p-1 px-2 border border-slate-205 border-slate-200 hover:bg-amber-50 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                              title="Editar detalles completos (Nombre, Descripción, Categoría)"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Ficha</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteProduct(item)}
                              className="text-rose-600 hover:text-rose-700 p-1 px-2 border border-slate-205 border-slate-200 hover:bg-rose-50 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer mr-1"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Borrar</span>
                            </button>

                            <button
                              onClick={() => handleToggleAvailability(item)}
                              className={`py-1 px-2.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                item.available
                                  ? 'bg-slate-105 bg-slate-100 hover:bg-rose-50 text-rose-600'
                                  : 'bg-emerald-550 bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                              }`}
                            >
                              {item.available ? 'Pausar Ventas' : 'Habilitar'}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: RESERVAS */}
          {activeTab === 'reserva' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Creation */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
                <h4 className="font-serif font-semibold text-sm text-slate-800 mb-1.5">📅 REGISTRAR RESERVA</h4>
                <p className="text-[11px] text-slate-400 mb-4">Ingrese los datos para bloquear mesa.</p>
                
                <form onSubmit={handleCreateReservation} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Comensal</label>
                    <input 
                      type="text" 
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      placeholder="ej. Juan Pérez"
                      className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Hora Cita</label>
                      <input 
                        type="text" 
                        value={resHour}
                        onChange={(e) => setResHour(e.target.value)}
                        placeholder="19:00"
                        className="w-full bg-slate-50 border rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mesa Destino</label>
                      <select 
                        value={resTableId}
                        onChange={(e) => setResTableId(Number(e.target.value))}
                        className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 font-semibold"
                      >
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Cap {t.capacity})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-xs font-bold shadow-md shadow-emerald-500/10 tracking-wide"
                  >
                    Agendar Reserva de Mesa
                  </button>
                </form>
              </div>

              {/* Current listings */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">📋 RESERVACIONES ACTIVAS EN EL SALÓN ESTA TARDE</h4>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                  {tables.filter(t => t.status === 'reservada').map(t => (
                    <div key={t.id} className="py-2.5 flex justify-between items-center text-xs text-slate-800">
                      <div>
                        <span className="font-serif font-bold text-emerald-800 block">{t.guestName?.split(' - ')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {t.name} • Capacidad para {t.capacity} personas</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold font-mono text-xs bg-emerald-50 text-emerald-800 py-1 px-2.5 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.guestName?.split(' - ')[1] || 'Tarde'}</span>
                      </div>
                    </div>
                  ))}
                  {tables.filter(t => t.status === 'reservada').length === 0 && (
                    <div className="text-center text-slate-400 py-12 text-xs">
                      No hay reservaciones ingresadas o programadas para el día de hoy.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: INVENTARIO */}
          {activeTab === 'inventario' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual inventory grid */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                  <h4 className="font-serif font-bold text-sm text-slate-800 mb-3">📋 INSUMOS / MATERIAS PRIMAS REGISTRADAS</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {stock.map((item) => {
                      const isLow = item.quantity <= item.minQuantity;
                      return (
                        <div key={item.id} className={`p-3 rounded-lg border flex justify-between items-center ${
                          isLow ? 'bg-orange-50/50 border-orange-200 ring-1 ring-orange-200/20' : 'bg-slate-5 border-slate-100'
                        }`}>
                          <div>
                            <span className="font-bold text-xs text-slate-800 block truncate max-w-[130px]">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Mínimo seguro: {item.minQuantity} {item.unit}</span>
                          </div>
                          
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className={`font-bold font-mono text-xs block ${isLow ? 'text-orange-600 font-extrabold' : 'text-slate-700'}`}>
                                {item.quantity.toFixed(1)} {item.unit}
                              </span>
                              {isLow && (
                                <span className="text-[8px] bg-orange-100 text-orange-850 px-1 py-0.5 rounded uppercase font-bold tracking-widest block mt-0.5">BAJO INDEX</span>
                              )}
                            </div>
                            <button
                              onClick={() => setStockAddId(item.id)}
                              className="p-1 hover:bg-slate-100 border rounded text-orange-600"
                              title="Recargar Stock"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add Form */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
                  <h4 className="font-serif font-semibold text-sm text-slate-800 mb-1.5">📦 INGRESAR DESPACHO INSUMOS</h4>
                  <p className="text-[11px] text-slate-400 mb-4">Registre la llegada de productos del proveedor para el inventario.</p>

                  <form onSubmit={handleIntakeStock} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Insumo Recibido</label>
                      <select 
                        value={stockAddId || ''} 
                        onChange={(e) => setStockAddId(e.target.value)}
                        className="w-full bg-slate-50 border rounded p-2 text-xs text-slate-850 font-medium whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      >
                        <option value="">-- Seleccionar Insumo --</option>
                        {stock.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Cantidad a Agregar</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={stockAddQty}
                        onChange={(e) => setStockAddQty(e.target.value)}
                        placeholder="ej. 10.0"
                        className="w-full bg-slate-50 border rounded p-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                        disabled={!stockAddId}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!stockAddId}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-2.5 text-xs font-bold shadow-md shadow-orange-500/15 tracking-wide"
                    >
                      Añadir a Almacén
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
