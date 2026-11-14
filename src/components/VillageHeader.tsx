import React, { useState, useRef, useEffect } from 'react';
import {
  Language,
  UserProfile,
  VillageConfig,
  getVillageTheme
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import { VillageLogo } from './VillageLogo';
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
  Bell,
  Search,
  X,
  LayoutGrid,
  Stethoscope,
  Pill,
  Utensils,
  Wrench,
  Car,
  ShoppingBasket,
  GraduationCap,
  HeartHandshake,
  Shapes,
  PackageCheck,
  Briefcase
} from 'lucide-react';

interface VillageHeaderProps {
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  activeOrdersCount: number;
  providerOrdersCount?: number;
  notificationsCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenProviderOrders?: () => void;
  onOpenNotifications: () => void;
  onOpenEmergency: () => void;
  onOpenAssistant: () => void;
  activeVillage: VillageConfig;
  isSignedIn: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  userPhotoUrl?: string;
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
  searchQuery,
  onSearchChange,
  cartCount,
  activeOrdersCount,
  providerOrdersCount = 0,
  notificationsCount,
  onOpenCart,
  onOpenOrders,
  onOpenProviderOrders,
  onOpenNotifications,
  onOpenEmergency,
  onOpenAssistant,
  activeVillage,
  isSignedIn,
  isAdmin,
  userProfile,
  userPhotoUrl,
  pendingAdminCount,
  onOpenAuth,
  onOpenAdminPanel
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const allNavItems = [
    { id: 'all', label: t.allServices, icon: LayoutGrid, color: `${theme.text} ${theme.softBg} ${theme.border}` },
    { id: 'doctors', label: t.doctors, icon: Stethoscope, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60' },
    { id: 'pharmacy', label: t.pharmacy, icon: Pill, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60' },
    { id: 'food', label: t.food, icon: Utensils, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900/60' },
    { id: 'technicians', label: t.technicians, icon: Wrench, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60' },
    { id: 'rides', label: t.rides, icon: Car, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60' },
    { id: 'grocery', label: t.grocery, icon: ShoppingBasket, color: 'text-lime-700 bg-lime-50 dark:bg-lime-950/50 border-lime-200 dark:border-lime-900/60' },
    { id: 'tutoring', label: t.tutoring, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900/60' },
    { id: 'charity', label: t.charity, icon: HeartHandshake, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900/60' },
    { id: 'other', label: t.other, icon: Shapes, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/60' }
  ];

  const brandName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Village Branding + Switcher + Desktop Search + Actions */}
        <div className="flex items-center justify-between gap-2.5 h-16">
          {/* Zone 1: Single Village Logo + Name (قرية نقباس) */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button
              onClick={() => onTabChange('all')}
              className="flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus:outline-none"
            >
              <VillageLogo village={activeVillage} lang={lang} size="md" />
              <span className="truncate max-w-[160px] sm:max-w-none">{brandName}</span>
            </button>
          </div>

          {/* Zone 1.5: Relocated Inline Search Bar (Desktop lg+) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-2">
            <div className="relative w-full">
              <Search
                className={`absolute top-2.5 w-4 h-4 text-slate-400 pointer-events-none ${
                  lang === 'ar' ? 'right-3' : 'left-3'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className={`w-full py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors ${
                  lang === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label={t.close}
                  className={`absolute top-2 p-0.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ${
                    lang === 'ar' ? 'left-2' : 'right-2'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Zone 2: Actions & Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Search Toggle Icon (Tablet / Mobile < lg) */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              title={lang === 'ar' ? 'بحث في القرية' : 'Search Village'}
              aria-label={lang === 'ar' ? 'بحث في القرية' : 'Search Village'}
              className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isMobileSearchOpen || searchQuery
                  ? `${theme.softBg} ${theme.text}`
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

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

            {/* Signed-in Order Status Tracking Button */}
            {isSignedIn && (
              <button
                type="button"
                onClick={onOpenOrders}
                title={t.orderStatus}
                aria-label={t.orderStatus}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PackageCheck className={`w-4 h-4 ${theme.text}`} />
                <span className="hidden md:inline">{t.orderStatus}</span>
                {activeOrdersCount > 0 && (
                  <span
                    className={`min-w-[16px] h-4 px-1 rounded-full ${theme.solidBg} text-white text-[10px] font-bold font-mono flex items-center justify-center`}
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            )}

            {/* Service Provider Incoming Orders Dashboard Button */}
            {isSignedIn && userProfile?.role === 'provider' && onOpenProviderOrders && (
              <button
                type="button"
                onClick={onOpenProviderOrders}
                title={t.providerOrders}
                aria-label={t.providerOrders}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t.providerOrders}</span>
                {providerOrdersCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-mono flex items-center justify-center">
                    {providerOrdersCount}
                  </span>
                )}
              </button>
            )}

            {/* Signed-in Notifications Bell Icon */}
            {isSignedIn && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title={t.notifications}
                aria-label={t.notifications}
                className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Bell className="w-4 h-4" />
                {notificationsCount > 0 && (
                  <span
                    className={`absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full ${theme.solidBg} text-white text-[10px] font-bold font-mono flex items-center justify-center`}
                  >
                    {notificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Login / Account Button with Optional Profile Avatar */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSignedIn
                  ? `${theme.softBg} ${theme.text} ${theme.border}`
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent hover:opacity-90'
              }`}
            >
              {isSignedIn && userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt={userProfile?.displayName || t.account}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : isSignedIn ? (
                <UserCheck className="w-3.5 h-3.5" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
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
              <span className="hidden xl:inline">{t.aiAssistant}</span>
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

        {/* Expandable Search Bar Row on Mobile / Tablet */}
        {(isMobileSearchOpen || Boolean(searchQuery)) && (
          <div className="lg:hidden pb-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search
                className={`absolute top-2.5 w-4 h-4 text-slate-400 pointer-events-none ${
                  lang === 'ar' ? 'right-3' : 'left-3'
                }`}
              />
              <input
                ref={mobileSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  lang === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'
                }`}
              />
              {(searchQuery || isMobileSearchOpen) && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsMobileSearchOpen(false);
                  }}
                  aria-label={t.close}
                  className={`absolute top-2 p-0.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ${
                    lang === 'ar' ? 'left-2' : 'right-2'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pinned 10 Service Categories Strip (replaces plain text bar) */}
        <nav
          aria-label={t.allServices}
          className="flex items-center gap-2 overflow-x-auto lg:grid lg:grid-cols-10 py-2.5 border-t border-slate-100 dark:border-slate-800 no-scrollbar"
        >
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`min-w-[92px] shrink-0 lg:min-w-0 p-2 rounded-2xl border transition-all text-center flex flex-col items-center gap-1.5 group cursor-pointer ${
                  isActive
                    ? `${theme.softBg} ${theme.border}`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[11px] font-bold whitespace-nowrap truncate max-w-full ${
                    isActive ? theme.text : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
