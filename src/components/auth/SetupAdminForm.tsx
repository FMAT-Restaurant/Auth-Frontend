import React, { useState } from 'react';
import { Button, Input, MailIcon, LockIcon, UserIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { AuthSession } from '../../types/auth';

interface SetupAdminFormProps {
  onSuccess: (session: AuthSession) => void;
}

export const SetupAdminForm: React.FC<SetupAdminFormProps> = ({ onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
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

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const session = await authApi.setupAdmin({
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      onSuccess(session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al configurar administrador');
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
          onChange={(e) => setFirstName(e.target.value)}
          required
          leftIcon={<UserIcon size={18} />}
        />

        <Input
          label="Apellidos"
          placeholder="Ej. González"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          leftIcon={<UserIcon size={18} />}
        />
      </div>

      <Input
        label="Teléfono (opcional)"
        placeholder="Ej. +52 999 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Input
        label="Correo electrónico del Administrador"
        type="email"
        placeholder="admin@restaurante.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        leftIcon={<MailIcon size={18} />}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
        />

        <Input
          label="Confirmar"
          type="password"
          placeholder="Repite la clave"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          isPasswordToggleable
          leftIcon={<LockIcon size={18} />}
          error={error || undefined}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
        >
          Configurar Administrador Inicial
        </Button>
      </div>
    </form>
  );
};
