import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input } from '../ui';
import { authApi } from '../../services/authApi';
import type { User } from '../../types/auth';

const AVAILABLE_OPERATING_ROLES = [
  { code: 'MESERO', label: 'Mesero (Órdenes y Menú)' },
  { code: 'HOST', label: 'Host (Sala y Asignación de Mesas)' },
  { code: 'ALMACENISTA', label: 'Almacenista (Inventario y Existencias)' },
  { code: 'CHEF_MASTER', label: 'Chef Master (Cocina y KDS)' },
];

interface StaffManagementViewProps {
  currentUser: User;
  token?: string;
  onLogout?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser, token }) => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['MESERO']);
  const [tempPassword, setTempPassword] = useState('Temp1234!');

  const loadStaff = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await authApi.getAllStaff(token);
      setStaffList(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleToggleRole = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((r) => r !== code)
          : prev
        : [...prev, code],
    );
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || selectedRoles.length === 0) return;

    if (!token) {
      setError('Sesión no autenticada');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessBanner(null);

    try {
      const result = await authApi.createStaff(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          roles: selectedRoles,
          initialPassword: tempPassword.trim() || undefined,
        },
        token,
      );

      setSuccessBanner(
        `¡Colaborador creado en la base de datos! Staff ID: ${result.staffId} | Contraseña temporal: ${result.temporaryPassword || tempPassword}`,
      );

      // Recargar lista real de la base de datos
      await loadStaff();

      setShowCreateForm(false);
      setFirstName('');
      setLastName('');
      setSelectedRoles(['MESERO']);
      setTempPassword('Temp1234!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar personal en la base de datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (memberId: string, memberName: string) => {
    if (!token) return;
    try {
      const res = await authApi.resetStaffPassword(memberId, token);
      alert(`Contraseña restablecida para ${memberName}.\nNueva clave temporal: ${res.temporaryPassword || 'Temp1234!'}`);
      await loadStaff();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    }
  };

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
            Panel de Administración · Auth
          </span>
          <h1 style={{ fontSize: '24px', marginTop: '2px', color: 'var(--color-ink)', fontWeight: 700 }}>Gestión de Personal y Permisos</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0 }}>
            Sesión: <strong>{currentUser.displayName}</strong> ({currentUser.email || currentUser.staffId})
          </p>
        </div>

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
      </div>

      {/* Notifications */}
      {successBanner && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-control)',
            color: 'var(--color-success)',
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
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-control)',
            color: 'var(--color-error)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Create Staff Form Card */}
      {showCreateForm && (
        <Card padding="md" style={{ border: '1px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '4px', color: 'var(--color-ink)' }}>Registrar nuevo colaborador en la Base de Datos</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
            El backend generará automáticamente un Staff ID único basado en el rol primario (ej. M000001) y la clave temporal.
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

            <div>
              <Input
                label="Contraseña temporal inicial"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                helperText="El empleado deberá cambiarla obligatoriamente en su primer login"
              />
            </div>

            {/* Operating Roles Selector */}
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
                Roles operativos del empleado (selecciona al menos uno) *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {AVAILABLE_OPERATING_ROLES.map((role) => {
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
                        backgroundColor: isChecked ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRole(role.code)}
                        style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: isChecked ? 600 : 500, color: 'var(--color-ink)' }}>
                        {role.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <Button variant="secondary" size="md" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
                Guardar en Base de Datos
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff Table */}
      <Card padding="none">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', color: 'var(--color-ink)' }}>Colaboradores Registrados ({staffList.length})</h2>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Conectado en tiempo real a PostgreSQL (Neon)</span>
          </div>

          <Button variant="tertiary" size="sm" onClick={loadStaff} isLoading={isLoading}>
            Actualizar lista
          </Button>
        </div>

        {isLoading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
            Cargando personal desde la base de datos...
          </div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-muted)', fontSize: '14px' }}>
            Aún no hay colaboradores registrados en la base de datos. Haz clic en <strong>+ Dar de alta empleado</strong> para agregar al primero.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Staff ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Colaborador</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Roles asignados</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Estado</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                      {member.staffId}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-ink)' }}>
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
                        {member.mustChangePassword ? 'Clave provisional' : 'Activo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(member.id, member.displayName)}
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-primary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Restablecer clave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
