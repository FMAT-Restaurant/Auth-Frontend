import React, { useState, useEffect } from 'react';
import { AuthCard } from './components/auth/AuthCard';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardHomeView } from './components/dashboard/DashboardHomeView';
import { StaffManagementView } from './components/admin/StaffManagementView';
import { ModulePlaceholderView } from './components/layout/ModulePlaceholderView';
import { authStorage } from './services/authStorage';
import { authApi } from './services/authApi';
import type { NavModuleId } from './components/layout/Sidebar';
import type { User, AuthSession } from './types/auth';

export const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(() => authStorage.getSession());
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [tempToken, setTempToken] = useState<string | undefined>(undefined);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<NavModuleId>('inicio');

  useEffect(() => {
    if (currentSession) {
      authStorage.saveSession(currentSession);
    } else {
      authStorage.clearSession();
    }
  }, [currentSession]);

  const handleLoginSuccess = (session: AuthSession) => {
    setCurrentSession(session);
    setActiveModule('inicio');
  };

  const handleRequirePasswordChange = (user: User) => {
    setTempUser(user);
    // Guardamos el token temporal si existía en la sesión
    setTempToken(currentSession?.accessToken);
    setIsChangePasswordOpen(true);
  };

  const handlePasswordChangeSuccess = (newToken?: string) => {
    if (tempUser) {
      const activeUser: User = {
        ...tempUser,
        mustChangePassword: false,
      };
      const newSession: AuthSession = {
        accessToken: newToken || currentSession?.accessToken || 'mock_jwt_activated_token',
        user: activeUser,
      };
      setCurrentSession(newSession);
    }
    setIsChangePasswordOpen(false);
    setTempUser(null);
    setTempToken(undefined);
    setActiveModule('inicio');
  };

  const handleLogout = async () => {
    if (currentSession?.accessToken) {
      await authApi.logout(currentSession.accessToken);
    }
    setCurrentSession(null);
    setTempUser(null);
    setTempToken(undefined);
    setIsChangePasswordOpen(false);
    setActiveModule('inicio');
    authStorage.clearSession();
  };

  // 1. Pantalla de Autenticación (si no hay sesión)
  if (!currentSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          backgroundColor: 'var(--color-canvas)',
        }}
      >
        <AuthCard
          onLoginSuccess={handleLoginSuccess}
          onRequirePasswordChange={handleRequirePasswordChange}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          user={tempUser}
          token={tempToken}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={() => {
            setIsChangePasswordOpen(false);
            setTempUser(null);
            setTempToken(undefined);
          }}
        />
      </div>
    );
  }

  const { user } = currentSession;

  // 2. Renderizado de la vista según el módulo activo en la Sidebar
  const renderActiveModuleContent = () => {
    switch (activeModule) {
      case 'inicio':
        return <DashboardHomeView currentUser={user} onNavigate={setActiveModule} />;
      case 'personal':
        if (user.userType === 'ADMIN') {
          return <StaffManagementView currentUser={user} onLogout={handleLogout} />;
        }
        return <DashboardHomeView currentUser={user} onNavigate={setActiveModule} />;
      case 'inventario':
      case 'sala':
      case 'menu':
      case 'ordenes':
      case 'caja':
      default:
        return <ModulePlaceholderView moduleId={activeModule} currentUser={user} />;
    }
  };

  // 3. Layout principal con Sidebar lateral y contenido
  return (
    <AppLayout
      currentUser={user}
      activeModule={activeModule}
      onSelectModule={setActiveModule}
      onLogout={handleLogout}
    >
      {renderActiveModuleContent()}
    </AppLayout>
  );
};

export default App;
