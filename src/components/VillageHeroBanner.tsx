import React from 'react';
import { Language, VillageConfig, getVillageTheme } from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import {
  Search,
  LayoutGrid,
  Stethoscope,
  Pill,
  Utensils,
  Wrench,
  Car,
  ShoppingBasket,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';

interface VillageHeroBannerProps {
  lang: Language;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: string;
  onSelectCategory: (cat: string) => void;
  activeVillage: VillageConfig;
}

export const VillageHeroBanner: React.FC<VillageHeroBannerProps> = ({
  lang,
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectCategory,
  activeVillage
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);

  const categories = [
    { id: 'all', label: t.allServices, icon: LayoutGrid, color: `${theme.text} ${theme.softBg} ${theme.border}` },
    { id: 'doctors', label: t.doctors, icon: Stethoscope, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60' },
    { id: 'pharmacy', label: t.pharmacy, icon: Pill, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60' },
    { id: 'food', label: t.food, icon: Utensils, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-900/60' },
    { id: 'technicians', label: t.technicians, icon: Wrench, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60' },
    { id: 'rides', label: t.rides, icon: Car, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60' },
    { id: 'grocery', label: t.grocery, icon: ShoppingBasket, color: 'text-lime-700 bg-lime-50 dark:bg-lime-950/50 border-lime-200 dark:border-lime-900/60' },
    { id: 'tutoring', label: t.tutoring, icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900/60' },
    { id: 'charity', label: t.charity, icon: HeartHandshake, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-900/60' }
  ];

  return (
    <div className="space-y-4">
      {/* Hero Visual Card tinted by Village Color Code */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[250px] sm:min-h-[285px] flex flex-col justify-end p-6 sm:p-10 text-white">
        <img
          src="/src/assets/images/village_square_center_1794475354441.jpg"
          alt={lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme.heroTint}`} />

        <div className="relative z-10 max-w-2xl space-y-3">
          {/* Unboxed typographic kicker */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/90">
            <span className={`w-2.5 h-2.5 rounded-full ${theme.dotBg} inline-block`} aria-hidden="true" />
            <span>{lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'ar' ? activeVillage.governorateAr : activeVillage.governorateEn}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-normal">
              {lang === 'ar' ? 'التعامل بالجنيه المصري (ج.م)' : 'All prices in EGP'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
            {lang === 'ar'
              ? `كل خدمات ${activeVillage.nameAr} في إيدك`
              : `All ${activeVillage.nameEn} Services in One Place`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
            {lang === 'ar'
              ? activeVillage.descriptionAr
              : activeVillage.descriptionEn}
          </p>

          {/* Clean Search Bar */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className={`absolute top-3.5 w-4 h-4 text-slate-400 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className={`w-full py-3 text-xs sm:text-sm rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200/80 dark:border-slate-700 shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exact 9 Service Categories Strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-2.5 rounded-2xl border transition-all text-center flex flex-col items-center gap-1.5 group cursor-pointer ${
                isActive
                  ? `${theme.softBg} ${theme.border}`
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cat.color} group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] font-bold whitespace-nowrap truncate max-w-full ${
                  isActive ? theme.text : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
