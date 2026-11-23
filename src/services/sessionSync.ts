import type { AuthSession } from '../types/auth';
import { authStorage, sanitizeSession } from './authStorage';

/**
 * Sincroniza la sesión en memoria entre pestañas del mismo origen (#6).
 *
 * Como el access token ya no está en localStorage, una pestaña nueva le pide la
 * sesión a las que ya están abiertas en lugar de renovarla: si dos pestañas
 * renovaran a la vez con la misma cookie, la rotación del refresh token
 * invalidaría a una de ellas. Cerrar sesión en una pestaña la cierra en todas.
 * BroadcastChannel solo comunica pestañas del mismo origen.
 */
const CHANNEL_NAME = 'fmat-auth-session';
export const SESSION_REQUEST_TIMEOUT_MS = 200;

type SyncMessage =
  | { type: 'request' }
  | { type: 'session'; session: AuthSession }
  | { type: 'logout' };

let channel: BroadcastChannel | null = null;
let applyingRemote = false;

function getChannel(): BroadcastChannel | null {
  if (channel) return channel;
  if (typeof BroadcastChannel === 'undefined') return null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
  return channel;
}

function post(message: SyncMessage): void {
  try {
    getChannel()?.postMessage(message);
  } catch {
    // Pestaña cerrándose o canal no disponible: se ignora.
  }
}

function isMessage(data: unknown): data is SyncMessage {
  return Boolean(data && typeof data === 'object' && 'type' in (data as Record<string, unknown>));
}

/**
 * Empieza a escuchar a otras pestañas y a difundir los cambios de esta.
 * Devuelve una función para dejar de escuchar.
 */
export function startSessionSync(): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const onMessage = (event: MessageEvent) => {
    const data: unknown = event.data;
    if (!isMessage(data)) return;
    if (data.type === 'request') {
      const current = authStorage.getSession();
      if (current) post({ type: 'session', session: current });
    } else if (data.type === 'logout') {
      applyingRemote = true;
      authStorage.clearSession();
      applyingRemote = false;
    }
  };
  ch.addEventListener('message', onMessage);

  let hadSession = Boolean(authStorage.getSession());
  const unsubscribe = authStorage.subscribe((session) => {
    if (!session && hadSession && !applyingRemote) {
      post({ type: 'logout' });
    }
    hadSession = Boolean(session);
  });

  return () => {
    ch.removeEventListener('message', onMessage);
    unsubscribe();
  };
}

/**
 * Pide la sesión a otra pestaña abierta. Resuelve con la sesión (ya validada)
 * o con null si nadie responde a tiempo.
 */
export function requestSessionFromOtherTabs(
  timeoutMs = SESSION_REQUEST_TIMEOUT_MS,
): Promise<AuthSession | null> {
  const ch = getChannel();
  if (!ch) return Promise.resolve(null);

  return new Promise((resolve) => {
    const finish = (session: AuthSession | null) => {
      clearTimeout(timer);
      ch.removeEventListener('message', onMessage);
      resolve(session);
    };
    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data;
      if (isMessage(data) && data.type === 'session') {
        finish(sanitizeSession(data.session));
      }
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    ch.addEventListener('message', onMessage);
    post({ type: 'request' });
  });
}

/** Solo para pruebas: cierra el canal para que cada prueba empiece limpia. */
export function resetSessionSyncForTests(): void {
  channel?.close();
  channel = null;
  applyingRemote = false;
}
