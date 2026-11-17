import React from 'react';

interface UtilityCardProps {
  title?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  dark?: boolean;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export const UtilityCard: React.FC<UtilityCardProps> = ({
  title,
  badge,
  rightAction,
  dark = false,
  className = '',
  bodyClassName = '',
  children,
}) => {
  const surfaceClass = dark
    ? 'bg-[#0f172a] text-slate-100 border border-[#334155]'
    : 'bg-[#ffffff] text-[#0f172a] border border-[#cbd5e1]';

  return (
    <section className={`rounded-[10px] p-3.5 flex flex-col min-h-0 ${surfaceClass} ${className}`}>
      {(title || rightAction) && (
        <header className="flex items-center justify-between gap-2.5 mb-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <h3 className="text-[14.5px] font-semibold tracking-[-0.015em] whitespace-nowrap">
                {title}
              </h3>
            )}
            {badge}
          </div>
          {rightAction && <div className="shrink-0 flex items-center gap-1.5">{rightAction}</div>}
        </header>
      )}
      <div className={`flex-1 min-h-0 flex flex-col ${bodyClassName}`}>{children}</div>
    </section>
  );
};
