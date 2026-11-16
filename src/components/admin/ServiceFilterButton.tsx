import React from 'react';

interface ServiceFilterButtonProps {
  label: string;
  count: string | number;
  isActive: boolean;
  badgeActive?: boolean;
  compact?: boolean;
  onClick: () => void;
}

export const ServiceFilterButton: React.FC<ServiceFilterButtonProps> = ({
  label,
  count,
  isActive,
  badgeActive,
  compact = false,
  onClick,
}) => {
  const highlightBadge = badgeActive ?? isActive;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: compact ? '6px' : '8px',
        width: '100%',
        textAlign: 'left',
        padding: compact ? '8px 10px' : '9px 10px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: 'pointer',
        fontSize: compact ? '12px' : '13px',
        fontWeight: isActive ? 700 : 500,
        backgroundColor: isActive ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={label}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          flexShrink: 0,
          padding: compact ? '1px 6px' : '2px 7px',
          borderRadius: '999px',
          backgroundColor: highlightBadge
            ? 'rgba(234, 88, 12, 0.16)'
            : 'rgba(107, 114, 128, 0.12)',
          color: highlightBadge ? 'var(--color-primary)' : 'var(--color-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );
};
