import React, { useState } from 'react';
import { FoodItem, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Utensils, Plus, Check, Lock, CheckCircle2 } from 'lucide-react';

interface FoodSectionProps {
  foods: FoodItem[];
  lang: Language;
  canUseServices: boolean;
  nowMs?: number;
  onRequireLogin: () => void;
  onAddToCart: (item: {
    id: string;
    name: string;
    price: number;
    type: 'food' | 'pharmacy' | 'farm';
    providerName?: string;
    providerOwnerId?: string;
  }) => void;
}

export const FoodSection: React.FC<FoodSectionProps> = ({
  foods,
  lang,
  canUseServices,
  nowMs,
  onRequireLogin,
  onAddToCart
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'bakery', label: lang === 'ar' ? 'فطير ومخبوزات' : 'Bakery & Feteer' },
    { id: 'traditional', label: lang === 'ar' ? 'أكل بيتي ومحاشي' : 'Homemade Kitchen' },
    { id: 'grill', label: lang === 'ar' ? 'مشاوي على الفحم' : 'Charcoal Grill' }
  ];

  const filtered = selectedCategory === 'all'
    ? foods
    : foods.filter((f) => f.category === selectedCategory);

  const handleAdd = (item: FoodItem) => {
    const avail = evaluateProviderAvailability(item.availability, nowMs);
    if (!avail.isOpen) return;
    if (!canUseServices) {
      onRequireLogin();
      return;
    }
    onAddToCart({
      id: item.id,
      name: item.name[lang],
      price: item.price,
      type: 'food',
      providerName: item.restaurantName[lang],
      providerOwnerId: item.ownerId
    });
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header and Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.food}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'فطير مشلتت بالسمن البلدي، أكل بيتي نضيف، ومشاوي طازة لحد البيت' : 'Fresh baladi feteer, homemade Egyptian dishes, and charcoal grills'}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const isAdded = addedIds[item.id];
          const avail = evaluateProviderAvailability(item.availability, nowMs);
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs transition-all flex flex-col sm:flex-row gap-4 ${
                avail.isOpen
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
              }`}
            >
              <img
                src={item.image}
                alt={item.name[lang]}
                referrerPolicy="no-referrer"
                className="w-full sm:w-36 h-36 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800"
              />

              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.name[lang]}
                    </h3>
                  </div>
                  <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                    {item.restaurantName[lang]}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description[lang]}
                  </p>

                  {!avail.isOpen ? (
                    <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-200 space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 shrink-0" />
                        <span>{avail.manualClosedReason || (lang === 'ar' ? avail.labelAr : avail.labelEn)}</span>
                      </div>
                      {avail.scheduleTextAr && (
                        <div className="font-mono tabular-nums opacity-80">
                          {lang === 'ar' ? `مواعيد العمل: ${avail.scheduleTextAr}` : `Hours: ${avail.scheduleTextEn}`}
                        </div>
                      )}
                    </div>
                  ) : avail.scheduleTextAr ? (
                    <div className="mt-2 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        {lang === 'ar' ? 'مفتوح الآن' : 'Open'}
                      </span>
                      <span className="font-mono tabular-nums">{lang === 'ar' ? avail.scheduleTextAr : avail.scheduleTextEn}</span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {item.price.toFixed(0)} <span className="text-xs font-normal text-slate-500">{item.currency[lang]}</span>
                  </div>

                  <button
                    type="button"
                    disabled={!avail.isOpen}
                    onClick={() => handleAdd(item)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      !avail.isOpen
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        : isAdded
                        ? 'bg-emerald-600 text-white cursor-pointer shadow-2xs'
                        : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-2xs'
                    }`}
                  >
                    {!avail.isOpen ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'مغلق الآن' : 'Closed'}</span>
                      </>
                    ) : isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تمت الإضافة' : 'Added'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.addToCart}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

