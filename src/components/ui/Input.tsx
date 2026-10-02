import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, AlertCircleIcon } from './Icons';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  isPasswordToggleable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightAction,
  isPasswordToggleable = false,
  required,
  type = 'text',
  disabled,
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const effectiveType = isPasswordToggleable ? (showPassword ? 'text' : 'password') : type;
  const hasError = Boolean(error);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }} className={className}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          backgroundColor: disabled ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
          borderRadius: 'var(--radius-control)',
          border: `1px solid ${hasError ? 'var(--color-error)' : isFocused ? 'var(--color-primary)' : 'var(--color-border)'}`,
          boxShadow: isFocused ? (hasError ? '0 0 0 1px var(--color-error)' : '0 0 0 1px var(--color-primary)') : 'none',
          transition: 'all 0.15s ease-in-out',
        }}
      >
        {leftIcon && (
          <div
            style={{
              paddingLeft: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: '100%',
            height: '40px',
            padding: leftIcon ? '0 12px 0 8px' : '0 12px',
            paddingRight: isPasswordToggleable || rightAction ? '40px' : '12px',
            fontSize: '14px',
            color: disabled ? 'var(--color-muted)' : 'var(--color-ink)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          {...props}
        />

        {isPasswordToggleable && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        )}

        {!isPasswordToggleable && rightAction && (
          <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center' }}>
            {rightAction}
          </div>
        )}
      </div>

      {hasError ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-error)',
            fontSize: '13px',
            marginTop: '2px',
          }}
        >
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <span style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
