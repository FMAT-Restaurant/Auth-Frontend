import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSettingsView } from './ProfileSettingsView';
import type { User } from '../../types/auth';

const mockAdminUser: User = {
  id: 'usr-admin-1',
  userType: 'ADMIN',
  email: 'admin@restaurant.com',
  displayName: 'Rolando Castro',
  firstName: 'Rolando',
  lastName: 'Castro',
  roleLabel: 'Administrador',
  roles: ['ADMINISTRADOR'],
  permissions: ['*'],
};

const mockStaffUser: User = {
  id: 'usr-staff-1',
  userType: 'STAFF',
  staffId: 'M000001',
  displayName: 'Colaborador M000001',
  firstName: 'Carlos',
  lastName: 'López',
  roleLabel: 'Mesero',
  roles: ['MESERO'],
  permissions: ['sala:tables:view'],
};

describe('ProfileSettingsView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  it('renders personal, theme, and danger sections without restaurant section', () => {
    render(
      <ProfileSettingsView
        currentUser={mockAdminUser}
        onUpdateUser={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('Perfil y Configuración')).toBeInTheDocument();
    expect(screen.getByText('Información Personal')).toBeInTheDocument();
    expect(screen.queryByText('Datos del Restaurante')).not.toBeInTheDocument();
    expect(screen.getByText('Apariencia y Tema')).toBeInTheDocument();
    expect(screen.getByText('Zona de Peligro')).toBeInTheDocument();
  });

  it('shows read-only notice and disables inputs for staff user', () => {
    render(
      <ProfileSettingsView
        currentUser={mockStaffUser}
        onUpdateUser={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText(/Modo de solo lectura/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Roberto')).toBeDisabled();
    expect(screen.getByPlaceholderText('Ej. Castro')).toBeDisabled();
    expect(screen.queryByText('Guardar cambios personales')).not.toBeInTheDocument();
    expect(screen.queryByText('Zona de Peligro')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminar mi cuenta')).not.toBeInTheDocument();
  });

  it('allows toggling dark mode and persists in document and localStorage', () => {
    render(
      <ProfileSettingsView
        currentUser={mockAdminUser}
        onUpdateUser={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    const darkModeButton = screen.getByRole('button', { name: /Modo Oscuro/i });
    fireEvent.click(darkModeButton);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('fmat_theme')).toBe('dark');

    const lightModeButton = screen.getByRole('button', { name: /Modo Claro/i });
    fireEvent.click(lightModeButton);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('fmat_theme')).toBe('light');
  });

  it('opens danger zone confirmation modal and requires typing ELIMINAR', async () => {
    render(
      <ProfileSettingsView
        currentUser={mockAdminUser}
        onUpdateUser={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    const openDeleteBtn = screen.getByRole('button', { name: /Eliminar mi cuenta/i });
    fireEvent.click(openDeleteBtn);

    expect(screen.getByText(/¿Eliminar cuenta de usuario definitivamente\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y eliminar/i });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('ELIMINAR');
    fireEvent.change(input, { target: { value: 'eliminar' } });

    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled();
    });
  });
});
