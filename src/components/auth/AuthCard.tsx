import React, { useState } from 'react';
import { Card, Tabs, type TabItem } from '../ui';
import { LoginForm } from './LoginForm';
import { RegisterRestaurantForm } from './RegisterRestaurantForm';
import type { User, AuthSession } from '../../types/auth';

interface AuthCardProps {
  onLoginSuccess: (session: AuthSession) => void;
  onRequirePasswordChange: (tempUser: User) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onLoginSuccess,
  onRequirePasswordChange,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const tabs: TabItem[] = [
    { id: 'login', label: 'Iniciar Sesión' },
    { id: 'register', label: 'Registrar Restaurante' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--color-primary-soft)',
            borderRadius: '9999px',
            marginBottom: '12px',
          }}
        >
        </div>

        <h1 style={{ fontSize: '26px', color: 'var(--color-ink)', fontWeight: 700 }}>
          FMAT Restaurant
        </h1>
      </div>

      {/* Main Card */}
      <Card padding="md">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'login' | 'register')}
          fullWidth
        />

        {activeTab === 'login' ? (
          <LoginForm
            onSuccess={onLoginSuccess}
            onRequirePasswordChange={onRequirePasswordChange}
          />
        ) : (
          <RegisterRestaurantForm onSuccess={onLoginSuccess} />
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
