import React from 'react';
import { EMERGENCY_NUMBERS, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, PhoneCall, Phone, ShieldAlert, Zap, Droplets, Landmark, Flame } from 'lucide-react';

interface EmergencyDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const EmergencyDirectoryModal: React.FC<EmergencyDirectoryModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Ambulance':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      default:
        return <Landmark className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 dark:text-rose-100">{t.emergency}</h3>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                {lang === 'ar' ? 'أرقام الطوارئ السريعة بالقرية' : 'Emergency Hotlines in Village'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Directory List */}
        <div className="p-6 space-y-3">
          {EMERGENCY_NUMBERS.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center shrink-0">
                  {getIcon(item.icon)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.name[lang]}
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-500 mt-0.5">
                    {item.number}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${item.number.split('/')[0].trim()}`}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center justify-center shadow-2xs"
                title={t.callNow}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
          {lang === 'ar'
            ? 'خطوط الطوارئ متوفرة على مدار الساعة لخدمة أهالي القرية'
            : 'Hotlines are active 24/7 for village emergencies'}
        </div>
      </div>
    </div>
  );
};
