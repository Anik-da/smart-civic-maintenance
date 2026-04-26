import React from 'react';

export function Button({ children, variant = 'default', className = '', isLoading, ...props }) {
  const baseClasses = 'py-3.5 px-7 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variants = {
    default: 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-purple-500/30',
    primary: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_30px_rgba(124,58,237,0.5)] hover:bg-right',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)]',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_4px_20px_rgba(239,68,68,0.3)]',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant] || variants.default} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
      ) : null}
      {children}
    </button>
  );
}
