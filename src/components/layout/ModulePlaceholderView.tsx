import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { CheckIcon, AlertCircleIcon } from '../ui/Icons';
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
  repo: string;
  defaultPort: number;
  expectedPermissions: string[];
}

const MODULE_REGISTRY: Record<string, MicrofrontendInfo> = {
  sala: {
    title: 'Módulo de Sala y Mesas',
    subtitle: 'Mapa interactivo de mesas, cola de comensales y asignación de meseros en turno.',
    team: 'Equipo Sala / Host',
    repo: 'https://github.com/FMAT-Restaurant/Documentation',
    defaultPort: 5174,
    expectedPermissions: ['sala:tables:view', 'sala:tables:assign_diner', 'sala:tables:assign_waiter'],
  },
  menu: {
    title: 'Módulo de Menú y Catálogo',
    subtitle: 'Gestión de platillos, bebidas, categorías, recetas culinarias y precios de venta.',
    team: 'Equipo Menú',
    repo: 'https://github.com/FMAT-Restaurant/Menu-Frontend',
    defaultPort: 5175,
    expectedPermissions: ['menu:view', 'menu:dishes:manage', 'menu:dishes:toggle_availability'],
  },
  inventario: {
    title: 'Módulo de Inventario y Almacén',
    subtitle: 'Control de materias primas, existencias físicas, entradas, salidas y alertas de stock.',
    team: 'Equipo Inventario',
    repo: 'https://github.com/FMAT-Restaurant/Inventory-Frontend',
    defaultPort: 5176,
    expectedPermissions: ['inventory:view', 'inventory:ingredients:create', 'inventory:ingredients:delete', 'inventory:stock:update_status'],
  },
  ordenes: {
    title: 'Módulo de Órdenes y Cocina (KDS)',
    subtitle: 'Comandas activas por mesa, pantalla KDS de preparación culinaria y despacho.',
    team: 'Equipo Orders + Kitchen',
    repo: 'https://github.com/FMAT-Restaurant/OrdersKDS-Frontend',
    defaultPort: 5177,
    expectedPermissions: ['orders:view', 'orders:create', 'kitchen:kds:view', 'kitchen:order:start_preparation'],
  },
  caja: {
    title: 'Módulo de Caja y Facturación',
    subtitle: 'Solicitud de cuentas por mesa, cobro con distintos métodos de pago y cierre de turno.',
    team: 'Equipo Billing & Payments',
    repo: 'https://github.com/FMAT-Restaurant/Documentation',
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
    repo: '',
    defaultPort: 5174,
    expectedPermissions: [],
  };

  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [showContract, setShowContract] = useState(false);

  const remoteUrl = `http://localhost:${info.defaultPort}`;

  const testConnection = async () => {
    setPingStatus('testing');
    try {
      // Intentamos un ping al puerto local del compañero
      await fetch(remoteUrl, { mode: 'no-cors' });
      setPingStatus('online');
    } catch {
      setPingStatus('offline');
    }
  };

  // Filtramos los permisos que el usuario actual tiene que aplican a este microservicio
  const userRelevantPermissions = currentUser.permissions.filter(
    (p) => p.startsWith(`${moduleId}:`) || p === '*'
  );

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          Inicio / Servicios / {info.title}
        </span>
      </div>

      {/* Main Integration Card */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
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
              <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                Puerto esperado: <strong>{remoteUrl}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '24px', marginTop: '10px', color: 'var(--color-ink)' }}>
              {info.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px', maxWidth: '600px' }}>
              {info.subtitle}
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={testConnection}
            isLoading={pingStatus === 'testing'}
          >
            Probar conexión local
          </Button>
        </div>

        {/* Status Alert Banner */}
        <div style={{ marginTop: '20px' }}>
          {pingStatus === 'online' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid #BBF7D0',
                color: 'var(--color-success)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <CheckIcon size={18} />
              <span>
                ¡Servidor detectado en <strong>{remoteUrl}</strong>! El microfrontend de tus compañeros está activo y listo para federación.
              </span>
            </div>
          )}

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
                No se detectó un servidor corriendo en <strong>{remoteUrl}</strong>. Pídele al {info.team} que inicie su frontend con <code>npm run dev</code> en ese puerto.
              </span>
            </div>
          )}

          {pingStatus === 'idle' && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-canvas)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                color: 'var(--color-text)',
              }}
            >
              Este espacio está reservado para renderizar el microfrontend del <strong>{info.team}</strong> mediante Module Federation cuando su servidor esté encendido.
            </div>
          )}
        </div>

        {/* Contract Data for the other team */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--color-ink)' }}>
                Contrato de Integración de Auth hacia este Microfrontend
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                Datos y permisos que el Shell de Auth le suministra a la vista de tus compañeros:
              </p>
            </div>

            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setShowContract(!showContract)}
            >
              {showContract ? 'Ocultar JSON de contrato' : 'Ver JSON de contrato'}
            </Button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', alignSelf: 'center' }}>
              Permisos del usuario para este módulo:
            </span>
            {userRelevantPermissions.length > 0 ? (
              userRelevantPermissions.map((p) => (
                <span
                  key={p}
                  style={{
                    fontSize: '11px',
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
              <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                (El usuario actual no posee permisos específicos para este módulo)
              </span>
            )}
          </div>

          {showContract && (
            <pre
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: 'var(--color-ink)',
                color: '#E5E7EB',
                borderRadius: 'var(--radius-control)',
                fontSize: '12px',
                overflowX: 'auto',
                lineHeight: 1.5,
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
                  remoteConfig: {
                    name: `${moduleId}App`,
                    url: `${remoteUrl}/assets/remoteEntry.js`,
                    component: `./${info.title.replace(/\s+/g, '')}View`,
                  },
                },
                null,
                2
              )}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
};
