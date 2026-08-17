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

const variants = {
  primary: 'gradient-purple-blue text-white hover:opacity-90 shadow-lg shadow-indigo-500/25',
  secondary: 'bg-bg-card text-text-primary border border-border-default hover:bg-bg-card-hover hover:border-border-accent',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-card',
  danger: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
};

const sizes = {
  sm: 'px-3 h-9 text-sm rounded-lg',
  md: 'px-5 h-11 text-sm rounded-xl',
  lg: 'px-12 h-14 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
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
