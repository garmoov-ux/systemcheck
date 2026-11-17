import React from 'react';

interface OptionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  count?: number;
}

export const OptionChip: React.FC<OptionChipProps> = ({ label, selected, onClick, count }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[32px] px-3.5 rounded-full text-[13px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer select-none ${
        selected
          ? 'bg-[#ffffff] text-[#1d1d1f] border-2 border-[#0066cc] font-semibold'
          : 'bg-[#fafafc] text-[#333333] border border-[#e0e0e0] font-normal hover:bg-[#f0f0f3]'
      }`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`text-[11px] ${selected ? 'text-[#0066cc]' : 'text-[#7a7a7a]'}`}>
          {count}
        </span>
      )}
    </button>
  );
};
