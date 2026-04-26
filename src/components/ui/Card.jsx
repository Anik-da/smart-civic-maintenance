import React from 'react';

export function Card({ children, className = '', title, icon: Icon }) {
  return (
    <article className={`glass-card p-8 rounded-3xl animate-fade-in-up ${className}`}>
      {(title || Icon) && (
        <h2 className="text-xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-purple-400" />}
          <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">{title}</span>
        </h2>
      )}
      {children}
    </article>
  );
}
