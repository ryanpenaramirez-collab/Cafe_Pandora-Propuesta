/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Utensils, Coffee, Edit, Plus, Trash2 } from 'lucide-react';
import { MenuItem } from '../../types';

interface InventoryMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabFocus: any;
  menu: MenuItem[];
  onUpdateMenuPrice: (itemId: string, newPrice: number, isAvailable: boolean) => void;
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
}

export default function InventoryMenuModal({ 
  isOpen, onClose, tabFocus, menu, 
  onUpdateMenuPrice,
  onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem
}: InventoryMenuModalProps) {
  const [activeTab, setActiveTab] = useState<'platos' | 'bebidas'>(tabFocus === 'platos' || tabFocus === 'bebidas' ? tabFocus : 'platos');

  // Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  
  // New full product CRUD states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'platillo' | 'bebida' | 'gaseosa'>('platillo');
  const [formSubcategory, setFormSubcategory] = useState<string>('entradas');
  const [formAvailable, setFormAvailable] = useState(true);

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
    setEditingPrice(item.price.toFixed(0));
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
        subcategory: formSubcategory,
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
        subcategory: formSubcategory,
        available: formAvailable
      };
      onAddMenuItem(newItem);
      triggerNotification(`Producto "${formName}" agregado con éxito`);
    }

    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormCategory('platillo');
    setFormSubcategory('entradas');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-oro/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-acento w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-borde"
      >
        {/* Header Title */}
        <div className="bg-emerald-650 bg-exito p-4 shrink-0 flex flex-col md:flex-row justify-between md:items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-serif text-lg font-bold">Gestión de Menú</h3>
              <p className="text-[11px] text-emerald-100 font-light">Administración de precios y disponibilidad de cocina</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-exito/80 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="bg-exito-superficie/50 p-2 shrink-0 border-b border-emerald-100 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('platos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'platos' ? 'bg-exito-superficie text-emerald-900 border border-exito/50' : 'text-cuerpo hover:text-exito'
            }`}
          >
            PLATILLOS (Comida)
          </button>
          <button
            onClick={() => setActiveTab('bebidas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'bebidas' ? 'bg-exito-superficie text-emerald-900 border border-exito/50' : 'text-cuerpo hover:text-exito'
            }`}
          >
            BEBIDAS (Café)
          </button>
        </div>

        {/* Sync panel notices */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-exito-superficie text-exito border-b border-rose-100 text-xs text-center py-2 font-bold"
            >
              🎉 {notification}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Container Panels */}
        <div className="flex-1 bg-hover-fondo p-6 overflow-y-auto">
          
          {/* TAB: PLATOS & BEBIDAS */}
          {(activeTab === 'platos' || activeTab === 'bebidas') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-hover-fondo border border-borde p-4 rounded-xl gap-3 text-xs font-bold text-cuerpo shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="uppercase text-titulo tracking-wider font-serif">GESTIÓN DE CARTA ({activeTab === 'platos' ? 'PLATILLOS & ALIMENTOS' : 'BEBIDAS & BARRA'})</span>
                  <span className="text-[10px] text-inactivo font-light font-sans normal-case">Administración de productos (crear, editar, eliminar) para el MVP</span>
                </div>
                {!isAdding && (
                  <button
                    onClick={() => {
                      setFormName('');
                      setFormPrice('');
                      setFormDescription('');
                      setFormCategory(activeTab === 'platos' ? 'platillo' : 'bebida');
                      setFormSubcategory(activeTab === 'platos' ? 'entradas' : 'gaseosas');
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

              {isAdding ? (
                <form onSubmit={handleSaveProduct} className="bg-acento p-5 rounded-2xl border border-borde shadow-md max-w-lg mx-auto space-y-4">
                  <div className="border-b pb-2">
                    <h4 className="font-serif font-bold text-sm text-titulo uppercase tracking-wide">
                      Agregar Nuevo Producto ({activeTab === 'platos' ? 'PLATILLO' : 'BEBIDA'})
                    </h4>
                    <p className="text-[10px] text-atenuado">Complete los campos obligatorios para agregar al menú.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-cuerpo mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="ej. Panini de Pavo Especial o Espresso Macchiato"
                        className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-medium text-titulo outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-cuerpo mb-1">Precio (COP) *</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          placeholder="0"
                          className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-mono font-bold text-titulo outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-cuerpo mb-1">Categoría *</label>
                        <select
                          value={formSubcategory}
                          onChange={(e) => setFormSubcategory(e.target.value)}
                          className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-semibold text-titulo outline-none"
                        >
                          {activeTab === 'platos' ? (
                            <>
                              <option value="entradas">Entradas</option>
                              <option value="principales">Principales</option>
                              <option value="ensaladas">Ensaladas</option>
                              <option value="postres">Postres</option>
                            </>
                          ) : (
                            <>
                              <option value="gaseosas">Gaseosas</option>
                              <option value="cervezas">Cervezas</option>
                              <option value="vinos">Vinos</option>
                              <option value="café">Café</option>
                              <option value="té">Té</option>
                              <option value="jugos">Jugos</option>
                              <option value="agua">Agua</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-cuerpo mb-1">Descripción</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="ej. Con queso mozzarella fundido, jamón de pavo y aderezo especial de pesto."
                        className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-medium text-titulo outline-none h-20 resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="formAvailable"
                        checked={formAvailable}
                        onChange={(e) => setFormAvailable(e.target.checked)}
                        className="rounded border-borde text-exito focus:ring-oro w-4 h-4"
                      />
                      <label htmlFor="formAvailable" className="text-[11px] font-bold text-cuerpo select-none">
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
                      className="px-3 py-1.5 border border-borde rounded text-xs font-bold text-cuerpo hover:bg-hover-fondo/80 cursor-pointer focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-exito/80 text-white rounded text-xs font-bold cursor-pointer focus:outline-none"
                    >
                      Crear Producto
                    </button>
                  </div>
                </form>
              ) : (
                <div className={isEditingItem ? 'flex gap-4 h-full' : ''}>
                  <div className={isEditingItem ? 'flex-1 overflow-y-auto' : ''}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeTab === 'platos' ? dishesList : beveragesList).map((item) => {
                        const isEditing = editingItemId === item.id;
                        return (
                          <div key={item.id} className="bg-acento p-4 rounded-xl border border-borde shadow-sm flex flex-col justify-between hover:border-exito/50 transition-colors">
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="font-serif font-bold text-sm text-titulo">{item.name}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  item.available ? 'bg-exito-superficie text-exito' : 'bg-slate-100 text-inactivo'
                                }`}>
                                  {item.available ? 'Activo' : 'Pausado'}
                                </span>
                              </div>
                              <p className="text-xs text-inactivo mt-1 pb-3 border-b leading-relaxed">{item.description}</p>
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-xs font-bold text-cuerpo">$</span>
                                  <input 
                                    type="number" 
                                    step="0.10"
                                    value={editingPrice}
                                    onChange={(e) => setEditingPrice(e.target.value)}
                                    className="w-16 bg-slate-550 bg-hover-fondo border rounded p-1 text-xs font-mono font-bold text-titulo text-center focus:ring-1 focus:ring-oro outline-none"
                                  />
                                  <button
                                    onClick={() => handleFinishEdit(item, item.available)}
                                    className="p-1 px-2.5 bg-emerald-600 hover:bg-exito/80 text-white rounded text-xs font-bold cursor-pointer"
                                  >
                                    ✓
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 font-mono">
                                  <span className="text-[10px] text-inactivo">Precio:</span>
                                  <span className="font-bold text-titulo text-xs">${item.price.toLocaleString('es-CO')} COP</span>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="text-exito hover:text-emerald-750 hover:bg-hover-fondo/80 hover:border-borde p-1 rounded"
                                    title="Editar precio"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <div className="flex gap-1 items-center">
                                <button
                                  onClick={() => {
                                    setFormName(item.name);
                                    setFormPrice(item.price.toString());
                                    setFormDescription(item.description);
                                    setFormCategory(item.category);
                                    setFormSubcategory(item.subcategory || (item.category === 'platillo' ? 'entradas' : 'gaseosas'));
                                    setFormAvailable(item.available);
                                    setIsEditingItem(item);
                                    setIsAdding(false);
                                  }}
                                  className="text-oro hover:text-oro p-1 px-2 border border-borde hover:bg-oro/10 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                                  title="Editar detalles completos (Nombre, Descripción, Categoría)"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Ficha</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteProduct(item)}
                                  className="text-peligro hover:text-peligro p-1 px-2 border border-borde hover:bg-peligro/10 rounded text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer mr-1"
                                  title="Eliminar producto"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Borrar</span>
                                </button>

                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`py-1 px-2.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                    item.available
                                      ? 'bg-slate-105 bg-borde hover:bg-peligro/10 text-peligro'
                                      : 'bg-emerald-550 bg-exito-superficie hover:bg-exito-superficie text-exito'
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
                  </div>

                  <AnimatePresence>
                    {isEditingItem && (
                      <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="w-80 shrink-0 bg-acento border-l border-borde rounded-xl shadow-lg overflow-y-auto"
                      >
                        <form onSubmit={handleSaveProduct} className="p-4 space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-serif font-bold text-sm text-titulo truncate">
                              Editar: {isEditingItem.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setIsEditingItem(null)}
                              className="p-1 hover:bg-hover-fondo rounded-full text-atenuado cursor-pointer shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-cuerpo mb-1">Nombre *</label>
                            <input
                              type="text"
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              placeholder="Nombre del producto"
                              className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-medium text-titulo outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-cuerpo mb-1">Precio (USD) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formPrice}
                              onChange={(e) => setFormPrice(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-mono font-bold text-titulo outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-cuerpo mb-1">Categoría</label>
                            <select
                              value={formSubcategory}
                              onChange={(e) => setFormSubcategory(e.target.value)}
                              className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-semibold text-titulo outline-none"
                            >
                              {formCategory === 'platillo' ? (
                                <>
                                  <option value="entradas">Entradas</option>
                                  <option value="principales">Principales</option>
                                  <option value="ensaladas">Ensaladas</option>
                                  <option value="postres">Postres</option>
                                </>
                              ) : (
                                <>
                                  <option value="gaseosas">Gaseosas</option>
                                  <option value="cervezas">Cervezas</option>
                                  <option value="vinos">Vinos</option>
                                  <option value="café">Café</option>
                                  <option value="té">Té</option>
                                  <option value="jugos">Jugos</option>
                                  <option value="agua">Agua</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-cuerpo mb-1">Descripción</label>
                            <textarea
                              value={formDescription}
                              onChange={(e) => setFormDescription(e.target.value)}
                              placeholder="Descripción del producto"
                              className="w-full bg-hover-fondo border border-borde rounded p-2 text-xs focus:ring-1 focus:ring-oro font-medium text-titulo outline-none h-20 resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              id="formAvailableEdit"
                              checked={formAvailable}
                              onChange={(e) => setFormAvailable(e.target.checked)}
                              className="rounded border-borde text-exito focus:ring-oro w-4 h-4"
                            />
                            <label htmlFor="formAvailableEdit" className="text-[11px] font-bold text-cuerpo select-none">
                              Habilitado para ventas
                            </label>
                          </div>

                          <div className="flex gap-2 pt-3 border-t">
                            <button
                              type="button"
                              onClick={() => setIsEditingItem(null)}
                              className="flex-1 py-1.5 border border-borde rounded text-xs font-bold text-cuerpo hover:bg-hover-fondo/80 cursor-pointer focus:outline-none"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-exito/80 text-white rounded text-xs font-bold cursor-pointer focus:outline-none"
                            >
                              Guardar Cambios
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
