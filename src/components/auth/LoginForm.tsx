import React, { useState } from 'react';
import { Button, Input, UserIcon, MailIcon, LockIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { User, AuthSession } from '../../types/auth';

interface LoginFormProps {
  onSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRequirePasswordChange,
}) => {
  const [isStaff, setIsStaff] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const session = await authApi.login(identifier, password);
      if (session.user.mustChangePassword) {
        onRequirePasswordChange(session.user);
      } else {
        onSuccess(session);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Selector de Modo: Personal vs Gerente */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#F3F4F6',
          padding: '4px',
          borderRadius: 'var(--radius-control)',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setIsStaff(true);
            setError(null);
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: isStaff ? 600 : 500,
            color: isStaff ? 'var(--color-primary)' : 'var(--color-muted)',
            backgroundColor: isStaff ? '#FFFFFF' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: isStaff ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          Personal (Staff ID)
        </button>

        <button
          type="button"
          onClick={() => {
            setIsStaff(false);
            setError(null);
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: !isStaff ? 600 : 500,
            color: !isStaff ? 'var(--color-primary)' : 'var(--color-muted)',
            backgroundColor: !isStaff ? '#FFFFFF' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: !isStaff ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          Gerente / Admin
        </button>
      </div>

      {isStaff ? (
        <Input
          label="Staff ID"
          type="text"
          placeholder="Ej. M000001"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
          required
          leftIcon={<UserIcon size={18} />}
        />
      ) : (
        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="admin@fmat.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          leftIcon={<MailIcon size={18} />}
        />
      )}

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        isPasswordToggleable
        leftIcon={<LockIcon size={18} />}
        error={error || undefined}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {isStaff ? 'Iniciar Sesión' : 'Acceder al Panel Administrativo'}
      </Button>
    </form>
  );
};
