import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStorage, sanitizeSession } from './authStorage';
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

  it('saves, retrieves, and clears session without persisting refreshToken in localStorage', () => {
    expect(authStorage.getSession()).toBeNull();

    authStorage.saveSession(mockSession);
    expect(authStorage.getSession()).toEqual(expectedStoredSession);
    expect(localStorage.getItem('fmat_restaurant_auth_session')).not.toContain('refresh-123');
    expect(localStorage.getItem('fmat_restaurant_auth_session')).not.toContain('refreshToken');

    authStorage.saveSession(mockSession);

    authStorage.clearSession();
    expect(authStorage.getSession()).toBeNull();
    authStorage.clearSession();
  });

  it('strips legacy refreshToken from localStorage when reading', () => {
    localStorage.setItem('fmat_restaurant_auth_session', JSON.stringify(mockSession));
    const loaded = authStorage.getSession();
    expect(loaded).toEqual(expectedStoredSession);
    expect(localStorage.getItem('fmat_restaurant_auth_session')).not.toContain('refreshToken');
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

  it('handles corrupted JSON and storage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('fmat_restaurant_auth_session', '{bad-json');
    expect(authStorage.getSession()).toBeNull();

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    authStorage.saveSession({ ...mockSession, accessToken: 'new-token' });

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove error');
    });
    localStorage.setItem('fmat_restaurant_auth_session', 'val');
    authStorage.clearSession();

    expect(consoleSpy).toHaveBeenCalled();
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

  it('getSession descarta y borra contenido manipulado en localStorage', () => {
    localStorage.setItem('fmat_restaurant_auth_session', JSON.stringify({ accessToken: 't', user: { id: 1 } }));
    expect(authStorage.getSession()).toBeNull();
    expect(localStorage.getItem('fmat_restaurant_auth_session')).toBeNull();
  });

  it('getSession limpia campos desconocidos y reescribe lo guardado', () => {
    localStorage.setItem(
      'fmat_restaurant_auth_session',
      JSON.stringify({ accessToken: 't', refreshToken: 'r', user: { ...validUser, extra: 1 } }),
    );
    expect(authStorage.getSession()).toEqual({ accessToken: 't', user: validUser });
    expect(JSON.parse(localStorage.getItem('fmat_restaurant_auth_session') as string)).toEqual({
      accessToken: 't',
      user: validUser,
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
