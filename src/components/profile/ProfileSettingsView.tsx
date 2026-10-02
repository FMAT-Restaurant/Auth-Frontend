import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  UserIcon,
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
  const isAdmin =
    currentUser.userType === 'ADMIN' ||
    (currentUser.roles && currentUser.roles.includes('ADMINISTRADOR')) ||
    (currentUser.roleLabel && currentUser.roleLabel.toLowerCase().includes('admin'));

  // Estado de Datos Personales
  const [firstName, setFirstName] = useState(
    currentUser.firstName || currentUser.displayName.split(' ')[0] || '',
  );
  const [lastName, setLastName] = useState(
    currentUser.lastName || currentUser.displayName.split(' ').slice(1).join(' ') || '',
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Estado de Apariencia (Modo Oscuro)
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('fmat_theme') as 'light' | 'dark') || 'light';
  });

  // Estado de Danger Zone
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Referencias para evitar sobreescritura cuando el usuario está editando
  const isDirtyRef = useRef({
    firstName: false,
    lastName: false,
  });

  const onUpdateUserRef = useRef(onUpdateUser);
  useEffect(() => {
    onUpdateUserRef.current = onUpdateUser;
  });

  const hasLoadedRef = useRef(false);

  // Sincronizar datos frescos del usuario desde backend solo una vez al montar
  useEffect(() => {
    if (hasLoadedRef.current || !token) return;
    hasLoadedRef.current = true;

    authApi
      .getMe(token)
      .then((freshUser) => {
        if (!isDirtyRef.current.firstName && freshUser.firstName) setFirstName(freshUser.firstName);
        if (!isDirtyRef.current.lastName && freshUser.lastName) setLastName(freshUser.lastName);
        onUpdateUserRef.current(freshUser);
      })
      .catch(() => {
        // En caso de error de red, se mantienen los valores locales
      });
  }, [token]);

  // Manejar cambio de tema
  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    localStorage.setItem('fmat_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const getFriendlyErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) {
      if (err.message === 'Unauthorized' || err.message.toLowerCase().includes('unauthorized')) {
        return 'Tu sesión ha expirado o no tienes permisos suficientes. Por favor, vuelve a iniciar sesión.';
      }
      return err.message;
    }
    return defaultMessage;
  };

  // Guardar datos personales (solo Administrador)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileErrorMsg(null);

    if (!isAdmin) {
      setProfileErrorMsg('Solo el Administrador tiene permisos para editar información de perfil.');
      return;
    }

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
        },
        token,
      );

      const updatedUser: User = {
        ...currentUser,
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        displayName: res.user.displayName,
      };

      onUpdateUser(updatedUser);
      setIsProfileSaved(true);
      setTimeout(() => setIsProfileSaved(false), 3500);
    } catch (err: unknown) {
      setProfileErrorMsg(
        getFriendlyErrorMessage(err, 'Error al guardar cambios personales'),
      );
    } finally {
      setIsUpdatingProfile(false);
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
        getFriendlyErrorMessage(err, 'Error al procesar la eliminación de la cuenta'),
      );
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--color-ink)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Perfil y Configuración
        </h1>
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
              flexShrink: 0,
            }}
          >
            <UserIcon size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Información Personal
            </h2>
          </div>
        </div>

        {/* Notificación informativa para personal operativo */}
        {!isAdmin && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: 'var(--color-primary-soft)',
              color: 'var(--color-ink)',
              borderRadius: 'var(--radius-control)',
              fontSize: '13px',
              border: '1px solid var(--color-border)',
            }}
          >
            <AlertCircleIcon size={18} color="var(--color-primary)" />
            <span>
              <strong>Modo de solo lectura:</strong> Los datos del personal operativo solo pueden ser modificados por el Administrador del restaurante.
            </span>
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
          <div className="fmat-grid-2">
            <Input
              label="Nombre"
              value={firstName}
              onChange={(e) => {
                isDirtyRef.current.firstName = true;
                setFirstName(e.target.value);
                setIsProfileSaved(false);
              }}
              placeholder="Ej. Roberto"
              disabled={!isAdmin}
              required
            />
            <Input
              label="Apellidos"
              value={lastName}
              onChange={(e) => {
                isDirtyRef.current.lastName = true;
                setLastName(e.target.value);
                setIsProfileSaved(false);
              }}
              placeholder="Ej. Castro"
              disabled={!isAdmin}
              required
            />
          </div>

          <div>
            <Input
              label="Correo electrónico / Identificador"
              value={currentUser.email || currentUser.staffId || ''}
              disabled
              helperText="El identificador principal del sistema no es modificable"
            />
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px', minHeight: '40px' }}>
              {isProfileSaved ? (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    userSelect: 'none',
                  }}
                >
                  <CheckIcon size={16} /> Guardado
                </span>
              ) : (
                <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
                  Guardar cambios personales
                </Button>
              )}
            </div>
          )}
        </form>
      </Card>

      {/* SECCIÓN 2: APARIENCIA DEL SISTEMA (MODO OSCURO) */}
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
              flexShrink: 0,
            }}
          >
            {currentTheme === 'dark' ? <MoonIcon size={22} /> : <SunIcon size={22} />}
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              Apariencia y Tema
            </h2>
          </div>
        </div>

        <div className="fmat-grid-2">
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
                flexShrink: 0,
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
                flexShrink: 0,
              }}
            >
              <MoonIcon size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)' }}>
                Modo Oscuro
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Obsidian cálido, acentos cobre quemado y alto contraste
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* SECCIÓN 3: ZONA DE PELIGRO (DANGER ZONE) */}
      <Card
        padding="lg"
        style={{
          border: '1px solid var(--color-error)',
          backgroundColor: 'var(--color-error-bg)',
        }}
      >
        <div className="fmat-danger-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldIcon size={20} color="var(--color-error)" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-error)', margin: 0 }}>
                Zona de Peligro
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0, maxWidth: '560px', lineHeight: 1.5 }}>
              Eliminar tu cuenta operativa revocará tus accesos y credenciales. Esta acción es irreversible.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            leftIcon={<TrashIcon size={16} />}
            onClick={() => {
              setDeleteConfirmInput('');
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Eliminar mi cuenta
          </Button>
        </div>
      </Card>

      {/* MODAL DE CONFIRMACIÓN DESTRUTIVA */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="¿Eliminar cuenta de usuario definitivamente?"
        description="Esta acción es completamente irreversible y eliminará todos los registros asociados en la base de datos."
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%', flexWrap: 'wrap' }}>
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
              leftIcon={isDeleting ? <LoaderIcon size={16} /> : <TrashIcon size={16} />}
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              disabled={deleteConfirmInput.trim().toUpperCase() !== 'ELIMINAR'}
            >
              Confirmar y eliminar
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
            <strong>Advertencia crítica:</strong> Se eliminarán todos los datos de la base de datos registrados a esta cuenta.
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
