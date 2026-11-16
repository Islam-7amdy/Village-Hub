import React, { useState, useEffect } from 'react';
import { Language, PendingPaymentOrder } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, CreditCard } from 'lucide-react';

interface UniversalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: 'doctor' | 'technician' | 'ride' | 'tutoring' | 'charity' | 'other';
  providerOwnerId?: string;
  providerName: string;
  serviceTitle: string;
  feeEgp?: number;
  lang: Language;
  defaultName?: string;
  defaultPhone?: string;
  defaultAddress?: string;
  onProceedToPayment: (order: PendingPaymentOrder) => void;
}

export const UniversalBookingModal: React.FC<UniversalBookingModalProps> = ({
  isOpen,
  onClose,
  serviceType,
  providerOwnerId,
  providerName,
  serviceTitle,
  feeEgp = 50,
  lang,
  defaultName = '',
  defaultPhone = '',
  defaultAddress = '',
  onProceedToPayment
}) => {
  const t = TRANSLATIONS[lang];
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);
  const [date, setDate] = useState('2026-11-15');
  const [time, setTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');

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

    const pendingOrder: PendingPaymentOrder = {
      source: 'booking',
      serviceType,
      title: serviceTitle,
      providerOwnerId,
      providerName,
      customerName: finalName,
      customerPhone: finalPhone,
      address: address.trim() || (lang === 'ar' ? 'الشارع العمومي بالبلد' : 'Main Village Street'),
      subtotalEgp: feeEgp,
      totalAmountEgp: feeEgp,
      date,
      time,
      notes: notes.trim() || undefined,
      itemsSummary: `${serviceTitle} (${date} · ${time})`
    };

    onClose();
    onProceedToPayment(pendingOrder);
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

          {/* Fee Summary Bar */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              {lang === 'ar' ? 'رسوم الخدمة / الحجز المطلوب سدادها:' : 'Service / Booking Fee:'}
            </span>
            <span className="font-mono font-extrabold text-sm text-amber-700 dark:text-amber-300">
              {feeEgp} {t.currency}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t.proceedToPayment}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
