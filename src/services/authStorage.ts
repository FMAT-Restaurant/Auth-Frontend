import type { AuthSession } from '../types/auth';

const STORAGE_KEY = 'fmat_restaurant_auth_session';

type SessionListener = (session: AuthSession | null) => void;
const listeners = new Set<SessionListener>();
let lastSavedJson: string | null = null;

export const authStorage = {
  saveSession: (session: AuthSession): void => {
    try {
      const json = JSON.stringify(session);
      if (json === lastSavedJson) return;
      lastSavedJson = json;
      localStorage.setItem(STORAGE_KEY, json);
      listeners.forEach((listener) => {
        try {
          listener(session);
        } catch (e) {
          console.error('Error al notificar listener de sesión:', e);
        }
      });
    } catch (err) {
      console.error('Error al guardar sesión en localStorage:', err);
    }
  },

  getSession: (): AuthSession | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      lastSavedJson = data;
      return JSON.parse(data) as AuthSession;
    } catch (err) {
      console.error('Error al leer sesión de localStorage:', err);
      return null;
    }
  },

  clearSession: (): void => {
    try {
      if (lastSavedJson === null && !localStorage.getItem(STORAGE_KEY)) return;
      lastSavedJson = null;
      localStorage.removeItem(STORAGE_KEY);
      listeners.forEach((listener) => {
        try {
          listener(null);
        } catch (e) {
          console.error('Error al notificar listener de cierre de sesión:', e);
        }
      });
    } catch (err) {
      console.error('Error al eliminar sesión de localStorage:', err);
    }
  },

  subscribe: (listener: SessionListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
