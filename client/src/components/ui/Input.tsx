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
    <div className={`flex flex-col ${className}`} style={{ gap: '12px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ display: 'block', fontSize: '15px', fontWeight: 600, color: '#2b2747' }}
        >
          {label}
        </label>
      )}
      <div 
        style={{ 
          height: '64px', 
          display: 'grid', 
          gridTemplateColumns: icon ? '40px minmax(0, 1fr)' : 'minmax(0, 1fr)', 
          alignItems: 'center', 
          boxSizing: 'border-box', 
          padding: icon ? '0 24px' : '0 24px', 
          border: error ? '1px solid #f43f5e' : '1px solid #dedbe8', 
          borderRadius: '16px', 
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
        }}
      >
        {icon && (
          <div style={{ color: '#7935f5', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            {icon}
          </div>
        )}
        <input
          id={inputId}
          style={{ 
            width: '100%', 
            minWidth: 0, 
            height: '100%', 
            padding: 0, 
            border: 0, 
            outline: 'none', 
            background: 'transparent', 
            color: '#282441', 
            fontSize: '16px' 
          }}
          {...props}
        />
      </div>
      {error && (
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#f43f5e' }}>{error}</p>
      )}
    </div>
  );
};
