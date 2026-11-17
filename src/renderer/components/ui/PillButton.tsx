import React from 'react';

export type PillButtonVariant = 'primary' | 'secondary-pill' | 'dark-utility' | 'pearl-capsule';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none';

  const sizeClass =
    size === 'sm'
      ? 'h-[30px] px-3 text-[12.5px] leading-none'
      : 'h-[34px] px-4 text-[13px] leading-none';

  const variantMap: Record<PillButtonVariant, string> = {
    primary: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-[7px]',
    'secondary-pill':
      'bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1d4ed8] border border-[#93c5fd] rounded-[7px]',
    'dark-utility': 'bg-[#1e293b] hover:bg-[#334155] text-white rounded-[7px]',
    'pearl-capsule':
      'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1] rounded-[7px]',
  };

  return (
    <button className={`${base} ${sizeClass} ${variantMap[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
