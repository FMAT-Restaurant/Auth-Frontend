import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesManagementView } from './RolesManagementView';
import { authApi } from '../../services/authApi';

vi.mock('../../services/authApi', () => ({
  authApi: {
    getRoles: vi.fn(),
    getPermissionsCatalog: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
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
  {
    code: 'GESTOR_MENU',
    name: 'Gestor de Menú',
    description: 'Administra platillos y carta',
    permissions: ['menu:dishes:manage'],
    isSystemRole: true,
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
  {
    serviceKey: 'menu',
    serviceName: 'Menú y Carta',
    permissions: [
      { code: 'menu:dishes:manage', label: 'Modificar platillos', description: 'Crear y editar platillos' },
    ],
  },
];

describe('RolesManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getRoles).mockResolvedValue(mockRoles);
    vi.mocked(authApi.getPermissionsCatalog).mockResolvedValue(mockCatalog);
  });

  it('loads and displays uniform role cards without inline permission chips', async () => {
    render(<RolesManagementView token="test-token" />);

    expect(screen.getByText(/Cargando catálogo de roles/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Administrador')).toBeInTheDocument();
      expect(screen.getByText('Barista')).toBeInTheDocument();
      expect(screen.getByText('Gestor de Menú')).toBeInTheDocument();
    });

    expect(screen.getByText('Acceso Total (*)')).toBeInTheDocument();
    expect(screen.getAllByText('1 permiso')).toHaveLength(2);
    expect(screen.queryByText('orders:view')).not.toBeInTheDocument();
    expect(screen.queryByText('menu:dishes:manage')).not.toBeInTheDocument();
  });

  it('filters roles by microservice sidebar and search query (name or permission parts)', async () => {
    render(<RolesManagementView token="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    const sidebar = screen.getByLabelText('Filtrar roles por microservicio');
    expect(within(sidebar).getByText('Todos')).toBeInTheDocument();

    // Filtrar por Menú y Carta
    fireEvent.click(within(sidebar).getByText('Menú y Carta'));
    expect(screen.getByText('Gestor de Menú')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.queryByText('Barista')).not.toBeInTheDocument();

    // Volver a Todos y buscar por parte del permiso ("dishes")
    fireEvent.click(within(sidebar).getByText('Todos'));
    const searchInput = screen.getByLabelText('Buscar roles o permisos');
    fireEvent.change(searchInput, { target: { value: 'dishes' } });

    expect(screen.getByText('Gestor de Menú')).toBeInTheDocument();
    expect(screen.queryByText('Barista')).not.toBeInTheDocument();

    // Buscar por descripción del permiso ("comandas")
    fireEvent.change(searchInput, { target: { value: 'comandas' } });
    expect(screen.getByText('Barista')).toBeInTheDocument();
    expect(screen.queryByText('Gestor de Menú')).not.toBeInTheDocument();
  });

  it('opens RoleDetailDrawer on card click, shows human-readable permissions with code on hover, and saves updates', async () => {
    const onRolesChanged = vi.fn();
    vi.mocked(authApi.updateRole).mockResolvedValueOnce({
      code: 'BARISTA',
      name: 'Barista',
      description: 'Preparación de bebidas',
      permissions: ['orders:view', 'orders:create'],
      isSystemRole: false,
    });

    render(<RolesManagementView token="test-token" onRolesChanged={onRolesChanged} />);

    await waitFor(() => {
      expect(screen.getByText('Barista')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Barista'));

    const drawer = screen.getByRole('dialog');
    // Se muestra la descripción legible ("Ver órdenes") y el código en el atributo title (hover)
    const permBadges = within(drawer).getAllByTitle('orders:view');
    expect(permBadges[0]).toHaveTextContent('Ver órdenes');

    // Agregar permiso "Crear órdenes" desde el catálogo del drawer
    const createOrdersCheckbox = within(drawer).getByLabelText(/Crear órdenes/i);
    fireEvent.click(createOrdersCheckbox);

    fireEvent.click(within(drawer).getByText('Guardar cambios'));

    await waitFor(() => {
      expect(authApi.updateRole).toHaveBeenCalledWith(
        'BARISTA',
        {
          name: 'Barista',
          description: 'Preparación de bebidas',
          permissions: ['orders:view', 'orders:create'],
        },
        'test-token',
      );
      expect(onRolesChanged).toHaveBeenCalled();
    });
  });

  it('handles role creation with microservice sidebar filter in modal', async () => {
    const onRolesChanged = vi.fn();
    vi.mocked(authApi.createRole).mockResolvedValueOnce({
      code: 'CAJERO',
      name: 'Cajero',
      permissions: ['orders:view'],
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

    // Filtrar en la sidebar del modal por "Órdenes y Cocina"
    const modalSidebar = screen.getByLabelText('Filtrar permisos por microservicio');
    fireEvent.click(within(modalSidebar).getByText('Órdenes y Cocina'));

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
