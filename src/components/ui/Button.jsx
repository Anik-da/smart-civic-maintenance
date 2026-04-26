import React from 'react';

export function Button({ children, variant = 'default', className = '', isLoading, ...props }) {
  const baseClasses = 'glass glass-btn';
  
  const variants = {
    default: 'glass-btn--ghost',
    primary: 'glass-btn--primary',
    success: 'glass-badge--lime', // Using lime theme for success
    danger: 'glass-btn--danger',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant] || variants.default} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
      ) : null}
      {children}
    </button>
  );
}
