import type { UserSession } from '../types';
import { STAFF_USERS } from '../data';

export function authenticate(email: string, pin: string): Promise<UserSession | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const match = STAFF_USERS.find(u => u.email === email && u.pin === pin);
      if (match) {
        resolve({ email: match.email, role: match.role as 'administrador' | 'mesero', name: match.name });
      } else {
        resolve(null);
      }
    }, 600);
  });
}
