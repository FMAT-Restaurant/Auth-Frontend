import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import { authStorage } from './services/authStorage';
import { authApi } from './services/authApi';
import { requestSessionFromOtherTabs } from './services/sessionSync';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
  });

  it('renders the login header correctly', async () => {
    render(<App />);
    expect(await screen.findByText('FMAT Restaurant')).toBeInTheDocument();
  });

  it('allows toggling between Personal and Gerente modes', async () => {
    render(<App />);
    const adminTab = await screen.findByText('Gerente / Admin');
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

  it('updates input values when typing', async () => {
    render(<App />);
    const idInput = (await screen.findByLabelText(/Staff ID/i)) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;

    fireEvent.change(idInput, { target: { value: 'M000104' } });
    fireEvent.change(passwordInput, { target: { value: 'Temp123!' } });

    expect(idInput.value).toBe('M000104');
    expect(passwordInput.value).toBe('Temp123!');
  });

  it('toggles theme on login screen and renders authenticated modules and logout', () => {
    authStorage.saveSession({
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
      });

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

describe('App: sesión en memoria (#6)', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
    vi.restoreAllMocks();
  });

  it('al recargar recupera la sesión con la cookie y no muestra el login', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValueOnce({
      accessToken: 'restored',
      user: {
        id: '1',
        userType: 'ADMIN',
        displayName: 'Admin Restaurado',
        roles: ['ADMINISTRADOR'],
        permissions: ['*'],
      },
    });

    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando sesión');
    expect(await screen.findByText('Bienvenido, Admin Restaurado')).toBeInTheDocument();
    expect(authStorage.getSession()?.accessToken).toBe('restored');
    expect(localStorage.getItem('fmat_restaurant_auth_session')).toBeNull();
  });

  it('usa la sesión de otra pestaña sin renovar', async () => {
    const restoreSpy = vi.spyOn(authApi, 'restoreSession');
    vi.mocked(requestSessionFromOtherTabs).mockResolvedValueOnce({
      accessToken: 'from-tab',
      user: { id: '2', userType: 'ADMIN', displayName: 'Admin Pestaña', permissions: ['*'] },
    });

    render(<App />);
    expect(await screen.findByText('Bienvenido, Admin Pestaña')).toBeInTheDocument();
    expect(restoreSpy).not.toHaveBeenCalled();
  });

  it('sin cookie válida muestra el login', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValueOnce(null);
    render(<App />);
    expect(await screen.findByText('Gerente / Admin')).toBeInTheDocument();
  });
});
