import React, { useState } from 'react';
import { Button, Input, UserIcon, MailIcon, LockIcon, AlertCircleIcon } from '../ui';
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
      if (err instanceof Error && err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor de autenticación');
      }
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
          backgroundColor: 'var(--color-surface-elevated)',
          padding: '4px',
          borderRadius: 'var(--radius-control)',
          gap: '4px',
          border: '1px solid var(--color-border)',
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
            color: isStaff ? 'var(--color-ink)' : 'var(--color-muted)',
            backgroundColor: isStaff ? 'var(--color-surface)' : 'transparent',
            border: isStaff ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: isStaff ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.15s ease-in-out',
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
            color: !isStaff ? 'var(--color-ink)' : 'var(--color-muted)',
            backgroundColor: !isStaff ? 'var(--color-surface)' : 'transparent',
            border: !isStaff ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            boxShadow: !isStaff ? 'var(--shadow-card)' : 'none',
            transition: 'all 0.15s ease-in-out',
          }}
        >
          Gerente / Admin
        </button>
      </div>

      {isStaff ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Input
            label="Staff ID"
            type="text"
            placeholder="Ej. M000001"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            required
            leftIcon={<UserIcon size={18} />}
          />
          {identifier.includes('@') && (
            <button
              type="button"
              onClick={() => setIsStaff(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '12px',
                textAlign: 'left',
                padding: '2px 4px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              💡 Parece un correo electrónico. Cambiar a Gerente / Admin
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="admin@fmat.com"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            required
            leftIcon={<MailIcon size={18} />}
          />
          {/^[A-Za-z]\d{5,7}$/.test(identifier.trim()) && (
            <button
              type="button"
              onClick={() => setIsStaff(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '12px',
                textAlign: 'left',
                padding: '2px 4px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              💡 Parece un Staff ID ({identifier.trim().toUpperCase()}). Cambiar a modo Personal
            </button>
          )}
        </div>
      )}

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••••••"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
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
            color: 'var(--color-error)',
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
