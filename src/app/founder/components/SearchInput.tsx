import React, { useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search workspaces...",
}) => {
  const [input, setInput] = useState(value);

  // Debounce or update immediately as needed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
        placeholder={placeholder}
        value={input}
        onChange={handleChange}
        aria-label="Search workspaces"
      />
      <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.6 10.6z"
          />
        </svg>
      </span>
    </div>
  );
};

export default SearchInput;
