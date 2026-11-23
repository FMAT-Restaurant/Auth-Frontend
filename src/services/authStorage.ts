import type { AuthSession } from '../types/auth';

const STORAGE_KEY = 'fmat_restaurant_auth_session';

type SessionListener = (session: AuthSession | null) => void;
const listeners = new Set<SessionListener>();
const expiredListeners = new Set<() => void>();
let lastSavedJson: string | null = null;

function sanitizeSession(session: AuthSession): AuthSession {
  // El refresh token nunca se guarda en localStorage; vive únicamente en cookie HttpOnly.
  return {
    accessToken: session.accessToken,
    user: session.user,
  };
}

export const authStorage = {
  saveSession: (session: AuthSession): void => {
    try {
      const safeSession = sanitizeSession(session);
      const json = JSON.stringify(safeSession);
      if (json === lastSavedJson) return;
      lastSavedJson = json;
      localStorage.setItem(STORAGE_KEY, json);
      listeners.forEach((listener) => {
        try {
          listener(safeSession);
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
      const parsed = JSON.parse(data) as AuthSession;
      if (parsed && 'refreshToken' in parsed) {
        const sanitized = sanitizeSession(parsed);
        const cleanJson = JSON.stringify(sanitized);
        lastSavedJson = cleanJson;
        localStorage.setItem(STORAGE_KEY, cleanJson);
        return sanitized;
      }
      lastSavedJson = data;
      return parsed;
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

  /**
   * Marca la sesión como expirada (BUG-SEC-001).
   * Borra de inmediato los tokens guardados (ya no sirven), pero NO desmonta la
   * vista: avisa a quien esté escuchando para que muestre "Tu sesión ha expirado"
   * antes de regresar al login. Si nadie escucha, se comporta como clearSession().
   */
  expireSession: (): void => {
    if (expiredListeners.size === 0) {
      authStorage.clearSession();
      return;
    }
    try {
      lastSavedJson = null;
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error al eliminar sesión expirada de localStorage:', err);
    }
    expiredListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error al notificar sesión expirada:', e);
      }
    });
  },

  onSessionExpired: (listener: () => void): (() => void) => {
    expiredListeners.add(listener);
    return () => {
      expiredListeners.delete(listener);
    };
  },

  subscribe: (listener: SessionListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
