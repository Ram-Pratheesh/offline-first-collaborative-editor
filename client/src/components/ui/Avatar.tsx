import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  online,
  className = '',
}) => {
  const initials = name
    ? name.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-bg-tertiary`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-bg-tertiary`}
          style={{ background: 'linear-gradient(135deg, #ff508a, #7147ed)' }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`
            absolute -bottom-0.5 -right-0.5 block rounded-full ring-2 ring-bg-card
            ${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
            ${online ? 'bg-success' : 'bg-text-muted'}
          `}
        />
      )}
    </div>
  );
};

interface AvatarGroupProps {
  users: { name: string; avatar?: string }[];
  max?: number;
  size?: 'sm' | 'md';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ users, max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar key={i} src={user.avatar} name={user.name} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}
            rounded-full bg-bg-elevated flex items-center justify-center
            font-medium text-text-secondary ring-2 ring-bg-card
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
