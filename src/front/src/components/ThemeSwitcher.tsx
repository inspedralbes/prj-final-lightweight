import { Sun, Moon } from './Icons';
import { useTheme } from '../context/ThemeContext';

export const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
};
