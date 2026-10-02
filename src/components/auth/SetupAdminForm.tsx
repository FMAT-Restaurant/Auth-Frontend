import React, { useState } from 'react';
import { Button, Input, MailIcon, LockIcon, UserIcon, AlertCircleIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { AuthSession } from '../../types/auth';

interface SetupAdminFormProps {
  onSuccess: (session: AuthSession) => void;
}

export const SetupAdminForm: React.FC<SetupAdminFormProps> = ({ onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const session = await authApi.setupAdmin({
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      onSuccess(session);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al registrar administrador');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Nombre(s)"
          placeholder="Ej. Roberto"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            if (error) setError(null);
          }}
          required
          leftIcon={<UserIcon size={18} />}
        />

        <Input
          label="Apellidos"
          placeholder="Ej. González"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            if (error) setError(null);
          }}
          required
          leftIcon={<UserIcon size={18} />}
        />
      </div>

      <Input
        label="Correo electrónico del Administrador"
        type="email"
        placeholder="admin@restaurante.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        required
        leftIcon={<MailIcon size={18} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
        />

        <Input
          label="Confirmar"
          type="password"
          placeholder="Repite la clave"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError(null);
          }}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
        />
      </div>

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

      <div style={{ marginTop: '4px' }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Registrar Administrador
        </Button>
      </div>
    </form>
  );
};
