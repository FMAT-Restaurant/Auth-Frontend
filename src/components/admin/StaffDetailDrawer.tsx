import React, { useState, useEffect } from 'react';
import { Drawer, Button, Input, Modal, KeyIcon, CopyIcon, TrashIcon, CheckIcon, AlertCircleIcon } from '../ui';
import type { User, RoleDefinition } from '../../types/auth';

export interface StaffDetailDrawerProps {
  isOpen: boolean;
  collaborator: User | null;
  availableRoles: RoleDefinition[];
  onClose: () => void;
  onSave: (id: string, updatedData: { firstName: string; lastName: string; roles: string[]; isActive: boolean }) => Promise<void>;
  onResetPassword: (id: string) => Promise<{ temporaryPassword?: string }>;
  onDelete: (id: string) => Promise<void>;
}

export const StaffDetailDrawer: React.FC<StaffDetailDrawerProps> = ({
  isOpen,
  collaborator,
  availableRoles,
  onClose,
  onSave,
  onResetPassword,
  onDelete,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isStaffIdCopied, setIsStaffIdCopied] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modales de confirmación protegida
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (collaborator) {
      setFirstName(collaborator.firstName || '');
      setLastName(collaborator.lastName || '');
      setSelectedRoles(collaborator.roles || []);
      setIsActive(collaborator.isActive ?? true);
      setTempPassword(collaborator.temporaryPassword || null);
      setSaveSuccessMsg(null);
      setErrorMsg(null);
      setIsCopied(false);
      setIsStaffIdCopied(false);
    }
  }, [collaborator]);

  if (!collaborator) return null;

  const handleToggleRole = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((r) => r !== code)
          : prev
        : [...prev, code],
    );
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleCopyStaffId = () => {
    if (collaborator.staffId) {
      navigator.clipboard.writeText(collaborator.staffId);
      setIsStaffIdCopied(true);
      setTimeout(() => setIsStaffIdCopied(false), 2500);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || selectedRoles.length === 0) {
      setErrorMsg('El nombre, apellidos y al menos un rol son requeridos');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      await onSave(collaborator.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roles: selectedRoles,
        isActive,
      });
      setSaveSuccessMsg('Datos actualizados correctamente');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await onResetPassword(collaborator.id);
      if (res.temporaryPassword) {
        setTempPassword(res.temporaryPassword);
      }
      setShowResetModal(false);
      setSaveSuccessMsg('¡Contraseña temporal restablecida con éxito!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(collaborator.id);
      setShowDeleteModal(false);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar colaborador');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`${collaborator.firstName || ''} ${collaborator.lastName || ''}`.trim() || collaborator.displayName}
        subtitle="Expediente de Personal Operativo"
        width="480px"
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              style={{
                borderColor: 'var(--color-error)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrashIcon size={16} />
              <span>Dar de baja</span>
            </Button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveChanges}
                isLoading={isSaving}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        }
      >
        {/* Banner de mensajes de éxito o error */}
        {saveSuccessMsg && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckIcon size={18} style={{ color: '#10b981' }} />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--color-error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircleIcon size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Identificador y Estado de Cuenta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              Staff ID Operativo
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'monospace' }}>
                {collaborator.staffId}
              </span>
              <button
                type="button"
                onClick={handleCopyStaffId}
                title="Copiar Staff ID"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: isStaffIdCopied ? 'var(--color-primary)' : 'var(--color-muted)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isStaffIdCopied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Estado:</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                color: isActive ? '#059669' : '#6b7280',
                transition: 'all 0.15s ease-in-out',
              }}
            >
              {isActive ? '● Activo' : '○ Inactivo'}
            </button>
          </div>
        </div>

        {/* Tarjeta de Contraseña Temporal o Activa */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-control)',
            backgroundColor: tempPassword ? 'var(--color-surface-elevated)' : 'var(--color-canvas)',
            border: tempPassword ? '1px solid var(--color-border)' : '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyIcon size={18} style={{ color: tempPassword ? 'var(--color-primary)' : '#059669' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {tempPassword ? 'Contraseña Temporal' : 'Contraseña Personalizada'}
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600,
                backgroundColor: tempPassword ? 'rgba(234, 88, 12, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: tempPassword ? 'var(--color-primary)' : '#059669',
              }}
            >
              {tempPassword ? 'Pendiente de cambio' : 'Activa por el usuario'}
            </span>
          </div>

          {tempPassword ? (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Esta contraseña temporal fue generada por el backend. El colaborador aún no la ha reemplazado:
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <code style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '1px' }}>
                  {tempPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  style={{ gap: '6px', padding: '4px 10px' }}
                >
                  {isCopied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  <span>{isCopied ? '¡Copiada!' : 'Copiar clave'}</span>
                </Button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
              El colaborador ya completó su primer inicio de sesión y reemplazó su contraseña temporal. Por privacidad y seguridad criptográfica, esta ya no es visible.
            </p>
          )}

          {/* Botón Protegido para Restablecer Contraseña */}
          <div style={{ paddingTop: '4px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setShowResetModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12px',
              }}
            >
              <KeyIcon size={15} />
              <span>Restablecer nueva contraseña temporal</span>
            </Button>
          </div>
        </div>

        {/* Formulario de Datos Personales */}
        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
            <Input
              label="Nombre(s)"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Carlos"
              required
            />
            <Input
              label="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Gómez"
              required
            />
          </div>

          {/* Selector de Roles Operativos */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
              Roles Operativos Asignados (al menos uno) *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableRoles
                .filter((r) => r.code !== 'ADMINISTRADOR')
                .map((role) => {
                  const isChecked = selectedRoles.includes(role.code);
                  return (
                    <label
                      key={role.code}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-control)',
                        border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isChecked ? 'rgba(234, 88, 12, 0.04)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(role.code)}
                          style={{
                            accentColor: 'var(--color-primary)',
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
                            {role.name}
                          </div>
                          {role.description && (
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {role.code}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Modal Protegido de Restablecimiento de Contraseña */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="¿Restablecer contraseña temporal?"
        maxWidth="440px"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowResetModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isResetting}
              onClick={handleConfirmReset}
            >
              Generar nueva clave
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5, margin: 0 }}>
          Se generará una nueva contraseña temporal aleatoria en el backend para{' '}
          <strong style={{ color: 'var(--color-ink)' }}>
            {collaborator.firstName} {collaborator.lastName} ({collaborator.staffId})
          </strong>.
          <br /><br />
          Esta acción cerrará de inmediato cualquier sesión activa del colaborador y deberás entregarle la nueva contraseña para que vuelva a iniciar sesión.
        </p>
      </Modal>

      {/* Modal Protegido de Eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="¿Dar de baja a este colaborador?"
        maxWidth="440px"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
              style={{ backgroundColor: 'var(--color-error)' }}
            >
              Sí, eliminar definitivamente
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5, margin: 0 }}>
          ¿Estás seguro de que deseas eliminar permanentemente a{' '}
          <strong style={{ color: 'var(--color-ink)' }}>
            {collaborator.firstName} {collaborator.lastName} ({collaborator.staffId})
          </strong>?
          <br /><br />
          Esta acción es <strong style={{ color: 'var(--color-error)' }}>irreversible</strong>. Se eliminarán sus credenciales, perfil y sesiones de la base de datos.
        </p>
      </Modal>
    </>
  );
};
