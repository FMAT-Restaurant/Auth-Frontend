import type { User, AuthSession } from '../types/auth';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000/api/v1';

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    restaurantId: string;
    staffId: string;
    email?: string;
    roles: string[];
    views?: string[];
  };
}

export interface RegisterRestaurantResponse {
  message: string;
  restaurant: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
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
  phone?: string;
  roles: string[];
  isActive: boolean;
  passwordStatus: string;
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

export const authApi = {
  getApiBase(): string {
    return API_BASE;
  },

  async login(identifier: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }

    const roleCodes: string[] = data.user.roles || [];
    const isStaff = Boolean(data.user.staffId && data.user.staffId !== 'ADMIN');
    const permissions = rolesToPermissions(roleCodes);

    const user: User = {
      id: data.user.id,
      restaurantId: data.user.restaurantId,
      userType: isStaff ? 'STAFF' : 'ADMIN',
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

  async registerRestaurant(params: {
    restaurantName: string;
    email: string;
    password: string;
    address?: string;
  }): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/register-restaurant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al registrar restaurante');
    }

    const user: User = {
      id: data.user.id,
      restaurantId: data.restaurant.id,
      userType: 'ADMIN',
      email: data.user.email,
      displayName: 'Administrador Restaurante',
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

  async changeInitialPassword(
    currentPassword: string,
    newPassword: string,
    token: string,
  ): Promise<{ accessToken: string }> {
    const res = await fetch(`${API_BASE}/auth/change-initial-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al actualizar contraseña');
    }

    return { accessToken: data.accessToken };
  },

  async getMe(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al obtener sesión');
    }

    const roleCodes = (data.roles || []).map((r: { code?: string } | string) =>
      typeof r === 'string' ? r : r.code || '',
    );
    const isStaff = Boolean(data.staffProfile?.staffId);
    const staffId = data.staffProfile?.staffId || 'ADMIN';
    const fullName = data.staffProfile
      ? `${data.staffProfile.firstName} ${data.staffProfile.lastName}`.trim()
      : data.email || 'Administrador';

    return {
      id: data.id,
      restaurantId: data.restaurantId,
      userType: isStaff ? 'STAFF' : 'ADMIN',
      staffId,
      email: data.email,
      displayName: fullName,
      roleLabel: roleCodes.join(', ') || (isStaff ? 'Personal' : 'Administrador'),
      roles: roleCodes,
      views: data.views,
      permissions: rolesToPermissions(roleCodes),
      mustChangePassword: data.passwordStatus === 'TEMPORARY',
    };
  },

  async logout(token?: string): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignorar errores de red en logout
    }
  },

  async getAllStaff(token: string): Promise<User[]> {
    const res = await fetch(`${API_BASE}/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });

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
        restaurantId: '',
        userType: 'STAFF',
        staffId: item.staffId || 'E000000',
        displayName: name,
        roleLabel: roles.join(', '),
        roles,
        permissions: rolesToPermissions(roles),
        mustChangePassword: item.passwordStatus === 'TEMPORARY',
      };
    });
  },

  async createStaff(
    payload: {
      firstName: string;
      lastName: string;
      phone?: string;
      roles: string[];
      initialPassword?: string;
    },
    token: string,
  ): Promise<{ staffId: string; temporaryPassword?: string; user: User }> {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

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
        restaurantId: '',
        userType: 'STAFF',
        staffId: createdStaffId,
        displayName: `${payload.firstName} ${payload.lastName}`.trim(),
        roleLabel: roles.join(', '),
        roles,
        permissions: rolesToPermissions(roles),
        mustChangePassword: true,
      },
    };
  },

  async updateStaffStatus(id: string, isActive: boolean, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/staff/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar estado del empleado');
    }
  },

  async resetStaffPassword(id: string, token: string): Promise<{ temporaryPassword?: string }> {
    const res = await fetch(`${API_BASE}/staff/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al resetear contraseña');
    }

    return { temporaryPassword: data.temporaryPassword };
  },
};
