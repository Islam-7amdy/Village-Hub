import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import {
  Language,
  VillageAnnouncement,
  VillageConfig,
  AnalyticsEventType,
  getVillageTheme
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  Plus,
  Newspaper,
  CheckCircle2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Pin,
  Phone,
  BookOpen
} from 'lucide-react';

interface NewsSectionProps {
  announcements: VillageAnnouncement[];
  lang: Language;
  activeVillageId: string;
  activeVillageName: string;
  activeVillage?: VillageConfig;
  currentUserId: string | null;
  currentUserName: string;
  defaultPhone?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  canUseServices?: boolean;
  onRequireLogin: () => void;
  onTrackEvent?: (type: AnalyticsEventType, targetId: string, targetLabel: string) => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  announcements,
  lang,
  activeVillageId,
  activeVillageName,
  activeVillage,
  currentUserId,
  currentUserName,
  defaultPhone,
  isAdmin,
  isBanned,
  canUseServices = false,
  onRequireLogin,
  onTrackEvent
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage?.colorCode);
  const viewedNewsThisSessionRef = useRef<Set<string>>(new Set());

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<VillageAnnouncement['category']>('community');
  const [contactPhone, setContactPhone] = useState(defaultPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState('');

  const categories: { id: VillageAnnouncement['category']; ar: string; en: string }[] = [
    { id: 'official', ar: 'بيان رسمي', en: 'Official Notice' },
    { id: 'utility', ar: 'مرافق ومياه وكهرباء', en: 'Utilities & Services' },
    { id: 'community', ar: 'أخبار البلد والأهالي', en: 'Community News' },
    { id: 'event', ar: 'مناسبات وفعاليات', en: 'Events' },
    { id: 'emergency', ar: 'خبر عاجل وهام', en: 'Urgent Update' }
  ];

  const getCategoryLabel = (cat: VillageAnnouncement['category']) => {
    const found = categories.find((c) => c.id === cat);
    return found ? found[lang] : cat;
  };

  const approvedNews = announcements.filter(
    (item) =>
      item.status === 'approved' &&
      (item.villageId === activeVillageId || !item.villageId)
  );

  const myPendingNews = announcements.filter(
    (item) =>
      currentUserId &&
      item.ownerId === currentUserId &&
      item.status !== 'approved'
  );

  useEffect(() => {
    setSpotlightIndex(0);
  }, [activeVillageId]);

  useEffect(() => {
    if (approvedNews.length <= 1 || isPaused || isSubmitModalOpen || isReaderModalOpen) return;
    const timer = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % approvedNews.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [approvedNews.length, isPaused, isSubmitModalOpen, isReaderModalOpen]);

  const safeSpotlightIndex = approvedNews.length > 0 ? spotlightIndex % approvedNews.length : 0;
  const featuredNews = approvedNews[safeSpotlightIndex];

  const getLocalizedTitle = (item: VillageAnnouncement) =>
    lang === 'en' ? item.titleEn || item.title : item.title;

  const getLocalizedContent = (item: VillageAnnouncement) =>
    lang === 'en' ? item.contentEn || item.content : item.content;

  const getLocalizedAuthor = (item: VillageAnnouncement) =>
    lang === 'en' ? item.authorNameEn || item.authorName : item.authorName;

  useEffect(() => {
    if (!featuredNews || !onTrackEvent) return;
    const key = `${currentUserId || 'guest'}_${featuredNews.id}`;
    if (viewedNewsThisSessionRef.current.has(key)) return;
    viewedNewsThisSessionRef.current.add(key);
    onTrackEvent('news_view', featuredNews.id, featuredNews.title);
  }, [featuredNews?.id, featuredNews?.title, currentUserId, onTrackEvent]);

  const handleOpenCreate = () => {
    if (!currentUserId || !canUseServices) {
      onRequireLogin();
      return;
    }
    if (isBanned) return;
    if (!contactPhone && defaultPhone) {
      setContactPhone(defaultPhone);
    }
    setIsSubmitModalOpen(true);
  };

  const handleOpenReader = (item?: VillageAnnouncement) => {
    if (item) {
      setSelectedNewsId(item.id);
      onTrackEvent?.('news_click', item.id, item.title);
    } else {
      setSelectedNewsId(featuredNews?.id || null);
      if (featuredNews) {
        onTrackEvent?.('news_click', featuredNews.id, featuredNews.title);
      }
    }
    setIsReaderModalOpen(true);
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isBanned || !title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const newsId = `news-${Date.now()}`;
    const todayIso = new Date().toISOString().split('T')[0];

    try {
      try {
        const payload: Record<string, unknown> = {
          ownerId: currentUserId,
          authorName: currentUserName || (lang === 'ar' ? 'أحد أهالي البلد' : 'Village Resident'),
          villageId: activeVillageId,
          title: title.trim().slice(0, 140),
          content: content.trim().slice(0, 800),
          category,
          date: todayIso,
          isPinned: false,
          status: isAdmin ? 'approved' : 'pending',
          createdAtMs: Date.now(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (contactPhone.trim()) {
          payload.contactPhone = contactPhone.trim().slice(0, 30);
        }
        await setDoc(doc(db, 'announcements', newsId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `announcements/${newsId}`);
      }

      setSubmittedNotice(
        isAdmin
          ? lang === 'ar'
            ? 'تم نشر الخبر في أهم أخبار بلدنا فوراً!'
            : 'News item published immediately!'
          : lang === 'ar'
          ? 'تسلم إيدك! الخبر اتبعت للإدارة وهينزل في أهم الأخبار أول ما يتراجع.'
          : 'Submitted! Your news item is pending admin review.'
      );

      setTimeout(() => {
        setSubmittedNotice('');
        setIsSubmitModalOpen(false);
        setTitle('');
        setContent('');
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevSlide = () => {
    if (approvedNews.length <= 1) return;
    const nextIdx = (spotlightIndex - 1 + approvedNews.length) % approvedNews.length;
    setSpotlightIndex(nextIdx);
    const nextItem = approvedNews[nextIdx];
    if (nextItem) onTrackEvent?.('news_click', nextItem.id, nextItem.title);
  };

  const handleNextSlide = () => {
    if (approvedNews.length <= 1) return;
    const nextIdx = (spotlightIndex + 1) % approvedNews.length;
    setSpotlightIndex(nextIdx);
    const nextItem = approvedNews[nextIdx];
    if (nextItem) onTrackEvent?.('news_click', nextItem.id, nextItem.title);
  };

  return (
    <div
      className="h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Hero Showcase Band: Important Village News */}
      <div className="relative flex-1 bg-slate-900 text-white flex flex-col">
        <div className="flex-1 bg-gradient-to-br from-sky-950/90 via-slate-900/95 to-emerald-950/90 p-5 sm:p-8 flex flex-col justify-between">
          {/* Showcase Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/15">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-medium">
                  <span>{activeVillageName}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {lang === 'ar'
                      ? `${approvedNews.length} خبر هام وتنبيه`
                      : `${approvedNews.length} top updates`}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                  {lang === 'ar'
                    ? `أهم أخبار ${activeVillageName}`
                    : `${activeVillageName} Top News`}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              disabled={isBanned}
              className={`min-h-[40px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shrink-0 ${
                isBanned
                  ? 'bg-slate-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 cursor-pointer shadow-sm'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.submitNews}</span>
            </button>
          </div>

          {/* Spotlight Featured News Card */}
          <div className="pt-5 min-h-[168px] flex-1 flex flex-col justify-between gap-5">
            {featuredNews ? (
              <>
                <div className="space-y-2.5 max-w-3xl">
                  {/* Unboxed typographic metadata strip */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/85">
                    <span
                      className={
                        featuredNews.category === 'emergency' ? 'text-rose-300' : 'text-sky-300'
                      }
                    >
                      {getCategoryLabel(featuredNews.category)}
                    </span>
                    {featuredNews.isPinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Pin className="w-3 h-3" />
                          {lang === 'ar' ? 'مثبت' : 'Pinned'}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{getLocalizedAuthor(featuredNews)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-white/75">{featuredNews.date}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-balance text-white">
                    {getLocalizedTitle(featuredNews)}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl line-clamp-2">
                    {getLocalizedContent(featuredNews)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenReader(featuredNews)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ar'
                          ? approvedNews.length > 1
                            ? `اقرأ التفاصيل (${approvedNews.length})`
                            : 'اقرأ الخبر بالكامل'
                          : approvedNews.length > 1
                          ? `Read All (${approvedNews.length})`
                          : 'Read Full Story'}
                      </span>
                    </button>

                    {featuredNews.contactPhone && (
                      <a
                        href={`tel:${featuredNews.contactPhone}`}
                        onClick={(e) => {
                          onTrackEvent?.('news_click', featuredNews.id, featuredNews.title);
                          if (!canUseServices) {
                            e.preventDefault();
                            onRequireLogin();
                          }
                        }}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="font-mono tabular-nums">{featuredNews.contactPhone}</span>
                      </a>
                    )}
                  </div>

                  {/* Slide Switcher Controls */}
                  {approvedNews.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono tabular-nums text-white/80">
                        {safeSpotlightIndex + 1} / {approvedNews.length}
                      </span>
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label={lang === 'ar' ? 'الخبر السابق' : 'Previous news'}
                        className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label={lang === 'ar' ? 'الخبر التالي' : 'Next news'}
                        className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? (
                          <ChevronLeft className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {lang === 'ar'
                      ? `تابع أخبار ومواعيد خدمات ${activeVillageName} أول بأول`
                      : `Stay updated with the latest news across ${activeVillageName}`}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                    {lang === 'ar'
                      ? 'تنبيهات الميه والكهرباء، مواعيد القوافل الطبية، وأخبار أهالي البلد المهمة بتظهر هنا مجاناً.'
                      : 'Utility schedules, medical convoys, and community updates appear here.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  disabled={isBanned}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shrink-0 cursor-pointer"
                >
                  {lang === 'ar' ? 'شارك بأول خبر الآن' : 'Share First Update'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Pending / Rejected News Notice */}
      {myPendingNews.length > 0 && (
        <div className="p-3.5 sm:px-5 bg-sky-50/80 dark:bg-sky-950/30 border-t border-sky-200 dark:border-sky-900/50 space-y-1.5 text-xs">
          <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>
              {lang === 'ar'
                ? 'أخبارك اللي لسه بتتراجع عند الإدارة:'
                : 'Your news submissions awaiting review:'}
            </span>
          </div>
          <div className="space-y-1">
            {myPendingNews.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300"
              >
                <span className="truncate">{getLocalizedTitle(item)}</span>
                <span className="font-semibold text-sky-700 dark:text-sky-400 shrink-0">
                  {item.status === 'rejected'
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

      {/* Full News Reader Modal */}
      {isReaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? `نشرة أهم أخبار ${activeVillageName}` : `${activeVillageName} News Bulletin`}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'ar'
                      ? `${approvedNews.length} خبر منشور ومعتمد`
                      : `${approvedNews.length} published updates`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReaderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {approvedNews.map((item) => {
                const isSelected = selectedNewsId === item.id;
                return (
                  <article
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-colors space-y-2.5 ${
                      isSelected
                        ? 'border-sky-400 dark:border-sky-600 bg-sky-50/50 dark:bg-sky-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span
                        className={
                          item.category === 'emergency'
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-sky-700 dark:text-sky-400 font-bold'
                        }
                      >
                        {getCategoryLabel(item.category)}
                      </span>
                      {item.isPinned && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Pin className="w-3 h-3" />
                            {lang === 'ar' ? 'مثبت' : 'Pinned'}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{getLocalizedAuthor(item)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{item.date}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {getLocalizedTitle(item)}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {getLocalizedContent(item)}
                    </p>

                    {item.contactPhone && (
                      <div className="pt-1">
                        <a
                          href={`tel:${item.contactPhone}`}
                          onClick={(e) => {
                            if (!canUseServices) {
                              e.preventDefault();
                              setIsReaderModalOpen(false);
                              onRequireLogin();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline font-mono"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.contactPhone}</span>
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsReaderModalOpen(false);
                  handleOpenCreate();
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.submitNews}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReaderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit News Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className={`w-5 h-5 ${theme.text}`} />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.submitNews}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
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
              <form
                key="submit-news-form"
                onSubmit={handleSubmitNews}
                className="p-6 space-y-4 text-xs overflow-y-auto"
              >
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'عنوان الخبر *' : 'News Headline *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'مثال: موعد قافلة طبية أو انقطاع ميه أو فعالية...'
                        : 'e.g. Medical convoy schedule or community update'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'نوع الخبر *' : 'News Category *'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as VillageAnnouncement['category'])
                      }
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
                      {lang === 'ar' ? 'رقم تواصل (اختياري)' : 'Contact Phone (Optional)'}
                    </label>
                    <input
                      type="tel"
                      maxLength={30}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تفاصيل الخبر *' : 'News Details *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={800}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب تفاصيل الخبر، الموعد، والمكان بوضوح لأهالي البلد...'
                        : 'Write the full news details, time, and location clearly...'
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {!isAdmin && (
                  <p className="text-[11px] text-sky-700 dark:text-sky-400">
                    {lang === 'ar'
                      ? 'الخبر بيتراجع من إدارة المنصة للتأكد من صحته وبعدها بينزل في أهم أخبار البلد للجميع مجاناً.'
                      : 'Submissions are reviewed by Admin for accuracy before publishing publicly for free.'}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl cursor-pointer"
                  >
                    {isSubmitting
                      ? lang === 'ar'
                        ? 'جاري الإرسال...'
                        : 'Submitting...'
                      : lang === 'ar'
                      ? 'إرسال الخبر'
                      : 'Submit News'}
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
