import React, { useState } from 'react';
import { Sidebar, type NavModuleId } from './Sidebar';
import { MenuIcon } from '../ui/Icons';
import type { User } from '../../types/auth';

interface AppLayoutProps {
  currentUser: User;
  activeModule: NavModuleId;
  onSelectModule: (moduleId: NavModuleId) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  activeModule,
  onSelectModule,
  onLogout,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-canvas)', position: 'relative' }}>
      {/* Mobile Topbar (visible en pantallas < 1024px) */}
      <header className="fmat-mobile-topbar">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: 'var(--radius-control)',
          }}
          aria-label="Abrir navegación lateral"
        >
          <MenuIcon size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '14px',
            }}
          >
            F
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
            FMAT-RESTAURANT
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelectModule('perfil')}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
          aria-label="Ir a mi perfil"
        >
          {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
        </button>
      </header>

      {/* Backdrop oscuro para drawer móvil */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 45,
            backdropFilter: 'blur(2px)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar fijo en desktop, drawer deslizante en mobile/tablet */}
      <Sidebar
        currentUser={currentUser}
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        onLogout={onLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Área principal de contenido responsiva */}
      <main className="fmat-layout-main">
        {children}
      </main>
    </div>
  );
};
