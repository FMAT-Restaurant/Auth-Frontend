import type { AuthSession, User } from '../types/auth';

const STORAGE_KEY = 'fmat_restaurant_auth_session';
const MAX_TOKEN_LENGTH = 8192;
const MAX_TEXT_LENGTH = 300;
const MAX_LIST_LENGTH = 500;

type SessionListener = (session: AuthSession | null) => void;
const listeners = new Set<SessionListener>();
const expiredListeners = new Set<() => void>();
let lastSavedJson: string | null = null;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function cleanText(value: unknown, max = MAX_TEXT_LENGTH): string | undefined {
  if (typeof value !== 'string' || value.length > max || CONTROL_CHARS.test(value)) {
    return undefined;
  }
  return value;
}

function cleanList(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) return undefined;
  const items = value.map((item) => cleanText(item));
  return items.every((item): item is string => item !== undefined) ? items : undefined;
}

function cleanBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Reconstruye la sesión solo con los campos conocidos y del tipo esperado, tanto
 * al guardar como al leer de localStorage: así no se persiste (ni se confía en)
 * contenido arbitrario. El refresh token nunca se guarda: vive en una cookie
 * HttpOnly. Devuelve null si la sesión no es válida.
 */
export function sanitizeSession(session: unknown): AuthSession | null {
  if (!session || typeof session !== 'object') return null;
  const raw = session as Record<string, unknown>;
  const accessToken = cleanText(raw.accessToken, MAX_TOKEN_LENGTH);
  const rawUser = raw.user as Record<string, unknown> | undefined;
  if (!accessToken || !rawUser || typeof rawUser !== 'object') return null;

  const id = cleanText(rawUser.id);
  const userType = rawUser.userType === 'ADMIN' || rawUser.userType === 'STAFF' ? rawUser.userType : undefined;
  const permissions = cleanList(rawUser.permissions);
  if (!id || !userType || !permissions) return null;

  const user: User = {
    id,
    userType,
    displayName: cleanText(rawUser.displayName) ?? '',
    permissions,
  };
  const optionalText = ['staffId', 'email', 'firstName', 'lastName', 'roleLabel'] as const;
  for (const key of optionalText) {
    const value = cleanText(rawUser[key]);
    if (value !== undefined) user[key] = value;
  }
  const roles = cleanList(rawUser.roles);
  if (roles) user.roles = roles;
  const views = cleanList(rawUser.views);
  if (views) user.views = views;
  const mustChangePassword = cleanBoolean(rawUser.mustChangePassword);
  if (mustChangePassword !== undefined) user.mustChangePassword = mustChangePassword;
  const isActive = cleanBoolean(rawUser.isActive);
  if (isActive !== undefined) user.isActive = isActive;
  const passwordResetRequested = cleanBoolean(rawUser.passwordResetRequested);
  if (passwordResetRequested !== undefined) user.passwordResetRequested = passwordResetRequested;
  if (rawUser.passwordStatus === 'TEMPORARY' || rawUser.passwordStatus === 'ACTIVE') {
    user.passwordStatus = rawUser.passwordStatus;
  }

  return { accessToken, user };
}

export const authStorage = {
  saveSession: (session: AuthSession): void => {
    try {
      const safeSession = sanitizeSession(session);
      if (!safeSession) {
        console.error('Sesión inválida: no se guarda en localStorage');
        return;
      }
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
      const sanitized = sanitizeSession(JSON.parse(data));
      if (!sanitized) {
        // Contenido inválido o manipulado: se descarta.
        lastSavedJson = null;
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      const cleanJson = JSON.stringify(sanitized);
      if (cleanJson !== data) {
        // Quita refreshToken de sesiones antiguas y cualquier campo desconocido.
        localStorage.setItem(STORAGE_KEY, cleanJson);
      }
      lastSavedJson = cleanJson;
      return sanitized;
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
