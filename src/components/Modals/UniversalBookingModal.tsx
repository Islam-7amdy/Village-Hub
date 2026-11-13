import React, { useState, useEffect } from 'react';
import { BookingRequest, Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, CheckCircle2 } from 'lucide-react';

interface UniversalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'doctor' | 'technician' | 'ride' | 'tutoring' | 'charity' | 'other';
  providerName: string;
  serviceTitle: string;
  lang: Language;
  defaultName?: string;
  defaultPhone?: string;
  defaultAddress?: string;
  onConfirmBooking: (booking: BookingRequest) => void;
}

export const UniversalBookingModal: React.FC<UniversalBookingModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  providerName,
  serviceTitle,
  lang,
  defaultName = '',
  defaultPhone = '',
  defaultAddress = '',
  onConfirmBooking
}) => {
  const t = TRANSLATIONS[lang];
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);
  const [date, setDate] = useState('2026-11-15');
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (defaultName && !customerName) setCustomerName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (defaultPhone && !customerPhone) setCustomerPhone(defaultPhone);
  }, [defaultPhone]);

  useEffect(() => {
    if (defaultAddress && !address) setAddress(defaultAddress);
  }, [defaultAddress]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || defaultName;
    const finalPhone = customerPhone.trim() || defaultPhone;
    if (!finalName || !finalPhone) return;

    const newBooking: BookingRequest = {
      id: `book-${Date.now()}`,
      serviceType,
      title: serviceTitle,
      providerName,
      customerName: finalName,
      customerPhone: finalPhone,
      address: address.trim() || (lang === 'ar' ? 'الشارع العمومي بالقرية' : 'Main Village Street'),
      date,
      time,
      notes: notes.trim() || undefined,
      status: 'confirmed',
      createdAt: new Date().toLocaleDateString()
    };

    onConfirmBooking(newBooking);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{serviceTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{providerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{t.bookedSuccessfully}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? `طلبك اتسجل مع ${providerName} وهيتواصل معاك على الموبايل عشان يأكد الميعاد.`
                : `Your request with ${providerName} is confirmed. They will reach out to verify.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
            {/* Customer Name */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.name} *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثلاً: الحاج خليل محمد' : 'e.g. Khalil Mohamed'}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={!defaultName}
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.phone} *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010XXXXXXXX"
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={!defaultPhone}
              />
            </div>

            {/* Village Address / Quarter */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'ar' ? 'الناحية الشرقية - جنب المسجد الكبير' : 'East Quarter, near the mosque'}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.preferredDate}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.preferredTime}
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="10:30 AM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.problemDetails}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={lang === 'ar' ? 'اكتب المشكلة أو الأعراض أو عدد الكراسي...' : 'Problem description or special instructions...'}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t.confirm}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
