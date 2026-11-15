import React, { useState, useEffect } from 'react';
import { BookingRequest, Language, ReviewItem } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, Star, CheckCircle, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetRole: string;
  lang: Language;
  defaultName?: string;
  eligibleBookings: BookingRequest[];
  onSubmitReview: (review: ReviewItem) => void | Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetRole,
  lang,
  defaultName = '',
  eligibleBookings,
  onSubmitReview
}) => {
  const t = TRANSLATIONS[lang];
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState(defaultName);
  const [neighborhood, setNeighborhood] = useState('الناحية الشرقية');
  const [comment, setComment] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string>(eligibleBookings[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultName && !authorName) setAuthorName(defaultName);
  }, [defaultName, authorName]);

  useEffect(() => {
    if (isOpen) {
      setSelectedBookingId(eligibleBookings[0]?.id || '');
      setError('');
    }
  }, [isOpen, eligibleBookings]);

  if (!isOpen) return null;

  const neighborhoods = [
    { ar: 'وسط البلد - عند الميدان والجامع', en: 'Village Center - Near Mosque' },
    { ar: 'الناحية الشرقية - طريق الترعة', en: 'East Quarter - Canal Road' },
    { ar: 'الناحية الغربية - مفرق المدارس', en: 'West Quarter - School Junction' },
    { ar: 'العزبة والغيطان الجنوبية', en: 'South Hamlet & Farmlands' },
    { ar: 'طريق البندر والمدخل', en: 'Main Road Entrance' }
  ];

  const ratingDescriptions: Record<number, { ar: string; en: string }> = {
    5: { ar: 'ممتاز جداً - شغل نضيف وأمانة عالية', en: 'Excellent - Outstanding service & honesty' },
    4: { ar: 'جيد جداً - ذوق وسريع في ميعاده', en: 'Very Good - Respectful & fast response' },
    3: { ar: 'كويس - خلص الشغل بشكل مقبول', en: 'Good - Job completed adequately' },
    2: { ar: 'مقبول - محتاج يظبط مواعيده أكتر', en: 'Fair - Needs better timeliness' },
    1: { ar: 'مش عاجبني - حصلت مشاكل في الخدمة', en: 'Unsatisfied - Encountered service issues' }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      setError(
        lang === 'ar'
          ? 'يلزم وجود طلب مكتمل مع مقدم الخدمة لإضافة تقييم موثق.'
          : 'A completed order with this provider is required to submit a review.'
      );
      return;
    }
    const finalAuthor = authorName.trim() || defaultName;
    if (!finalAuthor) {
      setError(lang === 'ar' ? 'اكتب اسمك الأول لو سمحت' : 'Please enter your name');
      return;
    }
    if (!comment.trim() || comment.trim().length < 2) {
      setError(lang === 'ar' ? 'اكتبلنا رأيك وتجربتك في كلمتين' : 'Please provide details of your experience');
      return;
    }

    const matchedNeighborhood = neighborhoods.find(
      (n) => n.ar === neighborhood || n.en === neighborhood
    ) || { ar: neighborhood, en: neighborhood };

    const newReview: ReviewItem = {
      id: `rev-${selectedBookingId}`,
      bookingId: selectedBookingId,
      targetId,
      author: finalAuthor,
      neighborhood: matchedNeighborhood,
      rating,
      date: new Date().toISOString().split('T')[0],
      comment: {
        ar: comment.trim(),
        en: comment.trim()
      },
      isVerifiedResident: true
    };

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmitReview(newReview);
      setComment('');
      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : lang === 'ar'
          ? 'تعذر حفظ التقييم. تأكد من أن الطلب مكتمل ولم يتم تقييمه مسبقاً.'
          : 'Could not save review. Ensure your order is completed and not yet reviewed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScore = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-500/10 dark:bg-amber-950/30">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.addReview}
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
              {targetName} · {targetRole}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {eligibleBookings.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">
                  {lang === 'ar'
                    ? 'التقييم متاح بعد إتمام الطلب فقط'
                    : 'Reviews require a completed order'}
                </div>
                <div className="opacity-90">
                  {lang === 'ar'
                    ? 'يجب أن يكون لديك طلب أو حجز مكتمل مع مقدم الخدمة هذا لم تقم بتقييمه من قبل.'
                    : 'You need at least one completed, unreviewed booking with this service provider to submit a verified review.'}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'الطلب المكتمل المرتبط بالتقييم' : 'Completed Order Being Reviewed'}
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {eligibleBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} · {b.date || b.createdAt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Star Selection */}
          <div className="text-center space-y-2 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              {t.ratingStars}
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeScore;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 min-h-[1.25rem]">
              {ratingDescriptions[activeScore]?.[lang] || ''}
            </p>
          </div>

          {/* Name & Neighborhood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.name} *
              </label>
              <input
                type="text"
                required={!defaultName}
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value);
                  setError('');
                }}
                placeholder={defaultName || (lang === 'ar' ? 'مثلاً: أبو عمر، أم خالد' : 'e.g. Abu Omar')}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.reviewerNeighborhood}
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              >
                {neighborhoods.map((n, idx) => (
                  <option key={idx} value={n[lang]}>
                    {n[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.yourReview} *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError('');
              }}
              placeholder={
                lang === 'ar'
                  ? 'اكتب رأيك بأمانة حول دقة المواعيد، الإتقان، السعر، وحسن المعاملة...'
                  : 'Write your honest review on punctuality, quality, pricing, and courtesy...'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Verified Purchase Badge (System Enforced) */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
              {lang === 'ar'
                ? 'تقييم موثق بناءً على طلب مكتمل من حسابك'
                : 'Verified review linked automatically to your completed order'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || eligibleBookings.length === 0}
              className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{lang === 'ar' ? 'نشر التقييم' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
