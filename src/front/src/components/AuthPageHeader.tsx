import { LanguageSwitcher } from "./LanguageSwitcher";

export const AuthPageHeader = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-5 bg-gradient-to-b from-black/80 to-transparent">
      <div className="flex items-center gap-0">
        <img
          src="/LW_logo.png"
          alt="LightWeight"
          className="w-17 h-17 object-contain"
        />
        <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Light<span className="text-orange-500">Weight</span>
        </span>
      </div>
      <LanguageSwitcher />
    </div>
  );
};
