import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  onFilterClick
}) => {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-black/90 backdrop-blur-xl border border-gray-800 rounded-2xl pl-12 pr-16 py-4 text-white placeholder-gray-500 focus:border-primary outline-none transition-colors"
        />
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Filter size={16} />
          </button>
        )}
      </div>
    </div>
  );
};