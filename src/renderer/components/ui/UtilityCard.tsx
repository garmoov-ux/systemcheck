import React from 'react';

interface UtilityCardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const UtilityCard: React.FC<UtilityCardProps> = ({
  title,
  subtitle,
  badge,
  rightAction,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <section
      className={`bg-[#ffffff] rounded-[18px] border border-[#e0e0e0] p-5 flex flex-col ${className}`}
    >
      {(title || rightAction) && (
        <header className="flex items-center justify-between gap-3 mb-3.5 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && (
                <h2 className="text-[17px] font-semibold leading-[1.25] tracking-[-0.015em] text-[#1d1d1f] whitespace-nowrap">
                  {title}
                </h2>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-[13px] text-[#7a7a7a] mt-0.5 leading-[1.35] truncate">{subtitle}</p>
            )}
          </div>
          {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
      )}
      <div className={`flex-1 min-h-0 flex flex-col ${bodyClassName}`}>{children}</div>
    </section>
  );
};
