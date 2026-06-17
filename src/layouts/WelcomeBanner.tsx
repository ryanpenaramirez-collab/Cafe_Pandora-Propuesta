import { ClipboardList, Clock, Plus } from 'lucide-react';
import type { UserSession } from '../types';

interface WelcomeBannerProps {
  user: UserSession;
  pendingOrdersCount: number;
  onNewOrder: () => void;
}

export default function WelcomeBanner({ user, pendingOrdersCount, onNewOrder }: WelcomeBannerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-acento border border-borde rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest bg-oro-superficie text-oro px-2 py-0.5 rounded-full font-bold border border-oro/20">
              Servicio en Vivo
            </span>
            <span className="text-xs font-mono text-atenuado">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-titulo mt-1.5">
            ¡Hola, {user.name}!
          </h2>
          <p className="text-sm text-atenuado font-light mt-0.5">
            Tienes <strong className="text-titulo font-semibold">{pendingOrdersCount}</strong> pedidos pendientes por atender. Revisa las comandas pendientes o dirígete a caja para facturar.
          </p>
        </div>

        <div className="bg-hover-fondo border border-borde rounded-xl p-3 flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-oro-superficie border border-oro/20 flex items-center justify-center text-oro shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-atenuado block tracking-wider">Comandas en Cola</span>
            <span className="font-sans text-sm font-bold text-titulo block mt-0.5">
              {pendingOrdersCount === 1 ? '1 pedido por atender' : `${pendingOrdersCount} pedidos por atender`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-acento border border-borde rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-borde pb-2">
          <h3 className="font-serif text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-oro" /> Acceso Rápido a Pedidos Pendientes
          </h3>
          <button
            onClick={onNewOrder}
            className="bg-acento hover:bg-acento-hover text-white text-xs font-mono font-bold tracking-wider uppercase py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
