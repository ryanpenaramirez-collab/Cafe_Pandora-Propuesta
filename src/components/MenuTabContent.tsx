import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, X, Trash2 } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuTabContentProps {
  tab: 'platos' | 'bebidas' | 'gaseosas';
  menu: MenuItem[];
  onUpdateMenuPrice: (itemId: string, newPrice: number, isAvailable: boolean) => void;
  onAddMenuItem: (item: MenuItem) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
}

const CATEGORY_MAP: Record<string, 'platillo' | 'bebida' | 'gaseosa'> = {
  platos: 'platillo',
  bebidas: 'bebida',
  gaseosas: 'gaseosa',
};

const CATEGORY_LABELS: Record<string, string> = {
  platos: 'Plato',
  bebidas: 'Bebida',
  gaseosas: 'Gaseosa',
};

export default function MenuTabContent({
  tab, menu, onUpdateMenuPrice, onAddMenuItem, onUpdateMenuItem, onDeleteMenuItem,
}: MenuTabContentProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const [isAdding, setIsAdding] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'platillo' | 'bebida' | 'gaseosa'>('platillo');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImage, setFormImage] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2200);
  };

  const filteredList = useMemo(() => {
    const targetCategory = CATEGORY_MAP[tab];
    return menu.filter(item => item.category === targetCategory);
  }, [menu, tab]);

  const handleStartEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditingPrice(item.price.toFixed(2));
  };

  const handleFinishEdit = (item: MenuItem, isAvailable: boolean) => {
    const priceNum = parseInt(editingPrice, 10);
    if (!isNaN(priceNum) && priceNum >= 0) {
      onUpdateMenuPrice(item.id, priceNum, isAvailable);
      triggerNotification(`Información de ${item.name} cambiada con éxito`);
    }
    setEditingItemId(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(formPrice, 10);
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
        available: formAvailable,
        image: formImage || isEditingItem.image,
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
        available: formAvailable,
        image: formImage || undefined,
      };
      onAddMenuItem(newItem);
      triggerNotification(`Producto "${formName}" agregado con éxito`);
    }

    setFormName('');
    setFormPrice('');
    setFormDescription('');
    setFormCategory('platillo');
    setFormAvailable(true);
    setFormImage('');
    setIsAdding(false);
    setIsEditingItem(null);
  };

  const handleDeleteProduct = (item: MenuItem) => {
    if (confirm(`¿Está seguro de eliminar el producto "${item.name}"?`)) {
      onDeleteMenuItem(item.id);
      triggerNotification(`Producto "${item.name}" eliminado con éxito`);
    }
  };

  const startEditDetail = (item: MenuItem) => {
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormDescription(item.description);
    setFormCategory(item.category);
    setFormAvailable(item.available);
    setFormImage(item.image || '');
    setIsEditingItem(item);
    setIsAdding(false);
  };

  const cancelForm = () => {
    setFormImage('');
    setIsAdding(false);
    setIsEditingItem(null);
  };

  const imageField = (
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Imagen del producto</label>
      {formImage && (
        <div className="relative mb-2 h-28 rounded-lg overflow-hidden border border-slate-200">
          <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => setFormImage('')}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <input
        type="url"
        value={formImage}
        onChange={(e) => setFormImage(e.target.value)}
        placeholder="https://... URL de la imagen"
        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none mb-1"
      />
      <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded p-2 text-[11px] font-bold text-slate-600 transition-colors">
        <span>📁 Subir imagen desde archivo</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => setFormImage(ev.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
      </label>
      <p className="text-[9px] text-slate-400 mt-1">Sube una imagen o pega una URL. Formatos: JPG, PNG, WebP.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs text-center py-2 font-bold rounded-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FAF5EE] border border-slate-200 p-4 rounded-xl gap-3 text-xs font-bold text-slate-700 shadow-sm">
        <span className="uppercase text-slate-800 tracking-wider font-serif">
          GESTIÓN DE CARTA ({tab.toUpperCase()})
        </span>
        {!isAdding && (
          <button
            onClick={() => {
              setFormName('');
              setFormPrice('');
              setFormDescription('');
              setFormCategory(CATEGORY_MAP[tab]);
              setFormAvailable(true);
              setFormImage('');
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
        <form onSubmit={handleSaveProduct} className="bg-white p-5 rounded-2xl border border-slate-300 shadow-md max-w-lg mx-auto space-y-4">
          <div className="border-b pb-2">
            <h4 className="font-serif font-bold text-sm text-slate-800 uppercase tracking-wide">
              Agregar Nuevo Producto ({CATEGORY_LABELS[tab]})
            </h4>
            <p className="text-[10px] text-slate-400">Complete los campos obligatorios para agregar al menú.</p>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio (COP) *</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="ej. 18000"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as 'platillo' | 'bebida' | 'gaseosa')}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 outline-none"
                >
                  <option value="platillo">Platillo / Comida</option>
                  <option value="bebida">Bebida / Café</option>
                  <option value="gaseosa">Gaseosa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción del producto"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none h-20 resize-none"
              />
            </div>

            {imageField}
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <button
              type="button"
              onClick={cancelForm}
              className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer focus:outline-none"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer focus:outline-none"
            >
              Crear Producto
            </button>
          </div>
        </form>
      ) : (
        <div className={isEditingItem ? 'flex gap-4 h-full' : ''}>
          <div className={isEditingItem ? 'flex-1 overflow-y-auto' : ''}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((item) => {
                const isEditing = editingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                          {tab === 'platos' ? '🍽' : tab === 'bebidas' ? '☕' : '🥤'}
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h4 className="font-serif font-bold text-sm text-slate-900 leading-tight">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-mono font-bold text-sm text-emerald-700">
                          ${item.price.toLocaleString('es-CO')} COP
                        </span>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-600">$</span>
                            <input
                              type="number"
                              step="1"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-16 bg-slate-50 border rounded p-1 text-xs font-mono font-bold text-slate-800 text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleFinishEdit(item, item.available); }}
                              className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setExpandedItemId(expandedItemId === item.id ? null : item.id); }}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                          >
                            {expandedItemId === item.id ? 'Ocultar' : 'Ver más'}
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedItemId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-slate-100 bg-slate-50 overflow-hidden"
                        >
                          <div className="p-3 space-y-2">
                            <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); startEditDetail(item); }}
                                className="flex-1 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit className="w-3 h-3" /> Editar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item); }}
                                className="flex-1 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Borrar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {filteredList.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-12 text-xs">
                  No hay productos en esta categoría.
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isEditingItem && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-80 shrink-0 bg-white border-l border-slate-200 rounded-xl shadow-lg overflow-y-auto"
              >
                <form onSubmit={handleSaveProduct} className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-serif font-bold text-sm text-slate-800 truncate">
                      Editar: {isEditingItem.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => { setFormImage(''); setIsEditingItem(null); }}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Nombre del producto"
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Precio (COP) *</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="ej. 18000"
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoría</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as 'platillo' | 'bebida' | 'gaseosa')}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 outline-none"
                    >
                      <option value="platillo">Platillo / Comida</option>
                      <option value="bebida">Bebida / Café</option>
                      <option value="gaseosa">Gaseosa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Descripción</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Descripción del producto"
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800 outline-none h-20 resize-none"
                    />
                  </div>

                  {imageField}

                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => { setFormImage(''); setIsEditingItem(null); }}
                      className="flex-1 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer focus:outline-none"
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
  );
}
