import type { AuthSession, User } from '../types/auth';

/** Clave donde versiones anteriores guardaban la sesión; se borra al arrancar (#6). */
export const LEGACY_STORAGE_KEY = 'fmat_restaurant_auth_session';
const MAX_TOKEN_LENGTH = 8192;
const MAX_TEXT_LENGTH = 300;
const MAX_LIST_LENGTH = 500;

type SessionListener = (session: AuthSession | null) => void;
const listeners = new Set<SessionListener>();
const expiredListeners = new Set<() => void>();
let lastSavedJson: string | null = null;

/**
 * La sesión (access token + usuario) vive SOLO en memoria (#6): un XSS ya no
 * puede leerla de localStorage. Al recargar, la app la recupera con la cookie
 * HttpOnly del refresh token (authApi.restoreSession).
 */
let memorySession: AuthSession | null = null;

function purgeLegacyStorage(): void {
  try {
    globalThis.localStorage?.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Sin acceso a localStorage (modo privado, etc.): no hay nada que borrar.
  }
}

purgeLegacyStorage();

function notify(session: AuthSession | null): void {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (e) {
      console.error('Error al notificar listener de sesión:', e);
    }
  });
}

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
 * al guardarla y al recibirla de otra pestaña: así no se conserva (ni se confía en)
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
    const safeSession = sanitizeSession(session);
    if (!safeSession) {
      console.error('Sesión inválida: no se guarda');
      return;
    }
    const json = JSON.stringify(safeSession);
    if (json === lastSavedJson) return;
    lastSavedJson = json;
    memorySession = safeSession;
    notify(safeSession);
  },

  getSession: (): AuthSession | null => memorySession,

  clearSession: (): void => {
    purgeLegacyStorage();
    if (memorySession === null && lastSavedJson === null) return;
    memorySession = null;
    lastSavedJson = null;
    notify(null);
  },

  /**
   * Marca la sesión como expirada (BUG-SEC-001).
   * Borra de inmediato el token (ya no sirve), pero NO desmonta la vista: avisa
   * a quien esté escuchando para que muestre "Tu sesión ha expirado" antes de
   * regresar al login. Si nadie escucha, se comporta como clearSession().
   */
  expireSession: (): void => {
    if (expiredListeners.size === 0) {
      authStorage.clearSession();
      return;
    }
    memorySession = null;
    lastSavedJson = null;
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
