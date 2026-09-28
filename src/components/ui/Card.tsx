import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  bordered = true,
  className = '',
  style,
  ...props
}) => {
  const paddingStyles: Record<string, string> = {
    none: '0',
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div
      className={`fmat-card ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-card)',
        border: bordered ? '1px solid var(--color-border)' : 'none',
        boxShadow: 'var(--shadow-card)',
        padding: paddingStyles[padding],
        width: '100%',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
