import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  style = {},
  ...props
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 700,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    border: 0,
    transition: 'all 0.2s',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: '36px', padding: '0 16px', fontSize: '14px', borderRadius: '10px' },
    md: { height: '44px', padding: '0 24px', fontSize: '15px', borderRadius: '12px' },
    lg: { height: '56px', padding: '0 32px', fontSize: '16px', borderRadius: '14px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(90deg, #ff4c58, #ed38ae, #793bf0)',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(214, 60, 202, 0.2)',
    },
    secondary: {
      background: '#ffffff',
      color: '#15103c',
      border: '1px solid #dedbe8',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    ghost: {
      background: 'transparent',
      color: '#656180',
    },
    danger: {
      background: '#f43f5e',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.2)',
    },
  };

  const combinedStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={className}
      style={combinedStyle}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="inline-flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};
