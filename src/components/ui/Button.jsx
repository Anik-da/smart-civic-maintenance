import React from 'react';

export function Button({ children, variant = 'default', className = '', isLoading, ...props }) {
  const baseClasses = 'neu-btn neu-focus py-3 px-6 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2';
  
  const variants = {
    default: 'neu-raised text-gray-600 dark:text-gray-300',
    primary: 'text-white bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg',
    success: 'text-white bg-gradient-to-br from-green-500 to-green-600 shadow-lg',
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
