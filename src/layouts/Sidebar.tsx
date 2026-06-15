import { LogOut } from 'lucide-react';
import type { UserSession } from '../types';

interface SidebarProps {
  user: UserSession;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <div className="w-full md:w-60 bg-pandora-hover text-pandora-sidebar-text border-b-2 md:border-b-0 md:border-r-2 border-pandora-border shrink-0 flex flex-col justify-between p-5 overflow-hidden md:h-full h-auto">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mx-auto mb-3.5 relative overflow-hidden">
          <img
            src="https://i.imgur.com/ARe5rPr.jpeg"
            alt="Logo Café Pandora"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="font-serif text-base font-extrabold tracking-widest text-pandora-cream uppercase">
          Café Pandora
        </h2>
        <p className="text-xs text-pandora-muted font-mono tracking-wider mt-1 uppercase">POS Sistema Administrativo</p>
      </div>

      <div className="hidden md:block my-4 text-center px-2 py-3 rounded bg-white/5 border border-white/5">
        <span className="block text-xs font-serif italic text-pandora-sidebar-text" style={{ opacity: 0.55 }}>
          "Más que un lugar, una experiencia para tus sentidos."
        </span>
      </div>

      <div className="mt-6 md:mt-auto flex flex-col gap-2 shrink-0">
        <span className="text-xs uppercase font-bold tracking-widest text-pandora-sidebar-text-secondary block font-mono">ROL DE ACCESOS</span>
        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-pandora-accent flex items-center justify-center text-sm font-bold text-white uppercase shadow-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="text-left overflow-hidden flex-1">
            <span className="text-sm font-semibold text-pandora-sidebar-text block truncate leading-tight">{user.name}</span>
            <span className="text-xs text-pandora-gold uppercase tracking-wider block font-bold mt-0.5 capitalize">{user.role}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-center py-2 bg-transparent hover:bg-pandora-danger/10 border border-pandora-danger rounded-lg text-xs font-bold text-pandora-danger transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono tracking-wider"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
