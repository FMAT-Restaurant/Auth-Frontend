import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Modal, AlertCircleIcon, CheckIcon, TrashIcon, ShieldIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { RoleDefinition, ServicePermissionGroup } from '../../types/auth';

interface RolesManagementViewProps {
  token?: string;
  onRolesChanged?: () => void;
}

export const RolesManagementView: React.FC<RolesManagementViewProps> = ({
  token,
  onRolesChanged,
}) => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [catalog, setCatalog] = useState<ServicePermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Modal para crear rol
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal para eliminar rol
  const [roleToDelete, setRoleToDelete] = useState<RoleDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedRoles, fetchedCatalog] = await Promise.all([
        authApi.getRoles(token),
        authApi.getPermissionsCatalog(token),
      ]);
      setRoles(fetchedRoles);
      setCatalog(fetchedCatalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar catálogo de roles y permisos');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleToggleAllServicePermissions = (serviceKey: string) => {
    const group = catalog.find((g) => g.serviceKey === serviceKey);
    if (!group) return;

    const groupCodes = group.permissions.map((p) => p.code);
    const allSelected = groupCodes.every((c) => selectedPermissions.includes(c));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !groupCodes.includes(c)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupCodes])));
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim() || selectedPermissions.length === 0) {
      setError('Debes ingresar un nombre y seleccionar al menos un permiso');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authApi.createRole(
        {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          permissions: selectedPermissions,
        },
        token,
      );

      setSuccessBanner(`Rol '${roleName.trim()}' creado exitosamente`);
      setTimeout(() => setSuccessBanner(null), 3500);

      setShowCreateModal(false);
      setRoleName('');
      setRoleDescription('');
      setSelectedPermissions([]);

      await loadData();
      if (onRolesChanged) onRolesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar rol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await authApi.deleteRole(roleToDelete.code, token);
      setSuccessBanner(`Rol '${roleToDelete.name}' eliminado exitosamente`);
      setTimeout(() => setSuccessBanner(null), 3500);
      setRoleToDelete(null);
      await loadData();
      if (onRolesChanged) onRolesChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar rol');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
            Roles y Permisos por Microservicio
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: '4px 0 0' }}>
            Gestiona los roles del sistema y asigna permisos granulares sobre cada microservicio de FMAT Restaurant.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
        >
          + Crear Nuevo Rol
        </Button>
      </div>

      {/* Alertas */}
      {successBanner && (
        <div
          style={{
            padding: '12px 16px',
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
          <span>{successBanner}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
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
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Roles */}
      {isLoading ? (
        <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          Cargando catálogo de roles...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {roles.map((role) => (
            <Card key={role.code} padding="md" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                      {role.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 600,
                        backgroundColor: role.isSystemRole ? 'rgba(107, 114, 128, 0.15)' : 'rgba(234, 88, 12, 0.15)',
                        color: role.isSystemRole ? 'var(--color-muted)' : 'var(--color-primary)',
                      }}
                    >
                      {role.isSystemRole ? 'Sistema' : 'Personalizado'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                    {role.code}
                  </div>
                </div>

                {!role.isSystemRole && (
                  <button
                    type="button"
                    onClick={() => setRoleToDelete(role)}
                    title="Eliminar rol personalizado"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-muted)',
                      padding: '4px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>

              {role.description && (
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
                  {role.description}
                </p>
              )}

              {/* Lista de permisos asignados */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '8px' }}>
                  Permisos incluidos ({role.permissions?.includes('*') ? 'Acceso Total (*)' : role.permissions?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {role.permissions?.includes('*') ? (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: 'rgba(234, 88, 12, 0.15)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <ShieldIcon size={12} />
                      Control Total del Sistema (*)
                    </span>
                  ) : (
                    (role.permissions || []).map((perm) => (
                      <span
                        key={perm}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          backgroundColor: 'var(--color-surface-elevated)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-ink)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {perm}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Crear Nuevo Rol */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Rol Operativo"
        maxWidth="640px"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCreateRole}
              isLoading={isSubmitting}
            >
              Guardar Rol
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Nombre del Rol"
            placeholder="Ej. Barista de Turno"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            required
          />

          <Input
            label="Descripción del Rol (opcional)"
            placeholder="Ej. Encargado de preparación de café y bebidas especiales"
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
          />

          {/* Catálogo de permisos por microservicio */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
              Permisos por Microservicio (selecciona los accesos autorizados) *
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
              {catalog.map((group) => {
                const groupCodes = group.permissions.map((p) => p.code);
                const allSelected = groupCodes.every((c) => selectedPermissions.includes(c));

                return (
                  <div
                    key={group.serviceKey}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-control)',
                      padding: '12px 14px',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {group.serviceName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleAllServicePermissions(group.serviceKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isChecked ? 'rgba(234, 88, 12, 0.05)' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.code)}
                              style={{
                                accentColor: 'var(--color-primary)',
                                width: '15px',
                                height: '15px',
                                marginTop: '2px',
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                                {perm.label}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.3 }}>
                                {perm.description}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar eliminación de rol */}
      <Modal
        isOpen={Boolean(roleToDelete)}
        onClose={() => setRoleToDelete(null)}
        title="¿Eliminar rol personalizado?"
        maxWidth="440px"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setRoleToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isDeleting}
              onClick={handleDeleteRole}
              style={{ backgroundColor: 'var(--color-error)' }}
            >
              Eliminar rol
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>
          ¿Estás seguro de que deseas eliminar el rol{' '}
          <strong style={{ color: 'var(--color-ink)' }}>{roleToDelete?.name}</strong>?
          <br /><br />
          Los colaboradores que tengan asignado este rol deberán contar con otro rol operativo para continuar accediendo al sistema.
        </p>
      </Modal>
    </div>
  );
};
