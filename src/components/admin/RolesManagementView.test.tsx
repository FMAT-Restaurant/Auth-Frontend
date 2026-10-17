import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesManagementView } from './RolesManagementView';
import { authApi } from '../../services/authApi';

vi.mock('../../services/authApi', () => ({
  authApi: {
    getRoles: vi.fn(),
    getPermissionsCatalog: vi.fn(),
    createRole: vi.fn(),
    deleteRole: vi.fn(),
  },
}));

const mockRoles = [
  {
    code: 'ADMINISTRADOR',
    name: 'Administrador',
    description: 'Acceso total',
    permissions: ['*'],
    isSystemRole: true,
  },
  {
    code: 'BARISTA',
    name: 'Barista',
    description: 'Preparación de bebidas',
    permissions: ['orders:view'],
    isSystemRole: false,
  },
];

const mockCatalog = [
  {
    serviceKey: 'orders',
    serviceName: 'Órdenes y Cocina',
    permissions: [
      { code: 'orders:view', label: 'Ver órdenes', description: 'Permite ver comandas' },
      { code: 'orders:create', label: 'Crear órdenes', description: 'Permite crear comandas' },
    ],
  },
];

describe('RolesManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(authApi.getPermissionsCatalog).mockResolvedValue(mockCatalog);
  });

  it('loads and displays system and custom roles', async () => {
    render(<RolesManagementView token="test-token" />);

    expect(screen.getByText(/Cargando catálogo de roles/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Administrador')).toBeInTheDocument();
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    expect(screen.getByText('Control Total del Sistema (*)')).toBeInTheDocument();
    expect(screen.getByText('orders:view')).toBeInTheDocument();
  });

  it('handles role creation validation, permission toggles, and submission', async () => {
    const onRolesChanged = vi.fn();
    vi.mocked(authApi.createRole).mockResolvedValueOnce({
      code: 'CAJERO',
      name: 'Cajero',
      permissions: ['orders:view', 'orders:create'],
    });

    render(<RolesManagementView token="test-token" onRolesChanged={onRolesChanged} />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Crear Nuevo Rol'));

    fireEvent.click(screen.getByText('Guardar Rol'));
    expect(
      screen.getByText('Debes ingresar un nombre y seleccionar al menos un permiso'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ej. Barista de Turno'), {
      target: { value: 'Cajero' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Encargado de preparación/i), {
      target: { value: 'Cobro de cuentas' },
    });

    const selectAllBtn = screen.getByText('Seleccionar todos');
    fireEvent.click(selectAllBtn);
    expect(screen.getByText('Deseleccionar todos')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Deseleccionar todos'));
    expect(screen.getByText('Seleccionar todos')).toBeInTheDocument();

    const viewCheckbox = screen.getByLabelText(/Ver órdenes/i);
    fireEvent.click(viewCheckbox);

    fireEvent.click(screen.getByText('Guardar Rol'));

    await waitFor(() => {
      expect(authApi.createRole).toHaveBeenCalledWith(
        {
          name: 'Cajero',
          description: 'Cobro de cuentas',
          permissions: ['orders:view'],
        },
        'test-token',
      );
      expect(onRolesChanged).toHaveBeenCalled();
    });
  });

  it('handles role deletion and API errors', async () => {
    const onRolesChanged = vi.fn();
    vi.mocked(authApi.deleteRole).mockResolvedValueOnce({
      message: 'Eliminado',
      code: 'BARISTA',
    });

    render(<RolesManagementView token="test-token" onRolesChanged={onRolesChanged} />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Eliminar rol personalizado');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('¿Eliminar rol personalizado?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Eliminar rol'));

    await waitFor(() => {
      expect(authApi.deleteRole).toHaveBeenCalledWith('BARISTA', 'test-token');
      expect(onRolesChanged).toHaveBeenCalled();
    });
  });

  it('displays error banner when loading roles fails', async () => {
    vi.mocked(authApi.getRoles).mockRejectedValueOnce(new Error('Error de red en roles'));

    render(<RolesManagementView token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Error de red en roles')).toBeInTheDocument();
    });
  });
});
