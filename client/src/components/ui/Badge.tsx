import React from 'react';

interface BadgeProps {
  variant?: 'online' | 'offline' | 'syncing' | 'default' | 'purple' | 'blue';
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses = {
  online: 'bg-success/15 text-success border border-success/20',
  offline: 'bg-warning/15 text-warning border border-warning/20',
  syncing: 'bg-info/15 text-info border border-info/20',
  default: 'bg-bg-elevated text-text-secondary border border-border-default',
  purple: 'bg-purple-primary/15 text-purple-light border border-purple-primary/20',
  blue: 'bg-blue-primary/15 text-blue-light border border-blue-primary/20',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
  pulse = false,
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        text-xs font-medium rounded-full
        ${variantClasses[variant]}
        ${className}
      `}
      style={{ padding: '0.25rem 0.75rem' }}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};
