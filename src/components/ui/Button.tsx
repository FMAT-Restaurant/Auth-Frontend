import React from 'react';
import { LoaderIcon } from './Icons';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  // Estilos base para garantizar concordancia estricta con la Guía Visual FMAT v2.0
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-control)',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled && !isLoading ? 0.6 : 1,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    userSelect: 'none',
    ...style,
  };

  // Altura y espaciado según tamaño (Pág. 04 Guía visual)
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: { height: '32px', padding: '0 12px', fontSize: '13px' },
    md: { height: '40px', padding: '0 16px', fontSize: '14px' },
    lg: { height: '48px', padding: '0 20px', fontSize: '16px' }, // Optimizado para touch
  };

  // Colores por variante
  const variantStyles: Record<ButtonVariant, { normal: React.CSSProperties; hover?: React.CSSProperties }> = {
    primary: {
      normal: {
        backgroundColor: 'var(--color-primary)',
        color: '#FFFFFF',
        borderColor: 'var(--color-primary)',
      },
    },
    secondary: {
      normal: {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      },
    },
    outline: {
      normal: {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        borderColor: 'var(--color-border)',
      },
    },
    tertiary: {
      normal: {
        backgroundColor: 'transparent',
        color: 'var(--color-primary)',
        borderColor: 'transparent',
      },
    },
    destructive: {
      normal: {
        backgroundColor: 'var(--color-error)',
        color: '#FFFFFF',
        borderColor: 'var(--color-error)',
      },
    },
    danger: {
      normal: {
        backgroundColor: 'var(--color-error)',
        color: '#FFFFFF',
        borderColor: 'var(--color-error)',
      },
    },
  };

  return (
    <button
      disabled={isDisabled}
      className={`fmat-button fmat-button--${variant} fmat-button--${size} ${className}`}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant].normal,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          if (variant === 'secondary' || variant === 'outline') e.currentTarget.style.backgroundColor = 'var(--color-canvas)';
          if (variant === 'tertiary') e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)';
          if (variant === 'destructive' || variant === 'danger') e.currentTarget.style.backgroundColor = '#B91C1C';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          if (variant === 'secondary' || variant === 'outline') e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          if (variant === 'tertiary') e.currentTarget.style.backgroundColor = 'transparent';
          if (variant === 'destructive' || variant === 'danger') e.currentTarget.style.backgroundColor = 'var(--color-error)';
        }
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderIcon size={size === 'sm' ? 14 : 18} />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
