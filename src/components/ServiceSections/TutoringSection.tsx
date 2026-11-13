import React, { useState } from 'react';
import { TutoringService, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { GraduationCap, Calendar, Clock, MapPin, Phone, BookOpen } from 'lucide-react';

interface TutoringSectionProps {
  tutors: TutoringService[];
  lang: Language;
  onBookTutor: (tutor: TutoringService) => void;
}

export const TutoringSection: React.FC<TutoringSectionProps> = ({
  tutors,
  lang,
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
        {filtered.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
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

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{tutor.grades[lang]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{tutor.schedule[lang]}</span>
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
                onClick={() => onBookTutor(tutor)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.bookLesson}</span>
              </button>

              <a
                href={`tel:${tutor.phone}`}
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
