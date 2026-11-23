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
