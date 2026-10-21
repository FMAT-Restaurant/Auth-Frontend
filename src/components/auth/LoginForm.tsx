import React, { useState } from 'react';
import { Button, Input, UserIcon, MailIcon, LockIcon, AlertCircleIcon, Modal, CheckIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { User, AuthSession } from '../../types/auth';

interface LoginFormProps {
  onSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User, token?: string, currentPassword?: string) => void;
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

  // Estado para solicitud de restablecimiento de contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStaffId, setForgotStaffId] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotStaffId.trim()) return;
    setIsSubmittingForgot(true);
    setForgotError(null);
    try {
      const res = await authApi.requestPasswordReset(forgotStaffId.trim());
      setForgotSuccessMsg(res.message || 'Solicitud de cambio de contraseña enviada exitosamente');
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message === 'Failed to fetch' ||
          err.message.toLowerCase().includes('failed to fetch') ||
          err.message.toLowerCase().includes('network') ||
          err.name === 'TypeError')
      ) {
        setForgotError('Estamos teniendo problemas actualmente, intente de nuevo más tarde.');
      } else {
        setForgotError(
          err instanceof Error
            ? err.message
            : 'Estamos teniendo problemas actualmente, intente de nuevo más tarde.',
        );
      }
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanIdentifier = isStaff ? identifier.trim().toUpperCase() : identifier.trim();
      const cleanPassword = password.trim();
      const session = await authApi.login(cleanIdentifier, cleanPassword);
      if (session.user.mustChangePassword) {
        onRequirePasswordChange(session.user, session.accessToken, cleanPassword);
      } else {
        onSuccess(session);
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message === 'Failed to fetch' ||
          err.message.toLowerCase().includes('failed to fetch') ||
          err.message.toLowerCase().includes('network') ||
          err.name === 'TypeError')
      ) {
        setError('Estamos teniendo problemas actualmente, intente de nuevo más tarde.');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Estamos teniendo problemas actualmente, intente de nuevo más tarde.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

      {isStaff && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
          <button
            type="button"
            onClick={() => {
              setForgotStaffId(identifier.trim().toUpperCase());
              setIsForgotModalOpen(true);
              setForgotSuccessMsg(null);
              setForgotError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '2px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      )}

      {forgotSuccessMsg && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#059669',
            borderRadius: 'var(--radius-control)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckIcon size={18} style={{ flexShrink: 0 }} />
          <span>{forgotSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
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

    {/* Modal de Solicitud de Restablecimiento de Contraseña para Staff */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="¿Olvidaste tu contraseña?"
        description="Ingresa tu Staff ID para enviar una solicitud de restablecimiento al Administrador."
        maxWidth="420px"
      >
        <form onSubmit={handleRequestPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {forgotSuccessMsg ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-control)',
                  color: '#059669',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <CheckIcon size={18} />
                <span>{forgotSuccessMsg}</span>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setIsForgotModalOpen(false)}
              >
                Aceptar
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Staff ID / Matrícula"
                placeholder="Ej. M000001"
                value={forgotStaffId}
                onChange={(e) => {
                  setForgotStaffId(e.target.value);
                  if (forgotError) setForgotError(null);
                }}
                required
                leftIcon={<UserIcon size={18} />}
              />
              {forgotError && (
                <div role="alert" style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                  {forgotError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingForgot}
                >
                  Solicitar restablecimiento
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
};
