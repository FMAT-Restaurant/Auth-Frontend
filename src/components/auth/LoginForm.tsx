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

  const fillQuickCredentials = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setIsStaff(false);
      setIdentifier('admin@fmat.com');
      setPassword('Admin123!');
    } else {
      setIsStaff(true);
      setIdentifier('M000001');
      setPassword('Temp1234!');
    }
    setError(null);
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
          helperText="Código emitido por tu administrador (ej. M000001, H000001)"
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
          helperText="Correo corporativo del dueño o gerente"
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

      {/* Acceso Rápido para Pruebas / Demos */}
      <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
          Atajos de credenciales (clic para autocompletar):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fillQuickCredentials('admin')}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              textAlign: 'left',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-canvas)',
              cursor: 'pointer',
            }}
          >
            <strong>👑 Admin</strong>
            <span style={{ display: 'block', color: 'var(--color-muted)' }}>admin@fmat.com</span>
          </button>
          <button
            type="button"
            onClick={() => fillQuickCredentials('staff')}
            style={{
              padding: '6px 8px',
              fontSize: '11px',
              textAlign: 'left',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-canvas)',
              cursor: 'pointer',
            }}
          >
            <strong>🧑‍🍳 Personal</strong>
            <span style={{ display: 'block', color: 'var(--color-muted)' }}>M000001 (Temp)</span>
          </button>
        </div>
      </div>
    </form>
  );
};
