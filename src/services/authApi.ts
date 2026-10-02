import type { User, AuthSession, RoleDefinition, ServicePermissionGroup } from '../types/auth';
import { authStorage } from './authStorage';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api/v1';

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    staffId: string;
    email?: string;
    roles: string[];
    views?: string[];
  };
}

export interface SetupAdminResponse {
  message: string;
  user: {
    id: string;
    email: string;
    staffId: string;
    roles: string[];
  };
  accessToken: string;
  refreshToken: string;
}

export interface BackendStaffItem {
  id: string;
  staffId?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  permissions?: string[];
  isActive: boolean;
  passwordStatus: string;
  temporaryPassword?: string | null;
  createdAt?: string;
}

// Mapea los roles del backend a permisos PBAC estándar del sistema
function rolesToPermissions(roles: string[]): string[] {
  if (roles.includes('ADMINISTRADOR')) {
    return ['*'];
  }
  const perms = new Set<string>();
  for (const role of roles) {
    switch (role) {
      case 'HOST':
        perms.add('sala:tables:view');
        perms.add('sala:tables:assign_diner');
        perms.add('sala:tables:assign_waiter');
        break;
      case 'ALMACENISTA':
        perms.add('inventory:view');
        perms.add('inventory:ingredients:create');
        perms.add('inventory:ingredients:delete');
        perms.add('inventory:stock:update_status');
        break;
      case 'MESERO':
        perms.add('orders:view');
        perms.add('orders:create');
        perms.add('menu:view');
        perms.add('sala:tables:view');
        break;
      case 'CHEF_MASTER':
        perms.add('kitchen:kds:view');
        perms.add('kitchen:order:start_preparation');
        perms.add('kitchen:order:mark_ready');
        perms.add('orders:view');
        break;
    }
  }
  return Array.from(perms);
}

// Control de concurrencia para evitar llamadas duplicadas de refresh token
let refreshPromise: Promise<string> | null = null;

async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
  fallbackToken?: string,
): Promise<Response> {
  const session = authStorage.getSession();
  const token = fallbackToken || session?.accessToken;

  const buildRequest = (t?: string) => {
    const headers = new Headers(options.headers || {});
    if (t) {
      headers.set('Authorization', `Bearer ${t}`);
    }
    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let res = await buildRequest(token);

  // Si el access token expiró (401), intentamos renovarlo transparentemente con el refresh token
  if (res.status === 401) {
    const currentSession = authStorage.getSession();
    const refreshToken = currentSession?.refreshToken;

    if (refreshToken) {
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (!refreshRes.ok) {
              throw new Error('Refresh token inválido o expirado');
            }

            const refreshData = await refreshRes.json();
            const newAccessToken: string = refreshData.accessToken;
            const newRefreshToken: string = refreshData.refreshToken || refreshToken;

            const existing = authStorage.getSession();
            if (existing) {
              authStorage.saveSession({
                ...existing,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              });
            }

            return newAccessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const freshAccessToken = await refreshPromise;
        res = await buildRequest(freshAccessToken);
      } catch {
        authStorage.clearSession();
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
    } else {
      authStorage.clearSession();
      throw new Error('Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.');
    }
  }

  return res;
}

export function formatErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const errorData = data as { message?: string | string[]; error?: string };
    if (Array.isArray(errorData.message)) {
      return errorData.message.join('. ');
    }
    if (typeof errorData.message === 'string' && errorData.message.trim()) {
      return errorData.message;
    }
    if (typeof errorData.error === 'string' && errorData.error.trim()) {
      return errorData.error;
    }
  }
  return fallback;
}

export const authApi = {
  getApiBase(): string {
    return API_BASE;
  },

  async getSetupStatus(): Promise<{ configured: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/auth/setup-status`);
      if (!res.ok) {
        return { configured: false };
      }
      return await res.json();
    } catch {
      return { configured: false };
    }
  },

  async login(identifier: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al iniciar sesión'));
    }

    const roleCodes: string[] = data.user.roles || [];
    const isAdmin = Boolean(
      data.user.userType === 'ADMIN' ||
      roleCodes.includes('ADMINISTRADOR') ||
      (data.user.email && (!data.user.staffId || data.user.staffId === 'ADMIN' || data.user.staffId.startsWith('ADM')))
    );
    const isStaff = !isAdmin;
    const permissions =
      data.user?.permissions && data.user.permissions.length > 0
        ? data.user.permissions
        : rolesToPermissions(roleCodes);

    const user: User = {
      id: data.user.id,
      userType: isAdmin ? 'ADMIN' : 'STAFF',
      staffId: data.user.staffId,
      email: data.user.email,
      displayName: isStaff ? `Colaborador ${data.user.staffId}` : 'Gerente General',
      roleLabel: roleCodes.join(', ') || (isStaff ? 'Personal' : 'Administrador'),
      roles: roleCodes,
      views: data.user.views,
      permissions,
      mustChangePassword: Boolean(data.mustChangePassword),
    };

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user,
    };
  },

  async setupAdmin(params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/setup-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al configurar administrador'));
    }

    const fullName = `${params.firstName || ''} ${params.lastName || ''}`.trim() || 'Administrador Principal';

    const user: User = {
      id: data.user.id,
      userType: 'ADMIN',
      email: data.user.email,
      staffId: data.user.staffId || 'ADM000001',
      firstName: params.firstName,
      lastName: params.lastName,
      displayName: fullName,
      roleLabel: 'Administrador',
      roles: ['ADMINISTRADOR'],
      permissions: ['*'],
      mustChangePassword: false,
    };

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user,
    };
  },

  async refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al renovar sesión'));
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  },

  async changeInitialPassword(
    currentPassword: string,
    newPassword: string,
    token?: string,
  ): Promise<{ accessToken: string }> {
    const res = await authenticatedFetch(
      '/auth/change-initial-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al actualizar contraseña'));
    }

    return { accessToken: data.accessToken };
  },

  async getMe(token?: string): Promise<User> {
    const res = await authenticatedFetch('/auth/me', {}, token);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al obtener sesión'));
    }

    const roleCodes = (data.roles || []).map((r: { code?: string } | string) =>
      typeof r === 'string' ? r : r.code || '',
    );
    const isAdmin = Boolean(
      data.userType === 'ADMIN' ||
      roleCodes.includes('ADMINISTRADOR') ||
      (data.email && (!data.staffProfile?.staffId || data.staffProfile?.staffId === 'ADMIN' || data.staffProfile?.staffId.startsWith('ADM')))
    );
    const isStaff = !isAdmin;
    const staffId = data.staffProfile?.staffId || data.staffId || (isAdmin ? 'ADMIN' : 'E000000');
    const firstName = data.firstName || data.staffProfile?.firstName || '';
    const lastName = data.lastName || data.staffProfile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || data.email || (isAdmin ? 'Administrador' : 'Colaborador');

    return {
      id: data.id,
      userType: isAdmin ? 'ADMIN' : 'STAFF',
      staffId,
      email: data.email,
      firstName,
      lastName,
      displayName: fullName,
      roleLabel: roleCodes.join(', ') || (isStaff ? 'Personal' : 'Administrador'),
      roles: roleCodes,
      views: data.views,
      permissions:
        data.permissions && data.permissions.length > 0
          ? data.permissions
          : rolesToPermissions(roleCodes),
      mustChangePassword: data.passwordStatus === 'TEMPORARY',
    };
  },

  async updateProfile(
    payload: { firstName: string; lastName: string },
    token?: string,
  ): Promise<{ message: string; user: { id: string; firstName: string; lastName: string; displayName: string } }> {
    const res = await authenticatedFetch(
      '/auth/profile',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al actualizar perfil'));
    }

    return data;
  },

  async deleteAccount(token?: string): Promise<{ message: string }> {
    const res = await authenticatedFetch(
      '/auth/account',
      {
        method: 'DELETE',
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al eliminar la cuenta'));
    }

    return data;
  },

  async logout(token?: string): Promise<void> {
    try {
      await authenticatedFetch(
        '/auth/logout',
        {
          method: 'POST',
        },
        token,
      );
    } catch {
      // Ignorar errores de red en logout
    }
  },

  async getAllStaff(token?: string): Promise<User[]> {
    const res = await authenticatedFetch('/staff', {}, token);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al obtener personal');
    }

    const data: BackendStaffItem[] = await res.json();

    return data.map((item) => {
      const roles = item.roles || [];
      const name = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Colaborador';

      return {
        id: item.id,
        userType: 'STAFF',
        staffId: item.staffId || 'E000000',
        displayName: name,
        firstName: item.firstName,
        lastName: item.lastName,
        roleLabel: roles.join(', '),
        roles,
        permissions:
          item.permissions && item.permissions.length > 0
            ? item.permissions
            : rolesToPermissions(roles),
        isActive: item.isActive,
        passwordStatus: item.passwordStatus as 'TEMPORARY' | 'ACTIVE',
        temporaryPassword: item.temporaryPassword,
        mustChangePassword: item.passwordStatus === 'TEMPORARY',
      };
    });
  },

  async updateStaff(
    id: string,
    payload: { firstName?: string; lastName?: string; roles?: string[]; isActive?: boolean },
    token?: string,
  ): Promise<User> {
    const res = await authenticatedFetch(
      `/staff/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al actualizar colaborador'));
    }

    const roles = data.roles || [];
    return {
      id: data.id,
      userType: 'STAFF',
      staffId: data.staffId,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Colaborador',
      roleLabel: roles.join(', '),
      roles,
      permissions:
        data.permissions && data.permissions.length > 0
          ? data.permissions
          : rolesToPermissions(roles),
      isActive: data.isActive,
      passwordStatus: data.passwordStatus,
      temporaryPassword: data.temporaryPassword,
      mustChangePassword: data.passwordStatus === 'TEMPORARY',
    };
  },

  async deleteStaff(id: string, token?: string): Promise<{ message: string; staffId: string }> {
    const res = await authenticatedFetch(
      `/staff/${id}`,
      {
        method: 'DELETE',
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al eliminar colaborador'));
    }

    return data;
  },

  async createStaff(
    payload: {
      firstName: string;
      lastName: string;
      roles: string[];
      initialPassword?: string;
    },
    token?: string,
  ): Promise<{ staffId: string; temporaryPassword?: string; user: User }> {
    const res = await authenticatedFetch(
      '/staff',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      token,
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al crear personal');
    }

    const createdStaffId = data.staffId || data.employee?.staffId;
    const roles = payload.roles;

    return {
      staffId: createdStaffId,
      temporaryPassword: data.temporaryPassword,
      user: {
        id: data.employee?.id || data.id,
        userType: 'STAFF',
        staffId: createdStaffId,
        displayName: `${payload.firstName} ${payload.lastName}`.trim(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        roleLabel: roles.join(', '),
        roles,
        permissions:
          data.employee?.permissions && data.employee.permissions.length > 0
            ? data.employee.permissions
            : rolesToPermissions(roles),
        isActive: true,
        passwordStatus: 'TEMPORARY',
        temporaryPassword: data.temporaryPassword,
        mustChangePassword: true,
      },
    };
  },

  async updateStaffStatus(id: string, isActive: boolean, token?: string): Promise<void> {
    const res = await authenticatedFetch(
      `/staff/${id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      },
      token,
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar estado del empleado');
    }
  },

  async resetStaffPassword(id: string, token?: string): Promise<{ temporaryPassword?: string }> {
    const res = await authenticatedFetch(
      `/staff/${id}/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
      token,
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al resetear contraseña');
    }

    return { temporaryPassword: data.temporaryPassword };
  },

  async getRoles(token?: string): Promise<RoleDefinition[]> {
    const res = await authenticatedFetch('/roles', {}, token);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar roles');
    }
    return res.json();
  },

  async getPermissionsCatalog(token?: string): Promise<ServicePermissionGroup[]> {
    const res = await authenticatedFetch('/roles/catalog', {}, token);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error al consultar catálogo de permisos');
    }
    return res.json();
  },

  async createRole(
    payload: { name: string; description?: string; code?: string; permissions: string[] },
    token?: string,
  ): Promise<RoleDefinition> {
    const res = await authenticatedFetch(
      '/roles',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al crear rol'));
    }

    return data;
  },

  async deleteRole(code: string, token?: string): Promise<{ message: string; code: string }> {
    const res = await authenticatedFetch(
      `/roles/${encodeURIComponent(code)}`,
      {
        method: 'DELETE',
      },
      token,
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(formatErrorMessage(data, 'Error al eliminar rol'));
    }

    return data;
  },
};
