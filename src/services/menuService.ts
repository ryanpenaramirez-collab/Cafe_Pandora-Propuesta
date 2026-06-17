import type { MenuItem } from '../types';
import { INITIAL_MENU, INITIAL_BEVERAGES, INITIAL_GASEOSAS } from '../data';

export const DEFAULT_MENU: MenuItem[] = [...INITIAL_MENU, ...INITIAL_BEVERAGES, ...INITIAL_GASEOSAS];
