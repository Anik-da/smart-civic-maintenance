import React from 'react';

export const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-aqua/80 ml-1 tracking-wide" style={{ color: 'rgba(94, 231, 223, 0.8)' }}>
          {label}
        </label>
      )}
      <div className="glass-input-wrap">
        <input
          ref={ref}
          className={`glass-input ${error ? 'border-red-500/50' : ''}`}
          {...props}
        />
        {props.type === 'email' && <span className="glass-input-icon">✉</span>}
      </div>
      {error && <p className="text-xs text-red-400 font-medium ml-1 mt-1">✕ {error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
