import React from 'react';
import { BookingRequest, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, Calendar, CheckCircle2, Phone, Wrench, Stethoscope, Car, ShoppingBag, GraduationCap, HeartHandshake, ShoppingBasket } from 'lucide-react';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingRequest[];
  lang: Language;
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-rose-500" />;
      case 'technician':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'ride':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'grocery':
        return <ShoppingBasket className="w-4 h-4 text-lime-600" />;
      case 'tutoring':
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      case 'charity':
        return <HeartHandshake className="w-4 h-4 text-teal-600" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.myBookings}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'سجل مواعيد الكشف وطلبات الصنايعية والأكل في البلد' : 'Your active village requests and appointments'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {bookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {lang === 'ar' ? 'لسه معندكش طلبات مسجلة دلوقتي.' : 'No registered bookings yet.'}
            </div>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center">
                      {getServiceIcon(b.serviceType)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{b.title}</div>
                      <div className="text-[11px] text-slate-500">{b.providerName}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'متأكد' : 'Confirmed'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.date} {b.time && `(${b.time})`}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.customerPhone}</span>
                  </div>
                </div>

                {(b.totalAmount || b.totalAmountEgp !== undefined || b.deliveryFeeEgp !== undefined) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1.5 border-t border-slate-200/40 dark:border-slate-700/40">
                    {b.deliveryFeeEgp !== undefined && (
                      <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {t.deliveryFee}: {b.deliveryFeeEgp} {t.currency}
                        {b.distanceKm ? ` (${b.distanceKm} ${lang === 'ar' ? 'كم' : 'km'})` : ''}
                      </span>
                    )}
                    <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {b.totalAmountEgp !== undefined
                        ? `${b.totalAmountEgp} ${t.currency}`
                        : b.totalAmount}
                    </span>
                  </div>
                )}

                {b.notes && (
                  <div className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900/60 p-2 rounded-lg">
                    "{b.notes}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
