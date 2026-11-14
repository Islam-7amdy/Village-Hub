import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, ADMIN_EMAIL, handleFirestoreError, OperationType } from '../../firebase';
import {
  Language,
  UserProfile,
  BannedPhoneRecord,
  BookingRequest,
  PlatformPricingConfig,
  ProviderListing,
  ReviewItem,
  VillageAd,
  VillageConfig,
  VillageColorCode,
  VillageLogoIconId,
  VILLAGE_COLOR_THEMES,
  VILLAGE_LOGO_PRESETS,
  getVillageTheme,
  normalizePhone,
  isBanCurrentlyActive,
  isAdExpired
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { VillageLogo, renderVillageLogoGlyph } from '../VillageLogo';
import {
  X,
  ShieldCheck,
  Briefcase,
  Megaphone,
  MapPin,
  CheckCircle2,
  XCircle,
  Phone,
  BarChart3,
  Users,
  Trash2,
  Ban,
  Search,
  DollarSign,
  CalendarClock,
  Upload,
  Star,
  Truck,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';

export type DemoUserAdminAction =
  | { type: 'ban'; uid: string; banUntilMs: number; reason: string; isPermanent: boolean }
  | { type: 'unban'; uid: string }
  | { type: 'delete'; uid: string };

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  providers: ProviderListing[];
  ads: VillageAd[];
  users: UserProfile[];
  bannedPhones: BannedPhoneRecord[];
  bookings: BookingRequest[];
  reviews: ReviewItem[];
  serviceCounts: {
    doctors: number;
    pharmacy: number;
    food: number;
    technicians: number;
    rides: number;
    grocery: number;
    tutoring: number;
    charity: number;
    other: number;
  };
  activeVillage: VillageConfig;
  adPricing: PlatformPricingConfig;
  nowMs: number;
  onVillageUpdated: (village: VillageConfig) => void;
  onDemoUserAction?: (action: DemoUserAdminAction) => void;
  onDemoProviderDecision?: (providerId: string, decision: 'approved' | 'rejected') => void;
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
  reviews,
  serviceCounts,
  activeVillage,
  adPricing,
  nowMs,
  onVillageUpdated,
  onDemoUserAction,
  onDemoProviderDecision
}) => {
  const t = TRANSLATIONS[lang];
  const [activeSection, setActiveSection] = useState<
    'analytics' | 'users' | 'providers' | 'ads' | 'village_settings'
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

  // Single-Village Settings Form state (قرية نقباس)
  const [editBaseFee, setEditBaseFee] = useState(String(activeVillage.baseDeliveryFeeEgp));
  const [editPerKmFee, setEditPerKmFee] = useState(String(activeVillage.perKmFeeEgp));
  const [editColorCode, setEditColorCode] = useState<VillageColorCode>(activeVillage.colorCode || 'amber');
  const [editLogoIcon, setEditLogoIcon] = useState<VillageLogoIconId>(activeVillage.logoIcon || 'wheat');
  const [editLogoUrl, setEditLogoUrl] = useState(activeVillage.logoUrl || '');
  const [villageMsg, setVillageMsg] = useState('');

  useEffect(() => {
    setWeekPrice(String(adPricing.adPriceWeekEgp));
    setMonthPrice(String(adPricing.adPriceMonthEgp));
  }, [adPricing.adPriceWeekEgp, adPricing.adPriceMonthEgp, isOpen]);

  useEffect(() => {
    setEditBaseFee(String(activeVillage.baseDeliveryFeeEgp ?? 10));
    setEditPerKmFee(String(activeVillage.perKmFeeEgp ?? 5));
    setEditColorCode(activeVillage.colorCode || 'amber');
    setEditLogoIcon(activeVillage.logoIcon || 'wheat');
    setEditLogoUrl(activeVillage.logoUrl || '');
  }, [activeVillage, isOpen]);

  // Comprehensive Platform Analytics for قرية نقباس
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

    const residentCount = users.filter((u) => u.role === 'resident').length;
    const providerUsersCount = users.filter((u) => u.role === 'provider').length;
    const engagementRate =
      users.length > 0 ? Math.min(100, Math.round((engagedKeys.size / users.length) * 100)) : 0;

    const approvedProvidersCount = providers.filter((p) => p.status === 'approved').length;
    const pendingProvidersCountLocal = providers.filter((p) => p.status === 'pending').length;
    const rejectedProvidersCount = providers.filter((p) => p.status === 'rejected').length;
    const providerApprovalRate =
      providers.length > 0 ? Math.round((approvedProvidersCount / providers.length) * 100) : 0;

    const activeAdsList = ads.filter(
      (a) => a.status === 'approved' && !isAdExpired(a.expiresAtMs, nowMs)
    );
    const expiredAdsList = ads.filter(
      (a) => a.status === 'approved' && isAdExpired(a.expiresAtMs, nowMs)
    );
    const pendingAdsList = ads.filter((a) => a.status === 'pending');
    const weeklyAdsCount = ads.filter((a) => (a.durationPlan || 'week') === 'week').length;
    const monthlyAdsCount = ads.filter((a) => a.durationPlan === 'month').length;
    const adApprovalRate =
      ads.length > 0
        ? Math.round((ads.filter((a) => a.status === 'approved').length / ads.length) * 100)
        : 0;

    const adRevenueEgp = ads
      .filter((a) => a.status === 'approved')
      .reduce((sum, a) => sum + (a.costEgp || 0), 0);

    const bookingsVolumeEgp = bookings.reduce((sum, b) => sum + (b.totalAmountEgp || 0), 0);
    const avgOrderEgp =
      bookings.length > 0 ? Math.round(bookingsVolumeEgp / bookings.length) : 0;
    const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length;

    const deliveryBookings = bookings.filter((b) => typeof b.deliveryFeeEgp === 'number' || typeof b.distanceKm === 'number');
    const deliveryFeesTotalEgp = bookings.reduce((sum, b) => sum + (b.deliveryFeeEgp || 0), 0);
    const avgDistanceKm =
      deliveryBookings.length > 0
        ? (
            deliveryBookings.reduce((sum, b) => sum + (b.distanceKm || 0), 0) /
            deliveryBookings.length
          ).toFixed(1)
        : '0.0';

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : '5.0';
    const verifiedReviewsCount = reviews.filter((r) => r.isVerifiedResident).length;

    const permBansCount = bannedPhones.filter((b) => b.isPermanent).length;
    const timedBansCount = bannedPhones.length - permBansCount;

    const totalGmvEgp = bookingsVolumeEgp + adRevenueEgp;

    const categoryBreakdown = [
      {
        id: 'doctors',
        labelAr: 'أطباء وعيادات',
        labelEn: 'Doctors & Clinics',
        listings: serviceCounts.doctors,
        bookings: bookings.filter((b) => b.serviceType === 'doctor').length,
        color: 'bg-rose-500'
      },
      {
        id: 'pharmacy',
        labelAr: 'صيدليات',
        labelEn: 'Pharmacies',
        listings: serviceCounts.pharmacy,
        bookings: bookings.filter((b) => b.serviceType === 'pharmacy').length,
        color: 'bg-emerald-500'
      },
      {
        id: 'food',
        labelAr: 'مطاعم وأكل بيتي',
        labelEn: 'Food & Bakery',
        listings: serviceCounts.food,
        bookings: bookings.filter((b) => b.serviceType === 'food').length,
        color: 'bg-orange-500'
      },
      {
        id: 'technicians',
        labelAr: 'فنيون وحرفيون',
        labelEn: 'Technicians',
        listings: serviceCounts.technicians,
        bookings: bookings.filter((b) => b.serviceType === 'technician').length,
        color: 'bg-amber-500'
      },
      {
        id: 'rides',
        labelAr: 'مواصلات وتوصيل',
        labelEn: 'Rides & Transit',
        listings: serviceCounts.rides,
        bookings: bookings.filter((b) => b.serviceType === 'ride').length,
        color: 'bg-sky-500'
      },
      {
        id: 'grocery',
        labelAr: 'بقالة وسوبر ماركت',
        labelEn: 'Grocery & Market',
        listings: serviceCounts.grocery,
        bookings: bookings.filter((b) => b.serviceType === 'grocery' || b.serviceType === 'farm').length,
        color: 'bg-lime-500'
      },
      {
        id: 'tutoring',
        labelAr: 'دروس ومعلمون',
        labelEn: 'Tutoring',
        listings: serviceCounts.tutoring,
        bookings: bookings.filter((b) => b.serviceType === 'tutoring').length,
        color: 'bg-indigo-500'
      },
      {
        id: 'charity',
        labelAr: 'جمعيات خيرية',
        labelEn: 'Charities',
        listings: serviceCounts.charity,
        bookings: bookings.filter((b) => b.serviceType === 'charity').length,
        color: 'bg-teal-500'
      },
      {
        id: 'other',
        labelAr: 'خدمات أخرى',
        labelEn: 'Other Services',
        listings: serviceCounts.other,
        bookings: bookings.filter((b) => b.serviceType === 'other').length,
        color: 'bg-purple-500'
      }
    ];

    const maxCategoryWeight = Math.max(
      1,
      ...categoryBreakdown.map((c) => c.listings + c.bookings)
    );

    return {
      totalUsers: users.length,
      residentCount,
      providerUsersCount,
      engagedCount: engagedKeys.size,
      engagementRate,
      activeBannedCount,
      approvedProvidersCount,
      pendingProvidersCount: pendingProvidersCountLocal,
      rejectedProvidersCount,
      providerApprovalRate,
      activeAdsCount: activeAdsList.length,
      pendingAdsCount: pendingAdsList.length,
      expiredAdsCount: expiredAdsList.length,
      weeklyAdsCount,
      monthlyAdsCount,
      adApprovalRate,
      adRevenueEgp,
      bookingsCount: bookings.length,
      confirmedBookingsCount,
      bookingsVolumeEgp,
      avgOrderEgp,
      deliveryOrdersCount: deliveryBookings.length,
      deliveryFeesTotalEgp,
      avgDistanceKm,
      reviewsCount: reviews.length,
      avgRating,
      verifiedReviewsCount,
      permBansCount,
      timedBansCount,
      totalGmvEgp,
      categoryBreakdown,
      maxCategoryWeight
    };
  }, [users, bookings, ads, providers, reviews, bannedPhones, serviceCounts, nowMs]);

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
          activeVillageId: 'noqbas',
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
      if (user.uid.startsWith('test-')) {
        onDemoUserAction?.({
          type: 'ban',
          uid: user.uid,
          banUntilMs,
          reason,
          isPermanent
        });
        setUserActionMsg(
          lang === 'ar'
            ? `تم حظر حساب التجربة ${user.displayName} (${normalized}).`
            : `Banned test user ${user.displayName} (${normalized}).`
        );
        setTimeout(() => setUserActionMsg(''), 3000);
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
      if (uid?.startsWith('test-')) {
        onDemoUserAction?.({ type: 'unban', uid });
        setUserActionMsg(
          lang === 'ar' ? `تم فك الحظر عن ${normalized}` : `Unbanned ${normalized}`
        );
        setTimeout(() => setUserActionMsg(''), 2500);
        return;
      }

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
      if (user.uid.startsWith('test-')) {
        onDemoUserAction?.({ type: 'delete', uid: user.uid });
        setConfirmDeleteUid(null);
        setUserActionMsg(
          lang === 'ar' ? `تم حذف حساب التجربة ${user.displayName}.` : `Deleted test account ${user.displayName}.`
        );
        setTimeout(() => setUserActionMsg(''), 2500);
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
          if (dataUrl.length > 40000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          }
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
      setVillageMsg(
        lang === 'ar'
          ? 'حجم اللوجو كبير أوي، جرب صورة أصغر.'
          : 'Logo image is too large, try a smaller image.'
      );
      setTimeout(() => setVillageMsg(''), 3000);
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
        if (snap.exists()) {
          await updateDoc(vRef, payload);
        } else {
          await setDoc(vRef, {
            ...payload,
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'villages/noqbas');
      }

      onVillageUpdated(updatedVillage);
      setVillageMsg(
        lang === 'ar' ? 'تم حفظ إعدادات ولوجو قرية نقباس بنجاح ✓' : 'Noqbas Village settings saved ✓'
      );
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
            onClick={() => setActiveSection('village_settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'village_settings'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إعدادات قرية نقباس' : 'Noqbas Settings'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* TAB 0: EXTENSIVE ANALYTICS */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              {/* Row 1: Primary 4 KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'إجمالي الحسابات المسجلة' : 'Registered Users'}</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {analyticsStats.totalUsers}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <span>{analyticsStats.residentCount} {lang === 'ar' ? 'مستخدم' : 'users'}</span>
                    <span>·</span>
                    <span>{analyticsStats.providerUsersCount} {lang === 'ar' ? 'مقدم خدمة' : 'providers'}</span>
                    {analyticsStats.activeBannedCount > 0 && (
                      <span className="text-rose-600 font-bold">· {analyticsStats.activeBannedCount} {lang === 'ar' ? 'محظور' : 'banned'}</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>{lang === 'ar' ? 'المتفاعلين ونسبة النشاط' : 'Engaged Users & Rate'}</span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                      {analyticsStats.engagedCount}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      ({analyticsStats.engagementRate}%)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {lang === 'ar' ? 'تفاعل عبر الطلبات والإعلانات والخدمات' : 'Orders, ads & services activity'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/25 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-sky-800 dark:text-sky-300">
                    <span>{lang === 'ar' ? 'الطلبات وحجم التعاملات' : 'Orders & Volume'}</span>
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {analyticsStats.bookingsCount}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      ({analyticsStats.confirmedBookingsCount} {lang === 'ar' ? 'مؤكد' : 'conf.'})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400 font-bold">
                    {analyticsStats.bookingsVolumeEgp.toLocaleString()} {t.currency} · {lang === 'ar' ? 'متوسط' : 'Avg'} {analyticsStats.avgOrderEgp} {t.currency}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    <span>{lang === 'ar' ? 'الإعلانات السارية وعائدها' : 'Active Ads & Revenue'}</span>
                    <Megaphone className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-300">
                      {analyticsStats.activeAdsCount}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {analyticsStats.pendingAdsCount} {lang === 'ar' ? 'مراجعة' : 'pend.'} · {analyticsStats.expiredAdsCount} {lang === 'ar' ? 'منتهي' : 'exp.'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                    {analyticsStats.adRevenueEgp.toLocaleString()} {t.currency} ({analyticsStats.adApprovalRate}% {lang === 'ar' ? 'قبول' : 'appr.'})
                  </div>
                </div>
              </div>

              {/* Row 2: 4 Deep Operational KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'مقدمي الخدمات المسجلين' : 'Service Providers'}</span>
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {analyticsStats.approvedProvidersCount} / {providers.length}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {analyticsStats.pendingProvidersCount} {lang === 'ar' ? 'مراجعة' : 'pend'} · {analyticsStats.rejectedProvidersCount} {lang === 'ar' ? 'مرفوض' : 'rej'} · {analyticsStats.providerApprovalRate}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'التوصيل والمسافات' : 'Delivery Analytics'}</span>
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    {analyticsStats.deliveryFeesTotalEgp.toLocaleString()} {t.currency}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {analyticsStats.deliveryOrdersCount} {lang === 'ar' ? 'طلب توصيل' : 'deliveries'} · {lang === 'ar' ? 'متوسط' : 'Avg'} {analyticsStats.avgDistanceKm} {lang === 'ar' ? 'كم' : 'km'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'التقييمات وجودة الخدمة' : 'Reviews & Quality'}</span>
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                    ★ {analyticsStats.avgRating} <span className="text-xs font-normal text-slate-500">({analyticsStats.reviewsCount})</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    {analyticsStats.verifiedReviewsCount} {lang === 'ar' ? 'تقييم موثق من أهالي نقباس' : 'verified resident reviews'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{lang === 'ar' ? 'سجل الأمان والحظر' : 'Moderation & Bans'}</span>
                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-lg font-extrabold font-mono text-rose-600">
                    {bannedPhones.length} <span className="text-xs font-normal text-slate-500">{lang === 'ar' ? 'رقم محظور' : 'phones'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {analyticsStats.timedBansCount} {lang === 'ar' ? 'مؤقت' : 'timed'} · {analyticsStats.permBansCount} {lang === 'ar' ? 'دائم' : 'perm'}
                  </div>
                </div>
              </div>

              {/* Row 3: Service Categories Distribution + Ads & Top Providers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Category Breakdown Bars */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'توزيع الخدمات والطلبات حسب القسم — نقباس' : 'Noqbas Activity by Category'}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'ar' ? 'مقدمي خدمة + طلبات' : 'Listings + Orders'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analyticsStats.categoryBreakdown.map((cat) => {
                      const totalWeight = cat.listings + cat.bookings;
                      const pct = Math.max(6, Math.round((totalWeight / analyticsStats.maxCategoryWeight) * 100));
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {lang === 'ar' ? cat.labelAr : cat.labelEn}
                            </span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {cat.listings} {lang === 'ar' ? 'خدمة' : 'items'} · {cat.bookings} {lang === 'ar' ? 'طلب' : 'orders'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cat.color} transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ads Plan Analytics & Top Providers */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'ar' ? 'تحليل الإعلانات وإجمالي القيمة المالية' : 'Ads Plans & Financial Summary'}</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[11px] text-slate-500">{lang === 'ar' ? 'باقة الأسبوع' : 'Weekly Ads'}</div>
                        <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                          {analyticsStats.weeklyAdsCount}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <div className="text-[11px] text-slate-500">{lang === 'ar' ? 'باقة الشهر' : 'Monthly Ads'}</div>
                        <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                          {analyticsStats.monthlyAdsCount}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{lang === 'ar' ? 'إجمالي الحركة' : 'Total GMV'}</div>
                        <div className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                          {analyticsStats.totalGmvEgp.toLocaleString()} {t.currency}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Providers Snapshot */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'ar' ? 'مقدمي الخدمات في قرية نقباس' : 'Registered Noqbas Providers'}</span>
                    </h4>
                    {providers.length === 0 ? (
                      <div className="text-slate-400 py-3 text-center">
                        {lang === 'ar' ? 'لا يوجد مقدمي خدمات مسجلين بعد.' : 'No providers registered yet.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {providers.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {lang === 'ar' ? p.nameAr : p.nameEn}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {lang === 'ar' ? p.specialtyAr : p.specialtyEn}
                              </div>
                            </div>
                            <span
                              className={`text-[11px] font-bold shrink-0 ${
                                p.status === 'approved'
                                  ? 'text-emerald-600'
                                  : p.status === 'rejected'
                                  ? 'text-rose-600'
                                  : 'text-amber-600'
                              }`}
                            >
                              {p.status === 'approved'
                                ? lang === 'ar'
                                  ? 'مفعل'
                                  : 'Approved'
                                : p.status === 'rejected'
                                ? lang === 'ar'
                                  ? 'مرفوض'
                                  : 'Rejected'
                                : lang === 'ar'
                                ? 'مراجعة'
                                : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Latest Orders & Bookings Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'أحدث الطلبات والحجوزات في نقباس' : 'Latest Noqbas Bookings & Orders'}</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {bookings.length} {lang === 'ar' ? 'سجل' : 'total'}
                  </span>
                </div>
                {bookings.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد طلبات مسجلة حتى الآن.' : 'No orders recorded yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start text-xs">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'الخدمة / الطلب' : 'Service / Order'}</th>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'مقدم الخدمة' : 'Provider'}</th>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'القيمة' : 'Amount'}</th>
                          <th className="px-4 py-2.5 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {bookings.slice(0, 8).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                              {b.customerName}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                              {b.title}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{b.providerName}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-500">{b.date}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">
                              {b.totalAmountEgp ? `${b.totalAmountEgp} ${t.currency}` : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`font-bold ${
                                  b.status === 'confirmed' || b.status === 'completed'
                                    ? 'text-emerald-600'
                                    : b.status === 'cancelled'
                                    ? 'text-rose-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {b.status === 'confirmed'
                                  ? lang === 'ar'
                                    ? 'مؤكد'
                                    : 'Confirmed'
                                  : b.status === 'completed'
                                  ? lang === 'ar'
                                    ? 'مكتمل'
                                    : 'Completed'
                                  : b.status === 'cancelled'
                                  ? lang === 'ar'
                                    ? 'ملغي'
                                    : 'Cancelled'
                                  : lang === 'ar'
                                  ? 'قيد الانتظار'
                                  : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

          {/* TAB 4: SINGLE VILLAGE SETTINGS (قرية نقباس) */}
          {activeSection === 'village_settings' && (
            <form
              onSubmit={handleSaveNoqbasSettings}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <VillageLogo
                    village={{
                      nameAr: 'قرية نقباس',
                      nameEn: 'Noqbas Village',
                      colorCode: editColorCode,
                      logoIcon: editLogoIcon,
                      logoUrl: editLogoUrl
                    }}
                    lang={lang}
                    size="lg"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'إعدادات ولوجو قرية نقباس' : 'Noqbas Village Branding & Settings'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'المنصة مخصصة بالكامل لقرية نقباس — تقدر تغير اللوجو، اللون المميز، وأسعار التوصيل.'
                        : 'Single-village platform for Noqbas — customize logo, accent color, and delivery rates.'}
                    </p>
                  </div>
                </div>
                {villageMsg && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{villageMsg}</span>
                )}
              </div>

              {/* Color Code Picker */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {lang === 'ar' ? 'اللون المميز للمنصة (Color Code)' : 'Platform Accent Color'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {(Object.keys(VILLAGE_COLOR_THEMES) as VillageColorCode[]).map((code) => {
                    const themeObj = VILLAGE_COLOR_THEMES[code];
                    const selected = editColorCode === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setEditColorCode(code)}
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

              {/* Noqbas Logo Picker / Custom Image Upload */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'لوجو / شعار قرية نقباس' : 'Noqbas Village Logo'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {lang === 'ar'
                        ? 'اختار شعار جاهز أو ارفع صورة لوجو خاصة بقرية نقباس'
                        : 'Pick a preset emblem or upload a custom logo image'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditLogoUrl('')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? 'حذف الصورة' : 'Remove'}
                      </button>
                    )}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'رفع صورة لوجو' : 'Upload Logo'}</span>
                      <input
                        key="noqbas-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleUploadNoqbasLogo}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {VILLAGE_LOGO_PRESETS.map((preset) => {
                    const selected = !editLogoUrl && editLogoIcon === preset.id;
                    const previewTheme = getVillageTheme(editColorCode);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditLogoIcon(preset.id);
                          setEditLogoUrl('');
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          selected
                            ? `${previewTheme.solidBg} text-white border-transparent shadow-2xs`
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {renderVillageLogoGlyph(preset.id, 'w-3.5 h-3.5')}
                        <span>{preset.label[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'فتح العداد للتوصيل (ج.م)' : 'Base Delivery Fee (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editBaseFee}
                    onChange={(e) => setEditBaseFee(e.target.value)}
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
                    value={editPerKmFee}
                    onChange={(e) => setEditPerKmFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'save-noqbas'}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {busyId === 'save-noqbas'
                    ? lang === 'ar'
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : lang === 'ar'
                    ? 'حفظ إعدادات قرية نقباس'
                    : 'Save Noqbas Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

