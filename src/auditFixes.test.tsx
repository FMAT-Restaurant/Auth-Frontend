/**
 * Pruebas de regresión de los hallazgos registrados en QA_AUDIT_LOG.md (21/10/2026).
 * Cada bloque falla con el código anterior a la corrección y pasa con el actual.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from './App';
import { authStorage } from './services/authStorage';
import { authApi } from './services/authApi';
import { AuthCard } from './components/auth/AuthCard';
import { Input } from './components/ui';
import { Sidebar } from './components/layout/Sidebar';
import type { AuthSession, User } from './types/auth';

const adminUser: User = {
  id: 'a1',
  userType: 'ADMIN',
  staffId: 'ADM000001',
  email: 'admin@fmat.com',
  displayName: 'Héctor Pizza',
  roleLabel: 'Administrador',
  roles: ['ADMINISTRADOR'],
  permissions: ['*'],
};

const session: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: adminUser,
};

describe('Correcciones de la auditoría QA', () => {
  beforeEach(() => {
    localStorage.clear();
    authStorage.clearSession();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BUG-SEC-001: sesión expirada', () => {
    it('avisa antes de regresar al login y no expulsa al usuario de golpe', () => {
      authStorage.saveSession(session);
      render(<App />);
      expect(screen.getByText('Bienvenido, Héctor Pizza', { exact: false })).toBeInTheDocument();

      act(() => {
        authStorage.expireSession();
      });

      // La vista sigue montada y aparece el aviso
      expect(screen.getByText('Tu sesión ha expirado')).toBeInTheDocument();
      expect(screen.queryByText('Gerente / Admin')).not.toBeInTheDocument();

      // Los tokens ya no están guardados aunque el aviso siga visible
      expect(authStorage.getSession()).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión de nuevo' }));
      expect(screen.getByText('Gerente / Admin')).toBeInTheDocument();
    });

    it('cuando la renovación del token falla se avisa en lugar de limpiar en silencio', async () => {
      authStorage.saveSession(session);
      const onExpired = vi.fn();
      const unsubscribe = authStorage.onSessionExpired(onExpired);

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 401 }))
        .mockResolvedValueOnce(new Response('', { status: 401 }));

      await expect(authApi.getMe()).rejects.toThrow('Tu sesión ha expirado');
      expect(onExpired).toHaveBeenCalledTimes(1);
      unsubscribe();
    });

    it('conserva el refresh token después de cambiar la contraseña temporal', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ accessToken: 'nuevo-access', refreshToken: 'nuevo-refresh' }), {
          status: 200,
        }),
      );

      const res = await authApi.changeInitialPassword('Temporal123', 'NuevaClave123', 'token');
      expect(res).toEqual({ accessToken: 'nuevo-access', refreshToken: 'nuevo-refresh' });
    });

    it('cerrar sesión con token expirado no dispara refresh ni marca sesión expirada', async () => {
      authStorage.saveSession(session);
      const onExpired = vi.fn();
      const unsubscribe = authStorage.onSessionExpired(onExpired);

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 401 }));

      await authApi.logout('expired-token');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(onExpired).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('después de cerrar sesión e iniciar sesión de nuevo no aparece el modal de sesión expirada', async () => {
      authStorage.saveSession(session);
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.endsWith('/auth/logout')) {
          return Promise.resolve(new Response('', { status: 401 }));
        }
        if (url.endsWith('/auth/setup-status')) {
          return Promise.resolve(new Response(JSON.stringify({ configured: true }), { status: 200 }));
        }
        if (url.endsWith('/auth/login')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                accessToken: 'fresh-access',
                refreshToken: 'fresh-refresh',
                mustChangePassword: false,
                user: {
                  id: 'a1',
                  staffId: 'ADM000001',
                  email: 'admin@fmat.com',
                  roles: ['ADMINISTRADOR'],
                },
              }),
              { status: 200 },
            ),
          );
        }
        return Promise.resolve(new Response('', { status: 404 }));
      });

      render(<App />);
      expect(screen.getByText('Bienvenido, Héctor Pizza', { exact: false })).toBeInTheDocument();

      // Simular cierre de sesión manual cuando el token ya expiró
      await act(async () => {
        fireEvent.click(screen.getByText('Cerrar sesión'));
      });

      // Incluso si un evento tardío intenta expirar la sesión ya cerrada, no debe afectar al próximo login
      act(() => {
        authStorage.expireSession();
      });

      fireEvent.click(screen.getByText('Gerente / Admin'));
      fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
        target: { value: 'admin@fmat.com' },
      });
      fireEvent.change(screen.getByLabelText(/Contraseña/i), {
        target: { value: 'Secret123!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Acceder al Panel Administrativo/i }));
      });

      expect(screen.getByText('Bienvenido, Gerente General', { exact: false })).toBeInTheDocument();
      expect(screen.queryByText('Tu sesión ha expirado')).not.toBeInTheDocument();
      expect(authStorage.getSession()?.accessToken).toBe('fresh-access');
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('BUG-AUTH-002: recuperación de contraseña del administrador', () => {
    it('en la pestaña Gerente / Admin no pide Staff ID', () => {
      vi.spyOn(authApi, 'getSetupStatus').mockResolvedValue({ configured: true });
      render(<AuthCard onLoginSuccess={vi.fn()} onRequirePasswordChange={vi.fn()} />);

      fireEvent.click(screen.getByText('Gerente / Admin'));
      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      expect(screen.queryByLabelText(/Staff ID \/ Matrícula/i)).not.toBeInTheDocument();
      expect(
        screen.getByText(/la contraseña de la cuenta de Administrador no se puede restablecer/i),
      ).toBeInTheDocument();
    });

    it('en la pestaña Personal sigue pidiendo el Staff ID', () => {
      vi.spyOn(authApi, 'getSetupStatus').mockResolvedValue({ configured: true });
      render(<AuthCard onLoginSuccess={vi.fn()} onRequirePasswordChange={vi.fn()} />);

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      expect(screen.getByLabelText(/Staff ID \/ Matrícula/i)).toBeInTheDocument();
    });
  });

  describe('UX-A11Y-004: nombre accesible del botón de perfil', () => {
    it('anuncia la acción y el nombre del usuario', () => {
      render(
        <Sidebar currentUser={adminUser} activeModule="inicio" onSelectModule={vi.fn()} onLogout={vi.fn()} />,
      );
      expect(
        screen.getByRole('button', { name: 'Ver perfil y configuración de Héctor Pizza' }),
      ).toBeInTheDocument();
    });
  });

  describe('UI-FORM-005: estado del botón mostrar/ocultar contraseña', () => {
    it('expone aria-pressed según la visibilidad de la contraseña', () => {
      render(<Input label="Contraseña" isPasswordToggleable />);
      const toggle = screen.getByLabelText('Mostrar clave');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(toggle);
      expect(screen.getByLabelText('Ocultar clave')).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
