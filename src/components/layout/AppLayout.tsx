import React from 'react';
import { Sidebar, type NavModuleId } from './Sidebar';
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
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-canvas)' }}>
      {/* Sidebar fijo a la izquierda */}
      <Sidebar
        currentUser={currentUser}
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        onLogout={onLogout}
      />

      {/* Área principal de contenido */}
      <main
        style={{
          marginLeft: '260px',
          flex: 1,
          minHeight: '100vh',
          padding: '32px 40px',
          backgroundColor: 'var(--color-canvas)',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  );
};
