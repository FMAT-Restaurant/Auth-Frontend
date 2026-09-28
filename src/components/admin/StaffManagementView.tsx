import React, { useState } from 'react';
import { Card, Button, Input } from '../ui';
import type { User, PermissionGroup } from '../../types/auth';

const SYSTEM_PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'inventory',
    label: 'Microservicio Inventario',
    permissions: [
      { code: 'inventory:view', label: 'Consultar inventario', description: 'Ver materias primas y existencias' },
      { code: 'inventory:ingredients:create', label: 'Agregar ingredientes', description: 'Dar de alta nuevos insumos en almacén' },
      { code: 'inventory:ingredients:update', label: 'Modificar ingredientes', description: 'Editar costos y especificaciones' },
      { code: 'inventory:ingredients:delete', label: 'Eliminar ingredientes', description: 'Dar de baja insumos' },
      { code: 'inventory:stock:update_status', label: 'Cambiar estado de stock', description: 'Marcar "Pocas unidades" o "Sin unidades"' },
      { code: 'inventory:stock:adjust', label: 'Ajuste de existencias', description: 'Registrar mermas o entradas físicas' },
    ],
  },
  {
    module: 'orders',
    label: 'Microservicio Órdenes',
    permissions: [
      { code: 'orders:view', label: 'Ver comandas', description: 'Consultar pedidos activos del restaurante' },
      { code: 'orders:create', label: 'Crear comandas (Mesero)', description: 'Abrir comandas y tomar órdenes por mesa' },
      { code: 'orders:update', label: 'Modificar comanda', description: 'Agregar productos a comandas abiertas' },
      { code: 'orders:cancel', label: 'Cancelar comanda', description: 'Anulación autorizada de comandas' },
    ],
  },
  {
    module: 'menu',
    label: 'Microservicio Menú',
    permissions: [
      { code: 'menu:view', label: 'Consultar catálogo', description: 'Ver recetas y precios de platillos' },
      { code: 'menu:dishes:manage', label: 'Administrar platillos', description: 'Crear o editar platillos en el menú' },
      { code: 'menu:dishes:toggle_availability', label: 'Pausar platillos', description: 'Desactivar platillos agotados' },
    ],
  },
  {
    module: 'kitchen',
    label: 'Microservicio Cocina (KDS)',
    permissions: [
      { code: 'kitchen:kds:view', label: 'Visualizar KDS', description: 'Ver pantalla de despacho culinario' },
      { code: 'kitchen:order:start_preparation', label: 'Iniciar preparación', description: 'Marcar platillos en cocción' },
      { code: 'kitchen:order:mark_ready', label: 'Marcar listo para servir', description: 'Notificar a sala que el pedido está listo' },
    ],
  },
  {
    module: 'sala',
    label: 'Microservicio Sala / Host',
    permissions: [
      { code: 'sala:tables:view', label: 'Ver mapa de mesas', description: 'Consultar ocupación del piso' },
      { code: 'sala:tables:assign_diner', label: 'Asignar comensales (Host)', description: 'Ubicar clientes en mesas vacías' },
      { code: 'sala:tables:assign_waiter', label: 'Asignar meseros a mesas', description: 'Vincular personal responsable' },
    ],
  },
  {
    module: 'billing',
    label: 'Microservicio Caja / Cobro',
    permissions: [
      { code: 'billing:account:request', label: 'Solicitar cuenta', description: 'Emitir pre-ticket para la mesa' },
      { code: 'billing:payment:process', label: 'Cobrar y cerrar cuenta', description: 'Registrar pagos en efectivo o tarjeta' },
    ],
  },
];

interface StaffManagementViewProps {
  currentUser: User;
  onLogout?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ currentUser }) => {
  const [staffList, setStaffList] = useState<User[]>([
    {
      id: 'usr_staff_104',
      restaurantId: currentUser.restaurantId,
      userType: 'STAFF',
      staffId: 'E000104',
      displayName: 'Juan Pérez',
      roleLabel: 'Líder de inventario',
      permissions: [
        'inventory:view',
        'inventory:ingredients:create',
        'inventory:ingredients:delete',
        'inventory:stock:update_status',
      ],
      mustChangePassword: false,
    },
    {
      id: 'usr_staff_105',
      restaurantId: currentUser.restaurantId,
      userType: 'STAFF',
      staffId: 'E000105',
      displayName: 'María Gómez',
      roleLabel: 'Mesera de Terraza',
      permissions: ['orders:create', 'orders:view', 'menu:view', 'sala:tables:view'],
      mustChangePassword: true,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp1234!');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'inventory:view',
    'inventory:ingredients:create',
    'inventory:ingredients:delete',
    'inventory:stock:update_status',
  ]);

  const handleTogglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !roleLabel.trim() || selectedPermissions.length === 0) return;

    const nextId = `E000${104 + staffList.length + 1}`;
    const newStaff: User = {
      id: `usr_${Date.now()}`,
      restaurantId: currentUser.restaurantId,
      userType: 'STAFF',
      staffId: nextId,
      displayName: `${firstName} ${lastName}`.trim(),
      roleLabel: roleLabel.trim(),
      permissions: selectedPermissions,
      mustChangePassword: true,
    };

    setStaffList([newStaff, ...staffList]);
    setShowCreateForm(false);
    setFirstName('');
    setLastName('');
    setRoleLabel('');
    setSelectedPermissions(['inventory:view']);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '24px',
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
          <h1 style={{ fontSize: '24px', marginTop: '2px' }}>Gestión de Personal y Permisos</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Sesión: <strong>{currentUser.displayName}</strong> ({currentUser.email || currentUser.staffId})
          </p>
        </div>
      </div>

      {/* Action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px' }}>Miembros del equipo ({staffList.length})</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
            Los roles son etiquetas descriptivas libres y los accesos se rigen por permisos granulares.
          </p>
        </div>

        <Button
          variant={showCreateForm ? 'secondary' : 'primary'}
          size="md"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cerrar formulario' : '+ Dar de alta empleado'}
        </Button>
      </div>

      {/* Create Staff Form Card */}
      {showCreateForm && (
        <Card padding="md" style={{ marginBottom: '24px', border: '1px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Registrar nuevo colaborador</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
            Se generará automáticamente un Staff ID inmutable con prefijo <strong>E</strong> y contraseña provisional.
          </p>

          <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Etiqueta de puesto / Rol"
                placeholder="Ej. Líder de inventario, Capitán de meseros..."
                value={roleLabel}
                onChange={(e) => setRoleLabel(e.target.value)}
                required
                helperText="Etiqueta libre creada por ti; no está atada a enums fijos"
              />
              <Input
                label="Contraseña temporal asignada"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                helperText="El empleado deberá cambiarla obligatoriamente en su primer login"
              />
            </div>

            {/* Granular Permissions Selector */}
            <div style={{ marginTop: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
                Permisos granulares asignados al colaborador ({selectedPermissions.length} seleccionados) *
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {SYSTEM_PERMISSION_GROUPS.map((group) => (
                  <div
                    key={group.module}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-control)',
                      padding: '12px',
                      backgroundColor: 'var(--color-canvas)',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ink)', display: 'block', marginBottom: '8px' }}>
                      {group.label}
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {group.permissions.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: 'var(--color-text)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.code)}
                              style={{
                                accentColor: 'var(--color-primary)',
                                width: '16px',
                                height: '16px',
                                marginTop: '2px',
                                cursor: 'pointer',
                              }}
                            />
                            <div>
                              <strong style={{ color: 'var(--color-ink)' }}>{perm.label}</strong>
                              <p style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{perm.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Button variant="secondary" size="md" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" type="submit">
                Guardar colaborador
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff Table */}
      <Card padding="none">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Staff ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Colaborador</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Etiqueta de puesto</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Permisos concedidos</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-ink)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member) => (
                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {member.staffId}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-ink)' }}>
                    {member.displayName}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'var(--color-canvas)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                      }}
                    >
                      {member.roleLabel}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {member.permissions.length} permisos
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {member.permissions.slice(0, 3).map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: '11px',
                            backgroundColor: 'var(--color-primary-soft)',
                            color: 'var(--color-primary)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {p.split(':')[1] || p}
                        </span>
                      ))}
                      {member.permissions.length > 3 && (
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                          +{member.permissions.length - 3} más
                        </span>
                      )}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
