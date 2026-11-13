import React from 'react';
import {
  Language,
  UserProfile,
  VillageConfig,
  getVillageTheme
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import {
  Sun,
  Moon,
  Globe,
  ShoppingBag,
  PhoneCall,
  Sparkles,
  UserCheck,
  ShieldCheck,
  LogIn,
  ChevronDown
} from 'lucide-react';

interface VillageHeaderProps {
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenEmergency: () => void;
  onOpenAssistant: () => void;
  activeVillage: VillageConfig;
  villages: VillageConfig[];
  onSwitchVillage: (villageId: string) => void;
  isSignedIn: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  pendingAdminCount: number;
  onOpenAuth: () => void;
  onOpenAdminPanel: () => void;
}

export const VillageHeader: React.FC<VillageHeaderProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDarkMode,
  activeTab,
  onTabChange,
  cartCount,
  onOpenCart,
  onOpenEmergency,
  onOpenAssistant,
  activeVillage,
  villages,
  onSwitchVillage,
  isSignedIn,
  isAdmin,
  userProfile,
  pendingAdminCount,
  onOpenAuth,
  onOpenAdminPanel
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);

  // Top 5 concise links on desktop bar; all 9 tabs appear on mobile sub-nav and hero category strip
  const headerNavItems = [
    { id: 'all', label: t.allServices },
    { id: 'doctors', label: t.doctors },
    { id: 'pharmacy', label: t.pharmacy },
    { id: 'food', label: t.food },
    { id: 'technicians', label: t.technicians }
  ];

  const allNavItems = [
    { id: 'all', label: t.allServices },
    { id: 'doctors', label: t.doctors },
    { id: 'pharmacy', label: t.pharmacy },
    { id: 'food', label: t.food },
    { id: 'technicians', label: t.technicians },
    { id: 'rides', label: t.rides },
    { id: 'grocery', label: t.grocery },
    { id: 'tutoring', label: t.tutoring },
    { id: 'charity', label: t.charity }
  ];

  const brandName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Village Name + Adjacent Village Switcher with Village Color Code */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <button
              onClick={() => onTabChange('all')}
              className="flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus:outline-none"
            >
              <span
                className={`w-8 h-8 rounded-xl ${theme.solidBg} text-white flex items-center justify-center font-bold text-base shrink-0 transition-colors`}
              >
                {lang === 'ar' ? 'ن' : 'N'}
              </span>
              <span className="truncate max-w-[140px] sm:max-w-none">{brandName}</span>
            </button>

            {/* Modular Village Switcher right next to Village Name */}
            <div className="relative flex items-center shrink-0">
              <span
                className={`w-2.5 h-2.5 rounded-full ${theme.dotBg} pointer-events-none shrink-0 ${
                  lang === 'ar' ? 'me-[-18px] z-10' : 'ms-2 -me-5 z-10'
                }`}
                aria-hidden="true"
              />
              <select
                value={activeVillage.id}
                onChange={(e) => onSwitchVillage(e.target.value)}
                aria-label={t.switchVillage}
                title={t.switchVillage}
                className={`appearance-none text-xs font-bold rounded-xl border ${theme.border} ${theme.softBg} ${theme.text} py-1.5 cursor-pointer focus:outline-none whitespace-nowrap transition-colors ${
                  lang === 'ar' ? 'pr-7 pl-6' : 'pl-7 pr-6'
                }`}
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {lang === 'ar' ? v.nameAr : v.nameEn}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 ${theme.text} pointer-events-none ${
                  lang === 'ar' ? '-ms-5' : '-ms-5'
                }`}
              />
            </div>
          </div>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {headerNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer ${
                    isActive
                      ? `${theme.text} font-bold`
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.underlineBg} rounded-full`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin Panel Button */}
            {isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold ${theme.solidBg} ${theme.hoverBg} text-white rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.adminPanel}</span>
                {pendingAdminCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-white text-slate-900 rounded-full text-[10px] font-mono">
                    {pendingAdminCount}
                  </span>
                )}
              </button>
            )}

            {/* Login / Account Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSignedIn
                  ? `${theme.softBg} ${theme.text} ${theme.border}`
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent hover:opacity-90'
              }`}
            >
              {isSignedIn ? <UserCheck className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
              <span className="max-w-[85px] truncate hidden sm:inline">
                {isSignedIn
                  ? userProfile?.displayName || t.account
                  : t.login}
              </span>
            </button>

            {/* AI Assistant */}
            <button
              onClick={onOpenAssistant}
              title={t.aiAssistant}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${theme.text}`} />
              <span>{t.aiAssistant}</span>
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              title={t.cart}
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label={t.cart}
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className={`absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full ${theme.solidBg} text-white text-[10px] font-bold font-mono flex items-center justify-center`}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Emergency Top Icon */}
            <button
              onClick={onOpenEmergency}
              title={t.emergency}
              className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label={t.emergency}
            >
              <PhoneCall className="w-4 h-4" />
            </button>

            {/* Day / Night Mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label={darkMode ? t.dayMode : t.nightMode}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.switchLang}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Scrollable Section Navigation */}
        <div className="xl:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {allNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`text-xs px-3 py-1 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === item.id
                  ? `${theme.softBg} ${theme.text} font-bold`
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
