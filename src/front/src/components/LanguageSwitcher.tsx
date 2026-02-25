import { useTranslation } from 'react-i18next';

/** Senyera (Catalan flag) as an inline SVG — 4 red stripes on gold. */
const SenyeraFlag = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 14"
    className={className}
    aria-label="Catalan flag"
  >
    <rect width="20" height="14" fill="#FCDD09" />
    <rect y="1"  width="20" height="2" fill="#DA121A" />
    <rect y="4"  width="20" height="2" fill="#DA121A" />
    <rect y="7"  width="20" height="2" fill="#DA121A" />
    <rect y="10" width="20" height="2" fill="#DA121A" />
  </svg>
);

const languages = [
  {
    code: 'en',
    label: 'EN',
    flag: <span className="text-base leading-none">🇬🇧</span>,
  },
  {
    code: 'es',
    label: 'ES',
    flag: <span className="text-base leading-none">🇪🇸</span>,
  },
  {
    code: 'ca',
    label: 'CA',
    flag: <SenyeraFlag className="w-5 h-3.5 rounded-sm" />,
  },
] as const;

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Select language">
      {languages.map((lang) => {
        const isActive = current === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            title={lang.label}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-orange-500 text-black'
                : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            {lang.flag}
            <span>{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
};
