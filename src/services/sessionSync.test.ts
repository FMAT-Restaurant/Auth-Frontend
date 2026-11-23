import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AuthSession } from '../types/auth';

vi.unmock('./sessionSync');

import { authStorage } from './authStorage';
import {
  requestSessionFromOtherTabs,
  resetSessionSyncForTests,
  startSessionSync,
} from './sessionSync';

const session: AuthSession = {
  accessToken: 'tab-token',
  user: { id: 'u1', userType: 'ADMIN', displayName: 'Admin', permissions: ['*'] },
};

/** Otra "pestaña": un canal propio con el mismo nombre. */
function otherTab() {
  const ch = new BroadcastChannel('fmat-auth-session');
  const received: unknown[] = [];
  ch.addEventListener('message', (e) => received.push(e.data));
  return { ch, received };
}

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));

describe('sessionSync (#6: sesión en memoria entre pestañas)', () => {
  beforeEach(() => {
    authStorage.clearSession();
    resetSessionSyncForTests();
  });

  afterEach(() => {
    resetSessionSyncForTests();
    vi.restoreAllMocks();
  });

  it('una pestaña con sesión responde a la petición de otra', async () => {
    authStorage.saveSession(session);
    const stop = startSessionSync();
    const tab = otherTab();

    tab.ch.postMessage({ type: 'request' });
    await tick();

    expect(tab.received).toContainEqual({ type: 'session', session });
    stop();
    tab.ch.close();
  });

  it('sin sesión no responde', async () => {
    const stop = startSessionSync();
    const tab = otherTab();
    tab.ch.postMessage({ type: 'request' });
    await tick();
    expect(tab.received.filter((m) => (m as { type: string }).type === 'session')).toHaveLength(0);
    stop();
    tab.ch.close();
  });

  it('requestSessionFromOtherTabs devuelve la sesión validada de otra pestaña', async () => {
    const tab = otherTab();
    tab.ch.addEventListener('message', (e) => {
      if ((e.data as { type: string }).type === 'request') {
        tab.ch.postMessage({ type: 'session', session: { ...session, refreshToken: 'no', extra: 1 } });
      }
    });

    await expect(requestSessionFromOtherTabs(500)).resolves.toEqual(session);
    tab.ch.close();
  });

  it('requestSessionFromOtherTabs devuelve null si nadie responde a tiempo', async () => {
    await expect(requestSessionFromOtherTabs(20)).resolves.toBeNull();
  });

  it('cerrar sesión en una pestaña la cierra en las demás', async () => {
    authStorage.saveSession(session);
    const stop = startSessionSync();
    const tab = otherTab();

    authStorage.clearSession();
    await tick();
    expect(tab.received).toContainEqual({ type: 'logout' });

    authStorage.saveSession(session);
    tab.ch.postMessage({ type: 'logout' });
    await tick();
    expect(authStorage.getSession()).toBeNull();
    // Aplicar un logout remoto no se vuelve a difundir (evita bucles).
    expect(tab.received.filter((m) => (m as { type: string }).type === 'logout')).toHaveLength(1);

    stop();
    tab.ch.close();
  });

  it('ignora mensajes con formato desconocido', async () => {
    authStorage.saveSession(session);
    const stop = startSessionSync();
    const tab = otherTab();
    tab.ch.postMessage('texto');
    tab.ch.postMessage(null);
    await tick();
    expect(authStorage.getSession()).toEqual(session);
    stop();
    tab.ch.close();
  });

  it('sin BroadcastChannel no falla', async () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error simular un navegador sin BroadcastChannel
    delete globalThis.BroadcastChannel;
    try {
      const stop = startSessionSync();
      expect(stop).toBeTypeOf('function');
      stop();
      await expect(requestSessionFromOtherTabs()).resolves.toBeNull();
    } finally {
      globalThis.BroadcastChannel = original;
    }
  });
});
