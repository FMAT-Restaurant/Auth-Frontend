import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, formatErrorMessage } from './authApi';
import { authStorage } from './authStorage';

describe('authApi', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
    vi.restoreAllMocks();
  });

  it('formats error messages from various response shapes', () => {
    expect(formatErrorMessage({ message: ['Error 1', 'Error 2'] }, 'Fallback')).toBe('Error 1. Error 2');
    expect(formatErrorMessage({ message: 'Single error' }, 'Fallback')).toBe('Single error');
    expect(formatErrorMessage({ error: 'Alt error' }, 'Fallback')).toBe('Alt error');
    expect(formatErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(formatErrorMessage({}, 'Fallback')).toBe('Fallback');
  });

  it('returns API base URL and checks setupStatus', async () => {
    expect(authApi.getApiBase()).toBeTruthy();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ configured: true }), { status: 200 }),
    );
    expect(await authApi.getSetupStatus()).toEqual({ configured: true });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }));
    expect(await authApi.getSetupStatus()).toEqual({ configured: false });

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network fail'));
    expect(await authApi.getSetupStatus()).toEqual({ configured: false });
  });

  it('logs in admin and staff users with role permission mapping', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'acc-1',
          refreshToken: 'ref-1',
          mustChangePassword: false,
          user: {
            id: '1',
            staffId: 'ADM001',
            email: 'admin@fmat.com',
            roles: ['ADMINISTRADOR'],
          },
        }),
        { status: 200 },
      ),
    );

    const adminSession = await authApi.login('admin@fmat.com', 'pass123');
    expect(adminSession.user.userType).toBe('ADMIN');
    expect(adminSession.user.permissions).toEqual(['*']);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'acc-2',
          refreshToken: 'ref-2',
          mustChangePassword: true,
          user: {
            id: '2',
            staffId: 'M001',
            roles: ['HOST', 'ALMACENISTA', 'MESERO', 'CHEF_MASTER'],
          },
        }),
        { status: 200 },
      ),
    );

    const staffSession = await authApi.login('M001', 'temp');
    expect(staffSession.user.userType).toBe('STAFF');
    expect(staffSession.user.mustChangePassword).toBe(true);
    expect(staffSession.user.permissions).toContain('orders:view');
    expect(staffSession.user.permissions).toContain('inventory:view');
    expect(staffSession.user.permissions).toContain('sala:tables:view');
    expect(staffSession.user.permissions).toContain('kitchen:kds:view');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Credenciales inválidas' }), { status: 401 }),
    );
    await expect(authApi.login('M001', 'bad')).rejects.toThrow('Credenciales inválidas');
  });

  it('handles setupAdmin and refreshSession', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          accessToken: 'a',
          refreshToken: 'r',
          user: { id: '1', email: 'a@b.com', staffId: 'ADM01', roles: ['ADMINISTRADOR'] },
        }),
        { status: 201 },
      ),
    );
    const session = await authApi.setupAdmin({
      email: 'a@b.com',
      password: '123',
      firstName: 'Ana',
      lastName: 'Lopez',
    });
    expect(session.user.displayName).toBe('Ana Lopez');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Ya configurado' }), { status: 400 }),
    );
    await expect(authApi.setupAdmin({ email: 'a@b.com', password: '123' })).rejects.toThrow('Ya configurado');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ accessToken: 'new-a', refreshToken: 'new-r' }), { status: 200 }),
    );
    expect(await authApi.refreshSession('old-r')).toEqual({
      accessToken: 'new-a',
      refreshToken: 'new-r',
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Refresh inválido' }), { status: 401 }),
    );
    await expect(authApi.refreshSession('bad')).rejects.toThrow('Refresh inválido');
  });

  it('handles transparent token refresh on 401 in authenticatedFetch', async () => {
    authStorage.saveSession({
      accessToken: 'expired-token',
      refreshToken: 'valid-refresh',
      user: {
        id: '1',
        userType: 'ADMIN',
        displayName: 'Admin',
        roleLabel: 'Admin',
        roles: ['ADMINISTRADOR'],
        permissions: ['*'],
      },
    });

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: 'fresh-token', refreshToken: 'fresh-refresh' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: 'updated-after-pw' }), { status: 200 }),
      );

    const res = await authApi.changeInitialPassword('old', 'new');
    expect(res.accessToken).toBe('updated-after-pw');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(authStorage.getSession()?.accessToken).toBe('fresh-token');

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));

    await expect(authApi.changeInitialPassword('old', 'new')).rejects.toThrow(
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    );

    authStorage.clearSession();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 401 }));
    await expect(authApi.changeInitialPassword('old', 'new')).rejects.toThrow(
      'Tu sesión ha expirado o no es válida.',
    );
  });

  it('handles getMe, updateProfile, deleteAccount, and logout', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'u1',
          userType: 'STAFF',
          staffProfile: { staffId: 'M100', firstName: 'Luis', lastName: 'Paz' },
          roles: [{ code: 'MESERO' }],
          passwordStatus: 'TEMPORARY',
        }),
        { status: 200 },
      ),
    );
    const me = await authApi.getMe('tok');
    expect(me.displayName).toBe('Luis Paz');
    expect(me.mustChangePassword).toBe(true);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: 'OK',
          user: { id: 'u1', firstName: 'Luis', lastName: 'Paz', displayName: 'Luis Paz' },
        }),
        { status: 200 },
      ),
    );
    const prof = await authApi.updateProfile({ firstName: 'Luis', lastName: 'Paz' }, 'tok');
    expect(prof.user.displayName).toBe('Luis Paz');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Eliminado' }), { status: 200 }),
    );
    expect(await authApi.deleteAccount('tok')).toEqual({ message: 'Eliminado' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 200 }));
    await authApi.logout('tok');
  });

  it('handles staff and roles CRUD methods', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 's1',
            staffId: 'M01',
            firstName: 'Pedro',
            lastName: 'Gomez',
            roles: ['MESERO'],
            isActive: true,
            passwordStatus: 'ACTIVE',
          },
        ]),
        { status: 200 },
      ),
    );
    const list = await authApi.getAllStaff('tok');
    expect(list).toHaveLength(1);
    expect(list[0].displayName).toBe('Pedro Gomez');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 's1',
          staffId: 'M01',
          firstName: 'Pedro',
          lastName: 'Ramos',
          roles: ['MESERO'],
          isActive: false,
          passwordStatus: 'ACTIVE',
        }),
        { status: 200 },
      ),
    );
    const updated = await authApi.updateStaff('s1', { lastName: 'Ramos', isActive: false }, 'tok');
    expect(updated.lastName).toBe('Ramos');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Deleted', staffId: 'M01' }), { status: 200 }),
    );
    expect(await authApi.deleteStaff('s1', 'tok')).toEqual({ message: 'Deleted', staffId: 'M01' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          staffId: 'M02',
          temporaryPassword: 'TMP',
          employee: { id: 's2', staffId: 'M02' },
        }),
        { status: 201 },
      ),
    );
    const created = await authApi.createStaff(
      { firstName: 'Rosa', lastName: 'Diaz', roles: ['MESERO'] },
      'tok',
    );
    expect(created.staffId).toBe('M02');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await authApi.updateStaffStatus('s2', false, 'tok');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ temporaryPassword: 'NEW_TMP' }), { status: 200 }),
    );
    expect(await authApi.resetStaffPassword('s2', 'tok')).toEqual({ temporaryPassword: 'NEW_TMP' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ code: 'MESERO', name: 'Mesero', permissions: ['orders:view'] }]), {
        status: 200,
      }),
    );
    expect(await authApi.getRoles('tok')).toHaveLength(1);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([{ serviceKey: 'orders', serviceName: 'Orders', permissions: [] }]), {
        status: 200,
      }),
    );
    expect(await authApi.getPermissionsCatalog('tok')).toHaveLength(1);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'CAJERO', name: 'Cajero', permissions: ['billing:view'] }), {
        status: 201,
      }),
    );
    const newRole = await authApi.createRole({ name: 'Cajero', permissions: ['billing:view'] }, 'tok');
    expect(newRole.code).toBe('CAJERO');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Rol eliminado', code: 'CAJERO' }), { status: 200 }),
    );
    expect(await authApi.deleteRole('CAJERO', 'tok')).toEqual({
      message: 'Rol eliminado',
      code: 'CAJERO',
    });
  });

  it('throws descriptive errors when staff and role endpoints fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Fallo de servidor' }), { status: 400 }),
      ),
    );

    await expect(authApi.getMe('tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.updateProfile({ firstName: 'A', lastName: 'B' }, 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.deleteAccount('tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.getAllStaff('tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.updateStaff('1', {}, 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.deleteStaff('1', 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(
      authApi.createStaff({ firstName: 'A', lastName: 'B', roles: [] }, 'tok'),
    ).rejects.toThrow('Fallo de servidor');
    await expect(authApi.updateStaffStatus('1', true, 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.resetStaffPassword('1', 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.getRoles('tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.getPermissionsCatalog('tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.createRole({ name: 'R', permissions: [] }, 'tok')).rejects.toThrow('Fallo de servidor');
    await expect(authApi.deleteRole('R', 'tok')).rejects.toThrow('Fallo de servidor');
  });
});
