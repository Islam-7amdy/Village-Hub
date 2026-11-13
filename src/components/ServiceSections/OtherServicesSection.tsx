import React from 'react';
import { OtherService, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Grid2x2, MapPin, Clock, Phone, Send } from 'lucide-react';

interface OtherServicesSectionProps {
  items: OtherService[];
  lang: Language;
  canUseServices: boolean;
  onRequireLogin: () => void;
  onRequestOther: (service: OtherService) => void;
}

export const OtherServicesSection: React.FC<OtherServicesSectionProps> = ({
  items,
  lang,
  canUseServices,
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.other}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'مكتبات، صيانة موبايلات، مغاسل، أفراح، وأي أنشطة أو خدمات أخرى في القرية'
                : 'Printing, phone repair, laundry, events, and miscellaneous village activities'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((srv) => (
          <div
            key={srv.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
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
                  <span>{srv.hours[lang]}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => onRequestOther(srv)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t.bookNow}</span>
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
        ))}
      </div>
    </div>
  );
};
