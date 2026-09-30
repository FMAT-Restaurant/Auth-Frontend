import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  UserIcon,
  StoreIcon,
  MapPinIcon,
  SunIcon,
  MoonIcon,
  TrashIcon,
  AlertCircleIcon,
  CheckIcon,
  LoaderIcon,
  ShieldIcon,
} from '../ui/Icons';
import { authApi } from '../../services/authApi';
import type { User } from '../../types/auth';

interface ProfileSettingsViewProps {
  currentUser: User;
  token?: string;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  token,
  onUpdateUser,
  onLogout,
}) => {
  // Estado de Datos Personales
  const [firstName, setFirstName] = useState(
    currentUser.firstName || currentUser.displayName.split(' ')[0] || '',
  );
  const [lastName, setLastName] = useState(
    currentUser.lastName || currentUser.displayName.split(' ').slice(1).join(' ') || '',
  );
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Estado de Datos del Restaurante (solo Admin)
  const isAdmin = currentUser.userType === 'ADMIN';
  const [restaurantName, setRestaurantName] = useState(currentUser.restaurantName || '');
  const [commercialName, setCommercialName] = useState(
    currentUser.restaurantCommercialName || currentUser.restaurantName || '',
  );
  const [restaurantAddress, setRestaurantAddress] = useState(currentUser.restaurantAddress || '');
  const [isUpdatingRestaurant, setIsUpdatingRestaurant] = useState(false);
  const [restaurantSuccessMsg, setRestaurantSuccessMsg] = useState<string | null>(null);
  const [restaurantErrorMsg, setRestaurantErrorMsg] = useState<string | null>(null);

  // Estado de Apariencia (Modo Oscuro)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('fmat_theme') as 'light' | 'dark') || 'light';
  });

  // Estado de Danger Zone
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sincronizar datos frescos del usuario desde backend
  useEffect(() => {
    if (!token) return;
    authApi
      .getMe(token)
      .then((freshUser) => {
        if (freshUser.firstName) setFirstName(freshUser.firstName);
        if (freshUser.lastName) setLastName(freshUser.lastName);
        if (freshUser.phone) setPhone(freshUser.phone);
        if (freshUser.restaurantName) setRestaurantName(freshUser.restaurantName);
        if (freshUser.restaurantCommercialName)
          setCommercialName(freshUser.restaurantCommercialName);
        if (freshUser.restaurantAddress) setRestaurantAddress(freshUser.restaurantAddress);
        onUpdateUser(freshUser);
      })
      .catch(() => {
        // En caso de error de red, se mantienen los valores locales
      });
  }, [token, onUpdateUser]);

  // Manejar cambio de tema
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('fmat_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  // Guardar datos personales
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setProfileErrorMsg('El nombre y los apellidos son obligatorios');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await authApi.updateProfile(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
        },
        token,
      );

      const updatedUser: User = {
        ...currentUser,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        phone: res.user.phone,
        displayName: res.user.displayName,
      };

      onUpdateUser(updatedUser);
      setProfileSuccessMsg('Tu información personal se ha guardado exitosamente');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setProfileErrorMsg(
        err instanceof Error ? err.message : 'Error al guardar cambios personales',
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Guardar datos del restaurante
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRestaurantErrorMsg(null);
    setRestaurantSuccessMsg(null);

    if (!restaurantName.trim()) {
      setRestaurantErrorMsg('El nombre del restaurante es obligatorio');
      return;
    }

    try {
      setIsUpdatingRestaurant(true);
      const res = await authApi.updateRestaurant(
        {
          name: restaurantName.trim(),
          commercialName: commercialName.trim() || undefined,
          address: restaurantAddress.trim() || undefined,
        },
        token,
      );

      const updatedUser: User = {
        ...currentUser,
        restaurantName: res.restaurant.name,
        restaurantCommercialName: res.restaurant.commercialName,
        restaurantAddress: res.restaurant.address,
      };

      onUpdateUser(updatedUser);
      setRestaurantSuccessMsg('La información del restaurante se ha actualizado exitosamente');
      setTimeout(() => setRestaurantSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setRestaurantErrorMsg(
        err instanceof Error ? err.message : 'Error al actualizar el restaurante',
      );
    } finally {
      setIsUpdatingRestaurant(false);
    }
  };

  // Ejecutar eliminación definitiva de cuenta
  const handleConfirmDelete = async () => {
    if (!token) return;
    setDeleteError(null);

    const requiredKeyword = 'ELIMINAR';
    if (deleteConfirmInput.trim().toUpperCase() !== requiredKeyword) {
      setDeleteError(`Debes escribir exactamente "${requiredKeyword}" para confirmar.`);
      return;
    }

    try {
      setIsDeleting(true);
      await authApi.deleteAccount(token);
      setIsDeleteModalOpen(false);
      onLogout();
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : 'Error al procesar la eliminación de la cuenta',
      );
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Perfil y Configuración
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px', margin: 0 }}>
          Administra tus datos de usuario, la información de tu establecimiento, apariencia y preferencias.
        </p>
      </div>

      {/* SECCIÓN 1: DATOS PERSONALES */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserIcon size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Información Personal
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
              Edita tu nombre y datos de contacto en la plataforma
            </p>
          </div>
        </div>

        {profileSuccessMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-control)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid var(--color-success)',
            }}
          >
            <CheckIcon size={18} />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {profileErrorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-control)',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid var(--color-error)',
            }}
          >
            <AlertCircleIcon size={18} />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Rolando"
              required
            />
            <Input
              label="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Castro Santeliz"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Teléfono / Móvil"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. +52 999 123 4567"
            />
            <Input
              label="Correo electrónico / Identificador"
              value={currentUser.email || currentUser.staffId || ''}
              disabled
              helperText="El identificador principal del sistema no es modificable"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
              Guardar cambios personales
            </Button>
          </div>
        </form>
      </Card>

      {/* SECCIÓN 2: DATOS DEL RESTAURANTE (ADMIN) */}
      {isAdmin && (
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StoreIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Datos del Restaurante
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                Información del establecimiento, razón social y ubicación
              </p>
            </div>
          </div>

          {restaurantSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                borderRadius: 'var(--radius-control)',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid var(--color-success)',
              }}
            >
              <CheckIcon size={18} />
              <span>{restaurantSuccessMsg}</span>
            </div>
          )}

          {restaurantErrorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-control)',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid var(--color-error)',
              }}
            >
              <AlertCircleIcon size={18} />
              <span>{restaurantErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Nombre Oficial / Razón Social"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ej. FMAT Bistro Gourmet"
                required
              />
              <Input
                label="Nombre Comercial"
                value={commercialName}
                onChange={(e) => setCommercialName(e.target.value)}
                placeholder="Ej. Bistro FMAT Centro"
              />
            </div>

            <Input
              label="Ubicación / Dirección"
              value={restaurantAddress}
              onChange={(e) => setRestaurantAddress(e.target.value)}
              placeholder="Ej. Calle 60 #240 x 43 y 45, Centro, Mérida, Yucatán"
              leftIcon={<MapPinIcon size={18} />}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="submit" variant="primary" isLoading={isUpdatingRestaurant}>
                Guardar datos del restaurante
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SECCIÓN 3: APARIENCIA DEL SISTEMA (MODO OSCURO) */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--color-primary-soft)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentTheme === 'dark' ? <MoonIcon size={22} /> : <SunIcon size={22} />}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Apariencia y Tema
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
              Selecciona el estilo visual que prefieras para la interfaz del sistema
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Opción Modo Claro */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-card)',
              border: `2px solid ${currentTheme === 'light' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              backgroundColor: currentTheme === 'light' ? 'var(--color-primary-soft)' : 'var(--color-surface)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: currentTheme === 'light' ? 'var(--color-primary)' : 'var(--color-canvas)',
                color: currentTheme === 'light' ? '#FFFFFF' : 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SunIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
                Modo Claro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Interfaz con fondo brillante y alto contraste
              </div>
            </div>
          </button>

          {/* Opción Modo Oscuro */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-card)',
              border: `2px solid ${currentTheme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              backgroundColor: currentTheme === 'dark' ? 'var(--color-primary-soft)' : 'var(--color-surface)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: currentTheme === 'dark' ? 'var(--color-primary)' : 'var(--color-canvas)',
                color: currentTheme === 'dark' ? '#FFFFFF' : 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MoonIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
                Modo Oscuro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Descanso visual y consumo reducido en entornos oscuros
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* SECCIÓN 4: ZONA DE PELIGRO (DANGER ZONE) */}
      <Card
        padding="lg"
        style={{
          border: '1px solid var(--color-error)',
          backgroundColor: 'var(--color-error-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldIcon size={20} color="var(--color-error)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-error)', margin: 0 }}>
                Zona de Peligro
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0, maxWidth: '580px' }}>
              {isAdmin
                ? 'Eliminar el restaurante borrará de forma permanente el establecimiento, todos los colaboradores asociados, roles e historiales en Neon Database. Esta acción no se puede deshacer.'
                : 'Eliminar tu cuenta operativa revocará tus accesos y credenciales de forma permanente.'}
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setDeleteConfirmInput('');
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            style={{ flexShrink: 0 }}
          >
            <TrashIcon size={16} />
            <span>{isAdmin ? 'Dar de baja restaurante' : 'Eliminar mi cuenta'}</span>
          </Button>
        </div>
      </Card>

      {/* MODAL DE CONFIRMACIÓN DESTRUTIVA */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={isAdmin ? '¿Dar de baja restaurante definitivamente?' : '¿Eliminar cuenta de usuario?'}
        description="Esta acción es completamente irreversible y eliminará todos los registros asociados en la base de datos."
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              disabled={deleteConfirmInput.trim().toUpperCase() !== 'ELIMINAR'}
            >
              {isDeleting ? <LoaderIcon size={16} /> : <TrashIcon size={16} />}
              <span>Confirmar y eliminar</span>
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-error-bg)',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-error)',
              fontSize: '13px',
              color: 'var(--color-error)',
              lineHeight: 1.5,
            }}
          >
            <strong>Advertencia crítica:</strong> Se eliminarán en cascada todos los datos en PostgreSQL Neon.
            Para confirmar, escribe <strong>ELIMINAR</strong> en el siguiente campo:
          </div>

          {deleteError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-error)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <AlertCircleIcon size={16} />
              <span>{deleteError}</span>
            </div>
          )}

          <Input
            label='Escribe "ELIMINAR" para confirmar'
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            placeholder="ELIMINAR"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};
