import React, { useState } from 'react';
import { Language, VillageConfig, calculateDeliveryFeeEgp } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, Camera, CheckCircle2, Truck, MapPin } from 'lucide-react';

interface PrescriptionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeVillage: VillageConfig;
  onPrescriptionSent: (orderInfo: {
    name: string;
    phone: string;
    address: string;
    notes: string;
    distanceKm: number;
    deliveryFeeEgp: number;
  }) => void;
}

export const PrescriptionUploadModal: React.FC<PrescriptionUploadModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeVillage,
  onPrescriptionSent
}) => {
  const t = TRANSLATIONS[lang];
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState(
    activeVillage.districts[0]?.id || 'dist-center'
  );
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const district = activeVillage.districts.find((d) => d.id === selectedDistrictId) || activeVillage.districts[0];
  const distanceKm = district?.distanceKm || 1.0;
  const deliveryFeeEgp = calculateDeliveryFeeEgp(
    distanceKm,
    false,
    activeVillage.baseDeliveryFeeEgp,
    activeVillage.perKmFeeEgp
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) return;

    onPrescriptionSent({
      name: patientName,
      phone,
      address: `${district ? district.name[lang] : ''}${address.trim() ? ` - ${address.trim()}` : ''}`,
      notes,
      distanceKm,
      deliveryFeeEgp
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.sendPrescription}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? `صيدلية الشفاء (${activeVillage.nameAr}) · صرف وتوصيل سريع`
                  : `Al-Shifa Pharmacy (${activeVillage.nameEn}) · Express Delivery`}
              </p>
            </div>
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
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'تمام! الروشتة وصلت الصيدلية' : 'Prescription Photo Received!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? 'د. هدى بتجهزلك العلاج دلوقتي والمندوب هيوصلهولك لحد البيت والدفع كاش عند الاستلام.'
                : 'The pharmacist is preparing your medication for doorstep cash-on-delivery.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
            {/* Photo Attachment */}
            <div
              onClick={() => setHasPhoto(!hasPhoto)}
              className={`p-5 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                hasPhoto
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-400'
              }`}
            >
              <Camera className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              {hasPhoto ? (
                <div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    ✓ {lang === 'ar' ? 'تم إرفاق صورة الروشتة بنجاح' : 'Prescription photo attached'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {lang === 'ar' ? 'دوس هنا لو عايز تغير الصورة' : 'Click to change photo'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'ar' ? 'دوس هنا عشان تصور الروشتة أو علبة الدواء' : 'Tap to snap or upload prescription photo'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {lang === 'ar' ? 'عشان كبار السن يطلبوا الدواء بسهولة من غير كتابة' : 'Easy for seniors without typing drug names'}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.name} *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={lang === 'ar' ? 'اسم المريض' : 'Patient name'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.phone} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <MapPin className="w-3.5 h-3.5 inline me-1 text-emerald-600" />
                {t.deliveryZone}
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {activeVillage.districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name[lang]} ({d.distanceKm} {lang === 'ar' ? 'كم' : 'km'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.address} *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'ar' ? 'الشارع / جنب بيت مين؟' : 'Street / Landmark'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar' ? 'ملاحظات أو حاجات تانية محتاجها' : 'Notes / Other Items'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={lang === 'ar' ? 'مثلاً: هات معاك قطن وشاش وخافض حرارة' : 'e.g. gauze and fever syrup'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 shrink-0" />
                <span>{t.distanceDelivery}</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {deliveryFeeEgp} {t.currency} ({distanceKm} {lang === 'ar' ? 'كم' : 'km'})
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
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'ابعت للصيدلية دلوقتي' : 'Send to Pharmacy'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
