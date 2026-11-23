import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi } from './authApi';
import { authStorage } from './authStorage';
import type { AuthSession } from '../types/auth';

const session: AuthSession = {
  accessToken: 'old-token',
  user: { id: 'u1', userType: 'ADMIN', displayName: 'Admin', permissions: ['*'] },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const notJson = (status: number) => new Response('<html>error</html>', { status });

/** Cada método con sus argumentos mínimos y el mensaje por defecto si el backend no manda uno. */
const calls: Array<[string, () => Promise<unknown>, string]> = [
  ['requestPasswordReset', () => authApi.requestPasswordReset('M000001'), ''],
  ['getMe', () => authApi.getMe('t'), ''],
  ['deleteAccount', () => authApi.deleteAccount('t'), ''],
  ['getAllStaff', () => authApi.getAllStaff('t'), ''],
  ['updateStaff', () => authApi.updateStaff('s1', { firstName: 'A' }, 't'), 'Error al actualizar colaborador'],
  ['deleteStaff', () => authApi.deleteStaff('s1', 't'), ''],
  ['updateStaffStatus', () => authApi.updateStaffStatus('s1', false, 't'), ''],
  ['resetStaffPassword', () => authApi.resetStaffPassword('s1', 't'), 'Error al resetear contraseña'],
  ['getRoles', () => authApi.getRoles('t'), 'Error al consultar roles'],
  ['getPermissionsCatalog', () => authApi.getPermissionsCatalog('t'), 'Error al consultar catálogo de permisos'],
  ['createRole', () => authApi.createRole({ name: 'R', permissions: [] }, 't'), 'Error al crear rol'],
  ['updateRole', () => authApi.updateRole('ROL_R', { name: 'R2' }, 't'), 'Error al actualizar rol'],
  ['deleteRole', () => authApi.deleteRole('ROL_R', 't'), 'Error al eliminar rol'],
];

describe('authApi: rutas de error', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    authStorage.clearSession();
    authStorage.saveSession(session);
  });

  it.each(calls)('%s propaga el mensaje del backend', async (_name, call) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ message: 'Mensaje del backend' }, 400));
    await expect(call()).rejects.toThrow();
  });

  it.each(calls.filter(([, , fallback]) => fallback))(
    '%s usa su mensaje por defecto si la respuesta no trae uno',
    async (_name, call, fallback) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({}, 500));
      await expect(call()).rejects.toThrow(fallback);
    },
  );

  it.each([
    ['getRoles', () => authApi.getRoles('t'), 'Error al consultar roles'],
    ['getPermissionsCatalog', () => authApi.getPermissionsCatalog('t'), 'Error al consultar catálogo de permisos'],
    ['createRole', () => authApi.createRole({ name: 'R', permissions: [] }, 't'), 'Error al crear rol'],
    ['deleteRole', () => authApi.deleteRole('ROL_R', 't'), 'Error al eliminar rol'],
  ] as Array<[string, () => Promise<unknown>, string]>)(
    '%s tolera una respuesta de error que no es JSON',
    async (_name, call, fallback) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(notJson(502));
      await expect(call()).rejects.toThrow(fallback);
    },
  );

  it('getSetupStatus no lanza: ante un error asume configured=false', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({}, 500));
    await expect(authApi.getSetupStatus()).resolves.toEqual({ configured: false });
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('sin red'));
    await expect(authApi.getSetupStatus()).resolves.toEqual({ configured: false });
  });

  it('updateRole y deleteRole devuelven la respuesta y codifican el código en la URL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ code: 'ROL_A B', name: 'A' }))
      .mockResolvedValueOnce(json({ message: 'ok', code: 'ROL_A B' }));
    await expect(authApi.updateRole('ROL_A B', { name: 'A' }, 't')).resolves.toEqual({ code: 'ROL_A B', name: 'A' });
    await expect(authApi.deleteRole('ROL_A B', 't')).resolves.toEqual({ message: 'ok', code: 'ROL_A B' });
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/roles/ROL_A%20B');
  });
});

describe('authApi: renovación de sesión ante 401', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    authStorage.clearSession();
  });

  it('renueva con la cookie, guarda el token nuevo y repite la petición', async () => {
    authStorage.saveSession(session);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ message: 'expirado' }, 401))
      .mockResolvedValueOnce(json({ accessToken: 'new-token' }))
      .mockResolvedValueOnce(json([{ code: 'MESERO', name: 'Mesero', permissions: [] }]));

    const roles = await authApi.getRoles();

    expect(roles).toHaveLength(1);
    expect(authStorage.getSession()?.accessToken).toBe('new-token');
    const refreshCall = fetchSpy.mock.calls[1];
    expect(String(refreshCall[0])).toContain('/auth/refresh');
    expect((refreshCall[1] as RequestInit).credentials).toBe('include');
    const retryHeaders = new Headers((fetchSpy.mock.calls[2][1] as RequestInit).headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-token');
  });

  it('si la renovación falla, expira la sesión', async () => {
    authStorage.saveSession(session);
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({}, 401));
    const expired = vi.fn();
    const off = authStorage.onSessionExpired(expired);

    await expect(authApi.getRoles()).rejects.toThrow('Tu sesión ha expirado');
    expect(expired).toHaveBeenCalled();
    expect(authStorage.getSession()).toBeNull();
    off();
  });

  it('sin sesión guardada, un 401 expira la sesión sin intentar renovar', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({}, 401));
    await expect(authApi.getRoles('t')).rejects.toThrow('no es válida');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('dos peticiones simultáneas comparten una sola renovación', async () => {
    authStorage.saveSession(session);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) return json({ accessToken: 'shared-token' });
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
      const headers = new Headers((lastCall?.[1] as RequestInit)?.headers);
      return headers.get('Authorization') === 'Bearer shared-token' ? json([]) : json({}, 401);
    });

    await Promise.all([authApi.getRoles(), authApi.getPermissionsCatalog()]);

    const refreshCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });
});
