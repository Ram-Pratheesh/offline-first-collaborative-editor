import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col" style={{ gap: '0.625rem' }}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-text-muted pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full h-12 bg-bg-tertiary border border-border-default rounded-xl
            text-text-primary placeholder-text-muted
            focus:outline-none focus:border-indigo-primary focus:ring-2 focus:ring-indigo-primary/20
            transition-all duration-200 shadow-sm
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${className}
          `}
          style={{ paddingLeft: icon ? '3.25rem' : '1rem', paddingRight: '1rem' }}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-error font-medium">{error}</p>
      )}
    </div>
  );
};
