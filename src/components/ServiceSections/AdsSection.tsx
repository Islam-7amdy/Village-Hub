import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Language, VillageAd } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { Tag, Plus, Phone, CheckCircle2, Clock, X, Megaphone } from 'lucide-react';

interface AdsSectionProps {
  ads: VillageAd[];
  lang: Language;
  activeVillageId: string;
  activeVillageName: string;
  currentUserId: string | null;
  currentUserName: string;
  isAdmin: boolean;
  onRequireLogin: () => void;
}

export const AdsSection: React.FC<AdsSectionProps> = ({
  ads,
  lang,
  activeVillageId,
  activeVillageName,
  currentUserId,
  currentUserName,
  isAdmin,
  onRequireLogin
}) => {
  const t = TRANSLATIONS[lang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'offer' | 'shop' | 'property' | 'job' | 'event'>('offer');
  const [priceText, setPriceText] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState('');

  const categories = [
    { id: 'all', ar: 'كل الإعلانات', en: 'All Ads' },
    { id: 'offer', ar: 'عروض وتخفيضات', en: 'Offers & Deals' },
    { id: 'shop', ar: 'محلات وتجارة', en: 'Shops & Goods' },
    { id: 'property', ar: 'شقق وأراضي وإيجار', en: 'Real Estate' },
    { id: 'job', ar: 'فرص شغل', en: 'Jobs' },
    { id: 'event', ar: 'دروس ومناسبات', en: 'Events & Tutoring' }
  ];

  const getCategoryLabel = (cat: VillageAd['category']) => {
    const found = categories.find((c) => c.id === cat);
    return found ? found[lang] : cat;
  };

  const approvedAds = ads.filter(
    (ad) =>
      ad.status === 'approved' &&
      (ad.villageId === activeVillageId || !ad.villageId) &&
      (selectedCategory === 'all' || ad.category === selectedCategory)
  );

  const myPendingAds = ads.filter(
    (ad) =>
      currentUserId &&
      ad.ownerId === currentUserId &&
      ad.status !== 'approved'
  );

  const handleOpenCreate = () => {
    if (!currentUserId) {
      onRequireLogin();
      return;
    }
    setIsModalOpen(true);
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !title.trim() || !description.trim() || !contactPhone.trim()) return;

    setIsSubmitting(true);
    const adId = `ad-${Date.now()}`;
    try {
      try {
        await setDoc(doc(db, 'ads', adId), {
          ownerId: currentUserId,
          authorName: currentUserName || (lang === 'ar' ? 'أحد أهالي البلد' : 'Village Resident'),
          villageId: activeVillageId,
          title: title.trim(),
          description: description.trim(),
          category,
          priceText: priceText.trim(),
          contactPhone: contactPhone.trim(),
          status: isAdmin ? 'approved' : 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `ads/${adId}`);
      }

      setSubmittedNotice(
        isAdmin
          ? lang === 'ar'
            ? 'تم نشر الإعلان فوراً!'
            : 'Ad published immediately!'
          : lang === 'ar'
          ? 'تمام! إعلانك اتبعت للأدمن وهيتنشر أول ما يوافق عليه.'
          : 'Submitted! Your ad is pending admin approval.'
      );

      setTimeout(() => {
        setSubmittedNotice('');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setPriceText('');
        setContactPhone('');
      }, 1600);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.ads}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar'
                ? `عروض المحلات، شقق الإيجار، وفرص الشغل في ${activeVillageName} (تحت إشراف الأدمن)`
                : `Local deals, rentals, and jobs in ${activeVillageName} (admin moderated)`}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t.submitAd}</span>
        </button>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {c[lang]}
          </button>
        ))}
      </div>

      {/* User's Pending / Rejected Ads Notice */}
      {myPendingAds.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-xs">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {lang === 'ar' ? 'إعلاناتك اللي لسه بتتراجع عند الأدمن:' : 'Your ads awaiting admin approval:'}
            </span>
          </div>
          <div className="space-y-1">
            {myPendingAds.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>{ad.title}</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {ad.status === 'rejected'
                    ? lang === 'ar'
                      ? 'مرفوض'
                      : 'Rejected'
                    : lang === 'ar'
                    ? 'قيد المراجعة'
                    : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Ads Grid */}
      {approvedAds.length === 0 ? (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500">
          {lang === 'ar'
            ? 'مفيش إعلانات منشورة في القسم ده حالياً — كن أول واحد يضيف إعلان!'
            : 'No published ads in this category yet — be the first to submit one!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {approvedAds.map((ad) => (
            <div
              key={ad.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Unboxed metadata line per zero-pill discipline */}
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    {getCategoryLabel(ad.category)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{ad.authorName}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {ad.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ad.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-xs font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {ad.priceText || (lang === 'ar' ? 'تواصل للسعر' : 'Call for price')}
                </div>

                <a
                  href={`tel:${ad.contactPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{ad.contactPhone}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Ad Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.submitAd}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submittedNotice ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-900 dark:text-white">{submittedNotice}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAd} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'عنوان الإعلان *' : 'Ad Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: شقة للإيجار أو عرض خاص بمحل...' : 'e.g. Apartment for rent'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'القسم' : 'Category'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {categories
                        .filter((c) => c.id !== 'all')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c[lang]}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'السعر أو العرض (ج.م)' : 'Price / Offer (EGP)'}
                    </label>
                    <input
                      type="text"
                      value={priceText}
                      onChange={(e) => setPriceText(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: 500 ج.م / خصم 20%' : 'e.g. 500 EGP'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رقم التليفون للتواصل *' : 'Contact Phone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تفاصيل الإعلان *' : 'Details *'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={lang === 'ar' ? 'اكتب كل التفاصيل والمكان والمميزات...' : 'Describe the offer or item...'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {!isAdmin && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {lang === 'ar'
                      ? 'ملاحظة: الإعلان هيتبعت للأدمن يراجعه الأول وبعدين ينزل لكل أهل القرية.'
                      : 'Note: Your ad will be reviewed by the Admin before appearing publicly.'}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer"
                  >
                    {isSubmitting
                      ? lang === 'ar'
                        ? 'جاري الإرسال...'
                        : 'Submitting...'
                      : lang === 'ar'
                      ? 'ابعت للمراجعة'
                      : 'Submit Ad'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
