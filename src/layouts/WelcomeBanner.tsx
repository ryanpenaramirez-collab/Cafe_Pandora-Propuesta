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
      <div className="bg-pandora-accent border border-pandora-border rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest bg-pandora-gold-bg text-pandora-gold px-2 py-0.5 rounded-full font-bold border border-pandora-gold/20">
              Servicio en Vivo
            </span>
            <span className="text-xs font-mono text-pandora-muted">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-pandora-title mt-1.5">
            ¡Hola, {user.name}!
          </h2>
          <p className="text-sm text-pandora-muted font-light mt-0.5">
            Tienes <strong className="text-pandora-title font-semibold">{pendingOrdersCount}</strong> pedidos pendientes por atender. Revisa las comandas pendientes o dirígete a caja para facturar.
          </p>
        </div>

        <div className="bg-pandora-hover border border-pandora-border rounded-xl p-3 flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-pandora-gold-bg border border-pandora-gold/20 flex items-center justify-center text-pandora-gold shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-pandora-muted block tracking-wider">Comandas en Cola</span>
            <span className="font-sans text-sm font-bold text-pandora-title block mt-0.5">
              {pendingOrdersCount === 1 ? '1 pedido por atender' : `${pendingOrdersCount} pedidos por atender`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-pandora-accent border border-pandora-border rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-pandora-border pb-2">
          <h3 className="font-serif text-sm font-extrabold text-pandora-title uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-pandora-gold" /> Acceso Rápido a Pedidos Pendientes
          </h3>
          <button
            onClick={onNewOrder}
            className="bg-pandora-primary hover:bg-pandora-primary-hover text-pandora-title text-xs font-mono font-bold tracking-wider uppercase py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
