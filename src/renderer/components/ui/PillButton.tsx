import React from 'react';

export type PillButtonVariant = 'primary' | 'secondary-pill' | 'pearl-capsule' | 'dark-utility';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<PillButtonVariant, string> = {
  primary:
    'bg-[#0066cc] text-white rounded-full border border-transparent hover:brightness-105 focus-visible:outline-2 focus-visible:outline-[#0071e3]',
  'secondary-pill':
    'bg-transparent text-[#0066cc] rounded-full border border-[#0066cc] hover:bg-[#0066cc]/5 focus-visible:outline-2 focus-visible:outline-[#0071e3]',
  'pearl-capsule':
    'bg-[#fafafc] text-[#1d1d1f] rounded-[11px] border border-[#e0e0e0] hover:bg-[#f0f0f3] focus-visible:outline-2 focus-visible:outline-[#0071e3]',
  'dark-utility':
    'bg-[#272729] text-white rounded-[8px] border border-transparent hover:bg-[#333336] focus-visible:outline-2 focus-visible:outline-[#0071e3]',
};

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'h-[34px] px-4 text-[13px] font-normal',
  md: 'h-[38px] px-5 text-[14px] font-normal',
};

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-transform duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
