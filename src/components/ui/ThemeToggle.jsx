/**
 * Theme Toggle Component
 * Switch between light and dark mode with smooth animation
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2 rounded-full
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 w-6 h-6 text-yellow-500
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 w-6 h-6 text-blue-400
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
    </button>
  );
}

/**
 * Expanded Theme Selector
 * Shows Light / Dark / System options
 */
export function ThemeSelector({ className = '' }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: null }
  ];

  const handleChange = (value) => {
    if (value === 'system') {
      localStorage.removeItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(value);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleChange(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-all duration-200
            ${theme === value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {Icon && <Icon className="w-4 h-4" />}
          <span className="text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
}
