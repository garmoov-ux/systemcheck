import React from 'react';

interface OptionChipProps {
  label?: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const OptionChip: React.FC<OptionChipProps> = ({
  label,
  count,
  selected = false,
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[29px] px-2.5 rounded-[6px] text-[12px] whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer select-none ${
        selected
          ? 'bg-[#2563eb] text-white font-semibold border border-[#2563eb]'
          : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] font-medium border border-[#cbd5e1]'
      }`}
    >
      {children ?? (
        <>
          <span>{label}</span>
          {count !== undefined && (
            <span className={`text-[11px] ${selected ? 'text-blue-100' : 'text-[#64748b]'}`}>
              {count.toLocaleString()}
            </span>
          )}
        </>
      )}
    </button>
  );
};
