import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui';
import { LoginForm } from './LoginForm';
import { SetupAdminForm } from './SetupAdminForm';
import { authApi } from '../../services/authApi';
import type { User, AuthSession } from '../../types/auth';

interface AuthCardProps {
  onLoginSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User, token?: string, currentPassword?: string) => void;
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
    void fetchStatus();
  }, [fetchStatus]);

  const handleOpenSetup = () => {
    setActiveTab('setup');
    void fetchStatus();
  };

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', color: 'var(--color-ink)', fontWeight: 700, margin: 0 }}>
          FMAT Restaurant
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: '6px 0 0' }}>
          Sistema de Restaurante
        </p>
      </div>

      {/* Main Card */}
      <Card padding="md">
        {activeTab === 'login' ? (
          <>
            <LoginForm
              onSuccess={onLoginSuccess}
              onRequirePasswordChange={onRequirePasswordChange}
            />
            <div
              style={{
                textAlign: 'center',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                type="button"
                onClick={handleOpenSetup}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-control)',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Registrar al administrador
              </button>
            </div>
          </>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Configuración Inicial de Administrador
              </h2>
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                ← Iniciar Sesión
              </button>
            </div>
            <SetupAdminForm
              onSuccess={onLoginSuccess}
              isConfigured={isAdminConfigured === true}
              isLoadingStatus={isLoadingStatus}
              onSwitchToLogin={() => setActiveTab('login')}
              onRefreshStatus={fetchStatus}
            />
          </div>
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
