import {
  HomeIcon,
  PackageIcon,
  MenuBookIcon,
  UtensilsIcon,
  ArmchairIcon,
  CreditCardIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
} from '../ui/Icons';
import type { User } from '../../types/auth';

export type NavModuleId = 'inicio' | 'sala' | 'menu' | 'inventario' | 'ordenes' | 'caja' | 'personal' | 'perfil';

interface NavItem {
  id: NavModuleId;
  label: string;
  icon: React.ReactNode;
  requiredModule?: string;
  adminOnly?: boolean;
}

interface SidebarProps {
  currentUser: User;
  activeModule: NavModuleId;
  onSelectModule: (moduleId: NavModuleId) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeModule,
  onSelectModule,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const serviceItems: NavItem[] = [
    { id: 'sala', label: 'Sala', icon: <ArmchairIcon size={18} />, requiredModule: 'sala' },
    { id: 'menu', label: 'Menú', icon: <MenuBookIcon size={18} />, requiredModule: 'menu' },
    { id: 'inventario', label: 'Inventario', icon: <PackageIcon size={18} />, requiredModule: 'inventory' },
    { id: 'ordenes', label: 'Órdenes y Cocina', icon: <UtensilsIcon size={18} />, requiredModule: 'orders' },
    { id: 'caja', label: 'Caja', icon: <CreditCardIcon size={18} />, requiredModule: 'billing' },
  ];

  const managementItems: NavItem[] = [
    { id: 'personal', label: 'Personal y Roles', icon: <SettingsIcon size={18} />, adminOnly: true },
  ];

  const isItemVisible = (item: NavItem) => {
    if (currentUser.userType === 'ADMIN') return true;
    if (item.adminOnly) return false;
    if (!item.requiredModule) return true;
    return currentUser.permissions.some(
      (p) => p.startsWith(`${item.requiredModule}:`) || p === '*'
    );
  };

  const visibleServiceItems = serviceItems.filter(isItemVisible);
  const visibleManagementItems = managementItems.filter(isItemVisible);

  const renderNavButton = (item: NavItem) => {
    const isActive = activeModule === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectModule(item.id);
          if (onCloseMobile) onCloseMobile();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          padding: '10px 14px',
          fontSize: '14px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
          backgroundColor: isActive ? 'var(--color-primary-soft)' : 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-control)',
          cursor: 'pointer',
          textAlign: 'left',
          outline: 'none',
          transition: 'all 0.15s ease-in-out',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
          }}
        >
          {item.icon}
        </span>
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className={`fmat-sidebar ${isMobileOpen ? 'fmat-sidebar--open' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px',
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            F
          </div>
          <div>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--color-ink)',
                letterSpacing: '-0.02em',
                display: 'block',
              }}
            >
              FMAT-RESTAURANT
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              Sistema de Restaurante
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            className="fmat-mobile-close-btn"
            onClick={onCloseMobile}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-control)',
            }}
            aria-label="Cerrar navegación"
          >
            <XIcon size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          padding: '16px 12px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Inicio */}
        {renderNavButton({ id: 'inicio', label: 'Inicio', icon: <HomeIcon size={18} /> })}

        {/* Sección: Servicios */}
        {visibleServiceItems.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 12px',
              }}
            >
              Servicios
            </span>
            {visibleServiceItems.map(renderNavButton)}
          </div>
        )}

        {/* Sección: Gestión */}
        {visibleManagementItems.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 12px',
              }}
            >
              Gestión
            </span>
            {visibleManagementItems.map(renderNavButton)}
          </div>
        )}
      </nav>

      {/* Bottom Profile & Logout Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* User Card / Click to open Perfil & Configuración */}
        <button
          type="button"
          onClick={() => {
            onSelectModule('perfil');
            if (onCloseMobile) onCloseMobile();
          }}
          title="Ver perfil y configuración"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-control)',
            backgroundColor:
              activeModule === 'perfil'
                ? 'var(--color-primary-soft)'
                : 'var(--color-canvas)',
            border:
              activeModule === 'perfil'
                ? '1px solid var(--color-primary)'
                : '1px solid var(--color-border)',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.15s ease-in-out',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (activeModule !== 'perfil') {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeModule !== 'perfil') {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor:
                activeModule === 'perfil'
                  ? 'var(--color-primary)'
                  : 'var(--color-primary-soft)',
              color:
                activeModule === 'perfil' ? '#FFFFFF' : 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
              transition: 'all 0.15s ease-in-out',
            }}
          >
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color:
                  activeModule === 'perfil'
                    ? 'var(--color-primary)'
                    : 'var(--color-ink)',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser.displayName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                {currentUser.staffId || 'ADMIN'}
              </span>
              {currentUser.roleLabel && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.roleLabel}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              color:
                activeModule === 'perfil'
                  ? 'var(--color-primary)'
                  : 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <SettingsIcon size={16} />
          </div>
        </button>

        {/* Reallocated Logout Button */}
        <button
          type="button"
          onClick={() => {
            onLogout();
            if (onCloseMobile) onCloseMobile();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            height: '36px',
            padding: '0 12px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text)',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
            e.currentTarget.style.borderColor = 'var(--color-error)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
        >
          <LogOutIcon size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
