import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = '장비번호 또는 IP 주소 검색...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-[#7a7a7a] absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[36px] pl-10 pr-8 rounded-full bg-[#ffffff] border border-[#e0e0e0] text-[14px] text-[#1d1d1f] placeholder:text-[#7a7a7a] focus:outline-2 focus:outline-[#0071e3] focus:border-transparent"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 text-[#7a7a7a] hover:text-[#1d1d1f] cursor-pointer"
          aria-label="검색어 지우기"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
