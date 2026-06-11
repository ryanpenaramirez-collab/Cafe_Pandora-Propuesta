import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Order, MenuItem, ShiftState } from '../types';

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

type VentasPeriodo = 'dia' | 'semanal' | 'mensual';

const PERIODOS: { id: VentasPeriodo; label: string }[] = [
  { id: 'dia', label: 'Día' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'mensual', label: 'Mensual' },
];

const CATEGORY_COLORS: Record<string, string> = {
  platillo: '#D4A574',
  bebida: '#8BAA7A',
  gaseosa: '#B8A0C8',
  otro: '#9AB0C0',
};

const CATEGORY_LABELS: Record<string, string> = {
  platillo: 'Comidas',
  bebida: 'Bebidas Calientes',
  gaseosa: 'Gaseosas',
  otro: 'Otros',
};

interface VentasProps {
  orders: Order[];
  menu: MenuItem[];
  shift: ShiftState;
}

function isToday(d: Date): boolean {
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function isThisWeek(d: Date): boolean {
  const n = new Date();
  const start = new Date(n);
  start.setDate(n.getDate() - n.getDay());
  start.setHours(0, 0, 0, 0);
  return d >= start;
}

function isThisMonth(d: Date): boolean {
  const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

export default function Ventas({ orders, menu, shift }: VentasProps) {
  const [periodo, setPeriodo] = useState<VentasPeriodo>('dia');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt);
      if (periodo === 'dia') return isToday(d);
      if (periodo === 'semanal') return isThisWeek(d);
      return isThisMonth(d);
    }).filter(o => o.status !== 'espera'); // only completed/factured orders
  }, [orders, periodo]);

  const metrics = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = filteredOrders.length;
    const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
    const itemCount = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
    return { totalSales, orderCount, avgTicket, itemCount };
  }, [filteredOrders]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = { platillo: 0, bebida: 0, gaseosa: 0, otro: 0 };
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const menuItem = menu.find((m) => m.id === item.menuItemId);
        const cat = menuItem?.category || 'otro';
        cats[cat] += item.price * item.quantity;
      });
    });
    return Object.entries(cats)
      .map(([key, value]) => ({ key, label: CATEGORY_LABELS[key] || key, value, color: CATEGORY_COLORS[key] || '#ccc' }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders, menu]);

  const maxCatValue = Math.max(...categoryData.map((c) => c.value), 1);

  const topItems = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!counts[item.menuItemId]) {
          counts[item.menuItemId] = { name: item.name, qty: 0, revenue: 0 };
        }
        counts[item.menuItemId].qty += item.quantity;
        counts[item.menuItemId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredOrders]);

  const chartMaxQty = topItems.length > 0 ? topItems[0].qty : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 p-1 bg-[#FAF5EE]/75 rounded-xl border border-slate-300 self-start shrink-0">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${
              periodo === p.id
                ? 'bg-pandora-dark text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-700 font-mono">Ventas</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <span className="block font-mono font-black text-lg text-amber-800">{formatCOP(metrics.totalSales)}</span>
          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">
            {periodo === 'dia' ? 'Hoy' : periodo === 'semanal' ? 'Esta semana' : 'Este mes'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-700 font-mono">Pedidos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <span className="block font-mono font-black text-lg text-emerald-800">{metrics.orderCount}</span>
          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">Completados</span>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-blue-700 font-mono">Ticket Prom.</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <span className="block font-mono font-black text-lg text-blue-800">{formatCOP(metrics.avgTicket)}</span>
          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">Por pedido</span>
        </div>

        <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-purple-700 font-mono">Items</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <span className="block font-mono font-black text-lg text-purple-800">{metrics.itemCount}</span>
          <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">Vendidos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="font-serif font-bold text-slate-800 text-sm mb-4">Ventas por Categoría</h4>
          {categoryData.every((c) => c.value === 0) ? (
            <div className="py-10 text-center text-slate-400 text-xs">No hay datos de ventas para este período.</div>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat) => {
                const pct = (cat.value / maxCatValue) * 100;
                return (
                  <div key={cat.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{cat.label}</span>
                      <span className="font-mono text-slate-500">{formatCOP(cat.value)}</span>
                    </div>
                    <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="font-serif font-bold text-slate-800 text-sm mb-4">Productos Más Vendidos</h4>
          {topItems.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">No hay productos vendidos en este período.</div>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${
                    i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-800 truncate">{item.name}</span>
                    <span className="block text-[9px] font-mono text-slate-400">{item.qty} vendidos</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0">{formatCOP(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#FDF8F0] rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pandora-accent/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-pandora-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold font-mono text-slate-500 tracking-wider">Resumen</span>
              <span className="block text-xs text-slate-700">
                {metrics.orderCount === 0
                  ? 'No hay actividad registrada.'
                  : `${metrics.orderCount} pedido${metrics.orderCount !== 1 ? 's' : ''} completado${metrics.orderCount !== 1 ? 's' : ''} con ${metrics.itemCount} item${metrics.itemCount !== 1 ? 's' : ''} vendido${metrics.itemCount !== 1 ? 's' : ''}.`}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {periodo === 'dia' ? 'Hoy' : periodo === 'semanal' ? 'Últimos 7 días' : 'Últimos 30 días'}
          </span>
        </div>
      </div>
    </div>
  );
}
