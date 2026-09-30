export interface User {
  id: string;
  restaurantId: string;
  userType: 'ADMIN' | 'STAFF';
  staffId?: string; // M000001 / E000001 para personal, ADMIN para admin
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  restaurantName?: string;
  restaurantCommercialName?: string;
  restaurantAddress?: string;
  displayName: string;
  roleLabel?: string; // Etiqueta descriptiva libre: ej. "Mesero", "Líder de inventario"
  roles?: string[]; // Roles devueltos por el backend: ["ADMINISTRADOR"], ["MESERO", "HOST"]
  views?: string[]; // Vistas autorizadas: ["orders-pos-view", "menu-catalog-view"]
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
