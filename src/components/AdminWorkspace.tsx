import React, { useState, useEffect, useMemo } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, ADMIN_EMAIL, handleFirestoreError, OperationType } from '../firebase';
import {
  Language,
  UserProfile,
  BannedPhoneRecord,
  BookingRequest,
  BookingStatus,
  PlatformPricingConfig,
  ProviderListing,
  ReviewItem,
  VillageAd,
  VillageConfig,
  VillageColorCode,
  VillageLogoIconId,
  ServiceSectionConfig,
  SectionIconKey,
  SectionColorKey,
  AnalyticsEventRecord,
  VILLAGE_COLOR_THEMES,
  VILLAGE_LOGO_PRESETS,
  normalizePhone,
  isBanCurrentlyActive,
  isAdExpired,
  getAllowedStatusesForService,
  getServiceStatusLabel,
  evaluateProviderAvailability
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import { VillageLogo, renderVillageLogoGlyph } from './VillageLogo';
import { DemoUserAdminAction } from './Modals/AdminDashboardModal';
import { getStatusLabel, getPaymentMethodLabel } from './Modals/OrderStatusModal';
import {
  ShieldCheck,
  BarChart3,
  LayoutGrid,
  Briefcase,
  Megaphone,
  PackageCheck,
  Wallet,
  Users,
  MapPin,
  Sun,
  Moon,
  Globe,
  Bell,
  UserCheck,
  Eye,
  MousePointerClick,
  TrendingUp,
  Activity,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  FileSpreadsheet,
  Printer,
  X,
  Search,
  Ban,
  Phone,
  DollarSign,
  CalendarClock,
  Upload,
  Star,
  Landmark,
  Banknote,
  UserPlus,
  Stethoscope,
  Pill,
  Utensils,
  Wrench,
  Car,
  ShoppingBag,
  GraduationCap,
  HeartHandshake,
  Shapes,
  Store,
  Hammer,
  Sparkles,
  Power,
  RefreshCw
} from 'lucide-react';

interface AdminWorkspaceProps {
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeVillage: VillageConfig;
  adminProfile: UserProfile | null;
  providers: ProviderListing[];
  ads: VillageAd[];
  users: UserProfile[];
  bannedPhones: BannedPhoneRecord[];
  bookings: BookingRequest[];
  reviews: ReviewItem[];
  sections: ServiceSectionConfig[];
  analyticsEvents: AnalyticsEventRecord[];
  adPricing: PlatformPricingConfig;
  nowMs: number;
  notificationsCount: number;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onVillageUpdated: (village: VillageConfig) => void;
  onDemoUserAction?: (action: DemoUserAdminAction) => void;
  onDemoProviderDecision?: (providerId: string, decision: 'approved' | 'rejected') => void;
  onAdminToggleProviderOpen?: (provider: ProviderListing, isAcceptingOrders: boolean) => void;
  onAdminDeleteProvider?: (provider: ProviderListing) => void;
  onSaveSection: (section: ServiceSectionConfig) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onResetSections: () => Promise<void>;
  onAdminSaveAd: (
    adId: string,
    payload: Partial<VillageAd> & {
      title: string;
      description: string;
      category: VillageAd['category'];
      contactPhone: string;
    },
    isNew?: boolean
  ) => Promise<void>;
  onAdminDeleteAd: (adId: string) => Promise<void>;
  onUpdateOrderStatus?: (
    orderId: string,
    status: BookingStatus,
    deliveryMeta?: { deliveryConfirmedRef: string; deliveryConfirmedAt: string }
  ) => void;
  onVerifyInstaPayPayment?: (orderId: string, decision: 'approve' | 'reject') => void;
  onAssignOrderProvider?: (orderId: string, providerOwnerId: string, providerName: string) => void;
  onSettleOrders?: (orderIds: string[]) => void;
  onCommissionRateChange?: (ratePercent: number) => void;
}

type AdminSectionTab =
  | 'overview'
  | 'sections'
  | 'providers'
  | 'ads'
  | 'orders'
  | 'settlement'
  | 'users'
  | 'village_settings';

const SECTION_ICONS: { key: SectionIconKey; ar: string; en: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'stethoscope', ar: 'طب وعيادات', en: 'Medical', Icon: Stethoscope },
  { key: 'pill', ar: 'صيدلية ودواء', en: 'Pharmacy', Icon: Pill },
  { key: 'utensils', ar: 'أكل ومطاعم', en: 'Food', Icon: Utensils },
  { key: 'wrench', ar: 'صيانة وفنيين', en: 'Repair', Icon: Wrench },
  { key: 'car', ar: 'مواصلات', en: 'Transport', Icon: Car },
  { key: 'shopping_basket', ar: 'بقالة وسوق', en: 'Grocery', Icon: ShoppingBag },
  { key: 'graduation_cap', ar: 'تعليم ودروس', en: 'Education', Icon: GraduationCap },
  { key: 'heart_handshake', ar: 'تكافل وجمعيات', en: 'Charity', Icon: HeartHandshake },
  { key: 'store', ar: 'محلات وتجارة', en: 'Store', Icon: Store },
  { key: 'hammer', ar: 'حرف وبناء', en: 'Crafts', Icon: Hammer },
  { key: 'sparkles', ar: 'خدمات مميزة', en: 'Featured', Icon: Sparkles },
  { key: 'shapes', ar: 'أنشطة أخرى', en: 'Other', Icon: Shapes },
  { key: 'layout', ar: 'عام', en: 'General', Icon: LayoutGrid }
];

const SECTION_COLORS: { key: SectionColorKey; ar: string; en: string; dot: string }[] = [
  { key: 'amber', ar: 'عنبري', en: 'Amber', dot: 'bg-amber-500' },
  { key: 'emerald', ar: 'زمردي', en: 'Emerald', dot: 'bg-emerald-500' },
  { key: 'rose', ar: 'قرمزي', en: 'Rose', dot: 'bg-rose-500' },
  { key: 'orange', ar: 'برتقالي', en: 'Orange', dot: 'bg-orange-500' },
  { key: 'blue', ar: 'أزرق', en: 'Blue', dot: 'bg-blue-500' },
  { key: 'lime', ar: 'ليموني', en: 'Lime', dot: 'bg-lime-500' },
  { key: 'indigo', ar: 'نيلي', en: 'Indigo', dot: 'bg-indigo-500' },
  { key: 'teal', ar: 'تركواز', en: 'Teal', dot: 'bg-teal-500' },
  { key: 'purple', ar: 'بنفسجي', en: 'Purple', dot: 'bg-purple-500' },
  { key: 'slate', ar: 'رمادي', en: 'Slate', dot: 'bg-slate-500' }
];

function csvCell(val: string | number | undefined): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDarkMode,
  activeVillage,
  adminProfile,
  providers,
  ads,
  users,
  bannedPhones,
  bookings,
  reviews,
  sections,
  analyticsEvents,
  adPricing,
  nowMs,
  notificationsCount,
  onOpenNotifications,
  onOpenAuth,
  onVillageUpdated,
  onDemoUserAction,
  onDemoProviderDecision,
  onAdminToggleProviderOpen,
  onAdminDeleteProvider,
  onSaveSection,
  onDeleteSection,
  onResetSections,
  onAdminSaveAd,
  onAdminDeleteAd,
  onUpdateOrderStatus,
  onVerifyInstaPayPayment,
  onAssignOrderProvider,
  onSettleOrders,
  onCommissionRateChange
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<AdminSectionTab>('overview');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Filters & search
  const [userSearch, setUserSearch] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Section Management Form State
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [secNameAr, setSecNameAr] = useState('');
  const [secNameEn, setSecNameEn] = useState('');
  const [secDescAr, setSecDescAr] = useState('');
  const [secDescEn, setSecDescEn] = useState('');
  const [secIconKey, setSecIconKey] = useState<SectionIconKey>('store');
  const [secColorKey, setSecColorKey] = useState<SectionColorKey>('amber');
  const [secSortOrder, setSecSortOrder] = useState('10');
  const [secEnabled, setSecEnabled] = useState(true);

  // Provider Analytics & Report Modal
  const [reportProvider, setReportProvider] = useState<ProviderListing | null>(null);
  const [confirmDeleteProviderId, setConfirmDeleteProviderId] = useState<string | null>(null);

  // Ads Editor / Creation State
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [isAdFormOpen, setIsAdFormOpen] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adCategory, setAdCategory] = useState<VillageAd['category']>('offer');
  const [adPriceText, setAdPriceText] = useState('');
  const [adPhone, setAdPhone] = useState('');
  const [adDurationDays, setAdDurationDays] = useState('7');
  const [confirmDeleteAdId, setConfirmDeleteAdId] = useState<string | null>(null);

  // Pricing & Commission
  const [weekPrice, setWeekPrice] = useState(String(adPricing.adPriceWeekEgp));
  const [monthPrice, setMonthPrice] = useState(String(adPricing.adPriceMonthEgp));
  const [commissionRateInput, setCommissionRateInput] = useState(
    String(adPricing.commissionRatePercent ?? 10)
  );

  // User moderation controls
  const [banDurationMap, setBanDurationMap] = useState<Record<string, string>>({});
  const [banReasonMap, setBanReasonMap] = useState<Record<string, string>>({});
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  // Village settings
  const [editBaseFee, setEditBaseFee] = useState(String(activeVillage.baseDeliveryFeeEgp));
  const [editPerKmFee, setEditPerKmFee] = useState(String(activeVillage.perKmFeeEgp));
  const [editColorCode, setEditColorCode] = useState<VillageColorCode>(activeVillage.colorCode || 'amber');
  const [editLogoIcon, setEditLogoIcon] = useState<VillageLogoIconId>(activeVillage.logoIcon || 'wheat');
  const [editLogoUrl, setEditLogoUrl] = useState(activeVillage.logoUrl || '');

  useEffect(() => {
    setWeekPrice(String(adPricing.adPriceWeekEgp));
    setMonthPrice(String(adPricing.adPriceMonthEgp));
    setCommissionRateInput(String(adPricing.commissionRatePercent ?? 10));
  }, [adPricing.adPriceWeekEgp, adPricing.adPriceMonthEgp, adPricing.commissionRatePercent]);

  useEffect(() => {
    setEditBaseFee(String(activeVillage.baseDeliveryFeeEgp ?? 10));
    setEditPerKmFee(String(activeVillage.perKmFeeEgp ?? 5));
    setEditColorCode(activeVillage.colorCode || 'amber');
    setEditLogoIcon(activeVillage.logoIcon || 'wheat');
    setEditLogoUrl(activeVillage.logoUrl || '');
  }, [activeVillage]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(''), 3000);
  };

  const effectiveCommissionRate = Math.min(
    50,
    Math.max(0, Number(adPricing.commissionRatePercent ?? 10) || 0)
  );

  // =========================================================================
  // COMPREHENSIVE TELEMETRY AGGREGATIONS (Views, Ads, Per-User, Per-Provider)
  // =========================================================================
  const telemetry = useMemo(() => {
    const sectionViews: Record<string, number> = {};
    const adViews: Record<string, number> = {};
    const adClicks: Record<string, number> = {};
    const providerViews: Record<string, number> = {};
    const userActivity: Record<
      string,
      { sectionViews: number; adViews: number; adClicks: number; providerViews: number }
    > = {};

    let totalSectionViews = 0;
    let totalAdViews = 0;
    let totalAdClicks = 0;
    let totalProviderViews = 0;

    analyticsEvents.forEach((ev) => {
      const uid = ev.ownerId || 'guest';
      if (!userActivity[uid]) {
        userActivity[uid] = { sectionViews: 0, adViews: 0, adClicks: 0, providerViews: 0 };
      }

      if (ev.eventType === 'section_view') {
        totalSectionViews += 1;
        sectionViews[ev.targetId] = (sectionViews[ev.targetId] || 0) + 1;
        userActivity[uid].sectionViews += 1;
      } else if (ev.eventType === 'ad_view') {
        totalAdViews += 1;
        adViews[ev.targetId] = (adViews[ev.targetId] || 0) + 1;
        userActivity[uid].adViews += 1;
      } else if (ev.eventType === 'ad_click') {
        totalAdClicks += 1;
        adClicks[ev.targetId] = (adClicks[ev.targetId] || 0) + 1;
        userActivity[uid].adClicks += 1;
      } else if (ev.eventType === 'provider_view') {
        totalProviderViews += 1;
        providerViews[ev.targetId] = (providerViews[ev.targetId] || 0) + 1;
        userActivity[uid].providerViews += 1;
      }
    });

    const totalAllViews = totalSectionViews + totalAdViews + totalProviderViews;
    const adCtrPercent =
      totalAdViews > 0 ? ((totalAdClicks / totalAdViews) * 100).toFixed(1) : '0.0';

    return {
      totalSectionViews,
      totalAdViews,
      totalAdClicks,
      totalProviderViews,
      totalAllViews,
      adCtrPercent,
      sectionViews,
      adViews,
      adClicks,
      providerViews,
      userActivity
    };
  }, [analyticsEvents]);

  // Per-Provider Complete Analytics & Financial Stats Map
  const providerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        viewsCount: number;
        orders: BookingRequest[];
        totalOrders: number;
        completedOrders: number;
        activeOrders: number;
        cancelledOrders: number;
        grossEgp: number;
        instaPayEgp: number;
        codEgp: number;
        commissionEgp: number;
        codFeesEgp: number;
        netPayableEgp: number;
        avgRating: string;
        reviewsList: ReviewItem[];
        completionRate: number;
        conversionRate: string;
      }
    >();

    providers.forEach((p) => {
      const nameLower = p.nameAr.trim().toLowerCase();
      const nameEnLower = p.nameEn.trim().toLowerCase();
      const pOrders = bookings.filter((b) => {
        if (b.providerOwnerId && (b.providerOwnerId === p.ownerId || b.providerOwnerId === p.id)) {
          return true;
        }
        const bProv = (b.providerName || '').trim().toLowerCase();
        return (
          (nameLower.length >= 3 && bProv.includes(nameLower)) ||
          (nameEnLower.length >= 3 && bProv.includes(nameEnLower))
        );
      });

      const validOrders = pOrders.filter(
        (b) =>
          b.status !== 'cancelled' &&
          !(b.paymentMethod === 'instapay' && b.paymentStatus !== 'paid')
      );
      const completedOrders = pOrders.filter((b) => b.status === 'completed').length;
      const cancelledOrders = pOrders.filter((b) => b.status === 'cancelled').length;
      const activeOrders = pOrders.filter((b) =>
        ['pending', 'confirmed', 'preparing', 'on_the_way'].includes(b.status)
      ).length;

      let grossEgp = 0;
      let instaPayEgp = 0;
      let codEgp = 0;
      let commissionEgp = 0;
      let codFeesEgp = 0;
      let netPayableEgp = 0;

      validOrders.forEach((b) => {
        const total = b.totalAmountEgp || 0;
        const codFee = b.codFeeEgp || 0;
        const base =
          typeof b.subtotalEgp === 'number' && b.subtotalEgp > 0
            ? b.subtotalEgp
            : Math.max(0, total - codFee);
        const comm = Math.round((base * effectiveCommissionRate) / 100);
        const isInsta = b.paymentMethod === 'instapay' || b.paymentStatus === 'paid';
        grossEgp += total;
        commissionEgp += comm;
        codFeesEgp += codFee;
        if (isInsta) {
          instaPayEgp += total;
          if (b.settlementStatus !== 'settled') netPayableEgp += Math.max(0, total - comm);
        } else {
          codEgp += total;
          if (b.settlementStatus !== 'settled') netPayableEgp -= comm + codFee;
        }
      });

      const candidateIds = new Set([p.id, p.ownerId, `prov-${p.id}`, `prov-food-${p.id}`, `prov-ph-${p.id}`, `prov-groc-${p.id}`, `prov-tut-${p.id}`, `prov-char-${p.id}`, `prov-ride-${p.id}`, `prov-oth-${p.id}`]);
      const pReviews = reviews.filter((r) => candidateIds.has(r.targetId));
      const avgRating =
        pReviews.length > 0
          ? (pReviews.reduce((s, r) => s + (r.rating || 5), 0) / pReviews.length).toFixed(1)
          : '5.0';

      const viewsCount =
        (telemetry.providerViews[p.ownerId] || 0) +
        (telemetry.providerViews[p.id] || 0) +
        (telemetry.providerViews[`prov-${p.id}`] || 0);

      const completionRate =
        pOrders.length > 0 ? Math.round((completedOrders / pOrders.length) * 100) : 0;
      const conversionRate =
        viewsCount > 0 ? ((pOrders.length / viewsCount) * 100).toFixed(1) : '0.0';

      map.set(p.id, {
        viewsCount,
        orders: pOrders,
        totalOrders: pOrders.length,
        completedOrders,
        activeOrders,
        cancelledOrders,
        grossEgp,
        instaPayEgp,
        codEgp,
        commissionEgp,
        codFeesEgp,
        netPayableEgp,
        avgRating,
        reviewsList: pReviews,
        completionRate,
        conversionRate
      });
    });

    return map;
  }, [providers, bookings, reviews, telemetry.providerViews, effectiveCommissionRate]);

  // Per-User Activity + Orders Breakdown
  const userSummaryRows = useMemo(() => {
    return users
      .map((u) => {
        const normPhone = normalizePhone(u.phone || '');
        const uOrders = bookings.filter(
          (b) =>
            b.ownerId === u.uid ||
            (normPhone.length >= 8 && normalizePhone(b.customerPhone) === normPhone)
        );
        const totalSpentEgp = uOrders
          .filter((b) => b.status !== 'cancelled')
          .reduce((s, b) => s + (b.totalAmountEgp || 0), 0);
        const act = telemetry.userActivity[u.uid] || {
          sectionViews: 0,
          adViews: 0,
          adClicks: 0,
          providerViews: 0
        };
        const phoneBanDoc = bannedPhones.find((bp) => bp.phone === normPhone);
        const userIsBanned =
          isBanCurrentlyActive(u.isBanned, u.banUntilMs) ||
          Boolean(phoneBanDoc && isBanCurrentlyActive(true, phoneBanDoc.banUntilMs, phoneBanDoc.isPermanent));

        return {
          user: u,
          ordersCount: uOrders.length,
          completedOrdersCount: uOrders.filter((b) => b.status === 'completed').length,
          totalSpentEgp,
          sectionViews: act.sectionViews,
          providerViews: act.providerViews,
          adViews: act.adViews,
          adClicks: act.adClicks,
          totalViews: act.sectionViews + act.providerViews + act.adViews,
          userIsBanned
        };
      })
      .sort((a, b) => b.ordersCount + b.totalViews - (a.ordersCount + a.totalViews));
  }, [users, bookings, telemetry.userActivity, bannedPhones]);

  // Financial Settlement Ledger (preserved & enriched)
  const settlementReport = useMemo(() => {
    const validOrders = bookings.filter(
      (b) =>
        b.status !== 'cancelled' &&
        !(b.paymentMethod === 'instapay' && b.paymentStatus !== 'paid')
    );
    let totalGrossEgp = 0;
    let totalInstaPayEgp = 0;
    let totalCodEgp = 0;
    let totalCodFeesEgp = 0;
    let totalCommissionEgp = 0;
    let netDueToProvidersEgp = 0;
    let netDueFromProvidersEgp = 0;

    type ProviderLedgerRow = {
      key: string;
      providerOwnerId?: string;
      providerName: string;
      ordersCount: number;
      unsettledOrderIds: string[];
      instaPayEgp: number;
      codEgp: number;
      codFeesEgp: number;
      commissionEgp: number;
      unsettledNetBalanceEgp: number;
    };

    const ledgerMap = new Map<string, ProviderLedgerRow>();

    validOrders.forEach((b) => {
      const total = b.totalAmountEgp || 0;
      const codFee = b.codFeeEgp || 0;
      const baseAmount =
        typeof b.subtotalEgp === 'number' && b.subtotalEgp > 0
          ? b.subtotalEgp
          : Math.max(0, total - codFee);
      const commission = Math.round((baseAmount * effectiveCommissionRate) / 100);
      const isInstaPay = b.paymentMethod === 'instapay' || b.paymentStatus === 'paid';
      const isSettled = b.settlementStatus === 'settled';

      totalGrossEgp += total;
      totalCodFeesEgp += codFee;
      totalCommissionEgp += commission;
      if (isInstaPay) totalInstaPayEgp += total;
      else totalCodEgp += total;

      const key = b.providerOwnerId || b.providerName;
      const existingRow = ledgerMap.get(key) || {
        key,
        providerOwnerId: b.providerOwnerId,
        providerName: b.providerName,
        ordersCount: 0,
        unsettledOrderIds: [],
        instaPayEgp: 0,
        codEgp: 0,
        codFeesEgp: 0,
        commissionEgp: 0,
        unsettledNetBalanceEgp: 0
      };

      existingRow.ordersCount += 1;
      if (isInstaPay) existingRow.instaPayEgp += total;
      else existingRow.codEgp += total;
      existingRow.codFeesEgp += codFee;
      existingRow.commissionEgp += commission;

      if (!isSettled) {
        existingRow.unsettledOrderIds.push(b.id);
        if (isInstaPay) {
          existingRow.unsettledNetBalanceEgp += Math.max(0, total - commission);
        } else {
          existingRow.unsettledNetBalanceEgp -= commission + codFee;
        }
      }
      ledgerMap.set(key, existingRow);
    });

    const providerRows = Array.from(ledgerMap.values()).sort(
      (a, b) => Math.abs(b.unsettledNetBalanceEgp) - Math.abs(a.unsettledNetBalanceEgp)
    );

    providerRows.forEach((row) => {
      if (row.unsettledNetBalanceEgp > 0) netDueToProvidersEgp += row.unsettledNetBalanceEgp;
      else if (row.unsettledNetBalanceEgp < 0)
        netDueFromProvidersEgp += Math.abs(row.unsettledNetBalanceEgp);
    });

    const adRevenueEgp = ads
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (a.costEgp || 0), 0);

    return {
      totalOrdersCount: validOrders.length,
      totalGrossEgp,
      totalInstaPayEgp,
      totalCodEgp,
      totalCodFeesEgp,
      totalCommissionEgp,
      adRevenueEgp,
      platformTotalRevenueEgp: totalCommissionEgp + totalCodFeesEgp + adRevenueEgp,
      netDueToProvidersEgp,
      netDueFromProvidersEgp,
      providerRows
    };
  }, [bookings, ads, effectiveCommissionRate]);

  const pendingInstaPayVerifications = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.paymentMethod === 'instapay' &&
          b.paymentStatus === 'pending_verification' &&
          b.status !== 'cancelled'
      ),
    [bookings]
  );

  const pendingProvidersCount = providers.filter((p) => p.status === 'pending').length;
  const openProvidersCount = providers.filter(
    (p) => p.status === 'approved' && evaluateProviderAvailability(p, nowMs).isOpen
  ).length;
  const pendingAdsCount = ads.filter((a) => a.status === 'pending').length;

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================
  const openCreateSectionForm = () => {
    setEditingSectionId(null);
    setSecNameAr('');
    setSecNameEn('');
    setSecDescAr('');
    setSecDescEn('');
    setSecIconKey('store');
    setSecColorKey('amber');
    setSecSortOrder(String(sections.length + 1));
    setSecEnabled(true);
    setIsSectionFormOpen(true);
  };

  const openEditSectionForm = (sec: ServiceSectionConfig) => {
    setEditingSectionId(sec.id);
    setSecNameAr(sec.nameAr);
    setSecNameEn(sec.nameEn);
    setSecDescAr(sec.descriptionAr || '');
    setSecDescEn(sec.descriptionEn || '');
    setSecIconKey(sec.iconKey || 'shapes');
    setSecColorKey(sec.colorCode || 'amber');
    setSecSortOrder(String(sec.sortOrder ?? 10));
    setSecEnabled(sec.isEnabled !== false);
    setIsSectionFormOpen(true);
  };

  const handleSaveSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secNameAr.trim() || !secNameEn.trim()) return;
    const existing = editingSectionId
      ? sections.find((s) => s.id === editingSectionId)
      : undefined;
    const slugBase = secNameEn
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);
    const id = existing ? existing.id : `sec_${slugBase || 'custom'}_${Date.now().toString().slice(-4)}`;
    const providerCategoryId = existing ? existing.providerCategoryId : id;

    setBusyId(`sec-${id}`);
    try {
      await onSaveSection({
        id,
        providerCategoryId,
        nameAr: secNameAr.trim(),
        nameEn: secNameEn.trim(),
        descriptionAr: secDescAr.trim(),
        descriptionEn: secDescEn.trim(),
        iconKey: secIconKey,
        colorCode: secColorKey,
        isEnabled: secEnabled,
        sortOrder: Math.max(1, Number(secSortOrder) || 10),
        isBuiltIn: existing ? existing.isBuiltIn : false
      });
      setIsSectionFormOpen(false);
      setEditingSectionId(null);
      showToast(lang === 'ar' ? 'تم حفظ بيانات القسم بنجاح ✓' : 'Section saved successfully ✓');
    } finally {
      setBusyId(null);
    }
  };

  const handleExportProviderCsv = (p: ProviderListing) => {
    const stats = providerStatsMap.get(p.id);
    if (!stats) return;
    const avail = evaluateProviderAvailability(p, nowMs);
    const lines: string[] = [];
    lines.push([csvCell('تقرير أداء مقدم خدمة - منصة قرية نقباس'), csvCell(new Date().toISOString().split('T')[0])].join(','));
    lines.push([csvCell('الاسم'), csvCell(p.nameAr), csvCell('التخصص'), csvCell(p.specialtyAr), csvCell('رقم الهاتف'), csvCell(p.phone)].join(','));
    lines.push([csvCell('حالة الاعتماد'), csvCell(p.status), csvCell('حالة العمل الآن'), csvCell(avail.isOpen ? 'مفتوح' : 'مغلق'), csvCell('التقييم'), csvCell(stats.avgRating)].join(','));
    lines.push([csvCell('المشاهدات'), csvCell(stats.viewsCount), csvCell('نسبة التحويل %'), csvCell(`${stats.conversionRate}%`), csvCell('إجمالي الطلبات'), csvCell(stats.totalOrders)].join(','));
    lines.push([csvCell('طلبات مكتملة'), csvCell(stats.completedOrders), csvCell('طلبات ملغاة'), csvCell(stats.cancelledOrders), csvCell('نسبة الإتمام %'), csvCell(`${stats.completionRate}%`)].join(','));
    lines.push([csvCell('إجمالي المبيعات (ج.م)'), csvCell(stats.grossEgp), csvCell('InstaPay'), csvCell(stats.instaPayEgp), csvCell('كاش COD'), csvCell(stats.codEgp)].join(','));
    lines.push([csvCell(`عمولة المنصة (${effectiveCommissionRate}%)`), csvCell(stats.commissionEgp), csvCell('رسوم COD'), csvCell(stats.codFeesEgp), csvCell('صافي التسوية المفتوحة'), csvCell(stats.netPayableEgp)].join(','));
    lines.push('');
    lines.push([csvCell('رقم الطلب'), csvCell('التاريخ'), csvCell('العميل'), csvCell('الهاتف'), csvCell('الخدمة / الأصناف'), csvCell('طريقة الدفع'), csvCell('الإجمالي (ج.م)'), csvCell('الحالة'), csvCell('التسوية')].join(','));

    stats.orders.forEach((b) => {
      lines.push(
        [
          csvCell(b.id),
          csvCell(b.date || b.createdAt),
          csvCell(b.customerName),
          csvCell(b.customerPhone),
          csvCell(b.itemsSummary || b.title),
          csvCell(getPaymentMethodLabel(b.paymentMethod, lang)),
          csvCell(b.totalAmountEgp || 0),
          csvCell(getServiceStatusLabel(b.status, b.serviceType, lang)),
          csvCell(b.settlementStatus === 'settled' ? 'تمت التسوية' : 'مفتوح')
        ].join(',')
      );
    });

    const csvContent = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `noqbas-provider-report-${p.id}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(lang === 'ar' ? 'تم تحميل ملف التقرير CSV بنجاح ✓' : 'CSV report downloaded ✓');
  };

  const handleOpenCreateAd = () => {
    setEditingAdId(null);
    setAdTitle('');
    setAdDesc('');
    setAdCategory('offer');
    setAdPriceText('');
    setAdPhone('');
    setAdDurationDays('7');
    setIsAdFormOpen(true);
  };

  const handleOpenEditAd = (ad: VillageAd) => {
    setEditingAdId(ad.id);
    setAdTitle(ad.title);
    setAdDesc(ad.description);
    setAdCategory(ad.category);
    setAdPriceText(ad.priceText || '');
    setAdPhone(ad.contactPhone);
    setAdDurationDays(String(ad.durationDays || 7));
    setIsAdFormOpen(true);
  };

  const handleSubmitAdForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adDesc.trim() || !adPhone.trim()) return;
    const isNew = !editingAdId;
    const adId = editingAdId || `ad-admin-${Date.now()}`;
    const days = Math.max(1, Number(adDurationDays) || 7);

    setBusyId(`save-ad-${adId}`);
    try {
      await onAdminSaveAd(
        adId,
        {
          title: adTitle.trim(),
          description: adDesc.trim(),
          category: adCategory,
          priceText: adPriceText.trim(),
          contactPhone: adPhone.trim(),
          durationDays: days,
          durationPlan: days >= 28 ? 'month' : 'week',
          expiresAtMs: Date.now() + days * 24 * 60 * 60 * 1000,
          status: 'approved'
        },
        isNew
      );
      setIsAdFormOpen(false);
      setEditingAdId(null);
      showToast(lang === 'ar' ? 'تم حفظ الإعلان ونشره ✓' : 'Ad saved & published ✓');
    } finally {
      setBusyId(null);
    }
  };

  const handleProviderDecision = async (provider: ProviderListing, decision: 'approved' | 'rejected') => {
    setBusyId(provider.id);
    try {
      if (provider.id.startsWith('test-')) {
        onDemoProviderDecision?.(provider.id, decision);
        return;
      }
      try {
        await updateDoc(doc(db, 'providers', provider.id), {
          status: decision,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `providers/${provider.id}`);
      }
      try {
        await updateDoc(doc(db, 'users', provider.ownerId), {
          providerStatus: decision,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Provider doc may be seeded
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAdDecision = async (ad: VillageAd, decision: 'approved' | 'rejected') => {
    setBusyId(ad.id);
    const durationDays = ad.durationDays || (ad.durationPlan === 'month' ? 30 : 7);
    try {
      await onAdminSaveAd(
        ad.id,
        {
          title: ad.title,
          description: ad.description,
          category: ad.category,
          contactPhone: ad.contactPhone,
          status: decision,
          expiresAtMs:
            decision === 'approved'
              ? Date.now() + durationDays * 24 * 60 * 60 * 1000
              : ad.expiresAtMs
        },
        false
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveAdPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(0, Number(weekPrice) || 0);
    const m = Math.max(0, Number(monthPrice) || 0);
    setBusyId('ad-pricing');
    try {
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId: 'noqbas',
          adPriceWeekEgp: w,
          adPriceMonthEgp: m,
          commissionRatePercent: effectiveCommissionRate,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'appConfig/settings');
      }
      showToast(lang === 'ar' ? 'تم تحديث تسعيرة الإعلانات ✓' : 'Ad pricing updated ✓');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveCommissionRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Math.min(50, Math.max(0, Number(commissionRateInput) || 0));
    setBusyId('commission-rate');
    try {
      onCommissionRateChange?.(rate);
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId: 'noqbas',
          adPriceWeekEgp: adPricing.adPriceWeekEgp,
          adPriceMonthEgp: adPricing.adPriceMonthEgp,
          commissionRatePercent: rate,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Ignore offline warning
      }
      showToast(
        lang === 'ar' ? `تم تحديث العمولة إلى ${rate}% ✓` : `Commission updated to ${rate}% ✓`
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleBanUser = async (user: UserProfile) => {
    if (user.email === ADMIN_EMAIL) return;
    const normalized = normalizePhone(user.phone);
    if (!normalized || normalized.length < 8) {
      showToast(lang === 'ar' ? 'المستخدم لا يملك رقم هاتف صالح' : 'Invalid user phone number');
      return;
    }
    const durationChoice = banDurationMap[user.uid] || '24h';
    const reason =
      (banReasonMap[user.uid] || '').trim() ||
      (lang === 'ar' ? 'مخالفة شروط المنصة' : 'Platform policy violation');
    const isPermanent = durationChoice === 'perm';
    const hoursMap: Record<string, number> = { '24h': 24, '3d': 72, '7d': 168, '30d': 720 };
    const banUntilMs = isPermanent ? 0 : Date.now() + (hoursMap[durationChoice] || 24) * 3600000;

    setBusyId(`ban-${user.uid}`);
    try {
      if (user.uid.startsWith('test-')) {
        onDemoUserAction?.({ type: 'ban', uid: user.uid, banUntilMs, reason, isPermanent });
        showToast(lang === 'ar' ? `تم حظر ${user.displayName}` : `Banned ${user.displayName}`);
        return;
      }
      try {
        await setDoc(doc(db, 'bannedPhones', normalized), {
          phone: normalized,
          userId: user.uid,
          userName: user.displayName,
          reason,
          banUntilMs,
          isPermanent,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `bannedPhones/${normalized}`);
      }
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isBanned: true,
          banUntilMs,
          banReason: reason,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      showToast(lang === 'ar' ? `تم حظر ${user.displayName} بنجاح` : `Banned ${user.displayName}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnbanUser = async (phoneRaw: string, uid?: string) => {
    const normalized = normalizePhone(phoneRaw);
    setBusyId(`unban-${uid || normalized}`);
    try {
      if (uid?.startsWith('test-')) {
        onDemoUserAction?.({ type: 'unban', uid });
        showToast(lang === 'ar' ? `تم فك الحظر عن ${normalized}` : `Unbanned ${normalized}`);
        return;
      }
      if (normalized && normalized.length >= 8) {
        try {
          await deleteDoc(doc(db, 'bannedPhones', normalized));
        } catch {
          // Ignore
        }
      }
      if (uid) {
        try {
          await updateDoc(doc(db, 'users', uid), {
            isBanned: false,
            banUntilMs: 0,
            banReason: '',
            updatedAt: serverTimestamp()
          });
        } catch {
          // Ignore
        }
      }
      showToast(lang === 'ar' ? `تم فك الحظر عن ${normalized}` : `Unbanned ${normalized}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.email === ADMIN_EMAIL) return;
    setBusyId(`del-${user.uid}`);
    try {
      if (user.uid.startsWith('test-')) {
        onDemoUserAction?.({ type: 'delete', uid: user.uid });
        setConfirmDeleteUid(null);
        showToast(lang === 'ar' ? `تم حذف ${user.displayName}` : `Deleted ${user.displayName}`);
        return;
      }
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}`);
      }
      try {
        await deleteDoc(doc(db, 'providers', user.uid));
      } catch {
        // Ignore
      }
      try {
        await deleteDoc(doc(db, 'carts', user.uid));
      } catch {
        // Ignore
      }
      setConfirmDeleteUid(null);
      showToast(lang === 'ar' ? `تم حذف حساب ${user.displayName}` : `Deleted ${user.displayName}`);
    } finally {
      setBusyId(null);
    }
  };

  const compressLogoFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const maxSide = 160;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = canvas.toDataURL('image/webp', 0.82);
          if (dataUrl.length > 40000) dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          if (dataUrl.length > 43000) {
            reject(new Error('Image too large'));
            return;
          }
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = String(reader.result || '');
      };
      reader.onerror = () => reject(new Error('Read failed'));
      reader.readAsDataURL(file);
    });

  const handleUploadNoqbasLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const compressed = await compressLogoFile(file);
      setEditLogoUrl(compressed);
    } catch {
      showToast(lang === 'ar' ? 'حجم اللوجو كبير، جرب صورة أصغر' : 'Logo image is too large');
    }
  };

  const handleSaveNoqbasSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('save-noqbas');
    try {
      const updatedVillage: VillageConfig = {
        ...activeVillage,
        id: 'noqbas',
        nameAr: 'قرية نقباس',
        nameEn: 'Noqbas Village',
        baseDeliveryFeeEgp: Math.max(0, Number(editBaseFee) || 0),
        perKmFeeEgp: Math.max(0, Number(editPerKmFee) || 0),
        colorCode: editColorCode,
        logoIcon: editLogoIcon,
        logoUrl: editLogoUrl,
        isActive: true
      };
      const vRef = doc(db, 'villages', 'noqbas');
      const snap = await getDoc(vRef);
      const payload = {
        id: updatedVillage.id,
        nameAr: updatedVillage.nameAr,
        nameEn: updatedVillage.nameEn,
        governorateAr: updatedVillage.governorateAr || 'مركز بنها - القليوبية',
        governorateEn: updatedVillage.governorateEn || 'Banha - Qalyubia',
        descriptionAr: updatedVillage.descriptionAr || '',
        descriptionEn: updatedVillage.descriptionEn || '',
        baseDeliveryFeeEgp: updatedVillage.baseDeliveryFeeEgp,
        perKmFeeEgp: updatedVillage.perKmFeeEgp,
        colorCode: updatedVillage.colorCode,
        logoIcon: updatedVillage.logoIcon,
        logoUrl: updatedVillage.logoUrl || '',
        isActive: true
      };
      try {
        if (snap.exists()) await updateDoc(vRef, payload);
        else await setDoc(vRef, { ...payload, createdAt: serverTimestamp() });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'villages/noqbas');
      }
      onVillageUpdated(updatedVillage);
      showToast(lang === 'ar' ? 'تم حفظ إعدادات قرية نقباس ✓' : 'Noqbas settings saved ✓');
    } finally {
      setBusyId(null);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (providerFilter !== 'all' && p.status !== providerFilter) return false;
    const q = providerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nameAr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.specialtyAr.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  const filteredUsers = userSummaryRows.filter(({ user: u }) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.address || u.neighborhood || '').toLowerCase().includes(q)
    );
  });

  const navItems: {
    id: AdminSectionTab;
    labelAr: string;
    labelEn: string;
    Icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'overview', labelAr: 'الإحصائيات والمشاهدات', labelEn: 'Analytics & Views', Icon: BarChart3 },
    { id: 'sections', labelAr: 'إدارة الأقسام', labelEn: 'Sections', Icon: LayoutGrid },
    { id: 'providers', labelAr: 'مقدمو الخدمة والتقارير', labelEn: 'Providers & Reports', Icon: Briefcase, badge: pendingProvidersCount },
    { id: 'ads', labelAr: 'التحكم في الإعلانات', labelEn: 'Ads & Telemetry', Icon: Megaphone, badge: pendingAdsCount },
    { id: 'orders', labelAr: 'الطلبات و InstaPay', labelEn: 'Orders & Dispatch', Icon: PackageCheck, badge: pendingInstaPayVerifications.length },
    { id: 'settlement', labelAr: 'التسويات المالية', labelEn: 'Settlements', Icon: Wallet },
    { id: 'users', labelAr: 'المستخدمون والتصفح', labelEn: 'Users & Activity', Icon: Users },
    { id: 'village_settings', labelAr: 'إعدادات قرية نقباس', labelEn: 'Noqbas Settings', Icon: MapPin }
  ];

  const activeNavMeta = navItems.find((n) => n.id === activeTab) || navItems[0];

  const sortedSections = sections
    .slice()
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract (No Customer Storefront Chrome) */}
      <header className="no-print sticky top-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'إدارة منصة قرية نقباس' : 'Noqbas Admin Console'}
              </span>
              <span aria-hidden="true">/</span>
              <span className="truncate font-semibold text-amber-700 dark:text-amber-400">
                {lang === 'ar' ? activeNavMeta.labelAr : activeNavMeta.labelEn}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate font-mono tabular-nums">
              {ADMIN_EMAIL}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toastMsg && (
            <span className="hidden md:inline text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              {toastMsg}
            </span>
          )}

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={t.notifications}
            className="relative min-h-[40px] w-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                {notificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? t.dayMode : t.nightMode}
            className="min-h-[40px] w-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            className="min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.switchLang}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[40px] px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{adminProfile?.displayName || t.account}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Canvas: 260px Sidebar + Content Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        {/* Sidebar Navigation (Desktop) + Horizontal Strip (Mobile) */}
        <aside className="no-print lg:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 lg:p-4">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.Icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                  </span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-mono tabular-nums text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Compact Admin Quick Summary in Sidebar */}
          <div className="hidden lg:block mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-semibold">
              <VillageLogo village={activeVillage} lang={lang} size="sm" />
              <span>{lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">{lang === 'ar' ? 'المشاهدات' : 'Views'}</div>
                <div className="font-mono tabular-nums font-extrabold text-sm text-slate-900 dark:text-white">
                  {telemetry.totalAllViews}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500">{lang === 'ar' ? 'المتفاعلين' : 'Active Prov'}</div>
                <div className="font-mono tabular-nums font-extrabold text-sm text-emerald-600">
                  {openProvidersCount} / {providers.length}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 min-w-0">
          {toastMsg && (
            <div className="md:hidden p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {toastMsg}
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: OVERVIEW, VIEWS & TELEMETRY                              */}
          {/* =============================================================== */}
          {activeTab === 'overview' && (
            <div className="no-print space-y-6">
              {/* 4 Telemetry + Business KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'إجمالي المشاهدات والتصفح' : 'Total Platform Views'}</span>
                    <Eye className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {telemetry.totalAllViews.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {telemetry.totalSectionViews} {lang === 'ar' ? 'أقسام' : 'sec'} ·{' '}
                    {telemetry.totalProviderViews} {lang === 'ar' ? 'مقدمين' : 'prov'} ·{' '}
                    {telemetry.totalAdViews} {lang === 'ar' ? 'إعلانات' : 'ads'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'تصفح ونقرات الإعلانات' : 'Ad Browsing & Clicks'}</span>
                    <MousePointerClick className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                      {telemetry.totalAdViews.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-amber-600">
                      ({telemetry.totalAdClicks} {lang === 'ar' ? 'نقرة' : 'clicks'} · {telemetry.adCtrPercent}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {ads.filter((a) => a.status === 'approved' && !isAdExpired(a.expiresAtMs, nowMs)).length}{' '}
                    {lang === 'ar' ? 'إعلان نشط الآن' : 'active ads'} · {settlementReport.adRevenueEgp}{' '}
                    {t.currency}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'الطلبات وحجم التعاملات' : 'Orders & GMV'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                      {bookings.length}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-emerald-600">
                      {settlementReport.totalGrossEgp.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {lang === 'ar' ? 'ربح المنصة' : 'Platform net'}:{' '}
                    {settlementReport.platformTotalRevenueEgp.toLocaleString()} {t.currency}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'المستخدمون ومقدمو الخدمة' : 'Users & Providers'}</span>
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                    {users.length}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {users.filter((u) => u.role === 'resident').length} {lang === 'ar' ? 'مستخدم' : 'users'} ·{' '}
                    {providers.length} {lang === 'ar' ? 'مقدم خدمة' : 'providers'} ({openProvidersCount}{' '}
                    {lang === 'ar' ? 'مفتوح' : 'open'})
                  </div>
                </div>
              </div>

              {/* Two-column Analytics Tables: Sections Telemetry + Ads Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sections Performance & Views Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'مشاهدات وطلبات الأقسام' : 'Section Views & Orders'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sections')}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      {lang === 'ar' ? 'إدارة الأقسام' : 'Manage Sections'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'القسم' : 'Section'}</th>
                          <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'المشاهدات' : 'Views'}</th>
                          <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'المقدمون' : 'Providers'}</th>
                          <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'الطلبات' : 'Orders'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedSections.map((sec) => {
                          const views = telemetry.sectionViews[sec.id] || 0;
                          const provCount = providers.filter(
                            (p) => p.category === sec.providerCategoryId || p.category === sec.id
                          ).length;
                          const ordCount = bookings.filter(
                            (b) => b.serviceType === sec.providerCategoryId || b.serviceType === sec.id
                          ).length;
                          return (
                            <tr key={sec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                                {lang === 'ar' ? sec.nameAr : sec.nameEn}
                                {!sec.isEnabled && (
                                  <span className="ms-2 text-[10px] text-rose-600">
                                    ({lang === 'ar' ? 'مخفي' : 'Hidden'})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold text-sky-600">
                                {views}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                {provCount}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold text-emerald-600">
                                {ordCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ads Views & Browsing Leaderboard */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'تصفح ومشاهدات الإعلانات' : 'Ad Impressions & Clicks'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ads')}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      {lang === 'ar' ? 'التحكم في الإعلانات' : 'Manage Ads'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'الإعلان' : 'Ad'}</th>
                          <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'المشاهدات' : 'Views'}</th>
                          <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'النقرات' : 'Clicks'}</th>
                          <th className="px-3 py-2.5 text-end">CTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {ads.slice(0, 8).map((ad) => {
                          const v = telemetry.adViews[ad.id] || 0;
                          const c = telemetry.adClicks[ad.id] || 0;
                          const ctr = v > 0 ? ((c / v) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={ad.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                                {ad.title}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold text-sky-600">
                                {v}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold text-amber-600">
                                {c}
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono tabular-nums text-slate-500">
                                {ctr}%
                              </td>
                            </tr>
                          );
                        })}
                        {ads.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                              {lang === 'ar' ? 'لا توجد إعلانات مسجلة بعد.' : 'No ads yet.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Per-User Views, Ad Browsing & Orders Summary Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar'
                        ? 'سجل المشاهدات وتصفح الإعلانات والطلبات لكل مستخدم'
                        : 'Per-User Views, Ad Browsing & Orders'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'متابعة نشاط كل مستخدم ومقدم خدمة من مشاهدات وتصفح وطلبات مقدمة'
                        : 'Detailed browsing, ad engagement, and submitted orders per account'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                  >
                    {lang === 'ar' ? 'إدارة وحظر المستخدمين' : 'User Moderation'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                        <th className="px-3 py-2.5 text-start">{lang === 'ar' ? 'الدور' : 'Role'}</th>
                        <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'تصفح الأقسام' : 'Sections'}</th>
                        <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'مشاهدات الإعلانات' : 'Ad Views'}</th>
                        <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'نقرات الإعلانات' : 'Ad Clicks'}</th>
                        <th className="px-3 py-2.5 text-end">{lang === 'ar' ? 'الطلبات المقدمة' : 'Orders'}</th>
                        <th className="px-4 py-2.5 text-end">{lang === 'ar' ? 'إجمالي الإنفاق' : 'Spend'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {userSummaryRows.map((row) => (
                        <tr key={row.user.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {row.user.displayName}
                              {row.userIsBanned && (
                                <span className="ms-1.5 text-[10px] text-rose-600">
                                  · {lang === 'ar' ? 'محظور' : 'Banned'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {row.user.phone || '—'}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300">
                            {row.user.role === 'provider'
                              ? lang === 'ar'
                                ? 'مقدم خدمة'
                                : 'Provider'
                              : lang === 'ar'
                              ? 'مستخدم'
                              : 'Resident'}
                          </td>
                          <td className="px-3 py-2.5 text-end font-mono tabular-nums">
                            {row.sectionViews + row.providerViews}
                          </td>
                          <td className="px-3 py-2.5 text-end font-mono tabular-nums text-sky-600 font-bold">
                            {row.adViews}
                          </td>
                          <td className="px-3 py-2.5 text-end font-mono tabular-nums text-amber-600 font-bold">
                            {row.adClicks}
                          </td>
                          <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold text-emerald-600">
                            {row.ordersCount}
                          </td>
                          <td className="px-4 py-2.5 text-end font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {row.totalSpentEgp.toLocaleString()} {t.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: SECTIONS MANAGEMENT (ADD / EDIT / HIDE / REORDER)        */}
          {/* =============================================================== */}
          {activeTab === 'sections' && (
            <div className="no-print space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'إدارة أقسام المنصة والخدمات' : 'Platform Service Sections'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar'
                      ? 'إضافة أقسام جديدة أو تعديل أسماء وألوان وترتيب وإظهار الأقسام الحالية في قرية نقباس'
                      : 'Add custom sections or edit titles, colors, order, and visibility across Noqbas'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetSections();
                      showToast(lang === 'ar' ? 'تمت استعادة الأقسام الافتراضية ✓' : 'Sections reset ✓');
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openCreateSectionForm}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة قسم جديد' : 'Add Section'}</span>
                  </button>
                </div>
              </div>

              {/* Add / Edit Section Inline Panel */}
              {isSectionFormOpen && (
                <form
                  onSubmit={handleSaveSectionSubmit}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingSectionId
                        ? lang === 'ar'
                          ? 'تعديل القسم'
                          : 'Edit Section'
                        : lang === 'ar'
                        ? 'إضافة قسم خدمات جديد'
                        : 'Create New Service Section'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsSectionFormOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'اسم القسم (عربي) *' : 'Section Name (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={secNameAr}
                        onChange={(e) => setSecNameAr(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: خدمات بيطرية ومزارع' : 'e.g. خدمات بيطرية'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'اسم القسم (English) *' : 'Section Name (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={secNameEn}
                        onChange={(e) => setSecNameEn(e.target.value)}
                        placeholder="e.g. Veterinary & Farms"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'الترتيب في القائمة' : 'Sort Order'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={secSortOrder}
                        onChange={(e) => setSecSortOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'وصف مختصر (عربي)' : 'Description (Arabic)'}
                      </label>
                      <input
                        type="text"
                        value={secDescAr}
                        onChange={(e) => setSecDescAr(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'وصف مختصر (English)' : 'Description (English)'}
                      </label>
                      <input
                        type="text"
                        value={secDescEn}
                        onChange={(e) => setSecDescEn(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'ar' ? 'أيقونة القسم' : 'Section Icon'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SECTION_ICONS.map(({ key, ar, en, Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSecIconKey(key)}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                              secIconKey === key
                                ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? ar : en}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {lang === 'ar' ? 'لون القسم وحالة الظهور' : 'Section Color & Visibility'}
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {SECTION_COLORS.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => setSecColorKey(c.key)}
                            className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                              secColorKey === c.key
                                ? 'border-slate-900 dark:border-white font-bold'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                            <span>{lang === 'ar' ? c.ar : c.en}</span>
                          </button>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={secEnabled}
                          onChange={(e) => setSecEnabled(e.target.checked)}
                          className="w-4 h-4 accent-amber-600"
                        />
                        <span>{lang === 'ar' ? 'القسم مفعّل وظاهر للمستخدمين' : 'Enabled & visible to residents'}</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsSectionFormOpen(false)}
                      className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={Boolean(busyId?.startsWith('sec-'))}
                      className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'حفظ القسم' : 'Save Section'}
                    </button>
                  </div>
                </form>
              )}

              {/* Sections Directory Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-start">{lang === 'ar' ? 'الترتيب' : '#'}</th>
                        <th className="px-4 py-3 text-start">{lang === 'ar' ? 'القسم' : 'Section'}</th>
                        <th className="px-4 py-3 text-start">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                        <th className="px-3 py-3 text-end">{lang === 'ar' ? 'المشاهدات' : 'Views'}</th>
                        <th className="px-3 py-3 text-end">{lang === 'ar' ? 'المقدمون' : 'Providers'}</th>
                        <th className="px-3 py-3 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="px-4 py-3 text-end">{lang === 'ar' ? 'تحكم' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sortedSections.map((sec) => {
                        const iconEntry =
                          SECTION_ICONS.find((i) => i.key === sec.iconKey) || SECTION_ICONS[11];
                        const Icon = iconEntry.Icon;
                        const provCount = providers.filter(
                          (p) => p.category === sec.providerCategoryId || p.category === sec.id
                        ).length;
                        return (
                          <tr key={sec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-mono tabular-nums font-bold text-slate-500">
                              {sec.sortOrder}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <Icon className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {lang === 'ar' ? sec.nameAr : sec.nameEn}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
                                    {lang === 'ar' ? sec.descriptionAr : sec.descriptionEn}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {sec.isBuiltIn
                                ? lang === 'ar'
                                  ? 'أساسي'
                                  : 'Built-in'
                                : lang === 'ar'
                                ? 'مضاف من الإدارة'
                                : 'Custom'}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums font-bold text-sky-600">
                              {telemetry.sectionViews[sec.id] || 0}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums">
                              {provCount}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`font-bold ${
                                  sec.isEnabled ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {sec.isEnabled
                                  ? lang === 'ar'
                                    ? 'ظاهر'
                                    : 'Visible'
                                  : lang === 'ar'
                                  ? 'مخفي'
                                  : 'Hidden'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditSectionForm(sec)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSaveSection({ ...sec, isEnabled: !sec.isEnabled })
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                                    sec.isEnabled
                                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : 'bg-emerald-600 text-white'
                                  }`}
                                >
                                  {sec.isEnabled
                                    ? lang === 'ar'
                                      ? 'إخفاء'
                                      : 'Hide'
                                    : lang === 'ar'
                                    ? 'تفعيل'
                                    : 'Enable'}
                                </button>
                                {!sec.isBuiltIn && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteSection(sec.id)}
                                    title={lang === 'ar' ? 'حذف القسم' : 'Delete Section'}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: SERVICE PROVIDERS ANALYTICS, CONTROL & EXPORTABLE REPORT */}
          {/* =============================================================== */}
          {activeTab === 'providers' && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className={`w-4 h-4 text-slate-400 absolute top-2.5 ${
                      lang === 'ar' ? 'right-3' : 'left-3'
                    }`}
                  />
                  <input
                    type="text"
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'ابحث بالاسم، التخصص، أو رقم الهاتف...'
                        : 'Search provider name, specialty, phone...'
                    }
                    className={`w-full py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ${
                      lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setProviderFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${
                        providerFilter === st
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {st === 'all'
                        ? lang === 'ar'
                          ? `الكل (${providers.length})`
                          : `All (${providers.length})`
                        : st === 'pending'
                        ? lang === 'ar'
                          ? `قيد المراجعة (${pendingProvidersCount})`
                          : `Pending (${pendingProvidersCount})`
                        : st === 'approved'
                        ? lang === 'ar'
                          ? 'المعتمدون'
                          : 'Approved'
                        : lang === 'ar'
                        ? 'المرفوضون'
                        : 'Rejected'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Providers Cards / Analytics List */}
              <div className="no-print space-y-3">
                {filteredProviders.length === 0 ? (
                  <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    {lang === 'ar' ? 'لا يوجد مقدمو خدمة مطابقون.' : 'No providers found.'}
                  </div>
                ) : (
                  filteredProviders.map((p) => {
                    const avail = evaluateProviderAvailability(p, nowMs);
                    const stats = providerStatsMap.get(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {lang === 'ar' ? p.nameAr : p.nameEn}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="font-semibold text-amber-700 dark:text-amber-400">
                                {lang === 'ar' ? p.specialtyAr : p.specialtyEn}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span
                                className={`font-bold ${
                                  p.status === 'approved'
                                    ? 'text-emerald-600'
                                    : p.status === 'rejected'
                                    ? 'text-rose-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {p.status === 'approved'
                                  ? lang === 'ar'
                                    ? 'معتمد'
                                    : 'Approved'
                                  : p.status === 'rejected'
                                  ? lang === 'ar'
                                    ? 'مرفوض'
                                    : 'Rejected'
                                  : lang === 'ar'
                                  ? 'قيد المراجعة'
                                  : 'Pending'}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span
                                className={`font-bold ${
                                  avail.isOpen ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {avail.isOpen
                                  ? lang === 'ar'
                                    ? 'مفتوح للطلبات'
                                    : 'Open'
                                  : avail.manualClosedReason ||
                                    (lang === 'ar' ? avail.labelAr : avail.labelEn)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                              <span>{p.phone}</span>
                              {p.priceLabelAr && (
                                <>
                                  <span>·</span>
                                  <span>{lang === 'ar' ? p.priceLabelAr : p.priceLabelEn}</span>
                                </>
                              )}
                              {avail.scheduleTextAr && (
                                <>
                                  <span>·</span>
                                  <span>{lang === 'ar' ? avail.scheduleTextAr : avail.scheduleTextEn}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Control Actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setReportProvider(p)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'إحصائيات واستخراج تقرير' : 'Analytics & Report'}</span>
                            </button>

                            {onAdminToggleProviderOpen && (
                              <button
                                type="button"
                                onClick={() => onAdminToggleProviderOpen(p, p.isAcceptingOrders === false)}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>
                                  {p.isAcceptingOrders === false
                                    ? lang === 'ar'
                                      ? 'فتح النشاط'
                                      : 'Open'
                                    : lang === 'ar'
                                    ? 'إغلاق مؤقت'
                                    : 'Close'}
                                </span>
                              </button>
                            )}

                            {p.status !== 'approved' && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleProviderDecision(p, 'approved')}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'اعتماد' : 'Approve'}</span>
                              </button>
                            )}

                            {p.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={busyId === p.id}
                                onClick={() => handleProviderDecision(p, 'rejected')}
                                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                              </button>
                            )}

                            {onAdminDeleteProvider &&
                              (confirmDeleteProviderId === p.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onAdminDeleteProvider(p);
                                      setConfirmDeleteProviderId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                                  >
                                    {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteProviderId(null)}
                                    className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 cursor-pointer"
                                  >
                                    {t.cancel}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProviderId(p.id)}
                                  title={lang === 'ar' ? 'حذف مقدم الخدمة' : 'Delete Provider'}
                                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Inline Per-Provider Metrics Grid */}
                        {stats && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'المشاهدات' : 'Views'}
                              </div>
                              <div className="font-mono tabular-nums font-extrabold text-sm text-sky-600">
                                {stats.viewsCount}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'الطلبات (مكتمل)' : 'Orders (Done)'}
                              </div>
                              <div className="font-mono tabular-nums font-extrabold text-sm text-slate-900 dark:text-white">
                                {stats.totalOrders} ({stats.completedOrders})
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'إجمالي المبيعات' : 'Gross Revenue'}
                              </div>
                              <div className="font-mono tabular-nums font-extrabold text-sm text-emerald-600">
                                {stats.grossEgp.toLocaleString()} {t.currency}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'عمولة المنصة' : 'Commission'}
                              </div>
                              <div className="font-mono tabular-nums font-extrabold text-sm text-amber-600">
                                {stats.commissionEgp.toLocaleString()} {t.currency}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'التسوية المفتوحة' : 'Open Settlement'}
                              </div>
                              <div
                                className={`font-mono tabular-nums font-extrabold text-sm ${
                                  stats.netPayableEgp >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {stats.netPayableEgp >= 0 ? `+${stats.netPayableEgp}` : stats.netPayableEgp}{' '}
                                {t.currency}
                              </div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                              <div className="text-[11px] text-slate-500">
                                {lang === 'ar' ? 'التقييم' : 'Rating'}
                              </div>
                              <div className="font-mono tabular-nums font-extrabold text-sm text-amber-500 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{stats.avgRating}</span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  ({stats.reviewsList.length})
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: ADS MODERATION, TELEMETRY, EDIT & PRICING                */}
          {/* =============================================================== */}
          {activeTab === 'ads' && (
            <div className="no-print space-y-6">
              {/* Ad Pricing + Create Official Ad Header */}
              <form
                onSubmit={handleSaveAdPricing}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'تسعيرة الإعلانات والتحكم الكامل' : 'Ad Pricing & Controls'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateAd}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إضافة إعلان جديد فوراً' : 'Create Ad Directly'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الأسبوع (ج.م)' : 'Weekly Ad Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={weekPrice}
                      onChange={(e) => setWeekPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الشهر (ج.م)' : 'Monthly Ad Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monthPrice}
                      onChange={(e) => setMonthPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busyId === 'ad-pricing'}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? 'حفظ التسعيرة' : 'Save Pricing'}
                  </button>
                </div>
              </form>

              {/* Inline Ad Add/Edit Form */}
              {isAdFormOpen && (
                <form
                  onSubmit={handleSubmitAdForm}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingAdId
                        ? lang === 'ar'
                          ? 'تعديل الإعلان'
                          : 'Edit Ad'
                        : lang === 'ar'
                        ? 'نشر إعلان جديد من الإدارة'
                        : 'Publish Official Ad'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAdFormOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder={lang === 'ar' ? 'عنوان الإعلان *' : 'Ad Title *'}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      required
                      value={adPhone}
                      onChange={(e) => setAdPhone(e.target.value)}
                      placeholder={lang === 'ar' ? 'رقم الهاتف *' : 'Phone *'}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                    <select
                      value={adCategory}
                      onChange={(e) => setAdCategory(e.target.value as VillageAd['category'])}
                      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="offer">{lang === 'ar' ? 'عروض وتخفيضات' : 'Offers'}</option>
                      <option value="shop">{lang === 'ar' ? 'محلات وتجارة' : 'Shops'}</option>
                      <option value="property">{lang === 'ar' ? 'شقق وأراضي' : 'Real Estate'}</option>
                      <option value="job">{lang === 'ar' ? 'فرص شغل' : 'Jobs'}</option>
                      <option value="event">{lang === 'ar' ? 'فعاليات وإعلانات' : 'Events'}</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={adPriceText}
                        onChange={(e) => setAdPriceText(e.target.value)}
                        placeholder={lang === 'ar' ? 'السعر / العرض' : 'Price / Offer'}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={adDurationDays}
                        onChange={(e) => setAdDurationDays(e.target.value)}
                        placeholder={lang === 'ar' ? 'المدة (يوم)' : 'Days'}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={adDesc}
                    onChange={(e) => setAdDesc(e.target.value)}
                    placeholder={lang === 'ar' ? 'تفاصيل الإعلان *' : 'Ad Details *'}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAdFormOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'حفظ ونشر الإعلان' : 'Save & Publish'}
                    </button>
                  </div>
                </form>
              )}

              {/* Ads Inventory & View Telemetry List */}
              <div className="space-y-3 text-xs">
                {ads.map((ad) => {
                  const expired = isAdExpired(ad.expiresAtMs, nowMs);
                  const views = telemetry.adViews[ad.id] || 0;
                  const clicks = telemetry.adClicks[ad.id] || 0;
                  return (
                    <div
                      key={ad.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {ad.title}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span
                            className={`font-bold ${
                              expired
                                ? 'text-slate-500'
                                : ad.status === 'approved'
                                ? 'text-emerald-600'
                                : ad.status === 'rejected'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {expired
                              ? lang === 'ar'
                                ? 'منتهي المدة'
                                : 'Expired'
                              : ad.status === 'approved'
                              ? lang === 'ar'
                                ? 'منشور'
                                : 'Approved'
                              : ad.status === 'rejected'
                              ? lang === 'ar'
                                ? 'مرفوض'
                                : 'Rejected'
                              : lang === 'ar'
                              ? 'قيد المراجعة'
                              : 'Pending'}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono tabular-nums text-sky-600 font-bold">
                            {views} {lang === 'ar' ? 'مشاهدة' : 'views'} · {clicks}{' '}
                            {lang === 'ar' ? 'نقرة' : 'clicks'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{ad.authorName}</span>
                          <span>·</span>
                          <span className="font-mono">{ad.contactPhone}</span>
                          <span>·</span>
                          <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                            {ad.durationDays || 7} {lang === 'ar' ? 'يوم' : 'd'} · {ad.costEgp ?? 0}{' '}
                            {t.currency}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{ad.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAd(ad)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                        </button>

                        {ad.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={busyId === ad.id}
                            onClick={() => handleAdDecision(ad, 'approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'نشر' : 'Approve'}</span>
                          </button>
                        )}

                        {ad.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() =>
                              onAdminSaveAd(ad.id, {
                                title: ad.title,
                                description: ad.description,
                                category: ad.category,
                                contactPhone: ad.contactPhone,
                                expiresAtMs: Math.max(nowMs, ad.expiresAtMs || nowMs) + 7 * 86400000
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold cursor-pointer"
                          >
                            {lang === 'ar' ? 'تمديد +7 أيام' : 'Extend +7d'}
                          </button>
                        )}

                        {ad.status !== 'rejected' && (
                          <button
                            type="button"
                            disabled={busyId === ad.id}
                            onClick={() => handleAdDecision(ad, 'rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                          >
                            {lang === 'ar' ? 'إيقاف / رفض' : 'Reject'}
                          </button>
                        )}

                        {confirmDeleteAdId === ad.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await onAdminDeleteAd(ad.id);
                                setConfirmDeleteAdId(null);
                                showToast(lang === 'ar' ? 'تم حذف الإعلان' : 'Ad deleted');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                            >
                              {lang === 'ar' ? 'تأكيد' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAdId(null)}
                              className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 cursor-pointer"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAdId(ad.id)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: ORDERS DISPATCH & INSTAPAY VERIFICATION                  */}
          {/* =============================================================== */}
          {activeTab === 'orders' && (
            <div className="no-print space-y-5 text-xs">
              {pendingInstaPayVerifications.length > 0 && (
                <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/25 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-sm text-amber-950 dark:text-amber-200">
                      {lang === 'ar'
                        ? `تحويلات InstaPay بانتظار المراجعة (${pendingInstaPayVerifications.length})`
                        : `InstaPay Transfers Pending Verification (${pendingInstaPayVerifications.length})`}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      01012405014
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {pendingInstaPayVerifications.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {b.customerName} · <span className="font-mono">{b.customerPhone}</span> ·{' '}
                            <span className="font-mono text-emerald-600">{b.totalAmountEgp} {t.currency}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.title} · {b.providerName}
                            {b.instaPaySender ? ` · ${b.instaPaySender}` : ''}
                            {b.instaPayCustomerRef ? ` · Ref: ${b.instaPayCustomerRef}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onVerifyInstaPayPayment?.(b.id, 'approve')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            {lang === 'ar' ? 'اعتماد وإرسال للمقدم' : 'Verify & Release'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onVerifyInstaPayPayment?.(b.id, 'reject')}
                            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                          >
                            {lang === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? `جميع الطلبات والحجوزات (${bookings.length})` : `All Orders (${bookings.length})`}
                </h2>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                >
                  <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                  <option value="pending">{getStatusLabel('pending', lang)}</option>
                  <option value="confirmed">{getStatusLabel('confirmed', lang)}</option>
                  <option value="preparing">{getStatusLabel('preparing', lang)}</option>
                  <option value="on_the_way">{getStatusLabel('on_the_way', lang)}</option>
                  <option value="completed">{getStatusLabel('completed', lang)}</option>
                  <option value="cancelled">{getStatusLabel('cancelled', lang)}</option>
                </select>
              </div>

              <div className="space-y-3">
                {bookings
                  .filter((b) => orderStatusFilter === 'all' || b.status === orderStatusFilter)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {b.title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">#{b.id.slice(-8)}</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            {getServiceStatusLabel(b.status, b.serviceType, lang)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>{b.customerName}</span>
                          <span>·</span>
                          <span className="font-mono">{b.customerPhone}</span>
                          <span>·</span>
                          <span>{b.providerName}</span>
                          <span>·</span>
                          <span>{getPaymentMethodLabel(b.paymentMethod, lang)}</span>
                          {typeof b.totalAmountEgp === 'number' && (
                            <>
                              <span>·</span>
                              <span className="font-mono font-bold text-emerald-600">
                                {b.totalAmountEgp} {t.currency}
                              </span>
                            </>
                          )}
                          {b.deliveryConfirmedRef && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-emerald-700 font-bold">
                                Ref: {b.deliveryConfirmedRef}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {onAssignOrderProvider && providers.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                            <select
                              value={b.providerOwnerId || ''}
                              onChange={(e) => {
                                const found = providers.find((p) => p.ownerId === e.target.value);
                                if (found) {
                                  onAssignOrderProvider(
                                    b.id,
                                    found.ownerId,
                                    lang === 'ar' ? found.nameAr : found.nameEn
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                            >
                              <option value="">{b.providerName}</option>
                              {providers.map((p) => (
                                <option key={p.id} value={p.ownerId}>
                                  {lang === 'ar' ? p.nameAr : p.nameEn}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <select
                          value={b.status}
                          onChange={(e) => onUpdateOrderStatus?.(b.id, e.target.value as BookingStatus)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                        >
                          {getAllowedStatusesForService(b.serviceType).map((st) => (
                            <option key={st} value={st}>
                              {getServiceStatusLabel(st, b.serviceType, lang)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 6: FINANCIAL SETTLEMENT                                     */}
          {/* =============================================================== */}
          {activeTab === 'settlement' && (
            <div className="no-print space-y-6 text-xs">
              <form
                onSubmit={handleSaveCommissionRate}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>{t.financialSettlement}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar'
                      ? 'طلبات InstaPay (01012405014) تُخصم منها العمولة ويُحول الباقي للمقدم، وطلبات COD يُخصم منها العمولة + 10 ج.م تحصيل.'
                      : 'InstaPay transfers settle net of commission; COD orders settle commission + 10 EGP fee.'}
                  </p>
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">
                      {lang === 'ar' ? 'نسبة العمولة (%)' : 'Commission (%)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={commissionRateInput}
                      onChange={(e) => setCommissionRateInput(e.target.value)}
                      className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>InstaPay</span>
                    <Landmark className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black font-mono tabular-nums text-emerald-600 mt-1">
                    {settlementReport.totalInstaPayEgp.toLocaleString()} {t.currency}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'كاش COD' : 'COD'}</span>
                    <Banknote className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-black font-mono tabular-nums text-amber-600 mt-1">
                    {settlementReport.totalCodEgp.toLocaleString()} {t.currency}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'صافي أرباح المنصة' : 'Net Earnings'}</span>
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-black font-mono tabular-nums text-sky-600 mt-1">
                    {settlementReport.platformTotalRevenueEgp.toLocaleString()} {t.currency}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">{lang === 'ar' ? 'تسويات مفتوحة' : 'Open Ledger'}</div>
                  <div className="font-mono tabular-nums font-bold text-emerald-600 mt-1">
                    +{settlementReport.netDueToProvidersEgp.toLocaleString()} {t.currency}
                  </div>
                  <div className="font-mono tabular-nums font-bold text-rose-600">
                    -{settlementReport.netDueFromProvidersEgp.toLocaleString()} {t.currency}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-start">{lang === 'ar' ? 'مقدم الخدمة' : 'Provider'}</th>
                        <th className="px-3 py-3 text-end">{lang === 'ar' ? 'الطلبات' : 'Orders'}</th>
                        <th className="px-3 py-3 text-end">InstaPay</th>
                        <th className="px-3 py-3 text-end">COD</th>
                        <th className="px-3 py-3 text-end">{lang === 'ar' ? 'حصة المنصة' : 'Platform Cut'}</th>
                        <th className="px-3 py-3 text-end">{lang === 'ar' ? 'الصافي المفتوح' : 'Net Open'}</th>
                        <th className="px-4 py-3 text-end">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {settlementReport.providerRows.map((row) => {
                        const hasUnsettled = row.unsettledOrderIds.length > 0;
                        return (
                          <tr key={row.key}>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              {row.providerName}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums">{row.ordersCount}</td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums text-emerald-600">
                              {row.instaPayEgp} {t.currency}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums text-amber-600">
                              {row.codEgp} {t.currency}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums">
                              {row.commissionEgp + row.codFeesEgp} {t.currency}
                            </td>
                            <td className="px-3 py-3 text-end font-mono tabular-nums font-bold">
                              {!hasUnsettled
                                ? lang === 'ar'
                                  ? 'مسوى ✓'
                                  : 'Settled ✓'
                                : `${row.unsettledNetBalanceEgp >= 0 ? '+' : ''}${row.unsettledNetBalanceEgp} ${t.currency}`}
                            </td>
                            <td className="px-4 py-3 text-end">
                              {hasUnsettled && (
                                <button
                                  type="button"
                                  onClick={() => onSettleOrders?.(row.unsettledOrderIds)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                                >
                                  {lang === 'ar' ? 'تصفية الكل' : 'Mark Settled'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 7: USERS, BROWSING TELEMETRY & MODERATION                   */}
          {/* =============================================================== */}
          {activeTab === 'users' && (
            <div className="no-print space-y-4 text-xs">
              <div className="relative max-w-md">
                <Search
                  className={`w-4 h-4 text-slate-400 absolute top-2.5 ${
                    lang === 'ar' ? 'right-3' : 'left-3'
                  }`}
                />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search name or phone...'}
                  className={`w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 ${
                    lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <div className="space-y-3">
                {filteredUsers.map((row) => {
                  const u = row.user;
                  const isSelfAdmin = u.email === ADMIN_EMAIL;
                  return (
                    <div
                      key={u.uid}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        row.userIsBanned
                          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {u.displayName}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                              {u.role === 'provider'
                                ? lang === 'ar'
                                  ? 'مقدم خدمة'
                                  : 'Provider'
                                : lang === 'ar'
                                ? 'مستخدم'
                                : 'Resident'}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {u.phone || '—'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500">
                            <span>
                              {lang === 'ar' ? 'مشاهدات' : 'Views'}: {row.totalViews}
                            </span>
                            <span>·</span>
                            <span>
                              {lang === 'ar' ? 'إعلانات' : 'Ads'}: {row.adViews} / {row.adClicks}
                            </span>
                            <span>·</span>
                            <span>
                              {lang === 'ar' ? 'طلبات' : 'Orders'}: {row.ordersCount} ({row.totalSpentEgp} {t.currency})
                            </span>
                          </div>
                        </div>

                        {!isSelfAdmin && (
                          <div className="flex items-center gap-2">
                            {row.userIsBanned && (
                              <button
                                type="button"
                                onClick={() => handleUnbanUser(u.phone, u.uid)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
                              >
                                {lang === 'ar' ? 'فك الحظر' : 'Unban'}
                              </button>
                            )}
                            {confirmDeleteUid === u.uid ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                                >
                                  {lang === 'ar' ? 'تأكيد' : 'Confirm'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUid(null)}
                                  className="px-2 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 cursor-pointer"
                                >
                                  {t.cancel}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUid(u.uid)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline me-1" />
                                {lang === 'ar' ? 'حذف' : 'Delete'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {!isSelfAdmin && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                          <select
                            value={banDurationMap[u.uid] || '24h'}
                            onChange={(e) =>
                              setBanDurationMap((prev) => ({ ...prev, [u.uid]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="24h">{lang === 'ar' ? 'حظر 24 ساعة' : '24h'}</option>
                            <option value="3d">{lang === 'ar' ? 'حظر 3 أيام' : '3d'}</option>
                            <option value="7d">{lang === 'ar' ? 'حظر أسبوع' : '7d'}</option>
                            <option value="30d">{lang === 'ar' ? 'حظر شهر' : '30d'}</option>
                            <option value="perm">{lang === 'ar' ? 'حظر دائم' : 'Permanent'}</option>
                          </select>
                          <input
                            type="text"
                            value={banReasonMap[u.uid] || ''}
                            onChange={(e) =>
                              setBanReasonMap((prev) => ({ ...prev, [u.uid]: e.target.value }))
                            }
                            placeholder={lang === 'ar' ? 'سبب الحظر...' : 'Ban reason...'}
                            className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleBanUser(u)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-rose-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{lang === 'ar' ? 'حظر رقم الهاتف' : 'Ban Phone'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 8: NOQBAS VILLAGE SETTINGS                                  */}
          {/* =============================================================== */}
          {activeTab === 'village_settings' && (
            <form
              onSubmit={handleSaveNoqbasSettings}
              className="no-print max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 text-xs"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <VillageLogo
                  village={{ ...activeVillage, colorCode: editColorCode, logoIcon: editLogoIcon, logoUrl: editLogoUrl }}
                  lang={lang}
                  size="lg"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'إعدادات وهوية قرية نقباس' : 'Noqbas Village Configuration'}
                  </h2>
                  <p className="text-slate-500">
                    {lang === 'ar'
                      ? 'تعديل رسوم التوصيل واللون والشعار للمنصة الموحدة'
                      : 'Configure delivery fees, theme color, and logo'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === 'ar' ? 'رسوم التوصيل الأساسية (ج.م)' : 'Base Delivery Fee (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editBaseFee}
                    onChange={(e) => setEditBaseFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === 'ar' ? 'رسوم كل كيلومتر إضافي (ج.م)' : 'Per-KM Fee (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPerKmFee}
                    onChange={(e) => setEditPerKmFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  {lang === 'ar' ? 'لون هوية القرية' : 'Village Accent Color'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(VILLAGE_COLOR_THEMES) as VillageColorCode[]).map((code) => {
                    const itemTheme = VILLAGE_COLOR_THEMES[code];
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setEditColorCode(code)}
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                          editColorCode === code
                            ? 'border-slate-900 dark:border-white font-bold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${itemTheme.dotBg}`} />
                        <span>{itemTheme.label[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  {lang === 'ar' ? 'شعار القرية أو رفع لوجو مخصص' : 'Village Logo Preset or Upload'}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {VILLAGE_LOGO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setEditLogoIcon(preset.id);
                        setEditLogoUrl('');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer ${
                        !editLogoUrl && editLogoIcon === preset.id
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 font-bold'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {renderVillageLogoGlyph(preset.id, 'w-3.5 h-3.5')}
                      <span>{preset.label[lang]}</span>
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer font-bold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'رفع صورة شعار مخصصة' : 'Upload Custom Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleUploadNoqbasLogo} className="hidden" />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={busyId === 'save-noqbas'}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ إعدادات قرية نقباس' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* ================================================================= */}
      {/* INDIVIDUAL SERVICE PROVIDER ANALYTICS & EXPORTABLE REPORT MODAL   */}
      {/* ================================================================= */}
      {reportProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div
            id="provider-printable-report"
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Report Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold text-amber-600">
                  {lang === 'ar' ? 'تقرير أداء تفصيلي — منصة قرية نقباس' : 'Provider Performance Report — Noqbas'}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'ar' ? reportProvider.nameAr : reportProvider.nameEn} ·{' '}
                  {lang === 'ar' ? reportProvider.specialtyAr : reportProvider.specialtyEn}
                </h3>
              </div>

              <div className="no-print flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportProviderCsv(reportProvider)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحميل CSV (Excel)' : 'Export CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportProvider(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Content */}
            {(() => {
              const stats = providerStatsMap.get(reportProvider.id);
              const avail = evaluateProviderAvailability(reportProvider, nowMs);
              if (!stats) return null;
              return (
                <div className="p-6 overflow-y-auto space-y-6 text-xs">
                  {/* Identity & Availability Metadata Strip */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                        <span className="font-mono">{reportProvider.phone}</span>
                        <span>·</span>
                        <span>{reportProvider.category}</span>
                        <span>·</span>
                        <span className={avail.isOpen ? 'text-emerald-600' : 'text-rose-600'}>
                          {avail.isOpen
                            ? lang === 'ar'
                              ? 'مفتوح للطلبات'
                              : 'Open'
                            : lang === 'ar'
                            ? avail.labelAr
                            : avail.labelEn}
                        </span>
                      </div>
                      {avail.scheduleTextAr && (
                        <div className="text-[11px] font-mono text-slate-500">
                          {lang === 'ar'
                            ? `مواعيد العمل المجدولة: ${avail.scheduleTextAr}`
                            : `Schedule: ${avail.scheduleTextEn}`}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {lang === 'ar' ? 'تاريخ استخراج التقرير:' : 'Generated:'}{' '}
                      {new Date().toISOString().split('T')[0]}
                    </div>
                  </div>

                  {/* 6 Report KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'المشاهدات' : 'Views'}
                      </div>
                      <div className="text-lg font-black font-mono tabular-nums text-sky-600">
                        {stats.viewsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                      </div>
                      <div className="text-lg font-black font-mono tabular-nums">
                        {stats.totalOrders}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'نسبة الإتمام' : 'Completion'}
                      </div>
                      <div className="text-lg font-black font-mono tabular-nums text-emerald-600">
                        {stats.completionRate}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales'}
                      </div>
                      <div className="text-lg font-black font-mono tabular-nums">
                        {stats.grossEgp} {t.currency}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? `عمولة (${effectiveCommissionRate}%)` : 'Commission'}
                      </div>
                      <div className="text-lg font-black font-mono tabular-nums text-amber-600">
                        {stats.commissionEgp} {t.currency}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500">
                        {lang === 'ar' ? 'صافي التسوية' : 'Open Net'}
                      </div>
                      <div
                        className={`text-lg font-black font-mono tabular-nums ${
                          stats.netPayableEgp >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {stats.netPayableEgp >= 0 ? `+${stats.netPayableEgp}` : stats.netPayableEgp}{' '}
                        {t.currency}
                      </div>
                    </div>
                  </div>

                  {/* Provider Orders Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-bold">
                      {lang === 'ar'
                        ? `سجل الطلبات التفصيلي (${stats.orders.length})`
                        : `Orders Breakdown (${stats.orders.length})`}
                    </div>
                    {stats.orders.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        {lang === 'ar'
                          ? 'لا توجد طلبات مسجلة لهذا المقدم حتى الآن.'
                          : 'No orders recorded for this provider yet.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50/70 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-start">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                              <th className="px-3 py-2 text-start">{lang === 'ar' ? 'الخدمة' : 'Service'}</th>
                              <th className="px-3 py-2 text-start">{lang === 'ar' ? 'الدفع' : 'Payment'}</th>
                              <th className="px-3 py-2 text-end">{lang === 'ar' ? 'القيمة' : 'Total'}</th>
                              <th className="px-3 py-2 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {stats.orders.map((b) => (
                              <tr key={b.id}>
                                <td className="px-3 py-2.5">
                                  <div className="font-bold">{b.customerName}</div>
                                  <div className="font-mono text-[11px] text-slate-500">{b.customerPhone}</div>
                                </td>
                                <td className="px-3 py-2.5 max-w-[200px] truncate">{b.itemsSummary || b.title}</td>
                                <td className="px-3 py-2.5">{getPaymentMethodLabel(b.paymentMethod, lang)}</td>
                                <td className="px-3 py-2.5 text-end font-mono tabular-nums font-bold">
                                  {b.totalAmountEgp || 0} {t.currency}
                                </td>
                                <td className="px-3 py-2.5 font-semibold">
                                  {getServiceStatusLabel(b.status, b.serviceType, lang)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
