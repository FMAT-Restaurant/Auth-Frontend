import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStorage } from './authStorage';
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

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
    vi.restoreAllMocks();
  });

  it('saves, retrieves, and clears session', () => {
    expect(authStorage.getSession()).toBeNull();

    authStorage.saveSession(mockSession);
    expect(authStorage.getSession()).toEqual(mockSession);

    authStorage.saveSession(mockSession);

    authStorage.clearSession();
    expect(authStorage.getSession()).toBeNull();
    authStorage.clearSession();
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
    expect(listener).toHaveBeenCalledWith(mockSession);
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
