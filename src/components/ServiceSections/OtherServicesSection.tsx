import React from 'react';
import { OtherService, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Grid2x2, MapPin, Clock, Phone, Send, Lock, CheckCircle2 } from 'lucide-react';

interface OtherServicesSectionProps {
  items: OtherService[];
  lang: Language;
  canUseServices: boolean;
  nowMs?: number;
  sectionTitle?: string;
  sectionDescription?: string;
  onRequireLogin: () => void;
  onRequestOther: (service: OtherService) => void;
}

export const OtherServicesSection: React.FC<OtherServicesSectionProps> = ({
  items,
  lang,
  canUseServices,
  nowMs,
  sectionTitle,
  sectionDescription,
  onRequireLogin,
  onRequestOther
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Grid2x2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {sectionTitle || t.other}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {sectionDescription ||
                (lang === 'ar'
                  ? 'مكتبات، صيانة موبايلات، مغاسل، أفراح، وأي أنشطة أو خدمات أخرى في القرية'
                  : 'Printing, phone repair, laundry, events, and miscellaneous village activities')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((srv) => {
          const avail = evaluateProviderAvailability(srv.availability, nowMs);
          return (
            <div
              key={srv.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                avail.isOpen
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {srv.name[lang]}
                    </h3>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                      {srv.activityType[lang]}
                    </p>
                  </div>
                  <span className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                    {srv.priceLabel[lang]}
                  </span>
                </div>

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

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {srv.description[lang]}
                </p>

                <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{srv.address[lang]}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {avail.scheduleTextAr
                        ? lang === 'ar'
                          ? avail.scheduleTextAr
                          : avail.scheduleTextEn
                        : srv.hours[lang]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!avail.isOpen}
                  onClick={() => avail.isOpen && onRequestOther(srv)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    avail.isOpen
                      ? 'text-white bg-slate-900 dark:bg-slate-700 hover:bg-amber-600 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {avail.isOpen ? <Send className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{avail.isOpen ? t.bookNow : lang === 'ar' ? 'مغلق الآن' : 'Closed'}</span>
                </button>

                <a
                  href={`tel:${srv.phone}`}
                  onClick={(e) => {
                    if (!canUseServices) {
                      e.preventDefault();
                      onRequireLogin();
                    }
                  }}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t.callNow}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

