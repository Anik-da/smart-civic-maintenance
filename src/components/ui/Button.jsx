import React from 'react';

export function Button({ children, variant = 'default', className = '', isLoading, ...props }) {
  const baseClasses = 'py-4 px-8 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    default: 'glass-card text-white hover:bg-white/10',
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
      ) : null}
      {children}
    </button>
  );
}
