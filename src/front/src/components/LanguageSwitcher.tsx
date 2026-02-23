import { useTranslation } from 'react-i18next';
import { Globe } from './Icons';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ca', label: 'Català', flag: '�' },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-5 h-5 text-orange-500" />
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-black border-2 border-orange-500 text-orange-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer font-semibold hover:bg-orange-500 hover:text-black"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-black text-orange-500">
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
