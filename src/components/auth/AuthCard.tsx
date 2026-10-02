import React, { useState } from 'react';
import { Card, Tabs, type TabItem } from '../ui';
import { LoginForm } from './LoginForm';
import { SetupAdminForm } from './SetupAdminForm';
import type { User, AuthSession } from '../../types/auth';

interface AuthCardProps {
  onLoginSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onLoginSuccess,
  onRequirePasswordChange,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'setup'>('login');

  const tabs: TabItem[] = [
    { id: 'login', label: 'Iniciar Sesión' },
    { id: 'setup', label: 'Configurar Admin' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--color-ink)', fontWeight: 700 }}>
          FMAT Restaurant
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: '6px 0 0' }}>
          Sistema de Autenticación y Control de Personal
        </p>
      </div>

      {/* Main Card */}
      <Card padding="md">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'login' | 'setup')}
          fullWidth
        />

        {activeTab === 'login' ? (
          <LoginForm
            onSuccess={onLoginSuccess}
            onRequirePasswordChange={onRequirePasswordChange}
          />
        ) : (
          <SetupAdminForm onSuccess={onLoginSuccess} />
        )}
      </Card>

      {/* Footer info */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
          UADY · Verificación y Validación 2026
        </p>
      </div>
    </div>
  );
};
