
export function Card({ children, className = '', title, icon: Icon }) {
  return (
    <article className={`glass glass-card ${className}`}>
      {(title || Icon) && (
        <div className="mb-6">
          <div className="glass-card__label flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {title || "COMPONENT"}
          </div>
        </div>
      )}
      <div className="glass-card__body text-white">
        {children}
      </div>
    </article>
  );
}
