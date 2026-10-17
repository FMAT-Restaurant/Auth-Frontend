import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StaffDetailDrawer } from './StaffDetailDrawer';
import type { User, RoleDefinition } from '../../types/auth';

const mockCollaborator: User = {
  id: 'c1',
  userType: 'STAFF',
  staffId: 'M000101',
  firstName: 'Carlos',
  lastName: 'Gomez',
  displayName: 'Carlos Gomez',
  roleLabel: 'MESERO',
  roles: ['MESERO', 'HOST'],
  permissions: ['orders:view'],
  isActive: true,
  temporaryPassword: 'TMP-999',
  mustChangePassword: true,
};

const mockRoles: RoleDefinition[] = [
  { code: 'ADMINISTRADOR', name: 'Administrador', permissions: ['*'] },
  { code: 'MESERO', name: 'Mesero', description: 'Atención a mesas', permissions: ['orders:view'] },
  { code: 'HOST', name: 'Host', description: 'Recepción', permissions: ['sala:tables:view'] },
];

describe('StaffDetailDrawer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('returns null when collaborator is null', () => {
    const { container } = render(
      <StaffDetailDrawer
        isOpen={true}
        collaborator={null}
        availableRoles={mockRoles}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders collaborator details, copies staffId and temporary password, and saves changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StaffDetailDrawer
        isOpen={true}
        collaborator={mockCollaborator}
        availableRoles={mockRoles}
        onClose={onClose}
        onSave={onSave}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('M000101')).toBeInTheDocument();
    expect(screen.getByText('TMP-999')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Copiar Staff ID'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('M000101');

    fireEvent.click(screen.getByText('Copiar clave'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TMP-999');

    fireEvent.click(screen.getByText('● Activo'));
    expect(screen.getByText('○ Inactivo')).toBeInTheDocument();

    const hostCheckbox = screen.getByLabelText(/Host/i);
    fireEvent.click(hostCheckbox);

    fireEvent.change(screen.getByLabelText(/Nombre\(s\)/i), { target: { value: '' } });
    fireEvent.click(screen.getByText('Guardar cambios'));
    expect(
      screen.getByText('El nombre, apellidos y al menos un rol son requeridos'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nombre\(s\)/i), { target: { value: 'Carlos Alberto' } });
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('c1', {
        firstName: 'Carlos Alberto',
        lastName: 'Gomez',
        roles: ['MESERO'],
        isActive: false,
      });
      expect(screen.getByText('Datos actualizados correctamente')).toBeInTheDocument();
    });
  });

  it('handles password reset and collaborator deletion modals', async () => {
    const onResetPassword = vi.fn().mockResolvedValue({ temporaryPassword: 'NEW-777' });
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StaffDetailDrawer
        isOpen={true}
        collaborator={{ ...mockCollaborator, temporaryPassword: null }}
        availableRoles={mockRoles}
        onClose={onClose}
        onSave={vi.fn()}
        onResetPassword={onResetPassword}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Contraseña Personalizada')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Restablecer nueva contraseña temporal'));
    expect(screen.getByText('¿Restablecer contraseña temporal?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Generar nueva clave'));
    await waitFor(() => {
      expect(onResetPassword).toHaveBeenCalledWith('c1');
      expect(screen.getByText('NEW-777')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Dar de baja'));
    expect(screen.getByText('¿Dar de baja a este colaborador?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sí, eliminar definitivamente'));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('c1');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
