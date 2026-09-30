import React from 'react';
import { Card, Button } from '../ui';
import { PackageIcon, UtensilsIcon, MenuBookIcon, ArmchairIcon, CreditCardIcon } from '../ui/Icons';
import type { User } from '../../types/auth';
import type { NavModuleId } from '../layout/Sidebar';

interface DashboardHomeViewProps {
  currentUser: User;
  onNavigate: (moduleId: NavModuleId) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({ currentUser, onNavigate }) => {
  // Accesos rápidos derivados naturalmente de los módulos que tiene asignados
  const hasInventory = currentUser.permissions.some((p) => p.startsWith('inventory:') || p === '*');
  const hasOrders = currentUser.permissions.some((p) => p.startsWith('orders:') || p.startsWith('kitchen:') || p === '*');
  const hasMenu = currentUser.permissions.some((p) => p.startsWith('menu:') || p === '*');
  const hasSala = currentUser.permissions.some((p) => p.startsWith('sala:') || p === '*');
  const hasBilling = currentUser.permissions.some((p) => p.startsWith('billing:') || p === '*');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header sin insignias técnicas */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--color-ink)', fontWeight: 700, margin: 0 }}>
          Bienvenido, {currentUser.displayName}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Identificador: <strong>{currentUser.staffId || 'ADMINISTRADOR'}</strong>
          </span>
          {currentUser.roleLabel && (
            <>
              <span style={{ color: 'var(--color-border)' }}>•</span>
              <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                Puesto: <strong style={{ color: 'var(--color-primary)' }}>{currentUser.roleLabel}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Módulos disponibles para el usuario */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-ink)', fontWeight: 700 }}>
          Módulos de trabajo
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {hasInventory && (
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PackageIcon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Inventario y Almacén
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Gestión de existencias, control de ingredientes y actualización de estados de disponibilidad.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('inventario')}>
                Abrir módulo →
              </Button>
            </Card>
          )}

          {hasOrders && (
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UtensilsIcon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Órdenes y Cocina
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Apertura y seguimiento de comandas, visualización de pedidos en KDS y despacho culinario.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('ordenes')}>
                Abrir módulo →
              </Button>
            </Card>
          )}

          {hasMenu && (
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MenuBookIcon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Menú y Catálogo
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Consulta de catálogo gastronómico, categorías, recetas y disponibilidad comercial.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('menu')}>
                Abrir módulo →
              </Button>
            </Card>
          )}

          {hasSala && (
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ArmchairIcon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Sala y Mesas
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Mapa de distribución del restaurante, asignación de comensales y control de mesas.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('sala')}>
                Abrir módulo →
              </Button>
            </Card>
          )}

          {hasBilling && (
            <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-control)',
                      backgroundColor: 'var(--color-primary-soft)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CreditCardIcon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                    Caja y Cuentas
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Emisión de pre-cuentas de mesa, cobro y registro de formas de pago.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onNavigate('caja')}>
                Abrir módulo →
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
