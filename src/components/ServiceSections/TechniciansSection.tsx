import React, { useState } from 'react';
import { TechnicianService, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Wrench, Phone, MessageCircle, Calendar, Star, MapPin, CheckCircle2 } from 'lucide-react';

interface TechniciansSectionProps {
  technicians: TechnicianService[];
  lang: Language;
  onRequestTechnician: (tech: TechnicianService) => void;
  onViewReviews?: (targetId: string, name: string, role: string, avatar: string, rating: number, reviewsCount: number) => void;
  onAddReview?: (targetId: string, name: string, role: string) => void;
}

export const TechniciansSection: React.FC<TechniciansSectionProps> = ({
  technicians,
  lang,
  onRequestTechnician,
  onViewReviews,
  onAddReview
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'electrician', label: lang === 'ar' ? 'كهربائي' : 'Electrician' },
    { id: 'plumber', label: lang === 'ar' ? 'سباك وميه' : 'Plumber' },
    { id: 'hvac', label: lang === 'ar' ? 'تكييف وتلاجات' : 'HVAC' },
    { id: 'carpenter', label: lang === 'ar' ? 'نجار وألوميتال' : 'Carpenter' },
    { id: 'solar', label: lang === 'ar' ? 'طاقة شمسية' : 'Solar' }
  ];

  const filtered = selectedCategory === 'all'
    ? technicians
    : technicians.filter((tech) => tech.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Header and Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.technicians}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'كهربائي، سباك، تكييف، نجار، وطاقة شمسية من ولاد البلد المضمونين' : 'Verified local electricians, plumbers, HVAC, carpenters, and solar experts'}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Technicians Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((tech) => (
          <div
            key={tech.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <img
                  src={tech.avatar}
                  alt={tech.name[lang]}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tech.name[lang]}
                    </h3>
                    {onViewReviews ? (
                      <button
                        type="button"
                        onClick={() =>
                          onViewReviews(
                            tech.id,
                            tech.name[lang],
                            tech.craft[lang],
                            tech.avatar,
                            tech.rating,
                            tech.reviewsCount
                          )
                        }
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40"
                        title={t.reviews}
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{tech.rating}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                          ({tech.reviewsCount})
                        </span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                        ★ {tech.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {tech.craft[lang]}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{tech.experienceYears} {lang === 'ar' ? 'سنة خبرة' : 'yrs exp'}</span>
                    <span>·</span>
                    <span>{tech.hourlyRate[lang]}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {tech.bio[lang]}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{tech.neighborhood[lang]}</span>
                </div>
                {onAddReview && (
                  <button
                    type="button"
                    onClick={() => onAddReview(tech.id, tech.name[lang], tech.craft[lang])}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    + {t.addReview}
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <a
                href={`tel:${tech.phone}`}
                className="flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.callNow}</span>
              </a>

              <a
                href={`https://wa.me/${tech.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
              </a>

              <button
                onClick={() => onRequestTechnician(tech)}
                className="flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'طلب صيانة' : 'Request'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
