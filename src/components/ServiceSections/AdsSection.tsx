import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import {
  Language,
  VillageAd,
  VillageConfig,
  PlatformPricingConfig,
  AnalyticsEventType,
  getVillageTheme,
  isAdExpired
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  Plus,
  Phone,
  CheckCircle2,
  Clock,
  X,
  Megaphone,
  CalendarClock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AdsSectionProps {
  ads: VillageAd[];
  lang: Language;
  activeVillageId: string;
  activeVillageName: string;
  activeVillage?: VillageConfig;
  currentUserId: string | null;
  currentUserName: string;
  defaultPhone?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  adPricing: PlatformPricingConfig;
  nowMs: number;
  canUseServices?: boolean;
  onRequireLogin: () => void;
  onTrackEvent?: (type: AnalyticsEventType, targetId: string, targetLabel: string) => void;
}

export const AdsSection: React.FC<AdsSectionProps> = ({
  ads,
  lang,
  activeVillageId,
  activeVillageName,
  activeVillage,
  currentUserId,
  currentUserName,
  defaultPhone,
  isAdmin,
  isBanned,
  adPricing,
  nowMs,
  canUseServices = false,
  onRequireLogin,
  onTrackEvent
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage?.colorCode);
  const viewedAdsThisSessionRef = useRef<Set<string>>(new Set());

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'offer' | 'shop' | 'property' | 'job' | 'event'>('offer');
  const [priceText, setPriceText] = useState('');
  const [contactPhone, setContactPhone] = useState(defaultPhone || '');
  const [durationPlan, setDurationPlan] = useState<'week' | 'month'>('week');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState('');

  const categories = [
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

  const selectedDurationDays = durationPlan === 'week' ? 7 : 30;
  const selectedAdCost = durationPlan === 'week' ? adPricing.adPriceWeekEgp : adPricing.adPriceMonthEgp;

  const approvedAds = ads.filter(
    (ad) =>
      ad.status === 'approved' &&
      !isAdExpired(ad.expiresAtMs, nowMs) &&
      (ad.villageId === activeVillageId || !ad.villageId)
  );

  const myPendingAds = ads.filter(
    (ad) =>
      currentUserId &&
      ad.ownerId === currentUserId &&
      ad.status !== 'approved'
  );

  useEffect(() => {
    setSpotlightIndex(0);
  }, [activeVillageId]);

  useEffect(() => {
    if (approvedAds.length <= 1 || isPaused || isModalOpen) return;
    const timer = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % approvedAds.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [approvedAds.length, isPaused, isModalOpen]);

  const safeSpotlightIndex = approvedAds.length > 0 ? spotlightIndex % approvedAds.length : 0;
  const featuredAd = approvedAds[safeSpotlightIndex];

  useEffect(() => {
    if (!featuredAd || !onTrackEvent) return;
    const key = `${currentUserId || 'guest'}_${featuredAd.id}`;
    if (viewedAdsThisSessionRef.current.has(key)) return;
    viewedAdsThisSessionRef.current.add(key);
    onTrackEvent('ad_view', featuredAd.id, featuredAd.title);
  }, [featuredAd?.id, featuredAd?.title, currentUserId, onTrackEvent]);

  const handleOpenCreate = () => {
    if (!currentUserId || !canUseServices) {
      onRequireLogin();
      return;
    }
    if (isBanned) return;
    if (!contactPhone && defaultPhone) {
      setContactPhone(defaultPhone);
    }
    setIsModalOpen(true);
  };

  const formatRemainingDays = (expiresAtMs?: number) => {
    if (!expiresAtMs) return null;
    const msLeft = expiresAtMs - nowMs;
    if (msLeft <= 0) return null;
    const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
    if (hoursLeft < 24) {
      return lang === 'ar' ? `باقي ${hoursLeft} ساعة` : `${hoursLeft}h left`;
    }
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    return lang === 'ar' ? `باقي ${daysLeft} يوم` : `${daysLeft}d left`;
  };

  const handleSubmitAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isBanned || !title.trim() || !description.trim() || !contactPhone.trim()) return;

    setIsSubmitting(true);
    const adId = `ad-${Date.now()}`;
    const durationDays = selectedDurationDays;
    const costEgp = selectedAdCost;
    const expiresAtMs = Date.now() + durationDays * 24 * 60 * 60 * 1000;

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
          durationPlan,
          durationDays,
          costEgp,
          expiresAtMs,
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
            ? `تم نشر الإعلان لمدة ${durationDays} يوم فوراً!`
            : `Ad published for ${durationDays} days immediately!`
          : lang === 'ar'
          ? `تمام! إعلانك اتبعت للأدمن (مدة ${durationDays} يوم - ${costEgp} ج.م) وهيتنشر أول ما يوافق عليه.`
          : `Submitted! Pending admin approval (${durationDays} days - ${costEgp} EGP).`
      );

      setTimeout(() => {
        setSubmittedNotice('');
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setPriceText('');
        setDurationPlan('week');
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevSlide = () => {
    if (approvedAds.length <= 1) return;
    const nextIdx = (spotlightIndex - 1 + approvedAds.length) % approvedAds.length;
    setSpotlightIndex(nextIdx);
    const nextAd = approvedAds[nextIdx];
    if (nextAd) onTrackEvent?.('ad_click', nextAd.id, nextAd.title);
  };

  const handleNextSlide = () => {
    if (approvedAds.length <= 1) return;
    const nextIdx = (spotlightIndex + 1) % approvedAds.length;
    setSpotlightIndex(nextIdx);
    const nextAd = approvedAds[nextIdx];
    if (nextAd) onTrackEvent?.('ad_click', nextAd.id, nextAd.title);
  };

  return (
    <div
      className="h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Hero Showcase Band: Featured Ads & Offers */}
      <div className="relative flex-1 bg-slate-900 text-white flex flex-col">
        <div className={`flex-1 bg-gradient-to-br ${theme.heroTint} p-5 sm:p-8 flex flex-col justify-between`}>
          {/* Showcase Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/15">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-2xl ${theme.solidBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
                  <span>{activeVillageName}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {lang === 'ar'
                      ? `${approvedAds.length} إعلان وعرض ساري`
                      : `${approvedAds.length} active offers`}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                  {lang === 'ar' ? `إعلانات وعروض ${activeVillageName}` : `${activeVillageName} Ads & Offers`}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={isBanned}
              className={`min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shrink-0 ${
                isBanned
                  ? 'bg-slate-500 cursor-not-allowed'
                  : `${theme.solidBg} ${theme.hoverBg} cursor-pointer shadow-sm`
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.submitAd}</span>
            </button>
          </div>

          {/* Spotlight Featured Offer Card */}
          <div className="pt-5 min-h-[168px] flex-1 flex flex-col justify-between gap-5">
            {featuredAd ? (
              <>
                <div className="space-y-2.5 max-w-3xl">
                  {/* Clean unboxed typographic metadata strip */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
                    <span className="text-amber-300">{getCategoryLabel(featuredAd.category)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{featuredAd.authorName}</span>
                    {formatRemainingDays(featuredAd.expiresAtMs) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {formatRemainingDays(featuredAd.expiresAtMs)}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-balance text-white">
                    {featuredAd.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl line-clamp-2">
                    {featuredAd.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-emerald-300">
                      {featuredAd.priceText || (lang === 'ar' ? 'تواصل لمعرفة السعر' : 'Call for price')}
                    </div>

                    <a
                      href={`tel:${featuredAd.contactPhone}`}
                      onClick={(e) => {
                        onTrackEvent?.('ad_click', featuredAd.id, featuredAd.title);
                        if (!canUseServices) {
                          e.preventDefault();
                          onRequireLogin();
                        }
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">{featuredAd.contactPhone}</span>
                    </a>
                  </div>

                  {/* Slide Switcher Controls */}
                  {approvedAds.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-white/80">
                        {safeSpotlightIndex + 1} / {approvedAds.length}
                      </span>
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label={lang === 'ar' ? 'الإعلان السابق' : 'Previous ad'}
                        className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label={lang === 'ar' ? 'الإعلان التالي' : 'Next ad'}
                        className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-lg sm:text-2xl font-extrabold text-white">
                    {lang === 'ar'
                      ? `اعرض شغلك أو عرضك قدام كل أهالي ${activeVillageName}`
                      : `Showcase your shop, rental, or deal across ${activeVillageName}`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                    {lang === 'ar'
                      ? `تقدر تضيف إعلان عروض المحلات أو الشقق أو فرص الشغل في المكان ده (يبدأ من ${adPricing.adPriceWeekEgp} ${t.currency} للأسبوع).`
                      : `Publish local deals, rentals, or job listings here (starting from ${adPricing.adPriceWeekEgp} ${t.currency}/week).`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={isBanned}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {lang === 'ar' ? 'أضف أول إعلان الآن' : 'Post First Ad'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Pending / Rejected Ads Notice (shown only when user has pending/rejected submissions) */}
      {myPendingAds.length > 0 && (
        <div className="p-3.5 sm:px-5 bg-amber-50/80 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              {lang === 'ar' ? 'إعلاناتك اللي لسه بتتراجع عند الأدمن:' : 'Your ads awaiting admin approval:'}
            </span>
          </div>
          <div className="space-y-1">
            {myPendingAds.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>
                  {ad.title}
                  {typeof ad.costEgp === 'number' && (
                    <span className="text-[11px] text-slate-500 ms-2 font-mono">
                      ({ad.durationDays || 7}d · {ad.costEgp} {t.currency})
                    </span>
                  )}
                </span>
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

      {/* Submit Ad Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className={`w-5 h-5 ${theme.text}`} />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.submitAd}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
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
              <form key="submit-ad-form" onSubmit={handleSubmitAd} className="p-6 space-y-4 text-xs overflow-y-auto">
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

                {/* Duration & Cost Plan Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ar' ? 'مدة عرض الإعلان والتكلفة *' : 'Ad Display Duration & Fee *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDurationPlan('week')}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        durationPlan === 'week'
                          ? `${theme.border} ${theme.softBg}`
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'لحد أسبوع (7 أيام)' : 'Up to 1 Week (7d)'}
                      </div>
                      <div className={`text-sm font-extrabold font-mono ${theme.text} mt-1`}>
                        {adPricing.adPriceWeekEgp} {t.currency}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationPlan('month')}
                      className={`p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        durationPlan === 'month'
                          ? `${theme.border} ${theme.softBg}`
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'شهر كامل (30 يوم)' : 'Full Month (30d)'}
                      </div>
                      <div className={`text-sm font-extrabold font-mono ${theme.text} mt-1`}>
                        {adPricing.adPriceMonthEgp} {t.currency}
                      </div>
                    </button>
                  </div>
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
                      {categories.map((c) => (
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
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

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'تكلفة نشر الإعلان:' : 'Total Ad Cost:'}
                  </span>
                  <span className={`font-extrabold font-mono text-sm ${theme.text}`}>
                    {selectedAdCost} {t.currency} ({selectedDurationDays} {lang === 'ar' ? 'يوم' : 'days'})
                  </span>
                </div>

                {!isAdmin && (
                  <p className={`text-[11px] ${theme.text}`}>
                    {lang === 'ar'
                      ? 'الإعلان هيتبعت للأدمن يراجعه الأول وبعدين ينزل ويبدأ العد التنازلي لمدة العرض، ويختفي تلقائياً لما المدة تخلص.'
                      : 'Your ad is reviewed by Admin first; display timer starts upon approval and expires automatically.'}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 font-bold text-white ${theme.solidBg} ${theme.hoverBg} rounded-xl cursor-pointer`}
                  >
                    {isSubmitting
                      ? lang === 'ar'
                        ? 'جاري الإرسال...'
                        : 'Submitting...'
                      : lang === 'ar'
                      ? `إرسال (${selectedAdCost} ج.م)`
                      : `Submit (${selectedAdCost} EGP)`}
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
