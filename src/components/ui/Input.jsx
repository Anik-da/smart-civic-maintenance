import React from 'react';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-purple-300 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-5 py-4 rounded-2xl text-base text-white placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-white/5 border border-white/10 ${error ? 'ring-2 ring-red-500' : ''}`}
        {...props}
      />
      {error && <p className="text-sm text-red-400 font-medium ml-1">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
