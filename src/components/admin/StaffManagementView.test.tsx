import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StaffManagementView } from './StaffManagementView';
import { authApi } from '../../services/authApi';
import type { User, RoleDefinition, ServicePermissionGroup } from '../../types/auth';

vi.mock('../../services/authApi', () => ({
  authApi: {
    getAllStaff: vi.fn(),
    getRoles: vi.fn(),
    getPermissionsCatalog: vi.fn(),
    createStaff: vi.fn(),
    createRole: vi.fn(),
    updateStaff: vi.fn(),
    resetStaffPassword: vi.fn(),
    deleteStaff: vi.fn(),
  },
}));

const mockAdmin: User = {
  id: 'admin-1',
  userType: 'ADMIN',
  email: 'admin@fmat.com',
  displayName: 'Admin General',
  roleLabel: 'Administrador',
  roles: ['ADMINISTRADOR'],
  permissions: ['*'],
};

const mockStaff: User[] = [
  {
    id: 's1',
    userType: 'STAFF',
    staffId: 'M000101',
    firstName: 'Juan',
    lastName: 'Pérez',
    displayName: 'Juan Pérez',
    roleLabel: 'MESERO',
    roles: ['MESERO'],
    permissions: ['orders:view'],
    isActive: true,
    mustChangePassword: true,
    temporaryPassword: 'TMP-111',
  },
];

const mockRoles: RoleDefinition[] = [
  { code: 'ADMINISTRADOR', name: 'Administrador', permissions: ['*'] },
  { code: 'MESERO', name: 'Mesero', description: 'Mesas', permissions: ['orders:view'] },
  { code: 'HOST', name: 'Host', description: 'Recepción', permissions: ['sala:tables:view'] },
];

const mockCatalog: ServicePermissionGroup[] = [
  {
    serviceKey: 'orders',
    serviceName: 'Órdenes',
    permissions: [{ code: 'orders:view', label: 'Ver órdenes', description: 'Ver' }],
  },
];

describe('StaffManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.mocked(authApi.getAllStaff).mockResolvedValue(mockStaff);
    vi.mocked(authApi.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(authApi.getPermissionsCatalog).mockResolvedValue(mockCatalog);
  });

  it('loads staff list, opens create form, creates staff with predefined roles and copies credentials', async () => {
    vi.mocked(authApi.createStaff).mockResolvedValueOnce({
      staffId: 'M000202',
      temporaryPassword: 'PASS-202',
      user: {
        id: 's2',
        userType: 'STAFF',
        staffId: 'M000202',
        displayName: 'María López',
        roleLabel: 'MESERO, HOST',
        roles: ['MESERO', 'HOST'],
        permissions: ['orders:view'],
      },
    });

    render(<StaffManagementView currentUser={mockAdmin} token="tok-123" />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Dar de alta empleado'));
    expect(screen.getByText('Registrar nuevo colaborador')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ej. Juan'), { target: { value: 'María' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez'), { target: { value: 'López' } });

    fireEvent.click(screen.getByLabelText(/Host/i));
    fireEvent.click(screen.getByText('Crear Colaborador'));

    await waitFor(() => {
      expect(authApi.createStaff).toHaveBeenCalledWith(
        {
          firstName: 'María',
          lastName: 'López',
          roles: ['MESERO', 'HOST'],
        },
        'tok-123',
      );
      expect(screen.getByText('¡Colaborador Registrado Exitosamente!')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copiar ID'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('M000202');

    fireEvent.click(screen.getByText('Copiar clave'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('PASS-202');

    fireEvent.click(screen.getByText('Entendido'));
  });

  it('creates staff with custom permissions and saves new role', async () => {
    vi.mocked(authApi.createRole).mockResolvedValueOnce({
      code: 'TURNO_NOCTURNO',
      name: 'Turno Nocturno',
      permissions: ['orders:view'],
    });
    vi.mocked(authApi.createStaff).mockResolvedValueOnce({
      staffId: 'M000303',
      temporaryPassword: 'PASS-303',
      user: {
        id: 's3',
        userType: 'STAFF',
        staffId: 'M000303',
        displayName: 'Pedro Ruiz',
        roleLabel: 'TURNO_NOCTURNO',
        roles: ['TURNO_NOCTURNO'],
        permissions: ['orders:view'],
      },
    });

    render(<StaffManagementView currentUser={mockAdmin} token="tok-123" />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Dar de alta empleado'));
    fireEvent.change(screen.getByPlaceholderText('Ej. Juan'), { target: { value: 'Pedro' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez'), { target: { value: 'Ruiz' } });

    fireEvent.click(screen.getByText(/Personalizar permisos directamente/i));
    fireEvent.click(screen.getByLabelText(/Guardar esta configuración como un nuevo Rol/i));
    fireEvent.change(screen.getByPlaceholderText('Ej. Mesero de Turno Nocturno'), {
      target: { value: 'Turno Nocturno' },
    });
    fireEvent.click(screen.getByLabelText('Ver órdenes'));

    fireEvent.click(screen.getByText('Crear Colaborador'));

    await waitFor(() => {
      expect(authApi.createRole).toHaveBeenCalled();
      expect(authApi.createStaff).toHaveBeenCalledWith(
        {
          firstName: 'Pedro',
          lastName: 'Ruiz',
          roles: ['TURNO_NOCTURNO'],
        },
        'tok-123',
      );
    });
  });

  it('opens collaborator drawer from table and switches to roles tab', async () => {
    render(<StaffManagementView currentUser={mockAdmin} token="tok-123" />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Expediente →'));
    expect(screen.getByText('Expediente de Personal Operativo')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cerrar'));

    fireEvent.click(screen.getByText('Roles y Permisos por Microservicio'));
    await waitFor(() => {
      expect(screen.getByText('+ Crear Nuevo Rol')).toBeInTheDocument();
    });
  });
});
