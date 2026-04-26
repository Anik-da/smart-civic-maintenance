import React from 'react';

export function Card({ children, className = '', title, icon: Icon }) {
  return (
    <article className={`neu-raised p-6 rounded-3xl ${className}`}>
      {(title || Icon) && (
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 tracking-tight flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </h2>
      )}
      {children}
    </article>
  );
}
