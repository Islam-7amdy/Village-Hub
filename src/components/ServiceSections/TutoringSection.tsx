import React, { useState } from 'react';
import { TutoringService, Language, evaluateProviderAvailability } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { GraduationCap, Calendar, Clock, MapPin, Phone, BookOpen, Lock, CheckCircle2 } from 'lucide-react';

interface TutoringSectionProps {
  tutors: TutoringService[];
  lang: Language;
  canUseServices: boolean;
  nowMs?: number;
  onRequireLogin: () => void;
  onBookTutor: (tutor: TutoringService) => void;
}

export const TutoringSection: React.FC<TutoringSectionProps> = ({
  tutors,
  lang,
  canUseServices,
  nowMs,
  onRequireLogin,
  onBookTutor
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'math', label: lang === 'ar' ? 'رياضيات وحساب' : 'Math' },
    { id: 'languages', label: lang === 'ar' ? 'إنجليزي ولغات' : 'Languages' },
    { id: 'science', label: lang === 'ar' ? 'علوم وفيزياء وكيمياء' : 'Science' },
    { id: 'quran', label: lang === 'ar' ? 'قرآن وتأسيس عربي' : 'Quran & Arabic' }
  ];

  const filtered =
    selectedCategory === 'all'
      ? tutors
      : tutors.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.tutoring}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'مدرسين البلد ومجموعات التقوية وحلقات تحفيظ القرآن لكل المراحل الدراسية'
                : 'Local qualified teachers, small study groups, and Quran circles for all grades'}
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
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tutor) => {
          const avail = evaluateProviderAvailability(tutor.availability, nowMs);
          return (
            <div
              key={tutor.id}
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
                      {tutor.teacherName[lang]}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {tutor.subject[lang]}
                    </p>
                  </div>
                  <span className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                    {tutor.feePerSession[lang]}
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
                      {lang === 'ar' ? 'متاح الآن' : 'Open Now'}
                    </span>
                    <span className="font-mono tabular-nums">{lang === 'ar' ? avail.scheduleTextAr : avail.scheduleTextEn}</span>
                  </div>
                ) : null}

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tutor.grades[lang]}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {avail.scheduleTextAr
                        ? lang === 'ar'
                          ? avail.scheduleTextAr
                          : avail.scheduleTextEn
                        : tutor.schedule[lang]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{tutor.location[lang]}</span>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {tutor.mode[lang]}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!avail.isOpen}
                  onClick={() => avail.isOpen && onBookTutor(tutor)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    avail.isOpen
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {avail.isOpen ? <Calendar className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{avail.isOpen ? t.bookLesson : lang === 'ar' ? 'مغلق الآن' : 'Closed'}</span>
                </button>

                <a
                  href={`tel:${tutor.phone}`}
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

