import React, { useState } from 'react';
import { Button, Input, MailIcon, LockIcon, UserIcon, AlertCircleIcon, ShieldIcon, LoaderIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { AuthSession } from '../../types/auth';

export interface SetupAdminFormProps {
  onSuccess: (session: AuthSession) => void;
  isConfigured?: boolean;
  onSwitchToLogin?: () => void;
  onRefreshStatus?: () => void;
  isLoadingStatus?: boolean;
}

export const SetupAdminForm: React.FC<SetupAdminFormProps> = ({
  onSuccess,
  isConfigured = false,
  onSwitchToLogin,
  onRefreshStatus,
  isLoadingStatus = false,
}) => {
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

  // Estado: Verificando estado inicial
  if (isLoadingStatus) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: '12px' }}>
        <LoaderIcon size={24} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Verificando estado de configuración...</span>
      </div>
    );
  }

  // Estado: Administrador ya registrado (Mejora UX/UI solicitada)
  if (isConfigured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px 0' }}>
        {/* Banner principal informativo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--color-primary-soft)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid #FED7AA',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <ShieldIcon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Ya se configuró un administrador
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '4px 0 0', lineHeight: 1.45 }}>
              Esta instalación local ya cuenta con un Administrador Principal activo. No es posible crear una cuenta administrativa adicional.
            </p>
          </div>
        </div>

        {/* Sección de Soluciones y Casos de Uso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Solución 1: Iniciar Sesión */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)', marginBottom: '4px' }}>
              ¿Ya eres el Administrador?
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
              Ingresa al panel general con tu correo electrónico y clave desde la pestaña de inicio de sesión.
            </p>
            {onSwitchToLogin && (
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={onSwitchToLogin}
              >
                Ir a Iniciar Sesión
              </Button>
            )}
          </div>

          {/* Solución 2: ¿Olvidaste tu contraseña o necesitas reconfigurar? */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)', marginBottom: '4px' }}>
              ¿Olvidaste tu acceso o necesitas reconfigurar el sistema?
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
              Por la seguridad de la sucursal, la cuenta de administrador no puede reiniciarse públicamente. Para registrar un nuevo administrador, el titular debe eliminar su cuenta desde su perfil o solicitar un reseteo de la base de datos local a TI / Soporte.
            </p>
          </div>

          {/* Solución 3: Personal operativo */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--color-canvas)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-ink)', marginBottom: '4px' }}>
              ¿Eres Personal Operativo (Staff)?
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
              Las cuentas del personal no se registran aquí. Tu gerente debe darte de alta desde el módulo de Personal y asignarte tu <strong>Staff ID</strong> con una contraseña temporal.
            </p>
          </div>
        </div>

        {/* Botón de verificación */}
        {onRefreshStatus && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefreshStatus}
            fullWidth
          >
            Comprobar estado nuevamente
          </Button>
        )}
      </div>
    );
  }

  // Estado: Administrador NO configurado (Formulario normal de configuración inicial)
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
