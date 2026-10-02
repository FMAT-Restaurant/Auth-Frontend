import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthCard } from './AuthCard';
import { authApi } from '../../services/authApi';

vi.mock('../../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    setupAdmin: vi.fn(),
    getSetupStatus: vi.fn().mockResolvedValue({ configured: false }),
  },
}));

describe('AuthCard Component - Error Presentation & Setup Status UX', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnRequirePasswordChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getSetupStatus).mockResolvedValue({ configured: false });
  });

  describe('LoginForm', () => {
    it('displays backend error message in alert banner above submit button and not inside inputs', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce(
        new Error('Credenciales inválidas o cuenta deshabilitada'),
      );

      const { container } = render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      const idInput = screen.getByLabelText(/Staff ID/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const submitBtn = screen.getByRole('button', { name: /Iniciar Sesión/i });
      const form = container.querySelector('form')!;

      fireEvent.change(idInput, { target: { value: 'M000001' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.submit(form);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Credenciales inválidas o cuenta deshabilitada');
      });

      // Verify the alert is rendered before the submit button in DOM order
      const alert = screen.getByRole('alert');
      expect(alert.compareDocumentPosition(submitBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      // Verify input container does not contain the error text as an input child
      expect(passwordInput.parentElement).not.toHaveTextContent('Credenciales inválidas');
    });

    it('clears error banner when user modifies input fields', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce(
        new Error('Credenciales inválidas'),
      );

      const { container } = render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      const idInput = screen.getByLabelText(/Staff ID/i);
      const passwordInput = screen.getByLabelText(/Contraseña/i);
      const form = container.querySelector('form')!;

      fireEvent.change(idInput, { target: { value: 'M000001' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Typing in password clears the alert
      fireEvent.change(passwordInput, { target: { value: 'newattempt' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('SetupAdminForm - Configured State UX', () => {
    it('displays informational view with solutions when admin is already configured', async () => {
      vi.mocked(authApi.getSetupStatus).mockResolvedValue({ configured: true });

      render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      const setupTab = screen.getByRole('tab', { name: /Registrar Admin/i });
      fireEvent.click(setupTab);

      await waitFor(() => {
        expect(screen.getByText('Ya se configuró un administrador')).toBeInTheDocument();
      });

      // Form inputs should NOT be visible
      expect(screen.queryByLabelText(/Correo electrónico del Administrador/i)).not.toBeInTheDocument();

      // Solutions should be present
      expect(screen.getByText('¿Ya eres el Administrador?')).toBeInTheDocument();
      expect(screen.getByText(/¿Olvidaste tu acceso o necesitas reconfigurar el sistema\?/i)).toBeInTheDocument();
      expect(screen.getByText(/¿Eres Personal Operativo \(Staff\)\?/i)).toBeInTheDocument();

      // Clicking "Ir a Iniciar Sesión" switches to login tab
      const goToLoginBtn = screen.getByRole('button', { name: /Ir a Iniciar Sesión/i });
      fireEvent.click(goToLoginBtn);

      expect(screen.getByLabelText(/Staff ID/i)).toBeInTheDocument();
    });

    it('displays registration form when admin is NOT yet configured', async () => {
      vi.mocked(authApi.getSetupStatus).mockResolvedValue({ configured: false });

      render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      const setupTab = screen.getByRole('tab', { name: /Registrar Admin/i });
      fireEvent.click(setupTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Correo electrónico del Administrador/i)).toBeInTheDocument();
      });
    });

    it('displays backend error message in alert banner above submit button when setup fails', async () => {
      vi.mocked(authApi.setupAdmin).mockRejectedValueOnce(
        new Error('Error de validación del servidor'),
      );

      const { container } = render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      // Switch to setup tab
      const setupTab = screen.getByRole('tab', { name: /Registrar Admin/i });
      fireEvent.click(setupTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Correo electrónico del Administrador/i)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/Nombre\(s\)/i);
      const lastNameInput = screen.getByLabelText(/Apellidos/i);
      const emailInput = screen.getByLabelText(/Correo electrónico del Administrador/i);
      const passwordInput = screen.getByLabelText(/^Contraseña/i);
      const confirmInput = screen.getByLabelText(/Confirmar/i);
      const submitBtn = screen.getByRole('button', { name: /Registrar Administrador/i });
      const form = container.querySelector('form')!;

      fireEvent.change(firstNameInput, { target: { value: 'Roberto' } });
      fireEvent.change(lastNameInput, { target: { value: 'González' } });
      fireEvent.change(emailInput, { target: { value: 'admin@fmat.com' } });
      fireEvent.change(passwordInput, { target: { value: 'AdminPassword123!' } });
      fireEvent.change(confirmInput, { target: { value: 'AdminPassword123!' } });

      fireEvent.submit(form);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Error de validación del servidor');
      });

      const alert = screen.getByRole('alert');
      expect(alert.compareDocumentPosition(submitBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('displays password mismatch error above submit button', async () => {
      const { container } = render(
        <AuthCard
          onLoginSuccess={mockOnLoginSuccess}
          onRequirePasswordChange={mockOnRequirePasswordChange}
        />,
      );

      const setupTab = screen.getByRole('tab', { name: /Registrar Admin/i });
      fireEvent.click(setupTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Correo electrónico del Administrador/i)).toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText(/Nombre\(s\)/i);
      const emailInput = screen.getByLabelText(/Correo electrónico del Administrador/i);
      const passwordInput = screen.getByLabelText(/^Contraseña/i);
      const confirmInput = screen.getByLabelText(/Confirmar/i);
      const submitBtn = screen.getByRole('button', { name: /Registrar Administrador/i });
      const form = container.querySelector('form')!;

      fireEvent.change(firstNameInput, { target: { value: 'Admin' } });
      fireEvent.change(emailInput, { target: { value: 'admin@fmat.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmInput, { target: { value: 'Different123!' } });

      fireEvent.submit(form);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Las contraseñas no coinciden');
      expect(alert.compareDocumentPosition(submitBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
