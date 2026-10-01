import React, { useState } from 'react';
import { Button, Input, BuildingIcon, MailIcon, LockIcon, UserIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { AuthSession } from '../../types/auth';

interface RegisterRestaurantFormProps {
  onSuccess: (session: AuthSession) => void;
}

export const RegisterRestaurantForm: React.FC<RegisterRestaurantFormProps> = ({ onSuccess }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
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

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const session = await authApi.registerRestaurant({
        restaurantName,
        email,
        password,
        address: address || undefined,
      });

      if (managerName.trim()) {
        session.user.displayName = managerName.trim();
      }

      onSuccess(session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar restaurante');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Input
        label="Nombre del restaurante"
        placeholder="Ej. La Trattoria FMAT"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        required
        leftIcon={<BuildingIcon size={18} />}
      />

      <Input
        label="Dirección o sucursal (opcional)"
        placeholder="Ej. Calle 60 #123, Mérida, Yucatán"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <Input
        label="Nombre del gerente o dueño"
        placeholder="Ej. Carlos Mendoza"
        value={managerName}
        onChange={(e) => setManagerName(e.target.value)}
        leftIcon={<UserIcon size={18} />}
      />

      <Input
        label="Correo del Administrador"
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
          placeholder="Mínimo 6 caracteres"
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
          Crear cuenta y restaurante
        </Button>
      </div>
    </form>
  );
};
