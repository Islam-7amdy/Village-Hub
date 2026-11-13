import React from 'react';
import { DoctorService, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Stethoscope, Calendar, Phone, Home, Clock, Star, MapPin } from 'lucide-react';

interface DoctorsSectionProps {
  doctors: DoctorService[];
  lang: Language;
  canUseServices: boolean;
  onRequireLogin: () => void;
  onBookDoctor: (doc: DoctorService) => void;
  onViewReviews?: (targetId: string, name: string, role: string, avatar: string, rating: number, reviewsCount: number) => void;
  onAddReview?: (targetId: string, name: string, role: string) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  doctors,
  lang,
  canUseServices,
  onRequireLogin,
  onBookDoctor,
  onViewReviews,
  onAddReview
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.doctors}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'دكاترة العيادات، أطفال، وتمريض منزلي يجيلك لحد البيت' : 'Village clinics, pediatricians, and home nursing'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3.5">
                <img
                  src={doc.avatar}
                  alt={doc.name[lang]}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {doc.name[lang]}
                    </h3>
                    {onViewReviews && (
                      <button
                        type="button"
                        onClick={() =>
                          onViewReviews(
                            doc.id,
                            doc.name[lang],
                            doc.specialty[lang],
                            doc.avatar,
                            doc.rating,
                            doc.reviewsCount
                          )
                        }
                        className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors shrink-0 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40"
                        title={t.reviews}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-mono tabular-nums">{doc.rating}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal font-mono tabular-nums">
                          ({doc.reviewsCount})
                        </span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                    {doc.specialty[lang]}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {doc.clinicName[lang]}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.location[lang]}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.availableDays[lang]}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'سعر الكشف:' : 'Fee:'} {doc.fee[lang]}
                  </span>
                  {doc.supportsHomeVisit && (
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <Home className="w-3 h-3" />
                      {t.homeVisit}
                    </span>
                  )}
                </div>
                {onAddReview && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={() =>
                        onViewReviews &&
                        onViewReviews(
                          doc.id,
                          doc.name[lang],
                          doc.specialty[lang],
                          doc.avatar,
                          doc.rating,
                          doc.reviewsCount
                        )
                      }
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {t.reviews} ({doc.reviewsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddReview(doc.id, doc.name[lang], doc.specialty[lang])}
                      className="text-[11px] text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 font-medium cursor-pointer"
                    >
                      + {t.addReview}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <a
                href={`tel:${doc.phone}`}
                onClick={(e) => {
                  if (!canUseServices) {
                    e.preventDefault();
                    onRequireLogin();
                  }
                }}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>{t.callNow}</span>
              </a>

              <button
                onClick={() => onBookDoctor(doc)}
                className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.bookNow}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
