import React, { useState } from 'react';
import { GroceryItem, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { ShoppingBasket, Plus, Check, Store } from 'lucide-react';

interface GrocerySectionProps {
  items: GroceryItem[];
  lang: Language;
  canUseServices: boolean;
  onRequireLogin: () => void;
  onAddToCart: (item: {
    id: string;
    name: string;
    price: number;
    type: 'grocery';
    providerName?: string;
    providerOwnerId?: string;
  }) => void;
}

export const GrocerySection: React.FC<GrocerySectionProps> = ({
  items,
  lang,
  canUseServices,
  onRequireLogin,
  onAddToCart
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'staples', label: lang === 'ar' ? 'تموين وأرز وزيت' : 'Pantry Staples' },
    { id: 'produce', label: lang === 'ar' ? 'خضار وفاكهة' : 'Fresh Produce' },
    { id: 'dairy', label: lang === 'ar' ? 'ألبان وجبن' : 'Dairy & Cheese' },
    { id: 'cleaning', label: lang === 'ar' ? 'منظفات البيت' : 'Cleaning' }
  ];

  const filtered =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.category === selectedCategory);

  const handleAdd = (item: GroceryItem) => {
    if (!canUseServices) {
      onRequireLogin();
      return;
    }
    onAddToCart({
      id: item.id,
      name: item.name[lang],
      price: item.price,
      type: 'grocery',
      providerName: item.storeName[lang],
      providerOwnerId: item.ownerId
    });
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-lime-700 dark:text-lime-400 flex items-center justify-center">
            <ShoppingBasket className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.grocery}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'مقاضي البيت اليومية من السوبر ماركت والبقالة بسعر البلد وتوصيل لباب البيت'
                : 'Daily groceries, pantry staples, dairy, and produce delivered to your doorstep'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-lime-700 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isAdded = addedIds[item.id];
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-lime-700 dark:text-lime-400">
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.storeName[lang]}</span>
                  <span>·</span>
                  <span className="text-slate-500 dark:text-slate-400">{item.unit[lang]}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.name[lang]}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description[lang]}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {item.price}{' '}
                  <span className="text-xs font-semibold text-slate-500">{item.currency[lang]}</span>
                </div>

                <button
                  onClick={() => handleAdd(item)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-lime-700 hover:bg-lime-800 text-white'
                  }`}
                >
                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAdded ? (lang === 'ar' ? 'انضافت' : 'Added') : t.addToCart}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
