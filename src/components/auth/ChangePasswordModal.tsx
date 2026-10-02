import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, LockIcon, ShieldIcon, AlertCircleIcon } from '../ui';
import { authApi } from '../../services/authApi';
import { authStorage } from '../../services/authStorage';
import type { User } from '../../types/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  user: User | null;
  token?: string;
  initialCurrentPassword?: string;
  onSuccess: (newToken?: string) => void;
  onCancel: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  user,
  token,
  initialCurrentPassword,
  onSuccess,
  onCancel,
}) => {
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCurrentPassword) {
      setCurrentPassword(initialCurrentPassword);
    }
  }, [initialCurrentPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanNew.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setError('La nueva contraseña no puede ser igual a la clave temporal');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    const activeToken = token || authStorage.getSession()?.accessToken;

    if (!activeToken) {
      setError('No se encontró el token de sesión activa. Por favor, vuelve a iniciar sesión.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.changeInitialPassword(cleanCurrent, cleanNew, activeToken);
      onSuccess(res.accessToken);
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
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError(null);
          }}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
        />

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-control)',
              fontSize: '13px',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            <AlertCircleIcon size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
};
