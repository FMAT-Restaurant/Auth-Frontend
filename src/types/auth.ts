export interface User {
  id: string;
  userType: 'ADMIN' | 'STAFF';
  staffId?: string; // M000001 / E000001 para personal, ADM000001 para admin
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  roleLabel?: string; // Etiqueta descriptiva libre: ej. "Mesero", "Líder de inventario"
  roles?: string[]; // Roles devueltos por el backend: ["ADMINISTRADOR"], ["MESERO", "HOST"]
  views?: string[]; // Vistas autorizadas: ["orders-pos-view", "menu-catalog-view"]
  permissions: string[]; // Lista de códigos PBAC: ej. ["inventory:view", "inventory:ingredients:create"]
  mustChangePassword?: boolean;
  isActive?: boolean;
  passwordStatus?: 'TEMPORARY' | 'ACTIVE';
  temporaryPassword?: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface RoleDefinition {
  code: string;
  name: string;
  description?: string;
  permissions: string[];
  isAssignable?: boolean;
  isSystemRole?: boolean;
}

export interface PermissionItem {
  code: string;
  label: string;
  description: string;
}

export interface ServicePermissionGroup {
  serviceKey: string;
  serviceName: string;
  iconName?: string;
  permissions: PermissionItem[];
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
