import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSettingsView } from './ProfileSettingsView';
import type { User } from '../../types/auth';

const mockAdminUser: User = {
  id: 'usr-admin-1',
  restaurantId: 'rest-1',
  userType: 'ADMIN',
  email: 'admin@restaurant.com',
  displayName: 'Rolando Castro',
  firstName: 'Rolando',
  lastName: 'Castro',
  phone: '9991234567',
  restaurantName: 'FMAT Bistro',
  restaurantCommercialName: 'FMAT Gourmet',
  restaurantAddress: 'Calle 60 #100',
  roleLabel: 'Administrador',
  roles: ['ADMINISTRADOR'],
  permissions: ['*'],
};

describe('ProfileSettingsView Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  it('renders personal and restaurant sections for admin user', () => {
    render(
      <ProfileSettingsView
        currentUser={mockAdminUser}
        onUpdateUser={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('Perfil y Configuración')).toBeInTheDocument();
    expect(screen.getByText('Información Personal')).toBeInTheDocument();
    expect(screen.getByText('Datos del Restaurante')).toBeInTheDocument();
    expect(screen.getByText('Apariencia y Tema')).toBeInTheDocument();
    expect(screen.getByText('Zona de Peligro')).toBeInTheDocument();
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

    const openDeleteBtn = screen.getByRole('button', { name: /Dar de baja restaurante/i });
    fireEvent.click(openDeleteBtn);

    expect(screen.getByText(/¿Dar de baja restaurante definitivamente\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar y eliminar/i });
    expect(confirmBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('ELIMINAR');
    fireEvent.change(input, { target: { value: 'eliminar' } });

    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled();
    });
  });
});
