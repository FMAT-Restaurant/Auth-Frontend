import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStorage, sanitizeSession, LEGACY_STORAGE_KEY } from './authStorage';
import type { AuthSession } from '../types/auth';

const mockSession: AuthSession = {
  accessToken: 'token-123',
  refreshToken: 'refresh-123',
  user: {
    id: 'u1',
    userType: 'ADMIN',
    displayName: 'Admin User',
    roleLabel: 'Administrador',
    roles: ['ADMINISTRADOR'],
    permissions: ['*'],
    mustChangePassword: false,
  },
};

const expectedStoredSession: AuthSession = {
  accessToken: 'token-123',
  user: mockSession.user,
};

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
    vi.restoreAllMocks();
  });

  it('[#6] guarda la sesión solo en memoria, sin refreshToken y nunca en localStorage', () => {
    expect(authStorage.getSession()).toBeNull();

    authStorage.saveSession(mockSession);
    expect(authStorage.getSession()).toEqual(expectedStoredSession);
    expect(localStorage.getItem('fmat_restaurant_auth_session')).toBeNull();
    expect(localStorage.length).toBe(0);

    authStorage.saveSession(mockSession);

    authStorage.clearSession();
    expect(authStorage.getSession()).toBeNull();
    authStorage.clearSession();
  });

  it('[#6] no lee sesiones de localStorage y borra la que dejaron versiones anteriores', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(mockSession));
    expect(authStorage.getSession()).toBeNull();
    authStorage.clearSession();
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('notifies subscribers on save and clear, and handles listener errors', () => {
    const listener = vi.fn();
    const failingListener = vi.fn(() => {
      throw new Error('listener error');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const unsub1 = authStorage.subscribe(listener);
    const unsub2 = authStorage.subscribe(failingListener);

    authStorage.saveSession(mockSession);
    expect(listener).toHaveBeenCalledWith(expectedStoredSession);
    expect(consoleSpy).toHaveBeenCalled();

    authStorage.clearSession();
    expect(listener).toHaveBeenCalledWith(null);

    unsub1();
    unsub2();
  });

  it('tolera un localStorage que falla al borrar la sesión antigua', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove error');
    });
    authStorage.saveSession(mockSession);
    expect(() => authStorage.clearSession()).not.toThrow();
    expect(authStorage.getSession()).toBeNull();
  });

  it('expireSession sin oyentes equivale a clearSession y con oyentes los avisa', () => {
    const listener = vi.fn();
    const off = authStorage.subscribe(listener);
    authStorage.saveSession(mockSession);
    authStorage.expireSession();
    expect(authStorage.getSession()).toBeNull();
    expect(listener).toHaveBeenLastCalledWith(null);

    authStorage.saveSession(mockSession);
    const expired = vi.fn();
    const failing = vi.fn(() => { throw new Error('x'); });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const offExpired = authStorage.onSessionExpired(expired);
    const offFailing = authStorage.onSessionExpired(failing);
    authStorage.expireSession();
    expect(expired).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(authStorage.getSession()).toBeNull();
    offExpired();
    offFailing();
    off();
  });
});

describe('sanitizeSession (Sonar S8475: no persistir contenido arbitrario)', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
    vi.restoreAllMocks();
  });

  const validUser = {
    id: 'u1',
    userType: 'STAFF',
    displayName: 'Ana',
    permissions: ['orders:orders:view'],
  };

  it('conserva solo los campos conocidos y del tipo esperado', () => {
    const result = sanitizeSession({
      accessToken: 'a.b.c',
      refreshToken: 'nunca',
      extra: '<script>',
      user: {
        ...validUser,
        staffId: 'M000001',
        email: 'ana@fmat.test',
        roles: ['MESERO'],
        views: ['orders-pos-view'],
        mustChangePassword: true,
        isActive: true,
        passwordResetRequested: false,
        passwordStatus: 'TEMPORARY',
        temporaryPassword: 'secreta',
        injected: { evil: true },
        firstName: 42,
      },
    });
    expect(result).toEqual({
      accessToken: 'a.b.c',
      user: {
        ...validUser,
        staffId: 'M000001',
        email: 'ana@fmat.test',
        roles: ['MESERO'],
        views: ['orders-pos-view'],
        mustChangePassword: true,
        isActive: true,
        passwordResetRequested: false,
        passwordStatus: 'TEMPORARY',
      },
    });
  });

  it.each([
    ['nulo', null],
    ['no objeto', 'texto'],
    ['sin token', { user: validUser }],
    ['token con saltos de línea', { accessToken: 'a' + String.fromCharCode(10) + 'b', user: validUser }],
    ['token enorme', { accessToken: 'x'.repeat(9000), user: validUser }],
    ['sin usuario', { accessToken: 't' }],
    ['userType desconocido', { accessToken: 't', user: { ...validUser, userType: 'ROOT' } }],
    ['permisos no lista', { accessToken: 't', user: { ...validUser, permissions: '*' } }],
    ['permiso no texto', { accessToken: 't', user: { ...validUser, permissions: [1] } }],
    ['sin id', { accessToken: 't', user: { ...validUser, id: undefined } }],
  ])('rechaza una sesión inválida: %s', (_name, value) => {
    expect(sanitizeSession(value)).toBeNull();
  });

  it('descarta listas opcionales inválidas, displayName ausente y passwordStatus desconocido', () => {
    const result = sanitizeSession({
      accessToken: 't',
      user: {
        id: 'u2',
        userType: 'ADMIN',
        permissions: ['*'],
        roles: 'ADMIN',
        views: [null],
        passwordStatus: 'OTRO',
        mustChangePassword: 'true',
      },
    });
    expect(result).toEqual({
      accessToken: 't',
      user: { id: 'u2', userType: 'ADMIN', displayName: '', permissions: ['*'] },
    });
  });


  it('saveSession no guarda ni notifica una sesión inválida', () => {
    const listener = vi.fn();
    const unsubscribe = authStorage.subscribe(listener);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    authStorage.saveSession({ accessToken: '', user: validUser } as unknown as AuthSession);
    expect(localStorage.getItem('fmat_restaurant_auth_session')).toBeNull();
    expect(listener).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    unsubscribe();
  });
});
