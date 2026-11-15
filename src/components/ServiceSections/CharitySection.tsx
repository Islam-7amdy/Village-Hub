import React from 'react';
import { CharityOrg, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { HeartHandshake, MapPin, Phone, Heart, Lock, CheckCircle2 } from 'lucide-react';

interface CharitySectionProps {
  charities: CharityOrg[];
  lang: Language;
  canUseServices: boolean;
  nowMs?: number;
  onRequireLogin: () => void;
  onContactCharity: (charity: CharityOrg) => void;
}

export const CharitySection: React.FC<CharitySectionProps> = ({
  charities,
  lang,
  canUseServices,
  nowMs,
  onRequireLogin,
  onContactCharity
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.charity}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'التبرع بالكفالات، القوافل الطبية، الشنط الغذائية، أو طلب مساعدة بسرية تامة'
                : 'Village charitable foundations, medical aid, food drives, and confidential support'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charities.map((org) => {
          const avail = evaluateProviderAvailability(org.availability, nowMs);
          return (
            <div
              key={org.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                avail.isOpen
                  ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-rose-200/80 dark:border-rose-900/50 opacity-85'
              }`}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {org.name[lang]}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {org.focus[lang]}
                  </p>
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

                <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50 text-xs text-teal-900 dark:text-teal-100 space-y-1">
                  <div className="font-bold">
                    {org.activeCampaign[lang]}
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-300 font-mono tabular-nums">
                    {org.donationExample[lang]}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{org.address[lang]}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!avail.isOpen}
                  onClick={() => avail.isOpen && onContactCharity(org)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    avail.isOpen
                      ? 'text-white bg-teal-600 hover:bg-teal-700 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {avail.isOpen ? <Heart className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{avail.isOpen ? t.charityAction : lang === 'ar' ? 'مغلق الآن' : 'Closed'}</span>
                </button>

                <a
                  href={`tel:${org.phone}`}
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

