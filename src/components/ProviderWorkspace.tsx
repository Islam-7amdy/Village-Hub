import React, { useMemo, useState } from 'react';
import {
  BookingRequest,
  BookingStatus,
  Language,
  ProviderAvailabilityConfig,
  ProviderListing,
  ReviewItem,
  UserProfile,
  VillageConfig,
  WEEKDAY_LABELS,
  evaluateProviderAvailability,
  getVillageTheme,
  getAllowedStatusesForService,
  getServiceStatusLabel,
  isDeliveryServiceType,
  matchesDeliveryReference,
  maskReferenceCode
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import { VillageLogo } from './VillageLogo';
import { getPaymentMethodLabel } from './Modals/OrderStatusModal';
import {
  Briefcase,
  Bell,
  Sun,
  Moon,
  Globe,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Phone,
  MapPin,
  Calendar,
  ReceiptText,
  Landmark,
  Banknote,
  ChefHat,
  Truck,
  Search,
  Star,
  Wallet,
  Settings,
  PackageCheck,
  FileSpreadsheet,
  Store,
  Power
} from 'lucide-react';

interface ProviderWorkspaceProps {
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeVillage: VillageConfig;
  providerProfile: UserProfile;
  providerListing?: ProviderListing;
  orders: BookingRequest[];
  reviews: ReviewItem[];
  commissionRatePercent: number;
  notificationsCount: number;
  isBanned: boolean;
  banReason?: string;
  banUntilMs?: number;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: BookingStatus,
    deliveryMeta?: { deliveryConfirmedRef: string; deliveryConfirmedAt: string }
  ) => void;
  onUpdateAvailability: (availability: ProviderAvailabilityConfig) => Promise<void> | void;
  nowMs?: number;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
}

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  doctor: { ar: 'أطباء وعيادات', en: 'Doctor & Clinic' },
  technician: { ar: 'فنيون وحرفيون', en: 'Technician & Craft' },
  food: { ar: 'مطاعم وكافيهات', en: 'Restaurant & Cafe' },
  pharmacy: { ar: 'صيدليات', en: 'Pharmacy' },
  grocery: { ar: 'بقالة وسوبر ماركت', en: 'Grocery & Market' },
  farm: { ar: 'منتجات زراعية', en: 'Farm & Produce' },
  tutoring: { ar: 'دروس ومعلمون', en: 'Tutoring & Education' },
  ride: { ar: 'مواصلات القرية', en: 'Village Rides' },
  charity: { ar: 'جمعيات خيرية', en: 'Charity & Aid' },
  other: { ar: 'خدمات أخرى', en: 'Other Services' },
  none: { ar: 'نشاط خدمي', en: 'Service Activity' }
};

export const ProviderWorkspace: React.FC<ProviderWorkspaceProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDarkMode,
  activeVillage,
  providerProfile,
  providerListing,
  orders,
  reviews,
  commissionRatePercent,
  notificationsCount,
  isBanned,
  banReason,
  banUntilMs,
  onUpdateOrderStatus,
  onUpdateAvailability,
  nowMs = Date.now(),
  onOpenNotifications,
  onOpenAuth
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);

  const [workspaceTab, setWorkspaceTab] = useState<'orders' | 'ledger' | 'activity'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'instapay' | 'cod'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [deliveryRefInput, setDeliveryRefInput] = useState<string>('');
  const [deliveryRefError, setDeliveryRefError] = useState<string>('');

  // Provider Availability & Working Hours Draft State
  const [isAcceptingDraft, setIsAcceptingDraft] = useState<boolean>(
    providerListing?.isAcceptingOrders !== false
  );
  const [closedReasonDraft, setClosedReasonDraft] = useState<string>(
    providerListing?.manualClosedReason || ''
  );
  const [scheduleEnabledDraft, setScheduleEnabledDraft] = useState<boolean>(
    Boolean(providerListing?.scheduleEnabled)
  );
  const [openTimeDraft, setOpenTimeDraft] = useState<string>(
    providerListing?.openTime || '09:00'
  );
  const [closeTimeDraft, setCloseTimeDraft] = useState<string>(
    providerListing?.closeTime || '22:00'
  );
  const [workingDaysDraft, setWorkingDaysDraft] = useState<number[]>(
    Array.isArray(providerListing?.workingDays) && providerListing.workingDays.length > 0
      ? providerListing.workingDays
      : [6, 0, 1, 2, 3, 4]
  );
  const [isSavingAvailability, setIsSavingAvailability] = useState<boolean>(false);
  const [availabilitySavedMsg, setAvailabilitySavedMsg] = useState<string>('');

  React.useEffect(() => {
    setIsAcceptingDraft(providerListing?.isAcceptingOrders !== false);
    setClosedReasonDraft(providerListing?.manualClosedReason || '');
    setScheduleEnabledDraft(Boolean(providerListing?.scheduleEnabled));
    setOpenTimeDraft(providerListing?.openTime || '09:00');
    setCloseTimeDraft(providerListing?.closeTime || '22:00');
    setWorkingDaysDraft(
      Array.isArray(providerListing?.workingDays)
        ? providerListing.workingDays
        : [6, 0, 1, 2, 3, 4]
    );
  }, [
    providerListing?.isAcceptingOrders,
    providerListing?.manualClosedReason,
    providerListing?.scheduleEnabled,
    providerListing?.openTime,
    providerListing?.closeTime,
    providerListing?.workingDays
  ]);

  const currentLiveAvailability = useMemo(
    () => evaluateProviderAvailability(providerListing, nowMs),
    [providerListing, nowMs]
  );

  const previewDraftAvailability = useMemo(
    () =>
      evaluateProviderAvailability(
        {
          isAcceptingOrders: isAcceptingDraft,
          manualClosedReason: closedReasonDraft,
          scheduleEnabled: scheduleEnabledDraft,
          openTime: openTimeDraft,
          closeTime: closeTimeDraft,
          workingDays: workingDaysDraft
        },
        nowMs
      ),
    [
      isAcceptingDraft,
      closedReasonDraft,
      scheduleEnabledDraft,
      openTimeDraft,
      closeTimeDraft,
      workingDaysDraft,
      nowMs
    ]
  );

  const buildAvailabilityPayload = (overrideAccepting?: boolean): ProviderAvailabilityConfig => ({
    isAcceptingOrders:
      typeof overrideAccepting === 'boolean' ? overrideAccepting : isAcceptingDraft,
    manualClosedReason: closedReasonDraft.trim().slice(0, 120),
    scheduleEnabled: scheduleEnabledDraft,
    openTime: openTimeDraft || '09:00',
    closeTime: closeTimeDraft || '22:00',
    workingDays: workingDaysDraft
  });

  const handleQuickToggleAccepting = async () => {
    const nextAccepting = !(providerListing?.isAcceptingOrders !== false);
    setIsAcceptingDraft(nextAccepting);
    setIsSavingAvailability(true);
    try {
      await onUpdateAvailability(buildAvailabilityPayload(nextAccepting));
      setAvailabilitySavedMsg(
        nextAccepting
          ? lang === 'ar'
            ? 'تم فتح استقبال الطلبات الآن ✓'
            : 'Orders enabled — You are now Open ✓'
          : lang === 'ar'
          ? 'تم إيقاف استقبال الطلبات والظهور كمغلق ✓'
          : 'Orders paused — You now appear Closed ✓'
      );
      setTimeout(() => setAvailabilitySavedMsg(''), 3000);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleSaveAvailabilitySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAvailability(true);
    try {
      await onUpdateAvailability(buildAvailabilityPayload());
      setAvailabilitySavedMsg(
        lang === 'ar'
          ? 'تم حفظ حالة التوافر ومواعيد العمل بنجاح ✓'
          : 'Availability & working hours saved ✓'
      );
      setTimeout(() => setAvailabilitySavedMsg(''), 3000);
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const toggleWorkingDay = (day: number) => {
    setWorkingDaysDraft((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const metrics = useMemo(() => {
    const activeOrders = orders.filter(
      (o) =>
        o.status === 'pending' ||
        o.status === 'confirmed' ||
        o.status === 'preparing' ||
        o.status === 'on_the_way'
    );
    const pendingConfirmCount = orders.filter((o) => o.status === 'pending').length;
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
    const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
    const unsettledOrders = nonCancelled.filter((o) => o.settlementStatus !== 'settled');

    let dueFromPlatformEgp = 0;
    let dueToPlatformEgp = 0;
    let totalInstaPayGrossEgp = 0;
    let totalCodGrossEgp = 0;

    nonCancelled.forEach((o) => {
      const total = o.totalAmountEgp || 0;
      if (o.paymentMethod === 'instapay' || o.paymentStatus === 'paid') {
        totalInstaPayGrossEgp += total;
      } else {
        totalCodGrossEgp += total;
      }
    });

    unsettledOrders.forEach((o) => {
      const baseAmount =
        typeof o.subtotalEgp === 'number' && o.subtotalEgp > 0
          ? o.subtotalEgp
          : Math.max(0, (o.totalAmountEgp || 0) - (o.codFeeEgp || 0));
      const commissionEgp = Math.round((baseAmount * commissionRatePercent) / 100);
      const codFee = o.codFeeEgp || 0;

      if (o.paymentStatus === 'paid' || o.paymentMethod === 'instapay') {
        dueFromPlatformEgp += Math.max(0, (o.totalAmountEgp || baseAmount) - commissionEgp);
      } else {
        dueToPlatformEgp += commissionEgp + codFee;
      }
    });

    const netUnsettledEgp = dueFromPlatformEgp - dueToPlatformEgp;
    const completionRate =
      orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0;

    return {
      totalOrders: orders.length,
      activeCount: activeOrders.length,
      pendingConfirmCount,
      completedCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
      completionRate,
      totalInstaPayGrossEgp,
      totalCodGrossEgp,
      dueFromPlatformEgp,
      dueToPlatformEgp,
      netUnsettledEgp,
      instaPayCount: nonCancelled.filter(
        (o) => o.paymentMethod === 'instapay' || o.paymentStatus === 'paid'
      ).length,
      codCount: nonCancelled.filter(
        (o) => o.paymentMethod === 'cod' || o.paymentStatus === 'pending_cod'
      ).length
    };
  }, [orders, commissionRatePercent]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter === 'pending' && o.status !== 'pending') return false;
      if (
        statusFilter === 'in_progress' &&
        o.status !== 'confirmed' &&
        o.status !== 'preparing' &&
        o.status !== 'on_the_way'
      ) {
        return false;
      }
      if (statusFilter === 'completed' && o.status !== 'completed') return false;
      if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;

      const isOnline = o.paymentMethod === 'instapay' || o.paymentStatus === 'paid';
      if (paymentFilter === 'instapay' && !isOnline) return false;
      if (paymentFilter === 'cod' && isOnline) return false;

      if (!q) return true;
      return (
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        (o.address || '').toLowerCase().includes(q) ||
        (o.transactionRef || '').toLowerCase().includes(q) ||
        (o.itemsSummary || '').toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  const effectiveStatus = providerListing?.status || providerProfile.providerStatus;
  const categoryKey = providerListing?.category || providerProfile.serviceCategory || 'none';
  const categoryLabel =
    CATEGORY_LABELS[categoryKey]?.[lang] || CATEGORY_LABELS.none[lang];
  const activityTitle =
    (lang === 'ar' ? providerListing?.specialtyAr : providerListing?.specialtyEn) ||
    providerProfile.serviceTitle ||
    categoryLabel;
  const activityPrice =
    (lang === 'ar' ? providerListing?.priceLabelAr : providerListing?.priceLabelEn) ||
    (providerProfile.serviceFeeEgp ? `${providerProfile.serviceFeeEgp} ${t.currency}` : '—');
  const activityDistrict =
    (lang === 'ar' ? providerListing?.neighborhoodAr : providerListing?.neighborhoodEn) ||
    providerProfile.neighborhood ||
    (lang === 'ar' ? 'قرية نقباس' : 'Noqbas Village');
  const activityBio =
    (lang === 'ar' ? providerListing?.bioAr : providerListing?.bioEn) ||
    providerProfile.serviceBio ||
    '';

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const isActiveStatus = (s: BookingStatus) =>
    s === 'pending' || s === 'confirmed' || s === 'preparing' || s === 'on_the_way';

  const openDeliveryVerification = (orderId: string) => {
    setVerifyingOrderId(orderId);
    setDeliveryRefInput('');
    setDeliveryRefError('');
  };

  const handleConfirmDeliveryWithRef = (order: BookingRequest) => {
    const trimmed = deliveryRefInput.trim();
    if (!matchesDeliveryReference(trimmed, order.transactionRef)) {
      setDeliveryRefError(
        lang === 'ar'
          ? 'الرقم المرجعي غير مطابق لرقم العميل — اطلب الرقم المرجعي الصحيح من العميل لتأكيد التسليم.'
          : 'Reference code does not match customer order reference — ask customer for the valid code.'
      );
      return;
    }
    onUpdateOrderStatus(order.id, 'completed', {
      deliveryConfirmedRef: trimmed.replace(/^#/, '').toUpperCase(),
      deliveryConfirmedAt: new Date().toISOString().split('T')[0]
    });
    setVerifyingOrderId(null);
    setDeliveryRefInput('');
    setDeliveryRefError('');
  };

  const handleStatusSelectChange = (order: BookingRequest, targetStatus: BookingStatus) => {
    if (targetStatus === 'completed' && isDeliveryServiceType(order.serviceType)) {
      openDeliveryVerification(order.id);
      return;
    }
    onUpdateOrderStatus(order.id, targetStatus);
  };

  const renderQuickAction = (order: BookingRequest) => {
    const allowed = getAllowedStatusesForService(order.serviceType);
    const isDelivery = isDeliveryServiceType(order.serviceType);

    if (order.status === 'pending') {
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('confirmed', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'confirmed') {
      if (allowed.includes('preparing')) {
        return (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
            className={`px-4 py-2 rounded-lg ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>{getServiceStatusLabel('preparing', order.serviceType, lang)}</span>
          </button>
        );
      }
      if (allowed.includes('on_the_way')) {
        return (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{getServiceStatusLabel('on_the_way', order.serviceType, lang)}</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('completed', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'preparing' && allowed.includes('on_the_way')) {
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('on_the_way', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'on_the_way') {
      if (isDelivery) {
        return (
          <button
            type="button"
            onClick={() => openDeliveryVerification(order.id)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {lang === 'ar' ? 'تأكيد التسليم بالرقم المرجعي' : 'Confirm Delivery w/ Ref'}
            </span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('completed', order.serviceType, lang)}</span>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Dedicated Provider Top Bar (3-zone SaaS header — completely separate from resident marketplace) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Provider Portal Brand */}
          <button
            type="button"
            onClick={() => setWorkspaceTab('orders')}
            className="flex items-center gap-2.5 text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <VillageLogo village={activeVillage} lang={lang} size="md" />
            <span>
              {lang === 'ar' ? 'بوابة مقدم الخدمة' : 'Provider Portal'}
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Workspace Tabs */}
          <nav
            aria-label={lang === 'ar' ? 'أقسام إدارة النشاط' : 'Provider Sections'}
            className="hidden md:flex items-center gap-6 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => setWorkspaceTab('orders')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceTab === 'orders'
                  ? `${theme.text} border-current font-bold`
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar'
                ? `طلبات النشاط (${orders.length})`
                : `Orders (${orders.length})`}
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('ledger')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceTab === 'ledger'
                  ? `${theme.text} border-current font-bold`
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'كشف الحساب والتسويات' : 'Financial Ledger'}
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab('activity')}
              className={`py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceTab === 'activity'
                  ? `${theme.text} border-current font-bold`
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'حالة النشاط والتفاصيل' : 'Activity Status'}
            </button>
          </nav>

          {/* Zone 3: Provider Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenNotifications}
              title={t.notifications}
              aria-label={t.notifications}
              className="relative p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <Bell className="w-4 h-4" />
              {notificationsCount > 0 && (
                <span
                  className={`absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full ${theme.solidBg} text-white text-[10px] font-bold font-mono tabular-nums flex items-center justify-center`}
                >
                  {notificationsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label={darkMode ? t.dayMode : t.nightMode}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.switchLang}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg ${theme.solidBg} ${theme.hoverBg} text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
            >
              {providerProfile.photoUrl ? (
                <img
                  src={providerProfile.photoUrl}
                  alt={providerProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              <span className="max-w-[110px] truncate">{providerProfile.displayName}</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setWorkspaceTab('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceTab === 'orders'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? `طلبات النشاط (${orders.length})` : `Orders (${orders.length})`}
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceTab === 'ledger'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? 'كشف الحساب والتسويات' : 'Financial Ledger'}
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
              workspaceTab === 'activity'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? 'حالة النشاط والتفاصيل' : 'Activity Status'}
          </button>
        </div>
      </header>

      {/* Main Provider Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Account Ban Notice */}
        {isBanned && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold">
                  {lang === 'ar'
                    ? 'نشاطك / حسابك محظور حالياً من الإدارة'
                    : 'Your provider account is currently restricted'}
                </div>
                <div className="text-[11px] opacity-85">
                  {banUntilMs
                    ? lang === 'ar'
                      ? `ينتهي الحظر: ${new Date(banUntilMs).toLocaleString('ar-EG')}`
                      : `Expires: ${new Date(banUntilMs).toLocaleString()}`
                    : lang === 'ar'
                    ? 'حظر دائم'
                    : 'Permanent restriction'}
                  {banReason ? ` · ${banReason}` : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer whitespace-nowrap"
            >
              {t.account}
            </button>
          </div>
        )}

        {/* Activity Status Summary Header (Always visible — Provider's Business Status) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                {providerProfile.photoUrl ? (
                  <img
                    src={providerProfile.photoUrl}
                    alt={providerProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className={`w-6 h-6 ${theme.text}`} />
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <span>{lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn}</span>
                  <span aria-hidden="true">·</span>
                  <span>{categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activityDistrict}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {providerProfile.displayName}
                </h1>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{activityTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold">{activityPrice}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{providerProfile.phone}</span>
                </div>
              </div>
            </div>

            {/* Explicit Activity Approval State + Live Open/Closed Quick Switch + Account Edit CTA */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div
                className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  effectiveStatus === 'approved'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : effectiveStatus === 'rejected'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
              >
                {effectiveStatus === 'approved' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'ar' ? 'نشاط معتمد' : 'Approved'}
                    </span>
                  </>
                ) : effectiveStatus === 'rejected' ? (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {lang === 'ar' ? 'يحتاج مراجعة' : 'Revision Needed'}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {lang === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
                    </span>
                  </>
                )}
              </div>

              {/* Instant Open / Closed Toggle Button */}
              <button
                type="button"
                disabled={isSavingAvailability}
                onClick={handleQuickToggleAccepting}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 ${
                  currentLiveAvailability.isOpen
                    ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : providerListing?.isAcceptingOrders === false
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {providerListing?.isAcceptingOrders === false
                    ? lang === 'ar'
                      ? 'إعادة فتح واستقبال الطلبات'
                      : 'Reopen & Accept Orders'
                    : lang === 'ar'
                    ? 'إيقاف استلام الطلبات (إغلاق الآن)'
                    : 'Pause Orders (Appear Closed)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab('activity')}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'مواعيد العمل' : 'Hours'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'الحساب' : 'Account'}</span>
              </button>
            </div>
          </div>

          {/* Live Platform Visibility Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 ${
                  currentLiveAvailability.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                }`}
              >
                {currentLiveAvailability.isOpen ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {lang === 'ar'
                    ? `الظهور للأهالي الآن: ${currentLiveAvailability.labelAr}`
                    : `Public Status: ${currentLiveAvailability.labelEn}`}
                </span>
              </span>

              {currentLiveAvailability.scheduleTextAr && (
                <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {lang === 'ar'
                    ? `مواعيد العمل المحددة: ${currentLiveAvailability.scheduleTextAr}`
                    : `Schedule: ${currentLiveAvailability.scheduleTextEn}`}
                </span>
              )}
            </div>

            {availabilitySavedMsg && (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {availabilitySavedMsg}
              </span>
            )}
          </div>
        </section>

        {/* 4-Column Tabular KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'الطلبات الواردة للنشاط' : 'Total Activity Orders'}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.totalOrders}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                {metrics.activeCount} {lang === 'ar' ? 'نشط حالياً' : 'active'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {metrics.pendingConfirmCount > 0
                ? lang === 'ar'
                  ? `${metrics.pendingConfirmCount} بانتظار تأكيدك الآن`
                  : `${metrics.pendingConfirmCount} awaiting confirmation`
                : lang === 'ar'
                ? 'لا توجد طلبات معلقة للتأكيد'
                : 'No pending confirmations'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'الطلبات المكتملة' : 'Completed Orders'}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {metrics.completedCount}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono tabular-nums">
                {metrics.completionRate}%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {lang === 'ar'
                ? `${metrics.cancelledCount} طلب ملغي`
                : `${metrics.cancelledCount} cancelled`}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ar' ? 'مبيعات InstaPay / الكاش' : 'InstaPay vs COD'}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.totalInstaPayGrossEgp + metrics.totalCodGrossEgp} {t.currency}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              InstaPay: {metrics.totalInstaPayGrossEgp} · {lang === 'ar' ? 'كاش' : 'COD'}: {metrics.totalCodGrossEgp}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
              <span>{lang === 'ar' ? 'صافي التسوية غير المسددة' : 'Net Unsettled Balance'}</span>
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div
              className={`mt-1.5 text-2xl font-black font-mono tabular-nums ${
                metrics.netUnsettledEgp >= 0
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {metrics.netUnsettledEgp >= 0 ? '+' : ''}
              {metrics.netUnsettledEgp} {t.currency}
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {metrics.netUnsettledEgp >= 0
                ? lang === 'ar'
                  ? `مستحق لك من الإدارة · عمولة ${commissionRatePercent}%`
                  : `Receivable from Admin · ${commissionRatePercent}% fee`
                : lang === 'ar'
                ? `مستحق عليك للإدارة · عمولة ${commissionRatePercent}%`
                : `Payable to Admin · ${commissionRatePercent}% fee`}
            </div>
          </div>
        </section>

        {/* TAB 1: ORDERS WORKSPACE */}
        {workspaceTab === 'orders' && (
          <section className="space-y-4">
            {/* Search & Filters Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  className={`absolute top-2.5 w-4 h-4 text-slate-400 pointer-events-none ${
                    lang === 'ar' ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'ar'
                      ? 'ابحث باسم العميل، الموبايل، العنوان، أو رقم المرجع...'
                      : 'Search by customer, phone, address, or reference...'
                  }
                  className={`w-full py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                  {(
                    [
                      { id: 'all', ar: `الكل (${orders.length})`, en: `All (${orders.length})` },
                      {
                        id: 'pending',
                        ar: `جديد (${metrics.pendingConfirmCount})`,
                        en: `Pending (${metrics.pendingConfirmCount})`
                      },
                      {
                        id: 'in_progress',
                        ar: 'قيد التنفيذ',
                        en: 'In Progress'
                      },
                      {
                        id: 'completed',
                        ar: `مكتمل (${metrics.completedCount})`,
                        en: `Completed (${metrics.completedCount})`
                      },
                      {
                        id: 'cancelled',
                        ar: `ملغي (${metrics.cancelledCount})`,
                        en: `Cancelled (${metrics.cancelledCount})`
                      }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        statusFilter === tab.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang === 'ar' ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'instapay' | 'cod')}
                  aria-label={lang === 'ar' ? 'تصفية طريقة الدفع' : 'Filter payment method'}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="all">{lang === 'ar' ? 'كل طرق الدفع' : 'All Payments'}</option>
                  <option value="instapay">InstaPay</option>
                  <option value="cod">{lang === 'ar' ? 'كاش عند الاستلام' : 'Cash (COD)'}</option>
                </select>
              </div>
            </div>

            {/* Detailed Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
                <PackageCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {orders.length === 0
                    ? lang === 'ar'
                      ? 'لم تصلك أي طلبات على نشاطك حتى الآن.'
                      : 'No incoming orders for your business yet.'
                    : lang === 'ar'
                    ? 'لا توجد طلبات مطابقة للتصفية الحالية.'
                    : 'No orders match the current filter.'}
                </div>
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setPaymentFilter('all');
                    }}
                    className={`mt-2 px-4 py-2 rounded-lg ${theme.solidBg} text-white text-xs font-bold cursor-pointer`}
                  >
                    {lang === 'ar' ? 'إظهار جميع الطلبات' : 'Reset Filters'}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPaidOnline =
                    order.paymentStatus === 'paid' || order.paymentMethod === 'instapay';
                  const isSettled = order.settlementStatus === 'settled';
                  const baseAmount =
                    typeof order.subtotalEgp === 'number' && order.subtotalEgp > 0
                      ? order.subtotalEgp
                      : Math.max(0, (order.totalAmountEgp || 0) - (order.codFeeEgp || 0));
                  const commissionEgp = Math.round((baseAmount * commissionRatePercent) / 100);
                  const providerNetShare = isPaidOnline
                    ? Math.max(0, (order.totalAmountEgp || baseAmount) - commissionEgp)
                    : Math.max(0, (order.totalAmountEgp || baseAmount) - commissionEgp - (order.codFeeEgp || 0));

                  return (
                    <article
                      key={order.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-2">
                            <span>
                              #
                              {isDeliveryServiceType(order.serviceType) &&
                              order.status !== 'completed' &&
                              order.status !== 'cancelled'
                                ? maskReferenceCode(order.transactionRef)
                                : order.transactionRef || order.id}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{order.createdAt}</span>
                            {order.date && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {lang === 'ar' ? 'الموعد:' : 'Scheduled:'} {order.date}
                                  {order.time ? ` (${order.time})` : ''}
                                </span>
                              </>
                            )}
                          </div>
                          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {order.title}
                          </h2>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                              order.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : order.status === 'cancelled'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {getServiceStatusLabel(order.status, order.serviceType, lang)}
                          </span>
                        </div>
                      </div>

                      {/* Hairline Split Grid: Customer Details + Order Scope & Financial Breakdown */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Customer Contact & Address */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400">
                            {lang === 'ar' ? 'بيانات العميل والتوصيل' : 'Customer & Location'}
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                            <span>{order.customerName}</span>
                            <span aria-hidden="true">·</span>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="inline-flex items-center gap-1 font-mono tabular-nums text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>{order.customerPhone}</span>
                            </a>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              {order.address}
                              {typeof order.distanceKm === 'number'
                                ? ` (${order.distanceKm} ${lang === 'ar' ? 'كم' : 'km'})`
                                : ''}
                            </span>
                          </div>
                          {order.itemsSummary && (
                            <div className="text-slate-700 dark:text-slate-200 flex items-start gap-1.5">
                              <ReceiptText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="font-semibold">{order.itemsSummary}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="text-slate-600 dark:text-slate-400">
                              <span className="font-bold">
                                {lang === 'ar' ? 'ملاحظات العميل:' : 'Notes:'}
                              </span>{' '}
                              {order.notes}
                            </div>
                          )}
                        </div>

                        {/* Payment & Financial Breakdown */}
                        <div className="space-y-2 md:border-s md:border-slate-100 md:dark:border-slate-800 md:ps-4">
                          <div className="text-[11px] font-bold text-slate-400">
                            {lang === 'ar' ? 'التفاصيل المالية والتحصيل' : 'Payment & Financial Details'}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                              {isPaidOnline ? (
                                <Landmark className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Banknote className="w-4 h-4 text-amber-600" />
                              )}
                              <span>{getPaymentMethodLabel(order.paymentMethod, lang)}</span>
                            </span>
                            <span className="font-mono tabular-nums text-sm font-black text-slate-900 dark:text-white">
                              {order.totalAmountEgp ? `${order.totalAmountEgp} ${t.currency}` : '—'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums space-y-0.5">
                            <div>
                              {lang === 'ar' ? 'قيمة الخدمة/الطلبات:' : 'Subtotal:'} {baseAmount} {t.currency}
                              {order.deliveryFeeEgp
                                ? ` · ${lang === 'ar' ? 'توصيل:' : 'Delivery:'} ${order.deliveryFeeEgp} ${t.currency}`
                                : ''}
                              {order.codFeeEgp
                                ? ` · ${lang === 'ar' ? 'رسوم كاش:' : 'COD Fee:'} ${order.codFeeEgp} ${t.currency}`
                                : ''}
                            </div>
                            <div>
                              {lang === 'ar'
                                ? `عمولة المنصة (${commissionRatePercent}%): ${commissionEgp} ج.م · صافي نصيبك: ${providerNetShare} ج.م`
                                : `Platform Fee (${commissionRatePercent}%): ${commissionEgp} EGP · Net Share: ${providerNetShare} EGP`}
                            </div>
                          </div>

                          <div
                            className={`text-[11px] font-bold ${
                              isPaidOnline
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isPaidOnline
                              ? lang === 'ar'
                                ? '✓ تم السداد لحساب المنصة (لا تطلب مبلغ من العميل)'
                                : '✓ Paid online to platform (do not collect cash)'
                              : lang === 'ar'
                              ? `حصّل ${order.totalAmountEgp || 0} ج.م كاش عند التسليم`
                              : `Collect ${order.totalAmountEgp || 0} EGP cash on delivery`}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isSettled
                              ? lang === 'ar'
                                ? `حالة التسوية: تمت التسوية مع الإدارة ✓${order.settledAt ? ` (${order.settledAt})` : ''}`
                                : `Settlement: Settled ✓`
                              : lang === 'ar'
                              ? 'حالة التسوية: بانتظار التسوية المالية'
                              : 'Settlement: Pending with Admin'}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Confirmed Reference Proof (completed delivery orders) */}
                      {order.status === 'completed' && order.deliveryConfirmedRef && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            {lang === 'ar'
                              ? `تم تأكيد التسليم بالرقم المرجعي من العميل: #${order.deliveryConfirmedRef}`
                              : `Delivery confirmed via customer ref: #${order.deliveryConfirmedRef}`}
                          </span>
                        </div>
                      )}

                      {/* Delivery Reference Input Verification Gate (for delivery orders) */}
                      {verifyingOrderId === order.id && (
                        <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3 text-xs">
                          <div className="font-bold text-sky-900 dark:text-sky-200">
                            {lang === 'ar'
                              ? 'تأكيد التسليم — أدخل الرقم المرجعي من العميل:'
                              : 'Confirm Delivery — Enter Customer Reference Number:'}
                          </div>
                          <p className="text-[11px] text-sky-800 dark:text-sky-300 opacity-90">
                            {lang === 'ar'
                              ? 'اطلب الرقم المرجعي الظاهر لدى العميل في شاشة متابعة الطلب (مثل NQB-849315 أو آخر 6 أرقام) وسجله هنا لإتمام التسليم.'
                              : 'Ask the customer for the reference number shown in their Order Status view and enter it below.'}
                          </p>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              dir="ltr"
                              value={deliveryRefInput}
                              onChange={(e) => {
                                setDeliveryRefInput(e.target.value);
                                if (deliveryRefError) setDeliveryRefError('');
                              }}
                              placeholder="NQB-XXXXXX / COD-XXXXXX"
                              className="flex-1 px-3.5 py-2 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmDeliveryWithRef(order)}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-nowrap cursor-pointer"
                            >
                              {lang === 'ar' ? 'تأكيد وإتمام التسليم' : 'Verify & Complete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyingOrderId(null);
                                setDeliveryRefError('');
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap cursor-pointer"
                            >
                              {t.cancel}
                            </button>
                          </div>
                          {deliveryRefError && (
                            <div className="text-rose-600 dark:text-rose-400 font-bold">
                              {deliveryRefError}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Workflow Controls Footer */}
                      {isActiveStatus(order.status) && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {renderQuickAction(order)}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                                className="px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                              >
                                {lang === 'ar' ? 'رفض / إلغاء الطلب' : 'Cancel Order'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <label className="text-slate-500 dark:text-slate-400 font-semibold">
                              {lang === 'ar' ? 'تغيير الحالة:' : 'Status:'}
                            </label>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusSelectChange(order, e.target.value as BookingStatus)
                              }
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                            >
                              {getAllowedStatusesForService(order.serviceType).map((st) => (
                                <option key={st} value={st}>
                                  {getServiceStatusLabel(st, order.serviceType, lang)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: FINANCIAL SETTLEMENT LEDGER */}
        {workspaceTab === 'ledger' && (
          <section className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className={`w-4 h-4 ${theme.text}`} />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'كشف حساب طلبات النشاط والتسويات' : 'Activity Orders & Financial Ledger'}
                  </h2>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {lang === 'ar'
                    ? `نسبة عمولة المنصة الحالية: ${commissionRatePercent}%`
                    : `Platform Commission Rate: ${commissionRatePercent}%`}
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar'
                    ? 'لا توجد معاملات مالية مسجلة حتى الآن.'
                    : 'No financial transactions recorded yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 text-start font-bold">
                          {lang === 'ar' ? 'المرجع / التاريخ' : 'Ref / Date'}
                        </th>
                        <th className="py-3 px-4 text-start font-bold">
                          {lang === 'ar' ? 'الطلب والعميل' : 'Order & Customer'}
                        </th>
                        <th className="py-3 px-4 text-start font-bold">
                          {lang === 'ar' ? 'طريقة الدفع' : 'Payment'}
                        </th>
                        <th className="py-3 px-4 text-end font-bold">
                          {lang === 'ar' ? 'الإجمالي' : 'Total'}
                        </th>
                        <th className="py-3 px-4 text-end font-bold">
                          {lang === 'ar' ? 'عمولة المنصة' : 'Commission'}
                        </th>
                        <th className="py-3 px-4 text-end font-bold">
                          {lang === 'ar' ? 'صافي التسوية' : 'Settlement'}
                        </th>
                        <th className="py-3 px-4 text-start font-bold">
                          {lang === 'ar' ? 'الحالة' : 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders.map((o) => {
                        const isCancelled = o.status === 'cancelled';
                        const isOnline = o.paymentMethod === 'instapay' || o.paymentStatus === 'paid';
                        const baseAmount =
                          typeof o.subtotalEgp === 'number' && o.subtotalEgp > 0
                            ? o.subtotalEgp
                            : Math.max(0, (o.totalAmountEgp || 0) - (o.codFeeEgp || 0));
                        const comm = isCancelled ? 0 : Math.round((baseAmount * commissionRatePercent) / 100);
                        const settlementDelta = isCancelled
                          ? 0
                          : isOnline
                          ? Math.max(0, (o.totalAmountEgp || baseAmount) - comm)
                          : -(comm + (o.codFeeEgp || 0));

                        return (
                          <tr
                            key={o.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              <div>
                                #
                                {isDeliveryServiceType(o.serviceType) &&
                                o.status !== 'completed' &&
                                o.status !== 'cancelled'
                                  ? maskReferenceCode(o.transactionRef)
                                  : o.transactionRef || o.id}
                              </div>
                              <div className="text-[11px]">{o.createdAt}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">{o.title}</div>
                              <div className="text-[11px] text-slate-500">
                                {o.customerName} · {getServiceStatusLabel(o.status, o.serviceType, lang)}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {getPaymentMethodLabel(o.paymentMethod, lang)}
                            </td>
                            <td className="py-3 px-4 text-end font-mono tabular-nums font-bold">
                              {o.totalAmountEgp || 0} {t.currency}
                            </td>
                            <td className="py-3 px-4 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              {comm} {t.currency}
                            </td>
                            <td
                              className={`py-3 px-4 text-end font-mono tabular-nums font-bold ${
                                settlementDelta >= 0
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {isCancelled
                                ? '—'
                                : `${settlementDelta >= 0 ? '+' : ''}${settlementDelta} ${t.currency}`}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-semibold">
                              {isCancelled ? (
                                <span className="text-slate-400">
                                  {lang === 'ar' ? 'ملغي' : 'Cancelled'}
                                </span>
                              ) : o.settlementStatus === 'settled' ? (
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {lang === 'ar'
                                    ? `تمت التسوية ${o.settledAt || ''}`
                                    : `Settled ${o.settledAt || ''}`}
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-400">
                                  {lang === 'ar' ? 'معلق للتسوية' : 'Pending'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: ACTIVITY STATUS & RESIDENT REVIEWS */}
        {workspaceTab === 'activity' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Details */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Briefcase className={`w-5 h-5 ${theme.text}`} />
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'ملف النشاط وتفاصيل الظهور للأهالي' : 'Business Profile & Public Details'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`px-4 py-2 rounded-lg ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer whitespace-nowrap`}
                >
                  {lang === 'ar' ? 'تعديل بيانات النشاط' : 'Edit Business Info'}
                </button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'الاسم التجاري / اسم مقدم الخدمة' : 'Business / Provider Name'}
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">
                    {providerProfile.displayName}
                  </dd>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'القسم الرئيسي في المنصة' : 'Service Category'}
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">{categoryLabel}</dd>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'التخصص / الخدمة المقدمة' : 'Specialty / Service Title'}
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">{activityTitle}</dd>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'السعر / تعريفة الخدمة' : 'Listed Fee / Price'}
                  </dt>
                  <dd className="mt-1 font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {activityPrice}
                  </dd>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'رقم التواصل المباشر' : 'Contact Phone'}
                  </dt>
                  <dd className="mt-1 font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {providerListing?.phone || providerProfile.phone}
                  </dd>
                </div>

                <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'المنطقة / العنوان في القرية' : 'District / Address'}
                  </dt>
                  <dd className="mt-1 font-bold text-slate-900 dark:text-white">
                    {activityDistrict}
                    {providerProfile.address ? ` — ${providerProfile.address}` : ''}
                  </dd>
                </div>
              </dl>

              {activityBio && (
                <div className="pt-2 text-xs">
                  <div className="text-slate-500 dark:text-slate-400 mb-1">
                    {lang === 'ar' ? 'نبذة عن النشاط والخدمات:' : 'About This Business:'}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{activityBio}</p>
                </div>
              )}

              {/* Availability & Operating Hours Scheduler */}
              <form
                onSubmit={handleSaveAvailabilitySettings}
                className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${theme.text}`} />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'التحكم في استقبال الطلبات ومواعيد العمل' : 'Order Availability & Working Hours'}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      previewDraftAvailability.isOpen
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {lang === 'ar' ? previewDraftAvailability.labelAr : previewDraftAvailability.labelEn}
                  </span>
                </div>

                {/* Manual Pause / Open Switch */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'استقبال الطلبات الآن' : 'Accepting New Orders Now'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'ar'
                          ? 'عند الإيقاف، يظهر نشاطك كمغلق أمام أهالي القرية ولن يتمكن العملاء من إرسال طلبات جديدة.'
                          : 'When paused, your business appears Closed and residents cannot submit new orders.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAcceptingDraft((prev) => !prev)}
                      className={`px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isAcceptingDraft
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>
                        {isAcceptingDraft
                          ? lang === 'ar'
                            ? 'مفتوح ويستقبل الطلبات'
                            : 'Open for Orders'
                          : lang === 'ar'
                          ? 'مغلق (متوقف مؤقتاً)'
                          : 'Closed (Paused)'}
                      </span>
                    </button>
                  </div>

                  {!isAcceptingDraft && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {lang === 'ar'
                          ? 'سبب الإغلاق المؤقت (اختياري — يظهر للعملاء):'
                          : 'Closure note (optional — visible to customers):'}
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        value={closedReasonDraft}
                        onChange={(e) => setClosedReasonDraft(e.target.value)}
                        placeholder={
                          lang === 'ar'
                            ? 'مثال: مغلق للصلاة، إجازة اليوم، أو ضغط طلبات مؤقت'
                            : 'e.g. Closed for break, holiday, or busy queue'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Scheduled Working Hours */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'تحديد مواعيد العمل اليومية التلقائية' : 'Automatic Working Hours Schedule'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'ar'
                          ? 'يظهر نشاطك كمغلق تلقائياً خارج ساعات وأيام العمل المحددة.'
                          : 'Automatically shows your business as Closed outside these hours and days.'}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={scheduleEnabledDraft}
                        onChange={(e) => setScheduleEnabledDraft(e.target.checked)}
                        className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>{lang === 'ar' ? 'تفعيل جدول المواعيد' : 'Enable Schedule'}</span>
                    </label>
                  </div>

                  {scheduleEnabledDraft && (
                    <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {lang === 'ar' ? 'يفتح من الساعة:' : 'Opens at:'}
                          </label>
                          <input
                            type="time"
                            value={openTimeDraft}
                            onChange={(e) => setOpenTimeDraft(e.target.value || '09:00')}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                            {lang === 'ar' ? 'يغلق الساعة:' : 'Closes at:'}
                          </label>
                          <input
                            type="time"
                            value={closeTimeDraft}
                            onChange={(e) => setCloseTimeDraft(e.target.value || '22:00')}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                          {lang === 'ar' ? 'أيام العمل الأسبوعية:' : 'Working Days:'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAY_LABELS.map((wd) => {
                            const active = workingDaysDraft.includes(wd.day);
                            return (
                              <button
                                key={wd.day}
                                type="button"
                                onClick={() => toggleWorkingDay(wd.day)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                  active
                                    ? `${theme.solidBg} text-white`
                                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {lang === 'ar' ? wd.labelAr : wd.labelEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSavingAvailability}
                    className={`px-5 py-2.5 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer disabled:opacity-60`}
                  >
                    {isSavingAvailability
                      ? lang === 'ar'
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                      : lang === 'ar'
                      ? 'حفظ حالة التوافر ومواعيد العمل'
                      : 'Save Availability & Hours'}
                  </button>
                  {availabilitySavedMsg && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {availabilitySavedMsg}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Resident Reviews Column */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'آراء وتقييمات أهالي القرية' : 'Resident Reviews'}
                </h3>
                {avgRating && (
                  <span className="inline-flex items-center gap-1 text-xs font-black font-mono tabular-nums text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{avgRating}</span>
                    <span className="text-slate-400 font-normal">({reviews.length})</span>
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ar'
                    ? 'لم تُسجل تقييمات على نشاطك حتى الآن.'
                    : 'No resident reviews submitted for your activity yet.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{rev.author}</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{rev.rating}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {rev.neighborhood[lang]} · {rev.date}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.comment[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-5 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn}
            </span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'ar' ? 'لوحة إدارة أعمال مقدم الخدمة' : 'Service Provider Operations'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="hover:underline font-semibold cursor-pointer"
            >
              {t.notifications}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={onOpenAuth}
              className={`${theme.text} hover:underline font-semibold cursor-pointer`}
            >
              {t.account}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
