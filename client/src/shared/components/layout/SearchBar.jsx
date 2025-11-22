import { useState, useEffect } from "react";

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  onSearch = null 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (value) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [value]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`relative transition-all duration-300 ${
        isFocused ? 'ring-2 ring-[#00A8E8]/20' : ''
      }`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-[#2A2A2A] border border-[#444] rounded-lg pl-12 pr-4 py-3 focus:border-[#00A8E8] focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
          aria-label="Search projects"
        />
        
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <svg
            className={`w-5 h-5 transition-colors duration-300 ${
              isFocused ? 'text-[#00A8E8]' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Clear Button */}
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-[#00A8E8] rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-[#00A8E8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-[#00A8E8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Search Suggestions (if needed) */}
      {isFocused && value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#2A2A2A] border border-[#444] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          <div className="p-3 text-sm text-gray-400">
            Press Enter to search for "{value}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
