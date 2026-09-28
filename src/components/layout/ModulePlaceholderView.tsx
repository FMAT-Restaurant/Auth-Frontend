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
  exposedName: string;
}

const MODULE_REGISTRY: Record<string, MicrofrontendInfo> = {
  sala: {
    title: 'Módulo de Sala y Mesas',
    subtitle: 'Mapa interactivo de mesas, cola de comensales y asignación de meseros en turno.',
    team: 'Equipo Sala / Host',
    repo: 'https://github.com/FMAT-Restaurant/Documentation',
    defaultPort: 5174,
    expectedPermissions: ['sala:tables:view', 'sala:tables:assign_diner', 'sala:tables:assign_waiter'],
    exposedName: 'salaApp/SalaView',
  },
  menu: {
    title: 'Módulo de Menú y Catálogo',
    subtitle: 'Gestión de platillos, bebidas, categorías, recetas culinarias y precios de venta.',
    team: 'Equipo Menú',
    repo: 'https://github.com/FMAT-Restaurant/Menu-Frontend',
    defaultPort: 5175,
    expectedPermissions: ['menu:view', 'menu:dishes:manage', 'menu:dishes:toggle_availability'],
    exposedName: 'menuApp/MenuView',
  },
  inventario: {
    title: 'Módulo de Inventario y Almacén',
    subtitle: 'Control de materias primas, existencias físicas, entradas, salidas y alertas de stock.',
    team: 'Equipo Inventario',
    repo: 'https://github.com/FMAT-Restaurant/Inventory-Frontend',
    defaultPort: 5176,
    expectedPermissions: ['inventory:view', 'inventory:ingredients:create', 'inventory:ingredients:delete', 'inventory:stock:update_status'],
    exposedName: 'inventoryApp/InventoryView',
  },
  ordenes: {
    title: 'Módulo de Órdenes y Cocina (KDS)',
    subtitle: 'Comandas activas por mesa, pantalla KDS de preparación culinaria y despacho.',
    team: 'Equipo Orders + Kitchen',
    repo: 'https://github.com/FMAT-Restaurant/OrdersKDS-Frontend',
    defaultPort: 5177,
    expectedPermissions: ['orders:view', 'orders:create', 'kitchen:kds:view', 'kitchen:order:start_preparation'],
    exposedName: 'ordersApp/OrdersKdsView',
  },
  caja: {
    title: 'Módulo de Caja y Facturación',
    subtitle: 'Solicitud de cuentas por mesa, cobro con distintos métodos de pago y cierre de turno.',
    team: 'Equipo Billing & Payments',
    repo: 'https://github.com/FMAT-Restaurant/Documentation',
    defaultPort: 5178,
    expectedPermissions: ['billing:account:request', 'billing:payment:process'],
    exposedName: 'billingApp/BillingView',
  },
};

type ActiveTab = 'status' | 'guide' | 'mock' | 'contract';

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
    exposedName: `${moduleId}App/MainView`,
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');

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
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Breadcrumb */}
      <div>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          Inicio / Servicios / {info.title}
        </span>
      </div>

      {/* Main Header Card */}
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
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: pingStatus === 'online' ? '#16A34A' : 'var(--color-muted)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: pingStatus === 'online' ? '#16A34A' : '#9CA3AF',
                  }}
                />
                Puerto: <strong>{remoteUrl}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '24px', marginTop: '10px', color: 'var(--color-ink)', fontWeight: 700 }}>
              {info.title}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px', maxWidth: '640px' }}>
              {info.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={testConnection}
              isLoading={pingStatus === 'testing'}
            >
              Probar conexión local
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '24px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '2px',
          }}
        >
          {[
            { id: 'status', label: 'Estado y Permisos' },
            { id: 'guide', label: 'Guía para el Equipo' },
            { id: 'mock', label: 'Simulación de Interfaz (Mock)' },
            { id: 'contract', label: 'Contrato JSON de Auth' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                  border: 'none',
                  background: 'none',
                  borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Estado y Permisos */}
        {activeTab === 'status' && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  ¡Servidor detectado en <strong>{remoteUrl}</strong>! El microfrontend de tus compañeros está encendido y listo para incrustarse en el Shell.
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
                  No se detectó un servidor activo en <strong>{remoteUrl}</strong>. Pídele al {info.team} que ejecute <code>npm run dev</code> en ese puerto.
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
                  lineHeight: 1.5,
                }}
              >
                Este espacio está reservado para renderizar el microfrontend del <strong>{info.team}</strong> mediante Module Federation cuando su servidor esté activo. Haz clic en <strong>Probar conexión local</strong> para verificar si está disponible.
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '8px' }}>
                Permisos del usuario en sesión aplicables a este módulo:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {userRelevantPermissions.length > 0 ? (
                  userRelevantPermissions.map((p) => (
                    <span
                      key={p}
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        backgroundColor: 'var(--color-primary-soft)',
                        color: 'var(--color-primary)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid #FED7AA',
                      }}
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>
                    El usuario en sesión no posee permisos asignados para <code>{moduleId}:*</code>. El microfrontend debe aplicar control de acceso interno según corresponda.
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
                Permisos estándar del módulo según la ERS:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {info.expectedPermissions.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guía de Integración para el Equipo */}
        {activeTab === 'guide' && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
              Comparte este fragmento con el <strong>{info.team}</strong> para que configuren la exportación de su vista en su proyecto frontend:
            </p>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                1. Configuración de Module Federation en su <code>vite.config.ts</code>:
              </span>
              <pre
                style={{
                  marginTop: '6px',
                  padding: '14px',
                  backgroundColor: 'var(--color-ink)',
                  color: '#E5E7EB',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '12px',
                  overflowX: 'auto',
                }}
              >
{`import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '${info.exposedName.split('/')[0]}',
      filename: 'remoteEntry.js',
      exposes: {
        './${info.exposedName.split('/')[1]}': './src/views/${info.exposedName.split('/')[1]}.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: ${info.defaultPort},
    cors: true
  }
});`}
              </pre>
            </div>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink)' }}>
                2. Props que recibe su vista principal:
              </span>
              <pre
                style={{
                  marginTop: '6px',
                  padding: '14px',
                  backgroundColor: 'var(--color-ink)',
                  color: '#E5E7EB',
                  borderRadius: 'var(--radius-control)',
                  fontSize: '12px',
                  overflowX: 'auto',
                }}
              >
{`export interface RemoteModuleProps {
  currentUser: {
    id: string;
    staffId: string;
    displayName: string;
    roleLabel: string;
    restaurantId: string;
    permissions: string[];
  };
  token: string;
}

export default function ${info.exposedName.split('/')[1]}({ currentUser, token }: RemoteModuleProps) {
  // Implementación del equipo
  return <div>Contenido de ${info.title}</div>;
}`}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Simulación de Interfaz (Mock para Demos) */}
        {activeTab === 'mock' && (
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 'var(--radius-control)',
                fontSize: '12px',
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontWeight: 700 }}>💡 VISTA PREVIA SIMULADA:</span>
              <span>
                Esta simulación interactiva muestra cómo se integrará el módulo del {info.team} dentro del Shell corporativo.
              </span>
            </div>

            <div
              style={{
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              {moduleId === 'sala' && <MockSalaView />}
              {moduleId === 'menu' && <MockMenuView />}
              {moduleId === 'inventario' && <MockInventarioView />}
              {moduleId === 'ordenes' && <MockOrdenesView />}
              {moduleId === 'caja' && <MockCajaView />}
            </div>
          </div>
        )}

        {/* Tab 4: Contrato JSON de Auth */}
        {activeTab === 'contract' && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '8px' }}>
              Carga útil exacta inyectada por el Shell de Auth al montar este microfrontend:
            </p>
            <pre
              style={{
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
                    name: info.exposedName.split('/')[0],
                    url: `${remoteUrl}/assets/remoteEntry.js`,
                    component: info.exposedName,
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};

/* =========================================================================
   Vistas Simuladas (Mocks) para Demostración Académica
   ========================================================================= */

const MockSalaView: React.FC = () => {
  const tables = [
    { id: 1, name: 'Mesa 01', capacity: 4, status: 'Ocupada', waiter: 'Juan P.', diners: 3 },
    { id: 2, name: 'Mesa 02', capacity: 2, status: 'Libre', waiter: '—', diners: 0 },
    { id: 3, name: 'Mesa 03', capacity: 6, status: 'Ocupada', waiter: 'Ana G.', diners: 5 },
    { id: 4, name: 'Mesa 04', capacity: 4, status: 'En Cuenta', waiter: 'Juan P.', diners: 4 },
    { id: 5, name: 'Mesa 05', capacity: 8, status: 'Reservada', waiter: '—', diners: 0 },
    { id: 6, name: 'Mesa 06', capacity: 2, status: 'Libre', waiter: '—', diners: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Libre': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Ocupada': return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'En Cuenta': return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
      case 'Reservada': return { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' };
      default: return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Distribución de Sala y Mesas en Tiempo Real
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Zona: Salón Principal (6 mesas activas)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#15803D' }}>2 Libres</span>
          <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>2 Ocupadas</span>
          <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#B45309' }}>1 En Cuenta</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
        {tables.map((t) => {
          const c = getStatusColor(t.status);
          return (
            <div
              key={t.id}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-card)',
                border: `1px solid ${c.border}`,
                backgroundColor: c.bg,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>{t.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: c.text }}>{t.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Capacidad: {t.capacity} pers. {t.diners > 0 && `(${t.diners} sentados)`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                Mesero: <strong style={{ color: 'var(--color-ink)' }}>{t.waiter}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MockMenuView: React.FC = () => {
  const dishes = [
    { id: 1, name: 'Panuchos de Cochinita', cat: 'Entradas', price: 95, available: true },
    { id: 2, name: 'Sopa de Lima Tradicional', cat: 'Entradas', price: 120, available: true },
    { id: 3, name: 'Poc Chuc con Frijol Colado', cat: 'Fuertes', price: 185, available: true },
    { id: 4, name: 'Queso Relleno Especial', cat: 'Fuertes', price: 240, available: false },
    { id: 5, name: 'Agua de Chaya con Limón', cat: 'Bebidas', price: 45, available: true },
    { id: 6, name: 'Marquesita con Queso de Bola', cat: 'Postres', price: 65, available: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Catálogo de Menú y Platillos
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Control de disponibilidad culinaria</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
        {dishes.map((d) => (
          <div
            key={d.id}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{d.cat}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: d.available ? '#15803D' : '#DC2626',
                  }}
                >
                  {d.available ? 'Disponible' : 'Agotado'}
                </span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: 'var(--color-ink)' }}>{d.name}</h4>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>${d.price} MXN</span>
              <button
                type="button"
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-canvas)',
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MockInventarioView: React.FC = () => {
  const items = [
    { id: 1, name: 'Carne de Cerdo (Pierna)', stock: 24, min: 10, unit: 'kg', status: 'Normal' },
    { id: 2, name: 'Recado Rojo / Achiote', stock: 4.5, min: 2, unit: 'kg', status: 'Normal' },
    { id: 3, name: 'Tortillas de Maíz', stock: 5, min: 8, unit: 'kg', status: 'Por Agotarse' },
    { id: 4, name: 'Queso de Bola (Edam)', stock: 2, min: 5, unit: 'piezas', status: 'Por Agotarse' },
    { id: 5, name: 'Hojas de Chaya Fresca', stock: 8, min: 3, unit: 'kg', status: 'Normal' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Control de Existencias en Almacén
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Materias primas e insumos</span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Insumo</th>
            <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Stock Actual</th>
            <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Mínimo</th>
            <th style={{ padding: '8px 12px', color: 'var(--color-muted)', fontWeight: 600 }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--color-ink)' }}>{it.name}</td>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.stock} {it.unit}</td>
              <td style={{ padding: '10px 12px', color: 'var(--color-muted)' }}>{it.min} {it.unit}</td>
              <td style={{ padding: '10px 12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: it.status === 'Normal' ? '#DCFCE7' : '#FEE2E2',
                    color: it.status === 'Normal' ? '#15803D' : '#B91C1C',
                  }}
                >
                  {it.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MockOrdenesView: React.FC = () => {
  const tickets = [
    { id: 104, mesa: 'Mesa 03', items: ['2x Panuchos Cochinita', '1x Sopa de Lima'], elapsed: '14 min', status: 'En Cocina' },
    { id: 105, mesa: 'Mesa 01', items: ['1x Poc Chuc', '2x Agua de Chaya'], elapsed: '8 min', status: 'En Cocina' },
    { id: 106, mesa: 'Mesa 04', items: ['1x Marquesita'], elapsed: '2 min', status: 'Listo para Despacho' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Pantalla KDS de Cocina & Comandas Activas
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Despacho y preparación de órdenes</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {tickets.map((tk) => (
          <div
            key={tk.id}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              backgroundColor: tk.status === 'Listo para Despacho' ? '#F0FDF4' : 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-ink)' }}>#{tk.id} · {tk.mesa}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                }}
              >
                ⏱ {tk.elapsed}
              </span>
            </div>

            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--color-ink)' }}>
              {tk.items.map((it, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{it}</li>
              ))}
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: tk.status === 'Listo para Despacho' ? '#15803D' : 'var(--color-primary)' }}>
                {tk.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MockCajaView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Terminal de Cobro y Facturación
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>Cierre de cuentas y emisión de tickets</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-ink)' }}>
            Cuenta Mesa 04 · Ticket #104
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>2x Panuchos Cochinita</span>
              <span>$190.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1x Sopa de Lima</span>
              <span>$120.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1x Poc Chuc</span>
              <span>$185.00</span>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              <span>Subtotal:</span>
              <span>$495.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-muted)' }}>
              <span>IVA (16%):</span>
              <span>$79.20</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              <span>Total a Cobrar:</span>
              <span>$574.20 MXN</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Método de Pago
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-control)', border: '2px solid var(--color-primary)', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>Efectivo</button>
            <button type="button" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '12px', cursor: 'pointer' }}>Tarjeta</button>
            <button type="button" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '12px', cursor: 'pointer' }}>Transferencia</button>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <button
              type="button"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--color-primary)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Confirmar Cobro ($574.20)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
