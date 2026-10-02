import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Tabs, Modal, CheckIcon, CopyIcon, type TabItem } from '../ui';
import { authApi } from '../../services/authApi';
import { StaffDetailDrawer } from './StaffDetailDrawer';
import { RolesManagementView } from './RolesManagementView';
import type { User, RoleDefinition, ServicePermissionGroup } from '../../types/auth';

interface StaffManagementViewProps {
  currentUser: User;
  token?: string;
  onLogout?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser, token }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');

  // Datos de Personal
  const [staffList, setStaffList] = useState<User[]>([]);
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<ServicePermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Drawer Lateral de Detalle / Edición
  const [selectedCollaborator, setSelectedCollaborator] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Formulario de Alta de Personal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['MESERO']);

  // Modo Permisos Personalizados en Alta
  const [isCustomizingPermissions, setIsCustomizingPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [saveRoleAsNew, setSaveRoleAsNew] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Modal de credenciales generadas para el nuevo colaborador
  const [createdCredentials, setCreatedCredentials] = useState<{
    staffId: string;
    fullName: string;
    temporaryPassword?: string;
  } | null>(null);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [isCopiedTemp, setIsCopiedTemp] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [staff, roles, catalog] = await Promise.all([
        authApi.getAllStaff(token),
        authApi.getRoles(token).catch(() => []),
        authApi.getPermissionsCatalog(token).catch(() => []),
      ]);
      setStaffList(staff);
      setRolesList(roles);
      setPermissionsCatalog(catalog);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleRole = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((r) => r !== code)
          : prev
        : [...prev, code],
    );
  };

  const handleToggleCustomPermission = (code: string) => {
    setCustomPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    if (!token) {
      setError('Sesión no autenticada');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessBanner(null);

    try {
      let finalRoles = [...selectedRoles];

      // Si el admin personalizó permisos directamente
      if (isCustomizingPermissions) {
        if (customPermissions.length === 0) {
          throw new Error('Debes seleccionar al menos un permiso para el colaborador');
        }
        if (saveRoleAsNew && !newRoleName.trim()) {
          throw new Error('Debes ingresar un nombre para guardar el nuevo rol');
        }
        const roleName =
          saveRoleAsNew && newRoleName.trim()
            ? newRoleName.trim()
            : `Personalizado ${firstName.trim()} ${lastName.trim()}`.trim();
        const existingMatch = rolesList.find(
          (r) => r.name.toLowerCase() === roleName.toLowerCase() || r.code.toLowerCase() === roleName.toLowerCase(),
        );
        if (existingMatch) {
          finalRoles = [existingMatch.code];
        } else {
          try {
            const createdRole = await authApi.createRole(
              {
                name: roleName,
                description: `Rol asignado a ${firstName.trim()} ${lastName.trim()}`,
                permissions: customPermissions,
              },
              token,
            );
            finalRoles = [createdRole.code];
          } catch (createRoleErr: unknown) {
            const fallbackMatch = rolesList.find(
              (r) => r.name.toLowerCase() === roleName.toLowerCase() || r.code.toLowerCase() === roleName.toLowerCase(),
            );
            if (fallbackMatch) {
              finalRoles = [fallbackMatch.code];
            } else {
              throw createRoleErr;
            }
          }
        }
      }

      const result = await authApi.createStaff(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          roles: finalRoles,
        },
        token,
      );

      setSuccessBanner(
        `¡Colaborador creado exitosamente! Staff ID: ${result.staffId} | Contraseña temporal: ${result.temporaryPassword}`,
      );

      setCreatedCredentials({
        staffId: result.staffId,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        temporaryPassword: result.temporaryPassword,
      });

      // Recargar lista
      await loadData();

      // Limpiar formulario
      setShowCreateForm(false);
      setFirstName('');
      setLastName('');
      setSelectedRoles(['MESERO']);
      setIsCustomizingPermissions(false);
      setCustomPermissions([]);
      setSaveRoleAsNew(false);
      setNewRoleName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar personal en la base de datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCollaboratorDrawer = (collaborator: User) => {
    setSelectedCollaborator(collaborator);
    setIsDrawerOpen(true);
  };

  const handleSaveCollaborator = async (
    id: string,
    updatedData: { firstName: string; lastName: string; roles: string[]; isActive: boolean },
  ) => {
    if (!token) return;
    const updatedUser = await authApi.updateStaff(id, updatedData, token);
    setSelectedCollaborator(updatedUser);
    await loadData();
  };

  const handleResetCollaboratorPassword = async (id: string) => {
    if (!token) return {};
    const res = await authApi.resetStaffPassword(id, token);
    await loadData();
    return res;
  };

  const handleDeleteCollaborator = async (id: string) => {
    if (!token) return;
    await authApi.deleteStaff(id, token);
    setIsDrawerOpen(false);
    setSelectedCollaborator(null);
    setSuccessBanner('Colaborador eliminado definitivamente del sistema');
    setTimeout(() => setSuccessBanner(null), 3500);
    await loadData();
  };

  const adminTabs: TabItem[] = [
    { id: 'staff', label: 'Personal Operativo' },
    { id: 'roles', label: 'Roles y Permisos por Microservicio' },
  ];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header view */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Panel de Administración
          </span>
          <h1 style={{ fontSize: '24px', marginTop: '2px', color: 'var(--color-ink)', fontWeight: 700 }}>
            Control de Personal y Accesos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
            Sesión: <strong>{currentUser.displayName}</strong> ({currentUser.email || currentUser.staffId})
          </p>
        </div>

        {activeTab === 'staff' && (
          <Button
            variant={showCreateForm ? 'secondary' : 'primary'}
            size="md"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setError(null);
              setSuccessBanner(null);
            }}
          >
            {showCreateForm ? 'Cerrar formulario' : '+ Dar de alta empleado'}
          </Button>
        )}
      </div>

      {/* Tabs Principales: Personal vs Roles */}
      <Tabs
        tabs={adminTabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'staff' | 'roles')}
        variant="pills"
      />

      {/* Vista de Roles y Permisos */}
      {activeTab === 'roles' ? (
        <RolesManagementView token={token} onRolesChanged={loadData} />
      ) : (
        /* Vista de Personal Operativo */
        <>
          {/* Notificaciones */}
          {successBanner && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--color-ink)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {successBanner}
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
              }}
            >
              {error}
            </div>
          )}

          {/* Formulario de Alta de Colaborador */}
          {showCreateForm && (
            <Card padding="md" style={{ border: '1px solid var(--color-primary)' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--color-ink)' }}>
                Registrar nuevo colaborador
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                El backend generará automáticamente un <strong>Staff ID único</strong> y una <strong>contraseña temporal aleatoria</strong>.
              </p>

              <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <Input
                    label="Nombre(s)"
                    placeholder="Ej. Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    label="Apellidos"
                    placeholder="Ej. Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                {/* Selector de Roles Existentes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                      Asignar Rol(es) del Restaurante *
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCustomizingPermissions(!isCustomizingPermissions)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: 500,
                      }}
                    >
                      {isCustomizingPermissions ? '← Volver a roles predefinidos' : '⚙ Personalizar permisos directamente'}
                    </button>
                  </div>

                  {!isCustomizingPermissions ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {rolesList
                        .filter((r) => r.code !== 'ADMINISTRADOR')
                        .map((role) => {
                          const isChecked = selectedRoles.includes(role.code);
                          return (
                            <label
                              key={role.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-control)',
                                border: isChecked ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                backgroundColor: isChecked ? 'rgba(234, 88, 12, 0.05)' : 'var(--color-surface)',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleRole(role.code)}
                                style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                              />
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: isChecked ? 600 : 500, color: 'var(--color-ink)' }}>
                                  {role.name}
                                </span>
                                {role.description && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                    {role.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  ) : (
                    /* Modo Personalizar Permisos con opción Guardar Rol como... */
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-control)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={saveRoleAsNew}
                            onChange={(e) => setSaveRoleAsNew(e.target.checked)}
                            style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
                            Guardar esta configuración como un nuevo Rol
                          </span>
                        </label>
                      </div>

                      {saveRoleAsNew && (
                        <Input
                          label="Nombre del Nuevo Rol"
                          placeholder="Ej. Mesero de Turno Nocturno"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          required
                        />
                      )}

                      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {permissionsCatalog.map((group) => (
                          <div key={group.serviceKey} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px', backgroundColor: 'var(--color-surface)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '8px' }}>
                              {group.serviceName}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px' }}>
                              {group.permissions.map((perm) => (
                                <label key={perm.code} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-ink)', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={customPermissions.includes(perm.code)}
                                    onChange={() => handleToggleCustomPermission(perm.code)}
                                    style={{ accentColor: 'var(--color-primary)' }}
                                  />
                                  <span>{perm.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <Button variant="secondary" size="md" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
                    Crear Colaborador
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tabla de Colaboradores */}
          <Card padding="none">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', color: 'var(--color-ink)', margin: 0 }}>
                  Colaboradores Registrados ({staffList.length})
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  Haz clic en cualquier colaborador para ver su expediente y contraseña temporal.
                </span>
              </div>

              <Button variant="tertiary" size="sm" onClick={loadData} isLoading={isLoading}>
                Actualizar lista
              </Button>
            </div>

            {isLoading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
                Cargando personal desde la base de datos...
              </div>
            ) : staffList.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
                Aún no hay colaboradores registrados. Haz clic en <strong>+ Dar de alta empleado</strong> para agregar al primero.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Staff ID</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Colaborador</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Roles asignados</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Estado de clave</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((member) => (
                      <tr
                        key={member.id}
                        onClick={() => handleOpenCollaboratorDrawer(member)}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease-in-out',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                          {member.staffId}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>
                          {member.displayName}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(member.roles || []).map((r) => (
                              <span
                                key={r}
                                style={{
                                  padding: '2px 8px',
                                  backgroundColor: 'var(--color-canvas)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--color-text)',
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: member.mustChangePassword ? 'var(--color-warning)' : 'var(--color-success)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: member.mustChangePassword ? 'var(--color-warning)' : 'var(--color-success)',
                              }}
                            />
                            {member.mustChangePassword ? 'Clave provisional (Ver)' : 'Activo'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCollaboratorDrawer(member);
                            }}
                          >
                            Expediente →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Drawer Lateral Deslizable de Detalle / Edición / Baja */}
      <StaffDetailDrawer
        isOpen={isDrawerOpen}
        collaborator={selectedCollaborator}
        availableRoles={rolesList}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCollaborator(null);
        }}
        onSave={handleSaveCollaborator}
        onResetPassword={handleResetCollaboratorPassword}
        onDelete={handleDeleteCollaborator}
      />

      {/* Modal de Confirmación de Credenciales Generadas */}
      <Modal
        isOpen={Boolean(createdCredentials)}
        onClose={() => setCreatedCredentials(null)}
        title="¡Colaborador Registrado Exitosamente!"
        description="Credenciales de acceso provisionales para el nuevo colaborador."
        maxWidth="480px"
        footer={
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setCreatedCredentials(null)}
          >
            Entendido
          </Button>
        }
      >
        {createdCredentials && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.5 }}>
              Proporciona estas credenciales a <strong>{createdCredentials.fullName}</strong>. En su primer inicio de sesión, el sistema le solicitará cambiar su contraseña obligatoriamente.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                  Staff ID (Usuario para Login)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <code style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                    {createdCredentials.staffId}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdCredentials.staffId);
                      setIsCopiedId(true);
                      setTimeout(() => setIsCopiedId(false), 2000);
                    }}
                    style={{ gap: '6px' }}
                  >
                    {isCopiedId ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                    <span>{isCopiedId ? '¡Copiado!' : 'Copiar ID'}</span>
                  </Button>
                </div>
              </div>

              {createdCredentials.temporaryPassword && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                    Contraseña Temporal Inicial
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <code style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', letterSpacing: '0.5px' }}>
                      {createdCredentials.temporaryPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (createdCredentials.temporaryPassword) {
                          navigator.clipboard.writeText(createdCredentials.temporaryPassword);
                          setIsCopiedTemp(true);
                          setTimeout(() => setIsCopiedTemp(false), 2000);
                        }
                      }}
                      style={{ gap: '6px' }}
                    >
                      {isCopiedTemp ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                      <span>{isCopiedTemp ? '¡Copiada!' : 'Copiar clave'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
