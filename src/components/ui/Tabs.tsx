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
  variant?: 'line' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  fullWidth = true,
  variant = 'line',
}) => {
  const isPills = variant === 'pills';

  const containerStyle: React.CSSProperties = isPills
    ? {
        display: 'flex',
        backgroundColor: 'var(--color-surface-elevated)',
        padding: '4px',
        borderRadius: 'var(--radius-control)',
        gap: '4px',
        border: '1px solid var(--color-border)',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '20px',
      }
    : {
        display: 'flex',
        borderBottom: '1px solid var(--color-border)',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '20px',
      };

  const getButtonStyle = (isActive: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      flex: fullWidth ? 1 : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: isActive ? 600 : 500,
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.15s ease-in-out',
    };

    if (isPills) {
      return {
        ...baseStyle,
        padding: '9px 16px',
        fontSize: '13px',
        color: isActive ? 'var(--color-ink)' : 'var(--color-muted)',
        backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
        border: isActive ? '1px solid var(--color-border)' : '1px solid transparent',
        borderRadius: 'var(--radius-sm)',
        boxShadow: isActive ? 'var(--shadow-card)' : 'none',
      };
    }

    return {
      ...baseStyle,
      padding: '12px 16px',
      fontSize: '14px',
      color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: `2px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
      marginBottom: '-1px',
    };
  };

  return (
    <div role="tablist" style={containerStyle}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={getButtonStyle(isActive)}
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
