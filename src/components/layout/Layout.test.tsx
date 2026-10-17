import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { AppLayout } from './AppLayout';
import { DashboardHomeView } from '../dashboard/DashboardHomeView';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { authApi } from '../../services/authApi';
import type { User } from '../../types/auth';

vi.mock('../../services/authApi', () => ({
  authApi: {
    changeInitialPassword: vi.fn(),
  },
}));

const adminUser: User = {
  id: 'a1',
  userType: 'ADMIN',
  staffId: 'ADMIN',
  email: 'admin@fmat.com',
  displayName: 'Roberto Admin',
  roleLabel: 'Administrador',
  roles: ['ADMINISTRADOR'],
  permissions: ['*'],
};

const staffUser: User = {
  id: 's1',
  userType: 'STAFF',
  staffId: 'M001',
  displayName: 'Ana Mesera',
  roleLabel: 'MESERO',
  roles: ['MESERO'],
  permissions: ['orders:view', 'sala:tables:view'],
};

describe('Layout, DashboardHomeView, and ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Sidebar and AppLayout for Admin and Staff, handling navigation and mobile drawer', () => {
    const onSelectModule = vi.fn();
    const onLogout = vi.fn();

    const { rerender } = render(
      <AppLayout
        currentUser={adminUser}
        activeModule="inicio"
        onSelectModule={onSelectModule}
        onLogout={onLogout}
      >
        <div>Contenido Principal</div>
      </AppLayout>,
    );

    expect(screen.getByText('Contenido Principal')).toBeInTheDocument();
    expect(screen.getByText('Personal y Roles')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Abrir navegación lateral'));
    fireEvent.click(screen.getByText('Sala'));
    expect(onSelectModule).toHaveBeenCalledWith('sala');

    fireEvent.click(screen.getByLabelText('Ir a mi perfil'));
    expect(onSelectModule).toHaveBeenCalledWith('perfil');

    fireEvent.click(screen.getByTitle('Ver perfil y configuración'));
    expect(onSelectModule).toHaveBeenCalledWith('perfil');

    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(onLogout).toHaveBeenCalled();

    rerender(
      <Sidebar
        currentUser={staffUser}
        activeModule="perfil"
        onSelectModule={onSelectModule}
        onLogout={onLogout}
      />,
    );

    expect(screen.queryByText('Personal y Roles')).not.toBeInTheDocument();
    expect(screen.getByText('Órdenes y Cocina')).toBeInTheDocument();
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
  });

  it('renders DashboardHomeView modules based on permissions and navigates on click', () => {
    const onNavigate = vi.fn();
    render(<DashboardHomeView currentUser={adminUser} onNavigate={onNavigate} />);

    expect(screen.getByText('Bienvenido, Roberto Admin')).toBeInTheDocument();
    expect(screen.getByText('Inventario y Almacén')).toBeInTheDocument();
    expect(screen.getByText('Órdenes y Cocina')).toBeInTheDocument();
    expect(screen.getByText('Menú y Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Sala y Mesas')).toBeInTheDocument();
    expect(screen.getByText('Caja y Cuentas')).toBeInTheDocument();

    const buttons = screen.getAllByText('Abrir módulo →');
    buttons.forEach((btn) => fireEvent.click(btn));
    expect(onNavigate).toHaveBeenCalledWith('inventario');
    expect(onNavigate).toHaveBeenCalledWith('ordenes');
    expect(onNavigate).toHaveBeenCalledWith('menu');
    expect(onNavigate).toHaveBeenCalledWith('sala');
    expect(onNavigate).toHaveBeenCalledWith('caja');
  });

  it('validates and submits ChangePasswordModal', async () => {
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    vi.mocked(authApi.changeInitialPassword).mockResolvedValueOnce({ accessToken: 'new-jwt' });

    render(
      <ChangePasswordModal
        isOpen={true}
        user={staffUser}
        token="temp-tok"
        initialCurrentPassword="Temp123!"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    );

    const newInput = screen.getByLabelText(/Nueva contraseña personal/i);
    const confirmInput = screen.getByLabelText(/Confirmar nueva contraseña/i);

    fireEvent.change(newInput, { target: { value: '123' } });
    fireEvent.change(confirmInput, { target: { value: '123' } });
    fireEvent.click(screen.getByText('Guardar nueva contraseña'));
    expect(screen.getByText('La nueva contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();

    fireEvent.change(newInput, { target: { value: 'Temp123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Temp123!' } });
    fireEvent.click(screen.getByText('Guardar nueva contraseña'));
    expect(
      screen.getByText('La nueva contraseña no puede ser igual a la clave temporal'),
    ).toBeInTheDocument();

    fireEvent.change(newInput, { target: { value: 'NuevaClave123!' } });
    fireEvent.change(confirmInput, { target: { value: 'OtraClave123!' } });
    fireEvent.click(screen.getByText('Guardar nueva contraseña'));
    expect(screen.getByText('Las nuevas contraseñas no coinciden')).toBeInTheDocument();

    fireEvent.change(confirmInput, { target: { value: 'NuevaClave123!' } });
    fireEvent.click(screen.getByText('Guardar nueva contraseña'));

    await waitFor(() => {
      expect(authApi.changeInitialPassword).toHaveBeenCalledWith(
        'Temp123!',
        'NuevaClave123!',
        'temp-tok',
      );
      expect(onSuccess).toHaveBeenCalledWith('new-jwt');
    });
  });
});
