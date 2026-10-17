import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { authStorage } from './services/authStorage';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
  });

  it('renders the login header correctly', () => {
    render(<App />);
    expect(screen.getByText('FMAT Restaurant')).toBeInTheDocument();
  });

  it('allows toggling between Personal and Gerente modes', () => {
    render(<App />);
    const adminTab = screen.getByText('Gerente / Admin');
    const staffTab = screen.getByText('Personal (Staff ID)');

    // Default is staff
    expect(screen.getByLabelText(/Staff ID/i)).toBeInTheDocument();

    // Click admin tab
    fireEvent.click(adminTab);
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();

    // Click staff tab back
    fireEvent.click(staffTab);
    expect(screen.getByLabelText(/Staff ID/i)).toBeInTheDocument();
  });

  it('updates input values when typing', () => {
    render(<App />);
    const idInput = screen.getByLabelText(/Staff ID/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: 'M000104' } });
    fireEvent.change(passwordInput, { target: { value: 'Temp123!' } });

    expect(idInput.value).toBe('M000104');
    expect(passwordInput.value).toBe('Temp123!');
  });

  it('toggles theme on login screen and renders authenticated modules and logout', () => {
    localStorage.setItem(
      'fmat_restaurant_auth_session',
      JSON.stringify({
        accessToken: 'tok-admin',
        user: {
          id: '1',
          userType: 'ADMIN',
          staffId: 'ADMIN',
          email: 'admin@fmat.com',
          displayName: 'Admin FMAT',
          roleLabel: 'Administrador',
          roles: ['ADMINISTRADOR'],
          permissions: ['*'],
        },
      }),
    );

    render(<App />);
    expect(screen.getByText('Bienvenido, Admin FMAT')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Personal y Roles'));
    expect(screen.getByText('Control de Personal y Accesos')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Ver perfil y configuración'));
    expect(screen.getByText('Perfil y Configuración')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sala'));
    fireEvent.click(screen.getByText('Cerrar sesión'));
  });
});
