import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, ADMIN_EMAIL, handleFirestoreError, OperationType } from '../../firebase';
import {
  Language,
  UserProfile,
  BannedPhoneRecord,
  BookingRequest,
  PlatformPricingConfig,
  ProviderListing,
  VillageAd,
  VillageConfig,
  VillageColorCode,
  VILLAGE_COLOR_THEMES,
  getVillageTheme,
  DEFAULT_DISTRICTS,
  normalizePhone,
  isBanCurrentlyActive,
  isAdExpired
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  X,
  ShieldCheck,
  Briefcase,
  Megaphone,
  MapPin,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Phone,
  BarChart3,
  Users,
  Trash2,
  Ban,
  Search,
  DollarSign,
  CalendarClock
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  providers: ProviderListing[];
  ads: VillageAd[];
  users: UserProfile[];
  bannedPhones: BannedPhoneRecord[];
  bookings: BookingRequest[];
  reviewsCount: number;
  villages: VillageConfig[];
  activeVillageId: string;
  adPricing: PlatformPricingConfig;
  nowMs: number;
  onSwitchVillage: (villageId: string) => void;
  onVillageAdded: (village: VillageConfig) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  lang,
  providers,
  ads,
  users,
  bannedPhones,
  bookings,
  reviewsCount,
  villages,
  activeVillageId,
  adPricing,
  nowMs,
  onSwitchVillage,
  onVillageAdded
}) => {
  const t = TRANSLATIONS[lang];
  const [activeSection, setActiveSection] = useState<
    'analytics' | 'users' | 'providers' | 'ads' | 'villages'
  >('analytics');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Ad pricing state
  const [weekPrice, setWeekPrice] = useState(String(adPricing.adPriceWeekEgp));
  const [monthPrice, setMonthPrice] = useState(String(adPricing.adPriceMonthEgp));
  const [pricingMsg, setPricingMsg] = useState('');

  // Users search & ban controls
  const [userSearch, setUserSearch] = useState('');
  const [banDurationMap, setBanDurationMap] = useState<Record<string, string>>({});
  const [banReasonMap, setBanReasonMap] = useState<Record<string, string>>({});
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);
  const [userActionMsg, setUserActionMsg] = useState('');

  // New Village Form state
  const [newVillageId, setNewVillageId] = useState('');
  const [newVillageNameAr, setNewVillageNameAr] = useState('');
  const [newVillageNameEn, setNewVillageNameEn] = useState('');
  const [newGovAr, setNewGovAr] = useState('');
  const [newBaseFee, setNewBaseFee] = useState('10');
  const [newPerKmFee, setNewPerKmFee] = useState('5');
  const [newColorCode, setNewColorCode] = useState<VillageColorCode>('teal');
  const [villageMsg, setVillageMsg] = useState('');

  useEffect(() => {
    setWeekPrice(String(adPricing.adPriceWeekEgp));
    setMonthPrice(String(adPricing.adPriceMonthEgp));
  }, [adPricing.adPriceWeekEgp, adPricing.adPriceMonthEgp, isOpen]);

  // Engaged / active users metrics
  const analyticsStats = useMemo(() => {
    const engagedKeys = new Set<string>();
    bookings.forEach((b) => {
      if (b.customerPhone) engagedKeys.add(normalizePhone(b.customerPhone));
      else if (b.customerName) engagedKeys.add(b.customerName);
    });
    ads.forEach((a) => {
      if (a.ownerId) engagedKeys.add(a.ownerId);
    });
    providers.forEach((p) => {
      if (p.ownerId) engagedKeys.add(p.ownerId);
    });
    users.forEach((u) => {
      if (!isBanCurrentlyActive(u.isBanned, u.banUntilMs)) {
        engagedKeys.add(u.uid);
      }
    });

    const activeBannedCount = users.filter((u) =>
      isBanCurrentlyActive(u.isBanned, u.banUntilMs)
    ).length;

    const approvedProvidersCount = providers.filter((p) => p.status === 'approved').length;
    const activeAdsList = ads.filter(
      (a) => a.status === 'approved' && !isAdExpired(a.expiresAtMs, nowMs)
    );
    const expiredAdsList = ads.filter(
      (a) => a.status === 'approved' && isAdExpired(a.expiresAtMs, nowMs)
    );
    const adRevenueEgp = ads
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (a.costEgp || 0), 0);
    const bookingsVolumeEgp = bookings.reduce((sum, b) => sum + (b.totalAmountEgp || 0), 0);

    return {
      totalUsers: users.length,
      engagedCount: engagedKeys.size,
      activeBannedCount,
      approvedProvidersCount,
      activeAdsCount: activeAdsList.length,
      expiredAdsCount: expiredAdsList.length,
      adRevenueEgp,
      bookingsCount: bookings.length,
      bookingsVolumeEgp
    };
  }, [users, bookings, ads, providers, nowMs]);

  if (!isOpen) return null;

  const pendingProvidersCount = providers.filter((p) => p.status === 'pending').length;
  const pendingAdsCount = ads.filter((a) => a.status === 'pending').length;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.address || u.neighborhood || '').toLowerCase().includes(q)
    );
  });

  const handleSaveAdPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(0, Number(weekPrice) || 0);
    const m = Math.max(0, Number(monthPrice) || 0);
    setBusyId('ad-pricing');
    try {
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId,
          adPriceWeekEgp: w,
          adPriceMonthEgp: m,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'appConfig/settings');
      }
      setPricingMsg(lang === 'ar' ? 'تم تحديث تسعيرة الإعلانات بنجاح ✓' : 'Ad pricing updated ✓');
      setTimeout(() => setPricingMsg(''), 2500);
    } finally {
      setBusyId(null);
    }
  };

  const handleBanUser = async (user: UserProfile) => {
    if (user.email === ADMIN_EMAIL) return;
    const normalized = normalizePhone(user.phone);
    if (!normalized || normalized.length < 8) {
      setUserActionMsg(
        lang === 'ar'
          ? 'المستخدم معندوش رقم هاتف صالح للحظر.'
          : 'User does not have a valid phone number.'
      );
      return;
    }

    const durationChoice = banDurationMap[user.uid] || '24h';
    const reason = (banReasonMap[user.uid] || '').trim() || (lang === 'ar' ? 'مخالفة شروط المنصة' : 'Platform policy violation');
    const isPermanent = durationChoice === 'perm';
    const hoursMap: Record<string, number> = {
      '24h': 24,
      '3d': 72,
      '7d': 168,
      '30d': 720
    };
    const banUntilMs = isPermanent ? 0 : Date.now() + (hoursMap[durationChoice] || 24) * 3600000;

    setBusyId(`ban-${user.uid}`);
    try {
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

      setUserActionMsg(
        lang === 'ar'
          ? `تم حظر ${user.displayName} والرقم ${normalized} بنجاح.`
          : `Banned ${user.displayName} (${normalized}).`
      );
      setTimeout(() => setUserActionMsg(''), 3000);
    } finally {
      setBusyId(null);
    }
  };

  const handleUnbanUser = async (phoneRaw: string, uid?: string) => {
    const normalized = normalizePhone(phoneRaw);
    setBusyId(`unban-${uid || normalized}`);
    try {
      if (normalized && normalized.length >= 8) {
        try {
          await deleteDoc(doc(db, 'bannedPhones', normalized));
        } catch {
          // Ignore if already removed
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
          // Ignore if user doc was deleted
        }
      }
      setUserActionMsg(
        lang === 'ar' ? `تم فك الحظر عن ${normalized}` : `Unbanned ${normalized}`
      );
      setTimeout(() => setUserActionMsg(''), 2500);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.email === ADMIN_EMAIL) return;
    setBusyId(`del-${user.uid}`);
    try {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}`);
      }
      try {
        await deleteDoc(doc(db, 'providers', user.uid));
      } catch {
        // Provider record might not exist
      }
      try {
        await deleteDoc(doc(db, 'carts', user.uid));
      } catch {
        // Cart record might not exist
      }
      setConfirmDeleteUid(null);
      setUserActionMsg(
        lang === 'ar' ? `تم حذف حساب ${user.displayName} نهائياً.` : `Deleted ${user.displayName}.`
      );
      setTimeout(() => setUserActionMsg(''), 2500);
    } finally {
      setBusyId(null);
    }
  };

  const handleProviderDecision = async (provider: ProviderListing, decision: 'approved' | 'rejected') => {
    setBusyId(provider.id);
    try {
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
        // Ignore if user doc was seeded or missing
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAdDecision = async (ad: VillageAd, decision: 'approved' | 'rejected') => {
    setBusyId(ad.id);
    const durationDays = ad.durationDays || (ad.durationPlan === 'month' ? 30 : 7);
    try {
      const payload: Record<string, unknown> = {
        status: decision,
        updatedAt: serverTimestamp()
      };
      if (decision === 'approved') {
        payload.expiresAtMs = Date.now() + durationDays * 24 * 60 * 60 * 1000;
      }
      try {
        await updateDoc(doc(db, 'ads', ad.id), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `ads/${ad.id}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSwitchActiveVillage = async (vid: string) => {
    setBusyId(vid);
    try {
      onSwitchVillage(vid);
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId: vid,
          adPriceWeekEgp: adPricing.adPriceWeekEgp,
          adPriceMonthEgp: adPricing.adPriceMonthEgp,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'appConfig/settings');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (newVillageId.trim() || newVillageNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .replace(/^-+|-+$/g, '') || `village-${Date.now()}`;

    if (!newVillageNameAr.trim() || !newVillageNameEn.trim()) return;

    setBusyId('add-village');
    try {
      const villageData: VillageConfig = {
        id: slug,
        nameAr: newVillageNameAr.trim(),
        nameEn: newVillageNameEn.trim(),
        governorateAr: newGovAr.trim() || 'مصر',
        governorateEn: newGovAr.trim() || 'Egypt',
        descriptionAr: `خدمات أهالي ${newVillageNameAr.trim()} الموحدة`,
        descriptionEn: `Unified community services for ${newVillageNameEn.trim()}`,
        baseDeliveryFeeEgp: Number(newBaseFee) || 10,
        perKmFeeEgp: Number(newPerKmFee) || 5,
        colorCode: newColorCode,
        isActive: true,
        districts: DEFAULT_DISTRICTS
      };

      try {
        await setDoc(doc(db, 'villages', slug), {
          id: villageData.id,
          nameAr: villageData.nameAr,
          nameEn: villageData.nameEn,
          governorateAr: villageData.governorateAr,
          governorateEn: villageData.governorateEn,
          descriptionAr: villageData.descriptionAr,
          descriptionEn: villageData.descriptionEn,
          baseDeliveryFeeEgp: villageData.baseDeliveryFeeEgp,
          perKmFeeEgp: villageData.perKmFeeEgp,
          colorCode: villageData.colorCode,
          isActive: true,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `villages/${slug}`);
      }

      onVillageAdded(villageData);
      setNewVillageId('');
      setNewVillageNameAr('');
      setNewVillageNameEn('');
      setNewGovAr('');
      setVillageMsg(lang === 'ar' ? 'تمت إضافة القرية بنجاح وتقدر تبدل عليها دلوقتي!' : 'Village added!');
      setTimeout(() => setVillageMsg(''), 2500);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.adminPanel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'الإحصائيات، المتفاعلين، حظر/حذف المستخدمين، تسعيرة الإعلانات، ومقدمي الخدمات'
                  : 'Analytics, user moderation & phone bans, ad pricing, and village management'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'analytics'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الإحصائيات' : 'Analytics'}</span>
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'users'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {lang === 'ar' ? `المستخدمين والحظر (${users.length})` : `Users & Bans (${users.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('providers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'providers'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'مقدمي الخدمات' : 'Service Providers'}
              {pendingProvidersCount > 0 ? ` (${pendingProvidersCount})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('ads')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'ads'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'الإعلانات والتسعيرة' : 'Ads & Pricing'}
              {pendingAdsCount > 0 ? ` (${pendingAdsCount})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('villages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'villages'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إدارة القرى' : 'Villages'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 0: ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {lang === 'ar' ? 'المستخدمين المسجلين' : 'Registered Users'}
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                    {analyticsStats.totalUsers}
                  </div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-1">
                    {lang === 'ar'
                      ? `${analyticsStats.activeBannedCount} محظور`
                      : `${analyticsStats.activeBannedCount} banned`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {lang === 'ar' ? 'عدد المتفاعلين على المنصة' : 'Active Engaged Users'}
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                    {analyticsStats.engagedCount}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {lang === 'ar' ? 'حجوزات + إعلانات + خدمات' : 'Bookings + Ads + Providers'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30">
                  <div className="text-[11px] font-semibold text-slate-500">
                    {lang === 'ar' ? 'الحجوزات والطلبات' : 'Bookings & Orders'}
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
                    {analyticsStats.bookingsCount}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 font-bold mt-1">
                    {analyticsStats.bookingsVolumeEgp.toLocaleString()} {t.currency}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30">
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    {lang === 'ar' ? 'الإعلانات السارية / العائد' : 'Active Ads / Revenue'}
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-300 mt-1">
                    {analyticsStats.activeAdsCount}
                    <span className="text-xs font-normal text-slate-500 ms-1.5">
                      ({analyticsStats.expiredAdsCount} {lang === 'ar' ? 'منتهي' : 'exp'})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold mt-1">
                    {analyticsStats.adRevenueEgp.toLocaleString()} {t.currency}
                  </div>
                </div>
              </div>

              {/* Extra Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'مقدمي الخدمات المعتمدين' : 'Approved Providers'}
                  </span>
                  <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {analyticsStats.approvedProvidersCount}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'إجمالي التقييمات والمراجعات' : 'Total Reviews'}
                  </span>
                  <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {reviewsCount}
                  </span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'الأرقام المحظورة' : 'Banned Phone Numbers'}
                  </span>
                  <span className="text-lg font-extrabold font-mono text-rose-600">
                    {bannedPhones.length}
                  </span>
                </div>
              </div>

              {/* Per Village Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
                  {lang === 'ar' ? 'توزيع النشاط حسب القرية' : 'Activity Breakdown by Village'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'القرية' : 'Village'}</th>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'المستخدمين' : 'Users'}</th>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'مقدمي الخدمات' : 'Providers'}</th>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'الإعلانات' : 'Ads'}</th>
                        <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'الطلبات' : 'Bookings'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {villages.map((v) => {
                        const vUsers = users.filter((u) => u.villageId === v.id).length;
                        const vProvs = providers.filter((p) => p.villageId === v.id).length;
                        const vAds = ads.filter((a) => a.villageId === v.id).length;
                        const vBooks = bookings.filter((b) => b.villageId === v.id).length;
                        const vTheme = getVillageTheme(v.colorCode);
                        return (
                          <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-bold flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${vTheme.dotBg}`} />
                              <span>{lang === 'ar' ? v.nameAr : v.nameEn}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono">{vUsers}</td>
                            <td className="px-4 py-2.5 font-mono">{vProvs}</td>
                            <td className="px-4 py-2.5 font-mono">{vAds}</td>
                            <td className="px-4 py-2.5 font-mono">{vBooks}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: USERS, TIMED PHONE BANS & DELETION */}
          {activeSection === 'users' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'دور بالاسم، الإيميل، أو رقم الموبايل...'
                        : 'Search by name, email, or phone...'
                    }
                    className={`w-full py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                      lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>
                {userActionMsg && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{userActionMsg}</span>
                )}
              </div>

              {filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  {lang === 'ar' ? 'مفيش مستخدمين مطابقين للبحث.' : 'No matching users found.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => {
                    const isSelfAdmin = u.email === ADMIN_EMAIL;
                    const normalized = normalizePhone(u.phone || '');
                    const phoneBanDoc = bannedPhones.find((bp) => bp.phone === normalized);
                    const userIsBanned =
                      isBanCurrentlyActive(u.isBanned, u.banUntilMs) ||
                      (phoneBanDoc && isBanCurrentlyActive(true, phoneBanDoc.banUntilMs, phoneBanDoc.isPermanent));

                    const banExpMs = phoneBanDoc?.banUntilMs || u.banUntilMs || 0;
                    const isPermBan = phoneBanDoc?.isPermanent || (u.isBanned && !banExpMs);

                    return (
                      <div
                        key={u.uid}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          userIsBanned
                            ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              {u.photoUrl ? (
                                <img src={u.photoUrl} alt={u.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-slate-600 dark:text-slate-300">
                                  {u.displayName.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {u.displayName}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                  {u.role === 'provider'
                                    ? lang === 'ar'
                                      ? 'مقدم خدمة'
                                      : 'Provider'
                                    : lang === 'ar'
                                    ? 'مستخدم'
                                    : 'Resident'}
                                </span>
                                {userIsBanned && (
                                  <span className="text-[11px] font-bold text-rose-600">
                                    · {isPermBan ? (lang === 'ar' ? 'حظر دائم' : 'Permanent Ban') : lang === 'ar' ? `محظور حتى ${new Date(banExpMs).toLocaleDateString('ar-EG')}` : `Banned until ${new Date(banExpMs).toLocaleDateString()}`}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {u.phone || '—'}
                                </span>
                                {(u.address || u.neighborhood || u.email) && (
                                  <>
                                    <span>·</span>
                                    <span>{u.address || u.neighborhood || u.email}</span>
                                  </>
                                )}
                                <span>·</span>
                                <span>{u.villageId}</span>
                              </div>
                            </div>
                          </div>

                          {!isSelfAdmin && (
                            <div className="flex items-center gap-2 shrink-0">
                              {userIsBanned && (
                                <button
                                  type="button"
                                  disabled={busyId === `unban-${u.uid}`}
                                  onClick={() => handleUnbanUser(u.phone, u.uid)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                >
                                  {lang === 'ar' ? 'فك الحظر' : 'Unban'}
                                </button>
                              )}

                              {confirmDeleteUid === u.uid ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={busyId === `del-${u.uid}`}
                                    onClick={() => handleDeleteUser(u)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                                  >
                                    {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteUid(null)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    {t.cancel}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUid(u.uid)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timed Phone Ban Toolbar */}
                        {!isSelfAdmin && (
                          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                            <select
                              value={banDurationMap[u.uid] || '24h'}
                              onChange={(e) =>
                                setBanDurationMap((prev) => ({ ...prev, [u.uid]: e.target.value }))
                              }
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            >
                              <option value="24h">{lang === 'ar' ? 'حظر 24 ساعة' : 'Ban 24 Hours'}</option>
                              <option value="3d">{lang === 'ar' ? 'حظر 3 أيام' : 'Ban 3 Days'}</option>
                              <option value="7d">{lang === 'ar' ? 'حظر أسبوع' : 'Ban 7 Days'}</option>
                              <option value="30d">{lang === 'ar' ? 'حظر شهر' : 'Ban 30 Days'}</option>
                              <option value="perm">{lang === 'ar' ? 'حظر دائم' : 'Permanent Ban'}</option>
                            </select>

                            <input
                              type="text"
                              value={banReasonMap[u.uid] || ''}
                              onChange={(e) =>
                                setBanReasonMap((prev) => ({ ...prev, [u.uid]: e.target.value }))
                              }
                              placeholder={lang === 'ar' ? 'سبب الحظر (اختياري)...' : 'Ban reason (optional)...'}
                              className="flex-1 min-w-[160px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                            />

                            <button
                              type="button"
                              disabled={busyId === `ban-${u.uid}`}
                              onClick={() => handleBanUser(u)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-rose-700 hover:opacity-90 text-white font-bold flex items-center gap-1.5 cursor-pointer"
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
              )}

              {/* Active Banned Phones List */}
              {bannedPhones.length > 0 && (
                <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5">
                  <div className="font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <Ban className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'الأرقام المحظورة حالياً على المنصة' : 'Banned Phone Numbers Registry'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {bannedPhones.map((bp) => (
                      <div key={bp.phone} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/40">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{bp.phone}</span>
                          {bp.userName && <span className="text-slate-500">({bp.userName})</span>}
                          <span className="text-rose-600 font-semibold">
                            {bp.isPermanent
                              ? lang === 'ar'
                                ? 'حظر دائم'
                                : 'Permanent'
                              : `${lang === 'ar' ? 'حتى' : 'Until'} ${new Date(bp.banUntilMs).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}`}
                          </span>
                          {bp.reason && <span className="text-slate-500">· {bp.reason}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnbanUser(bp.phone, bp.userId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                        >
                          {lang === 'ar' ? 'إلغاء الحظر' : 'Unban'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROVIDERS */}
          {activeSection === 'providers' && (
            <div className="space-y-3">
              {providers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {lang === 'ar'
                    ? 'مفيش طلبات تسجيل مقدمي خدمات جديدة حالياً.'
                    : 'No new service provider requests yet.'}
                </div>
              ) : (
                providers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
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
                              ? 'مقبول'
                              : 'Approved'
                            : p.status === 'rejected'
                            ? lang === 'ar'
                              ? 'مرفوض'
                              : 'Rejected'
                            : lang === 'ar'
                            ? 'مستني الموافقة'
                            : 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{p.villageId}</span>
                        <span>·</span>
                        <span className="font-mono">{p.phone}</span>
                        {p.priceLabelAr && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{lang === 'ar' ? p.priceLabelAr : p.priceLabelEn}</span>
                          </>
                        )}
                      </div>

                      {p.bioAr && (
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {lang === 'ar' ? p.bioAr : p.bioEn}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.status !== 'approved' && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => handleProviderDecision(p, 'approved')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'قبول وتفعيل' : 'Approve'}</span>
                        </button>
                      )}
                      {p.status !== 'rejected' && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => handleProviderDecision(p, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ADS APPROVAL & PRICING */}
          {activeSection === 'ads' && (
            <div className="space-y-6">
              {/* Dynamic Ad Pricing Settings Card */}
              <form
                onSubmit={handleSaveAdPricing}
                className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'تسعيرة الإعلانات (تتغير في أي وقت)' : 'Ad Pricing Configuration'}</span>
                  </div>
                  {pricingMsg && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{pricingMsg}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الإعلان حتى أسبوع (ج.م)' : 'Up to 1 Week Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={weekPrice}
                      onChange={(e) => setWeekPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الإعلان لمدة شهر (ج.م)' : 'Full Month Price (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={monthPrice}
                      onChange={(e) => setMonthPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busyId === 'ad-pricing'}
                    className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? 'حفظ التسعيرة' : 'Save Pricing'}
                  </button>
                </div>
              </form>

              {/* Ads List */}
              {ads.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  {lang === 'ar' ? 'مفيش إعلانات جديدة للمراجعة دلوقتي.' : 'No ads waiting for review.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {ads.map((ad) => {
                    const expired = isAdExpired(ad.expiresAtMs, nowMs);
                    return (
                      <div
                        key={ad.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                                ? 'مستني الموافقة'
                                : 'Pending'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{ad.authorName}</span>
                            <span>·</span>
                            <span>{ad.villageId}</span>
                            <span>·</span>
                            <span className="font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ad.contactPhone}
                            </span>
                            {(ad.durationDays || typeof ad.costEgp === 'number') && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400 font-bold">
                                  <CalendarClock className="w-3 h-3" />
                                  {ad.durationDays || 7} {lang === 'ar' ? 'يوم' : 'd'} · {ad.costEgp ?? 20} {t.currency}
                                </span>
                              </>
                            )}
                          </div>

                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {ad.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {(ad.status !== 'approved' || expired) && (
                            <button
                              disabled={busyId === ad.id}
                              onClick={() => handleAdDecision(ad, 'approved')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{expired ? (lang === 'ar' ? 'تجديد ونشر' : 'Renew & Approve') : (lang === 'ar' ? 'نشر الإعلان' : 'Approve Ad')}</span>
                            </button>
                          )}
                          {ad.status !== 'rejected' && (
                            <button
                              disabled={busyId === ad.id}
                              onClick={() => handleAdDecision(ad, 'rejected')}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VILLAGES SWITCHER & MODULAR CREATOR */}
          {activeSection === 'villages' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'التبديل السريع بين القرى (Modular Villages)' : 'Switch Active Village'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {villages.map((v) => {
                    const isCurrent = v.id === activeVillageId;
                    const vTheme = getVillageTheme(v.colorCode);
                    return (
                      <div
                        key={v.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isCurrent
                            ? `${vTheme.border} ${vTheme.softBg}`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${vTheme.dotBg} shrink-0`} />
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {lang === 'ar' ? v.nameAr : v.nameEn}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold ${vTheme.text}`}>
                              {vTheme.label[lang]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {lang === 'ar' ? v.governorateAr : v.governorateEn}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-2">
                            {lang === 'ar'
                              ? `توصيل أساسي: ${v.baseDeliveryFeeEgp} ج.م + ${v.perKmFeeEgp} ج.م/كم`
                              : `Delivery: ${v.baseDeliveryFeeEgp} + ${v.perKmFeeEgp}/km EGP`}
                          </div>
                        </div>

                        <button
                          disabled={isCurrent || busyId === v.id}
                          onClick={() => handleSwitchActiveVillage(v.id)}
                          className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? `${vTheme.solidBg} text-white cursor-default`
                              : 'bg-slate-900 dark:bg-slate-800 hover:opacity-90 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {isCurrent
                              ? lang === 'ar'
                                ? 'القرية النشطة حالياً ✓'
                                : 'Active Village ✓'
                              : lang === 'ar'
                              ? 'شغّل القرية دي'
                              : 'Switch to Village'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Village Form */}
              <form
                onSubmit={handleAddVillage}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'إضافة قرية جديدة للمنصة' : 'Add New Modular Village'}</span>
                  </h4>
                  {villageMsg && (
                    <span className="text-emerald-600 font-bold">{villageMsg}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'اسم القرية بالعربي *' : 'Arabic Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newVillageNameAr}
                      onChange={(e) => setNewVillageNameAr(e.target.value)}
                      placeholder="قرية ميت عاصم"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'اسم القرية بالإنجليزي *' : 'English Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newVillageNameEn}
                      onChange={(e) => setNewVillageNameEn(e.target.value)}
                      placeholder="Meet Assem"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'المركز / المحافظة' : 'Governorate'}
                    </label>
                    <input
                      type="text"
                      value={newGovAr}
                      onChange={(e) => setNewGovAr(e.target.value)}
                      placeholder="مركز بنها - القليوبية"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {lang === 'ar' ? 'اللون المميز للقرية (Color Code)' : 'Village Color Code'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(Object.keys(VILLAGE_COLOR_THEMES) as VillageColorCode[]).map((code) => {
                      const themeObj = VILLAGE_COLOR_THEMES[code];
                      const selected = newColorCode === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setNewColorCode(code)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            selected
                              ? `${themeObj.border} ${themeObj.softBg} ${themeObj.text}`
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${themeObj.dotBg}`} />
                          <span>{themeObj.label[lang]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'فتح العداد للتوصيل (ج.م)' : 'Base Delivery Fee (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newBaseFee}
                      onChange={(e) => setNewBaseFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الكيلو متر (ج.م)' : 'Per-KM Fee (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newPerKmFee}
                      onChange={(e) => setNewPerKmFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busyId === 'add-village'}
                    className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? '+ ضيف القرية للمنصة' : '+ Add Village'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

