import React, { useState } from 'react';
import { PharmacyItem, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Pill, Camera, Plus, Check, Truck, CheckCircle2, Lock } from 'lucide-react';

interface PharmacySectionProps {
  items: PharmacyItem[];
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
  onOpenUploadPrescription: () => void;
}

export const PharmacySection: React.FC<PharmacySectionProps> = ({
  items,
  lang,
  canUseServices,
  nowMs,
  onRequireLogin,
  onAddToCart,
  onOpenUploadPrescription
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'pain', label: lang === 'ar' ? 'مسكنات وحرارة' : 'Pain & Fever' },
    { id: 'chronic', label: lang === 'ar' ? 'أمراض مزمنة' : 'Chronic' },
    { id: 'firstaid', label: lang === 'ar' ? 'إسعافات أولية' : 'First Aid' },
    { id: 'baby', label: lang === 'ar' ? 'أطفال ورضع' : 'Baby Care' }
  ];

  const filtered = selectedCategory === 'all'
    ? items
    : items.filter((p) => p.category === selectedCategory);

  const handleAdd = (item: PharmacyItem) => {
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
      type: 'pharmacy',
      providerName: item.ownerId
        ? item.name[lang].split(' - ')[0]
        : lang === 'ar'
        ? 'صيدلية الشفاء - قرية نقباس'
        : 'Al-Shifa Pharmacy - Noqbas',
      providerOwnerId: item.ownerId
    });
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Header and Prescription Photo Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.pharmacy}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'صيدلية الشفاء · صرف روشتات، أدوية ضغط وسكر، وتوصيل للبيت حسب المسافة' : 'Village pharmacy, prescription fulfillment, and doorstep delivery by distance'}
            </p>
          </div>
        </div>

        {/* Upload Prescription Button */}
        <button
          onClick={onOpenUploadPrescription}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4" />
          <span>{t.sendPrescription}</span>
        </button>
      </div>

      {/* Village Pharmacy Delivery Promise Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <img
            src="/images/village_pharmacy_health_1794475355831.webp"
            alt="Pharmacy"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-emerald-300 dark:border-emerald-800"
          />
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'صيدلية الشفاء المركزية (د. هدى الصيدلانية)' : 'Al-Shifa Central Pharmacy (Dr. Huda)'}
            </div>
            <div className="text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar' ? 'توصيل سريع لعلاج كبار السن والأطفال لحد باب البيت والدفع عند الاستلام' : 'Express doorstep medicine delivery for seniors and families'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0">
          <Truck className="w-4 h-4" />
          <span>{t.distanceDelivery}</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isAdded = addedIds[item.id];
          const avail = evaluateProviderAvailability(item.availability, nowMs);
          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs transition-all flex flex-col justify-between space-y-3 ${
                avail.isOpen
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.name[lang]}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description[lang]}
                </p>

                <div className="flex items-center gap-2 text-[11px] mt-2">
                  {avail.isOpen ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.inStock}
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {lang === 'ar' ? 'مغلق الآن' : 'Closed'}
                    </span>
                  )}
                  {item.requiresPrescription && (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">
                      · {t.prescriptionRequired}
                    </span>
                  )}
                </div>

                {!avail.isOpen ? (
                  <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[10px] text-rose-800 dark:text-rose-200 space-y-0.5">
                    <div>{avail.manualClosedReason || (lang === 'ar' ? avail.labelAr : avail.labelEn)}</div>
                    {avail.scheduleTextAr && (
                      <div className="font-mono tabular-nums opacity-80">
                        {lang === 'ar' ? `مواعيد: ${avail.scheduleTextAr}` : `Hours: ${avail.scheduleTextEn}`}
                      </div>
                    )}
                  </div>
                ) : avail.scheduleTextAr ? (
                  <div className="mt-1.5 text-[10px] font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                    {lang === 'ar' ? `مفتوح · ${avail.scheduleTextAr}` : `Open · ${avail.scheduleTextEn}`}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    !avail.isOpen
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : isAdded
                      ? 'bg-emerald-600 text-white cursor-pointer shadow-2xs'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                  }`}
                >
                  {!avail.isOpen ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'مغلق' : 'Closed'}</span>
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
          );
        })}
      </div>
    </div>
  );
};

