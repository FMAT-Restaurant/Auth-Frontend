import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { AlertCircleIcon } from '../ui/Icons';
import type { NavModuleId } from './Sidebar';
import type { User } from '../../types/auth';

interface ModulePlaceholderViewProps {
  moduleId: NavModuleId;
  currentUser: User;
}

interface MicrofrontendInfo {
  title: string;
  subtitle: string;
  team: string;
  defaultPort: number;
  expectedPermissions: string[];
}

const MODULE_REGISTRY: Record<string, MicrofrontendInfo> = {
  sala: {
    title: 'Módulo de Sala y Mesas',
    subtitle: 'Mapa interactivo de mesas, cola de comensales y asignación de meseros en turno.',
    team: 'Equipo Sala / Host',
    defaultPort: 5174,
    expectedPermissions: ['sala:tables:view', 'sala:tables:assign_diner', 'sala:tables:assign_waiter'],
  },
  menu: {
    title: 'Módulo de Menú y Catálogo',
    subtitle: 'Gestión de platillos, bebidas, categorías, recetas culinarias y precios de venta.',
    team: 'Equipo Menú',
    defaultPort: 5175,
    expectedPermissions: ['menu:view', 'menu:dishes:manage', 'menu:dishes:toggle_availability'],
  },
  inventario: {
    title: 'Módulo de Inventario y Almacén',
    subtitle: 'Control de materias primas, existencias físicas, entradas, salidas y alertas de stock.',
    team: 'Equipo Inventario',
    defaultPort: 5176,
    expectedPermissions: ['inventory:view', 'inventory:ingredients:create', 'inventory:ingredients:delete', 'inventory:stock:update_status'],
  },
  ordenes: {
    title: 'Módulo de Órdenes y Cocina (KDS)',
    subtitle: 'Comandas activas por mesa, pantalla KDS de preparación culinaria y despacho.',
    team: 'Equipo Orders + Kitchen',
    defaultPort: 5177,
    expectedPermissions: ['orders:view', 'orders:create', 'kitchen:kds:view', 'kitchen:order:start_preparation'],
  },
  caja: {
    title: 'Módulo de Caja y Facturación',
    subtitle: 'Solicitud de cuentas por mesa, cobro con distintos métodos de pago y cierre de turno.',
    team: 'Equipo Billing & Payments',
    defaultPort: 5178,
    expectedPermissions: ['billing:account:request', 'billing:payment:process'],
  },
};

export const ModulePlaceholderView: React.FC<ModulePlaceholderViewProps> = ({
  moduleId,
  currentUser,
}) => {
  const info = MODULE_REGISTRY[moduleId] || {
    title: 'Módulo Externo',
    subtitle: 'Microfrontend del ecosistema FMAT Restaurant',
    team: 'Equipo Externo',
    defaultPort: 5174,
    expectedPermissions: [],
  };

  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [showContract, setShowContract] = useState(false);

  const remoteUrl = `http://localhost:${info.defaultPort}`;

  const testConnection = async () => {
    setPingStatus('testing');
    try {
      await fetch(remoteUrl, { mode: 'no-cors' });
      setPingStatus('online');
    } catch {
      setPingStatus('offline');
    }
  };

  const userRelevantPermissions = currentUser.permissions.filter(
    (p) => p.startsWith(`${moduleId}:`) || p === '*'
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          Inicio / Servicios / {info.title}
        </span>
      </div>

      {/* Si el microfrontend está en línea, lo incrustamos directamente */}
      {pingStatus === 'online' ? (
        <Card padding="none" style={{ overflow: 'hidden', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-canvas)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                Conectado en vivo al {info.team} ({remoteUrl})
              </span>
            </div>
            <Button variant="tertiary" size="sm" onClick={() => setPingStatus('idle')}>
              Desconectar vista
            </Button>
          </div>
          <iframe
            src={remoteUrl}
            title={info.title}
            style={{ width: '100%', flex: 1, border: 'none' }}
          />
        </Card>
      ) : (
        /* Estado de espera limpio */
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--color-primary-soft)',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {info.team}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  Puerto asignado: <strong>{remoteUrl}</strong>
                </span>
              </div>

              <h1 style={{ fontSize: '24px', marginTop: '10px', color: 'var(--color-ink)', fontWeight: 700 }}>
                {info.title}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px', maxWidth: '640px' }}>
                {info.subtitle}
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={testConnection}
              isLoading={pingStatus === 'testing'}
            >
              Probar conexión remota
            </Button>
          </div>

          <div style={{ marginTop: '20px' }}>
            {pingStatus === 'offline' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-warning-bg)',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid #FDE68A',
                  color: 'var(--color-warning)',
                  fontSize: '13px',
                }}
              >
                <AlertCircleIcon size={18} />
                <span>
                  No se detectó un servidor activo en <strong>{remoteUrl}</strong>. Cuando tus compañeros del {info.team} inicien su frontend con <code>npm run dev</code> en ese puerto, la vista se montará aquí de forma transparente.
                </span>
              </div>
            )}

            {pingStatus === 'idle' && (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--color-canvas)',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  lineHeight: 1.6,
                }}
              >
                Este espacio está reservado para renderizar el microfrontend del <strong>{info.team}</strong>. Auth no crea interfaces por ellos; una vez que su servidor esté corriendo en <code>{remoteUrl}</code>, haz clic en <strong>Probar conexión remota</strong> para montarlo dentro del Shell.
              </div>
            )}
          </div>

          {/* Permisos y Contrato */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
                  Permisos del usuario en sesión para este módulo:
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {userRelevantPermissions.length > 0 ? (
                    userRelevantPermissions.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          backgroundColor: 'var(--color-primary-soft)',
                          color: 'var(--color-primary)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #FED7AA',
                        }}
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      Sin permisos específicos para {moduleId}:*
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="tertiary"
                size="sm"
                onClick={() => setShowContract(!showContract)}
              >
                {showContract ? 'Ocultar contrato' : 'Ver contrato de sesión'}
              </Button>
            </div>

            {showContract && (
              <pre
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  backgroundColor: 'var(--color-ink)',
                  color: '#E5E7EB',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '12px',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(
                  {
                    currentUser: {
                      id: currentUser.id,
                      staffId: currentUser.staffId || 'ADMIN',
                      displayName: currentUser.displayName,
                      roleLabel: currentUser.roleLabel,
                      restaurantId: currentUser.restaurantId,
                      permissions: currentUser.permissions,
                    },
                    remoteUrl,
                  },
                  null,
                  2,
                )}
              </pre>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
