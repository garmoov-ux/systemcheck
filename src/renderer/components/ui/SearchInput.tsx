import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = '검색...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[30px] pl-8 pr-3 rounded-[7px] bg-[#f8fafc] text-[#0f172a] text-[12.5px] border border-[#cbd5e1] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#2563eb] placeholder:text-[#64748b]"
      />
    </div>
  );
};
