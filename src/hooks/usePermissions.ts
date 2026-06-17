import { useMemo } from 'react';
import type { UserSession } from '../types';

export interface ButtonDef {
  id: string;
  name: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  modal: string;
  param: string | null;
  count: number;
}

export type CategoryDef = {
  id: string;
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  buttonIds: string[];
};

export function usePermissions(
  user: UserSession | null,
  buttons: ButtonDef[],
  categories: CategoryDef[]
) {
  const visibleButtons = useMemo(() => {
    if (user?.role === 'mesero') {
      return buttons.filter(btn => ['crear_pedido', 'pedidos_pendientes', 'salir'].includes(btn.id));
    }
    return buttons;
  }, [user, buttons]);

  const visibleCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.buttonIds.some(id => visibleButtons.some(btn => btn.id === id))
    );
  }, [categories, visibleButtons]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      let sum = 0;
      cat.buttonIds.forEach(id => {
        const btn = buttons.find(b => b.id === id);
        if (btn) sum += btn.count;
      });
      counts[cat.id] = sum;
    });
    return counts;
  }, [categories, buttons]);

  return { visibleButtons, visibleCategories, categoryCounts };
}
