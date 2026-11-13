import React, { useState } from 'react';
import { FoodItem, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Utensils, Plus, Check, Clock, ShoppingBag } from 'lucide-react';

interface FoodSectionProps {
  foods: FoodItem[];
  lang: Language;
  onAddToCart: (item: { id: string; name: string; price: number; type: 'food' | 'pharmacy' | 'farm' }) => void;
}

export const FoodSection: React.FC<FoodSectionProps> = ({
  foods,
  lang,
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
    onAddToCart({
      id: item.id,
      name: item.name[lang],
      price: item.price,
      type: 'food'
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
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row gap-4"
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
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-sm font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {item.price.toFixed(0)} <span className="text-xs font-normal text-slate-500">{item.currency[lang]}</span>
                  </div>

                  <button
                    onClick={() => handleAdd(item)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {isAdded ? (
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
