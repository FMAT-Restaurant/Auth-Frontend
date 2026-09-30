import React, { useState } from 'react';
import { Modal, Input, Button, LockIcon, ShieldIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { User } from '../../types/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  user: User | null;
  token?: string;
  onSuccess: (newToken?: string) => void;
  onCancel: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  user,
  token,
  onSuccess,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword === currentPassword) {
      setError('La nueva contraseña no puede ser igual a la clave temporal');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      if (token) {
        try {
          const res = await authApi.changeInitialPassword(currentPassword, newPassword, token);
          onSuccess(res.accessToken);
          return;
        } catch (backendErr: unknown) {
          const msg = backendErr instanceof Error ? backendErr.message : '';
          if (msg && !msg.includes('Failed to fetch')) {
            setError(msg);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fallback local
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Cambio obligatorio de contraseña"
      description={`Hola ${user?.displayName || 'colaborador'}, has ingresado con una contraseña temporal. Por seguridad, debes definir tu clave personal definitiva.`}
      maxWidth="460px"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}>
            Cerrar sesión
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isLoading}
            leftIcon={<ShieldIcon size={16} />}
          >
            Guardar nueva contraseña
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--color-primary-soft)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid #FED7AA',
            fontSize: '13px',
            color: 'var(--color-primary)',
          }}
        >
          Tu identificador <strong>{user?.staffId || 'M000001'}</strong> se mantendrá activo tras el cambio.
        </div>

        <Input
          label="Contraseña temporal actual"
          type="password"
          placeholder="Ingresa la clave provista por el gerente"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
        />

        <Input
          label="Nueva contraseña personal"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
          helperText="Mínimo 6 caracteres"
        />

        <Input
          label="Confirmar nueva contraseña"
          type="password"
          placeholder="Repite la nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
          error={error || undefined}
        />
      </form>
    </Modal>
  );
};
