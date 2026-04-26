import React from 'react';

export function Card({ children, className = '', title, icon: Icon }) {
  return (
    <article className={`glass-card p-8 rounded-[2rem] ${className}`}>
      {(title || Icon) && (
        <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-purple-400" />}
          {title}
        </h2>
      )}
      {children}
    </article>
  );
}
