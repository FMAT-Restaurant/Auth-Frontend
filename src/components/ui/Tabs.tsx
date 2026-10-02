import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  fullWidth = true,
}) => {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '20px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              flex: fullWidth ? 1 : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
              cursor: 'pointer',
              outline: 'none',
              marginBottom: '-1px', // Sobrepone el borde activo
              transition: 'all 0.15s ease-in-out',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--color-ink)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--color-muted)';
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
