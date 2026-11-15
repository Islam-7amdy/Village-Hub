import React, { useState } from 'react';
import { GroceryItem, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { ShoppingBasket, Plus, Check, Store, Lock, CheckCircle2 } from 'lucide-react';

interface GrocerySectionProps {
  items: GroceryItem[];
  lang: Language;
  canUseServices: boolean;
  nowMs?: number;
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
  nowMs,
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
          const avail = evaluateProviderAvailability(item.availability, nowMs);
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                avail.isOpen
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
              }`}
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

                {!avail.isOpen ? (
                  <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-200 space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'ar' ? 'مغلق الآن' : 'Closed Now'}</span>
                    </div>
                    <div className="opacity-90">
                      {avail.manualClosedReason || (lang === 'ar' ? avail.labelAr : avail.labelEn)}
                    </div>
                    {avail.scheduleTextAr && (
                      <div className="font-mono tabular-nums opacity-80">
                        {lang === 'ar' ? `مواعيد العمل: ${avail.scheduleTextAr}` : `Hours: ${avail.scheduleTextEn}`}
                      </div>
                    )}
                  </div>
                ) : avail.scheduleTextAr ? (
                  <div className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {lang === 'ar' ? 'مفتوح الآن' : 'Open Now'}
                    </span>
                    <span className="font-mono tabular-nums">{lang === 'ar' ? avail.scheduleTextAr : avail.scheduleTextEn}</span>
                  </div>
                ) : null}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {item.price}{' '}
                  <span className="text-xs font-semibold text-slate-500">{item.currency[lang]}</span>
                </div>

                <button
                  type="button"
                  disabled={!avail.isOpen}
                  onClick={() => handleAdd(item)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    !avail.isOpen
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : isAdded
                      ? 'bg-emerald-600 text-white cursor-pointer'
                      : 'bg-lime-700 hover:bg-lime-800 text-white cursor-pointer'
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
                      <span>{lang === 'ar' ? 'انضافت' : 'Added'}</span>
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
          );
        })}
      </div>
    </div>
  );
};

