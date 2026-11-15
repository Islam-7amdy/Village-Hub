import React from 'react';
import { Language, ReviewItem } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, Star, ShieldCheck, Plus, MessageSquare, MapPin } from 'lucide-react';

interface ProviderReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetRole: string;
  targetAvatar?: string;
  rating: number;
  reviewsCount: number;
  reviews: ReviewItem[];
  lang: Language;
  eligibleReviewsCount?: number;
  onOpenAddReview: () => void;
}

export const ProviderReviewsModal: React.FC<ProviderReviewsModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetRole,
  targetAvatar,
  rating,
  reviewsCount,
  reviews,
  lang,
  eligibleReviewsCount = 0,
  onOpenAddReview
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const targetReviews = reviews.filter((r) => r.targetId === targetId);

  // Calculate rating counts for 1..5 stars
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  targetReviews.forEach((r) => {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
    counts[rounded] = (counts[rounded] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            {targetAvatar ? (
              <img
                src={targetAvatar}
                alt={targetName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-lg">
                ★
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {targetName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {targetRole}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rating Score Breakdown Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {rating.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(rating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {reviewsCount} {lang === 'ar' ? 'تقييم من أهالي القرية' : 'village resident reviews'}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={onOpenAddReview}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addReview}</span>
            </button>
            {eligibleReviewsCount === 0 && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'يتطلب إتمام طلب مكتمل لإضافة تقييم'
                  : 'Requires a completed order to review'}
              </span>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {targetReviews.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'كن أول من يشارك رأيه وتقييمه حول هذه الخدمة في القرية'
                  : 'Be the first resident to share feedback on this service'}
              </p>
              <button
                onClick={onOpenAddReview}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addReview}</span>
              </button>
            </div>
          ) : (
            targetReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {rev.author}
                      </span>
                      {rev.isVerifiedResident && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{t.verifiedResident}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{rev.neighborhood[lang]}</span>
                      <span>·</span>
                      <span>{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {rev.comment[lang] || rev.comment.ar || rev.comment.en}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
