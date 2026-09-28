import React, { useState } from 'react';
import { Button, Input, UserIcon, MailIcon, LockIcon } from '../ui';
import type { User, AuthSession } from '../../types/auth';

interface LoginFormProps {
  onSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRequirePasswordChange,
}) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Mock / Simulación para desarrollo autónomo del Frontend (Sprint 1)
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (isAdminMode) {
        if (!identifier.includes('@')) {
          setError('Introduce un correo electrónico válido');
          setIsLoading(false);
          return;
        }

        const adminSession: AuthSession = {
          accessToken: 'mock_jwt_admin_token',
          user: {
            id: 'usr_admin_001',
            restaurantId: 'rest_demo_fmat',
            userType: 'ADMIN',
            email: identifier,
            displayName: 'Gerente General',
            permissions: ['*'],
            mustChangePassword: false,
          },
        };
        onSuccess(adminSession);
      } else {
        // Validación de formato Staff ID E000000
        const staffIdRegex = /^[A-Z][0-9]{6}$/;
        const upperStaffId = identifier.trim().toUpperCase();

        if (!staffIdRegex.test(upperStaffId)) {
          setError('El identificador debe tener formato E000001 (1 letra y 6 números)');
          setIsLoading(false);
          return;
        }

        // Si la contraseña contiene "temp", simulamos que requiere cambio obligatorio
        const isTemporary = password.toLowerCase().includes('temp') || password === '123456';

        const staffUser: User = {
          id: 'usr_staff_104',
          restaurantId: 'rest_demo_fmat',
          userType: 'STAFF',
          staffId: upperStaffId,
          displayName: 'Juan Pérez',
          roleLabel: 'Líder de inventario',
          permissions: [
            'inventory:view',
            'inventory:ingredients:create',
            'inventory:ingredients:delete',
            'inventory:stock:update_status',
          ],
          mustChangePassword: isTemporary,
        };

        if (isTemporary) {
          onRequirePasswordChange(staffUser);
        } else {
          onSuccess({
            accessToken: 'mock_jwt_staff_token',
            user: staffUser,
          });
        }
      }
    } catch {
      setError('Ocurrió un error al intentar iniciar sesión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isAdminMode ? (
        <Input
          label="Correo corporativo del administrador"
          type="email"
          placeholder="ejemplo@restaurante.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          leftIcon={<MailIcon size={18} />}
          helperText="Cuenta de administración registrada por el dueño"
        />
      ) : (
        <Input
          label="Identificador de personal (Staff ID)"
          type="text"
          placeholder="E000104"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
          required
          maxLength={7}
          leftIcon={<UserIcon size={18} />}
          helperText="Código de 7 caracteres proporcionado por tu gerente"
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

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <button
          type="button"
          onClick={() => {
            setIsAdminMode(!isAdminMode);
            setError(null);
            setIdentifier('');
            setPassword('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'underline',
          }}
        >
          {isAdminMode
            ? '← ¿Eres personal operativo? Ingresa con tu Staff ID'
            : '¿Eres administrador? Inicia sesión con correo corporativo →'}
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
      >
        {isAdminMode ? 'Acceder al Panel Administrativo' : 'Iniciar sesión'}
      </Button>

      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          Tip de prueba: Usa contraseña <strong>"123456"</strong> para probar el modal de cambio forzoso.
        </span>
      </div>
    </form>
  );
};
