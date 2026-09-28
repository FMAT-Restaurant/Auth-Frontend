import type { AuthSession } from '../types/auth';

const STORAGE_KEY = 'fmat_restaurant_auth_session';

export const authStorage = {
  saveSession: (session: AuthSession): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.error('Error al guardar sesión en localStorage:', err);
    }
  },

  getSession: (): AuthSession | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as AuthSession;
    } catch (err) {
      console.error('Error al leer sesión de localStorage:', err);
      return null;
    }
  },

  clearSession: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error al eliminar sesión de localStorage:', err);
    }
  },
};
