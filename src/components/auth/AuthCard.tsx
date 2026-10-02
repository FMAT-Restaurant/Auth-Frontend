import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tabs, type TabItem } from '../ui';
import { LoginForm } from './LoginForm';
import { SetupAdminForm } from './SetupAdminForm';
import { authApi } from '../../services/authApi';
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
  const [isAdminConfigured, setIsAdminConfigured] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await authApi.getSetupStatus();
      setIsAdminConfigured(res.configured);
    } catch {
      setIsAdminConfigured(false);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'login' | 'setup');
    if (tabId === 'setup') {
      fetchStatus();
    }
  };

  const tabs: TabItem[] = [
    { id: 'login', label: 'Iniciar Sesión' },
    { id: 'setup', label: 'Registrar Admin' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--color-ink)', fontWeight: 700, margin: 0 }}>
          FMAT Restaurant
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '6px', marginBottom: 0 }}>
          Sistema de Autenticación y Control de Personal
        </p>
      </div>

      {/* Main Card */}
      <Card padding="md">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          fullWidth
          variant="pills"
        />

        {activeTab === 'login' ? (
          <LoginForm
            onSuccess={onLoginSuccess}
            onRequirePasswordChange={onRequirePasswordChange}
          />
        ) : (
          <SetupAdminForm
            onSuccess={onLoginSuccess}
            isConfigured={isAdminConfigured === true}
            isLoadingStatus={isLoadingStatus}
            onSwitchToLogin={() => setActiveTab('login')}
            onRefreshStatus={fetchStatus}
          />
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
