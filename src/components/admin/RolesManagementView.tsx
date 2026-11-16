import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button, Input, Modal, AlertCircleIcon, CheckIcon, TrashIcon, ShieldIcon } from '../ui';
import { authApi } from '../../services/authApi';
import type { RoleDefinition, ServicePermissionGroup } from '../../types/auth';
import { PermissionsCatalogPicker } from './PermissionsCatalogPicker';
import { buildPermissionLookup } from './permissionsCatalogUtils';
import { RoleDetailDrawer } from './RoleDetailDrawer';

interface RolesManagementViewProps {
  token?: string;
  onRolesChanged?: () => void;
}

function roleMatchesService(role: RoleDefinition, serviceKey: string): boolean {
  if (serviceKey === 'all') return true;
  const perms = role.permissions || [];
  return perms.includes('*') || perms.some((p) => p.startsWith(`${serviceKey}:`));
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

  // Filtros de la lista de roles
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer de detalle / edición de rol
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);

  // Modal para crear rol
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal para eliminar rol
  const [roleToDelete, setRoleToDelete] = useState<RoleDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const permissionLookup = useMemo(() => buildPermissionLookup(catalog), [catalog]);

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
    void loadData();
  }, [loadData]);

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return roles.filter((role) => {
      if (!roleMatchesService(role, selectedServiceFilter)) {
        return false;
      }

      if (!query) return true;

      if (
        role.name.toLowerCase().includes(query) ||
        role.code.toLowerCase().includes(query) ||
        (role.description && role.description.toLowerCase().includes(query))
      ) {
        return true;
      }

      return (role.permissions || []).some((permCode) => {
        if (permCode.toLowerCase().includes(query)) return true;
        const meta = permissionLookup.get(permCode);
        if (!meta) return false;
        return (
          meta.label.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query) ||
          meta.serviceName.toLowerCase().includes(query)
        );
      });
    });
  }, [roles, selectedServiceFilter, searchQuery, permissionLookup]);

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

  const handleUpdateRole = async (
    code: string,
    payload: { name?: string; description?: string; permissions?: string[] },
  ) => {
    const updated = await authApi.updateRole(code, payload, token);
    setRoles((prev) => prev.map((r) => (r.code === code ? updated : r)));
    setSelectedRole(updated);
    setSuccessBanner(`Rol '${updated.name}' actualizado exitosamente`);
    setTimeout(() => setSuccessBanner(null), 3500);
    if (onRolesChanged) onRolesChanged();
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await authApi.deleteRole(roleToDelete.code, token);
      setSuccessBanner(`Rol '${roleToDelete.name}' eliminado exitosamente`);
      setTimeout(() => setSuccessBanner(null), 3500);
      if (selectedRole?.code === roleToDelete.code) {
        setSelectedRole(null);
      }
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

      {/* Contenido principal: Sidebar de filtro + Grid de Roles */}
      {isLoading ? (
        <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
          Cargando catálogo de roles...
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Sidebar izquierda de filtro por microservicio */}
          <aside
            aria-label="Filtrar roles por microservicio"
            style={{
              width: '240px',
              flexShrink: 0,
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--color-muted)',
                padding: '4px 8px 8px',
              }}
            >
              Microservicios
            </div>

            <button
              type="button"
              onClick={() => setSelectedServiceFilter('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                textAlign: 'left',
                padding: '9px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedServiceFilter === 'all' ? 700 : 500,
                backgroundColor:
                  selectedServiceFilter === 'all' ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
                color:
                  selectedServiceFilter === 'all' ? 'var(--color-primary)' : 'var(--color-ink)',
              }}
            >
              <span>Todos</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  backgroundColor:
                    selectedServiceFilter === 'all'
                      ? 'rgba(234, 88, 12, 0.18)'
                      : 'var(--color-surface-elevated)',
                  color:
                    selectedServiceFilter === 'all'
                      ? 'var(--color-primary)'
                      : 'var(--color-muted)',
                }}
              >
                {roles.length}
              </span>
            </button>

            {catalog.map((group) => {
              const count = roles.filter((r) => roleMatchesService(r, group.serviceKey)).length;
              const isActive = selectedServiceFilter === group.serviceKey;

              return (
                <button
                  key={group.serviceKey}
                  type="button"
                  onClick={() => setSelectedServiceFilter(group.serviceKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    backgroundColor: isActive ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={group.serviceName}
                  >
                    {group.serviceName}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      flexShrink: 0,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      backgroundColor: isActive
                        ? 'rgba(234, 88, 12, 0.18)'
                        : 'var(--color-surface-elevated)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Columna derecha: Barra de búsqueda + Grid uniforme de Roles */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre de rol o permiso (ej. menu, dishes, manage, platillos)..."
                aria-label="Buscar roles o permisos"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                {filteredRoles.length} {filteredRoles.length === 1 ? 'rol' : 'roles'}
              </span>
            </div>

            {filteredRoles.length === 0 ? (
              <Card padding="lg" style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '13px' }}>
                No se encontraron roles que coincidan con los filtros seleccionados.
              </Card>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gridAutoRows: '1fr',
                  gap: '16px',
                }}
              >
                {filteredRoles.map((role) => {
                  const isWildcard = role.permissions?.includes('*');
                  const permCount = role.permissions?.length || 0;

                  return (
                    <Card
                      key={role.code}
                      padding="md"
                      onClick={() => setSelectedRole(role)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRole(role);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ minWidth: 0 }}>
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
                                  backgroundColor: role.isSystemRole
                                    ? 'rgba(107, 114, 128, 0.15)'
                                    : 'rgba(234, 88, 12, 0.15)',
                                  color: role.isSystemRole ? 'var(--color-muted)' : 'var(--color-primary)',
                                }}
                              >
                                {role.isSystemRole ? 'Sistema' : 'Personalizado'}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--color-muted)',
                                fontFamily: 'monospace',
                                marginTop: '2px',
                              }}
                            >
                              {role.code}
                            </div>
                          </div>

                          {!role.isSystemRole && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoleToDelete(role);
                              }}
                              title="Eliminar rol personalizado"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-muted)',
                                padding: '4px',
                                borderRadius: 'var(--radius-sm)',
                                flexShrink: 0,
                              }}
                            >
                              <TrashIcon size={16} />
                            </button>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--color-muted)',
                            margin: 0,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '36px',
                          }}
                        >
                          {role.description || 'Sin descripción operativa.'}
                        </p>
                      </div>

                      {/* Pie de card compacto para mantener tamaño uniforme */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--color-border)',
                          fontSize: '12px',
                        }}
                      >
                        {isWildcard ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                            }}
                          >
                            <ShieldIcon size={13} />
                            Acceso Total (*)
                          </span>
                        ) : (
                          <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                            {permCount} {permCount === 1 ? 'permiso' : 'permisos'}
                          </span>
                        )}

                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          Ver / editar →
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer lateral: Ver y editar permisos del rol */}
      <RoleDetailDrawer
        isOpen={Boolean(selectedRole)}
        role={selectedRole}
        catalog={catalog}
        onClose={() => setSelectedRole(null)}
        onSave={handleUpdateRole}
        onRequestDelete={(role) => setRoleToDelete(role)}
      />

      {/* Modal: Crear Nuevo Rol */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Rol Operativo"
        maxWidth="860px"
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
        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
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
          </div>

          {/* Catálogo de permisos por microservicio con sidebar */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
              Permisos por Microservicio (selecciona los accesos autorizados) *
            </label>

            <PermissionsCatalogPicker
              catalog={catalog}
              selectedPermissions={selectedPermissions}
              onTogglePermission={handleTogglePermission}
              onToggleAllService={handleToggleAllServicePermissions}
              height="360px"
            />
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
