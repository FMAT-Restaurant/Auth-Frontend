export interface User {
  id: string;
  restaurantId: string;
  userType: 'ADMIN' | 'STAFF';
  staffId?: string; // E000104 para personal, undefined/ADMIN para admin
  email?: string;
  displayName: string;
  roleLabel?: string; // Etiqueta descriptiva libre: ej. "Líder de inventario"
  permissions: string[]; // Lista de códigos PBAC: ej. ["inventory:view", "inventory:ingredients:create"]
  mustChangePassword?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: {
    code: string;
    label: string;
    description: string;
  }[];
}
