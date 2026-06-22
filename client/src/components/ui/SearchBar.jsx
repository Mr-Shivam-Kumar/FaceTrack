import { useState, useCallback, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiCommand } from 'react-icons/fi';
import { debounce } from '../../utils/helpers';

/**
 * SearchBar - Global search input with debounce and keyboard shortcut
 * @param {object} props
 * @param {string} props.placeholder
 * @param {Function} props.onSearch - Callback with search value
 * @param {string} props.className
 * @param {boolean} props.showShortcut - Show Ctrl+K hint
 */
const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  className = '',
  showShortcut = true,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((val) => {
      onSearch?.(val);
    }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    debouncedSearch(val);
  };

  const handleClear = () => {
    setValue('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-20 py-2.5
          text-sm text-gray-900 dark:text-white
          bg-gray-100 dark:bg-dark-100
          border border-gray-200 dark:border-white/10
          rounded-xl
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
          transition-all duration-200
        "
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            onClick={handleClear}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-dark-200 transition-colors"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        )}
        {showShortcut && !value && (
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-dark-200 rounded-md border border-gray-300 dark:border-white/10">
            <FiCommand className="w-3 h-3" />K
          </kbd>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
