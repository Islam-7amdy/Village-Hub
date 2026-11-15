import { useState, useEffect, useMemo, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AnalyticsEventType,
  BannedPhoneRecord,
  BookingRequest,
  BookingStatus,
  DemoTestAccount,
  Language,
  PaymentMethod,
  PaymentStatus,
  PendingPaymentOrder,
  ProviderListing,
  TEST_DEMO_BOOKINGS,
  UserProfile,
  VillageAd,
  VillageConfig,
  evaluateProviderAvailability,
  getServiceStatusLabel,
  normalizePhone
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import { CartItem } from '../components/Modals/CartModal';
import { AppNotificationItem } from '../components/Modals/NotificationsModal';

export interface UseBookingsOptions {
  lang: Language;
  nowMs: number;
  activeVillage: VillageConfig;
  firebaseUser: FirebaseUser | null;
  effectiveUid: string | null;
  effectiveProfile: UserProfile | null;
  userProfile: UserProfile | null;
  activeDemoAccount: DemoTestAccount | null;
  profileLoaded: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isCurrentUserBanned: boolean;
  ownPhoneBan: BannedPhoneRecord | null;
  mergedProviders: ProviderListing[];
  firestoreAds: VillageAd[];
  allAds: VillageAd[];
  trackAnalyticsEvent: (
    eventType: AnalyticsEventType,
    targetId: string,
    targetLabel: string
  ) => Promise<void>;
  requireAuth: (next: () => void) => void;
  onOrderCompletedOpenTracker: (orderId: string) => void;
}

export function useBookings({
  lang,
  nowMs,
  activeVillage,
  firebaseUser,
  effectiveUid,
  effectiveProfile,
  userProfile,
  activeDemoAccount,
  profileLoaded,
  isSignedIn,
  isAdmin,
  isCurrentUserBanned,
  ownPhoneBan,
  mergedProviders,
  firestoreAds,
  allAds,
  trackAnalyticsEvent,
  requireAuth,
  onOrderCompletedOpenTracker
}: UseBookingsOptions) {
  const t = TRANSLATIONS[lang];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>(TEST_DEMO_BOOKINGS);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentOrder | null>(null);
  const [recentlyCompletedOrderId, setRecentlyCompletedOrderId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string>('');

  // 1. Per-User Isolated Cart Listener
  const cartStorageKey = effectiveUid ? `noqbas_cart_${effectiveUid}` : 'noqbas_cart_guest';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart(Array.isArray(parsed) ? (parsed as CartItem[]) : []);
      } else {
        setCart([]);
      }
    } catch {
      setCart([]);
    }

    if (!firebaseUser) return;
    const unsub = onSnapshot(
      doc(db, 'carts', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { items?: CartItem[] };
          const remoteItems = Array.isArray(data.items) ? data.items : [];
          setCart(remoteItems);
          try {
            localStorage.setItem(cartStorageKey, JSON.stringify(remoteItems));
          } catch {
            // Ignore localStorage quota issues
          }
        }
      },
      (err) => console.warn('Cart listener warning:', err.message)
    );
    return () => unsub();
  }, [firebaseUser, cartStorageKey]);

  // 2. Bookings & Notifications Seen State Listener
  useEffect(() => {
    if (!effectiveUid) {
      setBookings(TEST_DEMO_BOOKINGS);
      setSeenNotificationIds([]);
      return;
    }

    try {
      const saved = window.localStorage.getItem(`noqbas_seen_notifs_${effectiveUid}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSeenNotificationIds(parsed as string[]);
      } else {
        setSeenNotificationIds([]);
      }
    } catch {
      setSeenNotificationIds([]);
    }

    if (!firebaseUser) {
      setBookings((prev) => (prev.length > 0 ? prev : TEST_DEMO_BOOKINGS));
      return;
    }

    if (isAdmin) {
      const unsub = onSnapshot(
        collection(db, 'bookings'),
        (snap) => {
          if (snap.empty) return;
          const remote: BookingRequest[] = snap.docs.map((d) => {
            const data = d.data() as BookingRequest;
            return {
              ...data,
              id: d.id,
              createdAt:
                typeof data.createdAt === 'string'
                  ? data.createdAt
                  : new Date().toLocaleDateString()
            };
          });
          setBookings((prev) => {
            const map = new Map<string, BookingRequest>();
            remote.forEach((b) => map.set(b.id, b));
            prev.forEach((b) => {
              if (!map.has(b.id)) map.set(b.id, b);
            });
            return Array.from(map.values());
          });
        },
        (err) => console.warn('Bookings listener warning:', err.message)
      );
      return () => unsub();
    }

    let ownerRemote: BookingRequest[] = [];
    let providerRemote: BookingRequest[] = [];

    const syncCustomerAndProviderBookings = () => {
      if (ownerRemote.length === 0 && providerRemote.length === 0) return;
      setBookings((prev) => {
        const map = new Map<string, BookingRequest>();
        ownerRemote.forEach((b) => map.set(b.id, b));
        providerRemote.forEach((b) => map.set(b.id, b));
        prev.forEach((b) => {
          if (!map.has(b.id)) map.set(b.id, b);
        });
        return Array.from(map.values());
      });
    };

    const mapSnapshotDocs = (docs: { id: string; data: () => unknown }[]): BookingRequest[] =>
      docs.map((d) => {
        const data = d.data() as BookingRequest;
        return {
          ...data,
          id: d.id,
          createdAt:
            typeof data.createdAt === 'string' ? data.createdAt : new Date().toLocaleDateString()
        };
      });

    const unsubOwner = onSnapshot(
      query(collection(db, 'bookings'), where('ownerId', '==', firebaseUser.uid)),
      (snap) => {
        ownerRemote = mapSnapshotDocs(snap.docs);
        syncCustomerAndProviderBookings();
      },
      (err) => console.warn('Owner bookings listener warning:', err.message)
    );

    const unsubProvider = onSnapshot(
      query(
        collection(db, 'bookings'),
        where('providerOwnerId', '==', firebaseUser.uid),
        where('providerVisible', '==', true)
      ),
      (snap) => {
        providerRemote = mapSnapshotDocs(snap.docs);
        syncCustomerAndProviderBookings();
      },
      (err) => console.warn('Provider bookings listener warning:', err.message)
    );

    return () => {
      unsubOwner();
      unsubProvider();
    };
  }, [isAdmin, firebaseUser, effectiveUid]);

  const userOrders = useMemo(() => {
    if (!isSignedIn) return [];
    if (isAdmin) return bookings;
    const myNormPhone = normalizePhone(effectiveProfile?.phone || '');
    return bookings.filter(
      (b) =>
        b.ownerId === effectiveUid ||
        (myNormPhone.length >= 8 && normalizePhone(b.customerPhone) === myNormPhone)
    );
  }, [isSignedIn, isAdmin, bookings, effectiveUid, effectiveProfile?.phone]);

  const activeOrdersCount = useMemo(
    () =>
      userOrders.filter(
        (o) =>
          o.status === 'pending' ||
          o.status === 'confirmed' ||
          o.status === 'preparing' ||
          o.status === 'on_the_way'
      ).length,
    [userOrders]
  );

  const providerOrders = useMemo(() => {
    if (!isSignedIn || effectiveProfile?.role !== 'provider') return [];
    const nameLower = (effectiveProfile.displayName || '').trim().toLowerCase();
    return bookings.filter(
      (b) =>
        b.providerVisible !== false &&
        !(b.paymentMethod === 'instapay' && b.paymentStatus !== 'paid') &&
        b.paymentStatus !== 'rejected' &&
        ((b.providerOwnerId && b.providerOwnerId === effectiveUid) ||
          (nameLower.length >= 3 && b.providerName.toLowerCase().includes(nameLower)))
    );
  }, [isSignedIn, effectiveProfile, effectiveUid, bookings]);

  const activeProviderOrdersCount = useMemo(
    () =>
      providerOrders.filter(
        (o) =>
          o.status === 'pending' ||
          o.status === 'confirmed' ||
          o.status === 'preparing' ||
          o.status === 'on_the_way'
      ).length,
    [providerOrders]
  );

  const pendingAdminCount = useMemo(
    () =>
      mergedProviders.filter((p) => p.status === 'pending').length +
      firestoreAds.filter((a) => a.status === 'pending').length +
      bookings.filter(
        (b) =>
          b.paymentMethod === 'instapay' &&
          b.paymentStatus === 'pending_verification' &&
          b.status !== 'cancelled'
      ).length,
    [mergedProviders, firestoreAds, bookings]
  );

  const userNotifications = useMemo<AppNotificationItem[]>(() => {
    if (!isSignedIn || !effectiveUid) return [];
    const list: AppNotificationItem[] = [];

    if (isAdmin) {
      const pendingProv = mergedProviders.filter((p) => p.status === 'pending').length;
      const pendingAds = firestoreAds.filter((a) => a.status === 'pending').length;
      if (pendingProv > 0) {
        list.push({
          id: `admin-prov-${pendingProv}`,
          type: 'admin',
          tone: 'warning',
          title:
            lang === 'ar'
              ? `طلبات مقدمي خدمة جديدة (${pendingProv})`
              : `${pendingProv} Pending Provider Request(s)`,
          body:
            lang === 'ar'
              ? 'فيه مقدمي خدمة جداد مستنيين موافقتك من لوحة الأدمن عشان يظهروا للناس.'
              : 'New service provider applications await your review in the Admin Panel.'
        });
      }
      if (pendingAds > 0) {
        list.push({
          id: `admin-ads-${pendingAds}`,
          type: 'admin',
          tone: 'warning',
          title:
            lang === 'ar' ? `إعلانات بانتظار المراجعة (${pendingAds})` : `${pendingAds} Pending Ad(s)`,
          body:
            lang === 'ar'
              ? 'فيه إعلانات جديدة مستنية موافقتك في لوحة الأدمن.'
              : 'New submitted ads await your approval in the Admin Panel.'
        });
      }
      const pendingInstaPay = bookings.filter(
        (b) =>
          b.paymentMethod === 'instapay' &&
          b.paymentStatus === 'pending_verification' &&
          b.status !== 'cancelled'
      ).length;
      if (pendingInstaPay > 0) {
        list.push({
          id: `admin-instapay-${pendingInstaPay}`,
          type: 'admin',
          tone: 'warning',
          title:
            lang === 'ar'
              ? `تحويلات InstaPay بانتظار الاعتماد (${pendingInstaPay})`
              : `${pendingInstaPay} InstaPay Transfer(s) Pending Review`,
          body:
            lang === 'ar'
              ? 'راجع طلبات الدفع عبر InstaPay في لوحة الأدمن وتأكد من وصول التحويل قبل إرسالها لمقدم الخدمة.'
              : 'Verify InstaPay transfers in the Admin Panel before releasing orders to providers.'
        });
      }
    }

    if (isCurrentUserBanned) {
      list.push({
        id: `ban-${ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs || 'perm'}`,
        type: 'ban',
        tone: 'danger',
        title: lang === 'ar' ? 'الحساب محظور حالياً' : 'Account Currently Restricted',
        body:
          lang === 'ar'
            ? 'حسابك محظور مؤقتاً أو دائماً من تقديم طلبات جديدة.'
            : 'Your account is restricted from submitting new requests.'
      });
    } else if (
      !activeDemoAccount &&
      profileLoaded &&
      !isAdmin &&
      (!userProfile || !userProfile.phone)
    ) {
      list.push({
        id: 'complete-profile-reminder',
        type: 'account',
        tone: 'warning',
        title: lang === 'ar' ? 'استكمال بيانات الحساب' : 'Complete Your Profile',
        body:
          lang === 'ar'
            ? 'كمل بياناتك (الاسم ورقم الموبايل والعنوان) لتفعيل كل خدمات المنصة.'
            : 'Add your name, mobile number, and address to unlock all services.'
      });
    }

    if (effectiveProfile?.role === 'provider') {
      if (activeProviderOrdersCount > 0) {
        list.push({
          id: `prov-incoming-${activeProviderOrdersCount}`,
          type: 'booking',
          tone: 'warning',
          title:
            lang === 'ar'
              ? `لديك ${activeProviderOrdersCount} طلبات واردة جديدة`
              : `You have ${activeProviderOrdersCount} incoming order(s)`,
          body:
            lang === 'ar'
              ? 'راجع تبويب "طلبات النشاط" في لوحة عملك لتأكيد الطلبات ومتابعة التسليم والتحصيل.'
              : 'Review the "Orders" tab in your Provider Portal to confirm orders and track fulfillment.'
        });
      }

      if (effectiveProfile.providerStatus === 'approved') {
        list.push({
          id: 'prov-status-approved',
          type: 'provider',
          tone: 'success',
          title: lang === 'ar' ? 'تم تفعيل حسابك كمقدم خدمة' : 'Provider Account Approved',
          body:
            lang === 'ar'
              ? 'مبروك! نشاطك ظاهر دلوقتي لكل أهالي قرية نقباس.'
              : 'Your service profile is now live across Noqbas Village.'
        });
      } else if (effectiveProfile.providerStatus === 'pending') {
        list.push({
          id: 'prov-status-pending',
          type: 'provider',
          tone: 'warning',
          title: lang === 'ar' ? 'طلب مقدم الخدمة قيد المراجعة' : 'Provider Application Under Review',
          body:
            lang === 'ar'
              ? 'الأدمن بيراجع بياناتك وهيتفعل حسابك قريب.'
              : 'Admin is reviewing your provider application.'
        });
      } else if (effectiveProfile.providerStatus === 'rejected') {
        list.push({
          id: 'prov-status-rejected',
          type: 'provider',
          tone: 'danger',
          title: lang === 'ar' ? 'تم رفض طلب مقدم الخدمة' : 'Provider Application Declined',
          body:
            lang === 'ar'
              ? 'راجع بياناتك من حسابك وعدلها لإعادة التقديم.'
              : 'Please update your details from My Account and resubmit.'
        });
      }
    }

    allAds
      .filter((ad) => ad.ownerId === effectiveUid)
      .forEach((ad) => {
        list.push({
          id: `ad-${ad.id}-${ad.status}`,
          type: 'ad',
          tone:
            ad.status === 'approved' ? 'success' : ad.status === 'rejected' ? 'danger' : 'warning',
          title:
            ad.status === 'approved'
              ? lang === 'ar'
                ? `تمت الموافقة على إعلانك: ${ad.title}`
                : `Ad Approved: ${ad.title}`
              : ad.status === 'rejected'
              ? lang === 'ar'
                ? `تم رفض إعلانك: ${ad.title}`
                : `Ad Declined: ${ad.title}`
              : lang === 'ar'
              ? `إعلانك قيد المراجعة: ${ad.title}`
              : `Ad Pending Review: ${ad.title}`,
          body:
            ad.status === 'approved'
              ? lang === 'ar'
                ? 'إعلانك معروض الآن في قسم الإعلانات والعروض.'
                : 'Your ad is now live in the Ads & Offers showcase.'
              : ad.status === 'rejected'
              ? lang === 'ar'
                ? 'لم تتم الموافقة على نشر الإعلان.'
                : 'This ad was not approved for publication.'
              : lang === 'ar'
              ? 'هيظهر تلقائياً أول ما الأدمن يوافق عليه.'
              : 'Will go live as soon as Admin approves it.'
        });
      });

    bookings
      .filter(
        (b) =>
          b.ownerId === effectiveUid ||
          normalizePhone(b.customerPhone) === normalizePhone(effectiveProfile?.phone || '')
      )
      .forEach((b) => {
        const isPendingInstaPay =
          b.paymentMethod === 'instapay' && b.paymentStatus === 'pending_verification';
        const isRejectedPayment = b.paymentStatus === 'rejected';
        const statusText = isPendingInstaPay
          ? lang === 'ar'
            ? 'قيد المراجعة — بانتظار تأكيد الإدارة لتحويل InstaPay'
            : 'Under Review — Awaiting Admin InstaPay verification'
          : isRejectedPayment
          ? lang === 'ar'
            ? 'تم رفض التحويل'
            : 'Payment Rejected'
          : getServiceStatusLabel(b.status, b.serviceType, lang);
        list.push({
          id: `booking-${b.id}-${b.status}-${b.paymentStatus || 'std'}`,
          type: 'booking',
          tone:
            b.status === 'cancelled' || isRejectedPayment
              ? 'danger'
              : b.status === 'completed' || b.status === 'confirmed'
              ? 'success'
              : 'warning',
          title: `${b.title} — ${statusText}`,
          body: `${b.providerName}${
            b.totalAmountEgp ? ` · ${b.totalAmountEgp} ${lang === 'ar' ? 'ج.م' : 'EGP'}` : ''
          }`,
          meta: [b.date, b.time].filter(Boolean).join(' · ')
        });
      });

    return list;
  }, [
    isSignedIn,
    effectiveUid,
    activeDemoAccount,
    isAdmin,
    mergedProviders,
    firestoreAds,
    isCurrentUserBanned,
    ownPhoneBan,
    effectiveProfile,
    userProfile,
    profileLoaded,
    activeProviderOrdersCount,
    allAds,
    bookings,
    lang
  ]);

  const unreadNotificationsCount = useMemo(
    () => userNotifications.filter((n) => !seenNotificationIds.includes(n.id)).length,
    [userNotifications, seenNotificationIds]
  );

  const handleMarkAllNotificationsRead = useCallback(() => {
    if (!effectiveUid) return;
    const allIds = userNotifications.map((n) => n.id);
    setSeenNotificationIds(allIds);
    try {
      window.localStorage.setItem(`noqbas_seen_notifs_${effectiveUid}`, JSON.stringify(allIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [effectiveUid, userNotifications]);

  // Booking Persistence with Rollback on Error
  const persistBooking = useCallback(
    async (booking: BookingRequest): Promise<void> => {
      setBookingError('');
      const providerVisible =
        typeof booking.providerVisible === 'boolean'
          ? booking.providerVisible
          : booking.paymentMethod !== 'instapay';
      const resolvedVillageId = booking.villageId || activeVillage.id;
      const withOwner: BookingRequest = effectiveUid
        ? {
            ...booking,
            villageId: resolvedVillageId,
            ownerId: booking.ownerId || effectiveUid,
            providerVisible,
            settlementStatus: booking.settlementStatus || 'pending'
          }
        : {
            ...booking,
            villageId: resolvedVillageId,
            providerVisible,
            settlementStatus: booking.settlementStatus || 'pending'
          };

      setBookings((prev) => [withOwner, ...prev]);

      if (firebaseUser) {
        try {
          const payload: Record<string, unknown> = {
            ownerId: firebaseUser.uid,
            villageId: resolvedVillageId,
            serviceType: booking.serviceType,
            title: booking.title.slice(0, 160),
            providerName: booking.providerName.slice(0, 100),
            customerName: booking.customerName.slice(0, 80),
            customerPhone: booking.customerPhone.slice(0, 30),
            status: booking.status,
            providerVisible,
            settlementStatus: booking.settlementStatus || 'pending',
            createdAt: serverTimestamp()
          };
          if (booking.providerOwnerId) payload.providerOwnerId = booking.providerOwnerId.slice(0, 128);
          if (booking.address) payload.address = booking.address.slice(0, 160);
          if (typeof booking.distanceKm === 'number') payload.distanceKm = booking.distanceKm;
          if (typeof booking.deliveryFeeEgp === 'number') payload.deliveryFeeEgp = booking.deliveryFeeEgp;
          if (typeof booking.codFeeEgp === 'number') payload.codFeeEgp = booking.codFeeEgp;
          if (typeof booking.subtotalEgp === 'number') payload.subtotalEgp = booking.subtotalEgp;
          if (typeof booking.totalAmountEgp === 'number') payload.totalAmountEgp = booking.totalAmountEgp;
          if (booking.date) payload.date = booking.date.slice(0, 40);
          if (booking.time) payload.time = booking.time.slice(0, 40);
          if (booking.notes) payload.notes = booking.notes.slice(0, 400);
          if (booking.itemsSummary) payload.itemsSummary = booking.itemsSummary.slice(0, 400);
          if (booking.paymentMethod) payload.paymentMethod = booking.paymentMethod;
          if (booking.paymentStatus) payload.paymentStatus = booking.paymentStatus;
          if (booking.transactionRef) payload.transactionRef = booking.transactionRef.slice(0, 60);
          if (booking.instaPaySender) payload.instaPaySender = booking.instaPaySender.slice(0, 60);
          if (booking.instaPayCustomerRef) {
            payload.instaPayCustomerRef = booking.instaPayCustomerRef.slice(0, 60);
          }
          if (booking.paymentVerifiedAt) {
            payload.paymentVerifiedAt = booking.paymentVerifiedAt.slice(0, 40);
          }
          if (booking.deliveryConfirmedRef) {
            payload.deliveryConfirmedRef = booking.deliveryConfirmedRef.slice(0, 60);
          }
          if (booking.deliveryConfirmedAt) {
            payload.deliveryConfirmedAt = booking.deliveryConfirmedAt.slice(0, 40);
          }

          await setDoc(doc(db, 'bookings', booking.id), payload);
        } catch (err) {
          setBookings((prev) => prev.filter((b) => b.id !== withOwner.id));
          try {
            handleFirestoreError(err, OperationType.CREATE, `bookings/${booking.id}`);
          } catch {
            // Diagnostic logged via handleFirestoreError
          }
          const friendlyMsg =
            lang === 'ar'
              ? 'تعذر حفظ الطلب في قاعدة البيانات. تأكد من اتصالك بالإنترنت وتأكيد بريدك/هاتفك وحاول مرة أخرى.'
              : 'Failed to save booking to the database. Please check your connection and account verification, then try again.';
          setBookingError(friendlyMsg);
          throw new Error(friendlyMsg, { cause: err });
        }
      }
    },
    [activeVillage.id, effectiveUid, firebaseUser, lang]
  );

  const handleUpdateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: BookingStatus,
      deliveryMeta?: { deliveryConfirmedRef: string; deliveryConfirmedAt: string }
    ) => {
      const previousBooking = bookings.find((b) => b.id === orderId);
      setBookingError('');
      setBookings((prev) =>
        prev.map((b) =>
          b.id === orderId
            ? {
                ...b,
                status: newStatus,
                ...(deliveryMeta
                  ? {
                      deliveryConfirmedRef: deliveryMeta.deliveryConfirmedRef,
                      deliveryConfirmedAt: deliveryMeta.deliveryConfirmedAt
                    }
                  : {})
              }
            : b
        )
      );
      if (firebaseUser && !orderId.startsWith('book-demo-')) {
        try {
          await updateDoc(doc(db, 'bookings', orderId), {
            status: newStatus,
            ...(deliveryMeta
              ? {
                  deliveryConfirmedRef: deliveryMeta.deliveryConfirmedRef.slice(0, 60),
                  deliveryConfirmedAt: deliveryMeta.deliveryConfirmedAt.slice(0, 40)
                }
              : {})
          });
        } catch (err) {
          if (previousBooking) {
            setBookings((prev) => prev.map((b) => (b.id === orderId ? previousBooking : b)));
          }
          setBookingError(
            lang === 'ar'
              ? 'تعذر تحديث حالة الطلب في قاعدة البيانات. تم استرجاع الحالة السابقة.'
              : 'Failed to update order status in database. Reverted to previous status.'
          );
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${orderId}`);
        }
      }
    },
    [bookings, firebaseUser, lang]
  );

  const handleVerifyInstaPayPayment = useCallback(
    async (orderId: string, decision: 'approve' | 'reject') => {
      const verifiedAt = new Date().toISOString().split('T')[0];
      setBookings((prev) =>
        prev.map((b) =>
          b.id === orderId
            ? decision === 'approve'
              ? {
                  ...b,
                  paymentStatus: 'paid',
                  providerVisible: true,
                  paymentVerifiedAt: verifiedAt
                }
              : {
                  ...b,
                  paymentStatus: 'rejected',
                  providerVisible: false,
                  status: 'cancelled'
                }
            : b
        )
      );
      if (firebaseUser && !orderId.startsWith('book-demo-')) {
        try {
          await updateDoc(
            doc(db, 'bookings', orderId),
            decision === 'approve'
              ? {
                  paymentStatus: 'paid',
                  providerVisible: true,
                  paymentVerifiedAt: verifiedAt
                }
              : {
                  paymentStatus: 'rejected',
                  providerVisible: false,
                  status: 'cancelled'
                }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${orderId}`);
        }
      }
    },
    [firebaseUser]
  );

  const handleAssignOrderProvider = useCallback(
    async (orderId: string, providerOwnerId: string, providerName: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === orderId
            ? {
                ...b,
                providerOwnerId: providerOwnerId || undefined,
                providerName: providerName || b.providerName
              }
            : b
        )
      );
      if (firebaseUser && !orderId.startsWith('book-demo-')) {
        try {
          await updateDoc(doc(db, 'bookings', orderId), {
            providerOwnerId: providerOwnerId || '',
            providerName: providerName.slice(0, 100)
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `bookings/${orderId}`);
        }
      }
    },
    [firebaseUser]
  );

  const handleSettleOrders = useCallback(
    async (orderIds: string[]) => {
      if (orderIds.length === 0) return;
      const today = new Date().toISOString().split('T')[0];
      const idSet = new Set(orderIds);
      setBookings((prev) =>
        prev.map((b) =>
          idSet.has(b.id) ? { ...b, settlementStatus: 'settled', settledAt: today } : b
        )
      );
      if (firebaseUser) {
        for (const orderId of orderIds) {
          if (orderId.startsWith('book-demo-')) continue;
          try {
            await updateDoc(doc(db, 'bookings', orderId), {
              settlementStatus: 'settled',
              settledAt: today
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `bookings/${orderId}`);
          }
        }
      }
    },
    [firebaseUser]
  );

  // Cart Persistence & Actions
  const updateCartStateAndStorage = useCallback(
    (updater: (prev: CartItem[]) => CartItem[]) => {
      setCart((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(cartStorageKey, JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        if (firebaseUser && (firebaseUser.emailVerified || firebaseUser.phoneNumber)) {
          setDoc(doc(db, 'carts', firebaseUser.uid), {
            ownerId: firebaseUser.uid,
            villageId: activeVillage.id,
            items: next.slice(0, 50),
            updatedAt: serverTimestamp()
          }).catch((err) => console.warn('Cart sync warning:', err.message));
        }
        return next;
      });
    },
    [cartStorageKey, firebaseUser, activeVillage.id]
  );

  const handleAddToCart = useCallback(
    (item: {
      id: string;
      name: string;
      price: number;
      type: 'food' | 'pharmacy' | 'grocery' | 'farm';
      providerName?: string;
      providerOwnerId?: string;
    }) => {
      if (item.providerOwnerId) {
        const ownerListing = mergedProviders.find(
          (p) => p.ownerId === item.providerOwnerId || p.id === item.providerOwnerId
        );
        if (ownerListing && !evaluateProviderAvailability(ownerListing, nowMs).isOpen) {
          return;
        }
      }
      trackAnalyticsEvent(
        'provider_view',
        item.providerOwnerId || item.id,
        item.providerName || item.name
      );
      requireAuth(() => {
        updateCartStateAndStorage((prev) => {
          const existing = prev.find((i) => i.id === item.id);
          if (existing) {
            return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
          }
          return [...prev, { ...item, quantity: 1 }];
        });
      });
    },
    [mergedProviders, nowMs, trackAnalyticsEvent, requireAuth, updateCartStateAndStorage]
  );

  const handleUpdateCartQuantity = useCallback(
    (id: string, delta: number) => {
      updateCartStateAndStorage((prev) =>
        prev
          .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
          .filter((item) => item.quantity > 0)
      );
    },
    [updateCartStateAndStorage]
  );

  const handleRemoveCartItem = useCallback(
    (id: string) => {
      updateCartStateAndStorage((prev) => prev.filter((i) => i.id !== id));
    },
    [updateCartStateAndStorage]
  );

  const handleClearCart = useCallback(() => {
    updateCartStateAndStorage(() => []);
  }, [updateCartStateAndStorage]);

  const handleProceedToPayment = useCallback(
    (pendingOrder: PendingPaymentOrder) => {
      if (isCurrentUserBanned) return;
      setPendingPayment(pendingOrder);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Ignore scroll error
      }
    },
    [isCurrentUserBanned]
  );

  const handlePaymentCompleted = useCallback(
    async (result: {
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
      transactionRef: string;
      codFeeEgp: number;
      finalTotalAmountEgp: number;
      instaPaySender?: string;
      instaPayCustomerRef?: string;
    }) => {
      if (!pendingPayment) return;

      const prefix =
        pendingPayment.source === 'cart'
          ? 'order'
          : pendingPayment.source === 'prescription'
          ? 'rx'
          : 'book';

      const newBooking: BookingRequest = {
        id: `${prefix}-${Date.now()}`,
        ownerId: effectiveUid || undefined,
        providerOwnerId: pendingPayment.providerOwnerId,
        villageId: activeVillage.id,
        serviceType: pendingPayment.serviceType,
        title: pendingPayment.title,
        providerName: pendingPayment.providerName,
        customerName: pendingPayment.customerName,
        customerPhone: pendingPayment.customerPhone,
        address: pendingPayment.address,
        distanceKm: pendingPayment.distanceKm,
        deliveryFeeEgp: pendingPayment.deliveryFeeEgp,
        codFeeEgp: result.codFeeEgp,
        subtotalEgp: pendingPayment.subtotalEgp,
        totalAmountEgp: result.finalTotalAmountEgp,
        totalAmount: `${result.finalTotalAmountEgp.toFixed(0)} ${t.currency}`,
        date: pendingPayment.date,
        time: pendingPayment.time,
        notes: pendingPayment.notes,
        itemsSummary: pendingPayment.itemsSummary,
        paymentMethod: result.paymentMethod,
        paymentStatus: result.paymentStatus,
        providerVisible: result.paymentMethod !== 'instapay',
        instaPaySender: result.instaPaySender?.slice(0, 60),
        instaPayCustomerRef: result.instaPayCustomerRef?.slice(0, 60),
        transactionRef: result.transactionRef,
        settlementStatus: 'pending',
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      };

      await persistBooking(newBooking);
      if (pendingPayment.source === 'cart') {
        handleClearCart();
      }
      setPendingPayment(null);
      setRecentlyCompletedOrderId(newBooking.id);
      onOrderCompletedOpenTracker(newBooking.id);
    },
    [
      pendingPayment,
      effectiveUid,
      activeVillage.id,
      t.currency,
      persistBooking,
      handleClearCart,
      onOrderCompletedOpenTracker
    ]
  );

  return {
    cart,
    bookings,
    seenNotificationIds,
    pendingPayment,
    setPendingPayment,
    recentlyCompletedOrderId,
    setRecentlyCompletedOrderId,
    bookingError,
    setBookingError,
    userOrders,
    activeOrdersCount,
    providerOrders,
    activeProviderOrdersCount,
    pendingAdminCount,
    userNotifications,
    unreadNotificationsCount,
    handleMarkAllNotificationsRead,
    persistBooking,
    handleUpdateOrderStatus,
    handleVerifyInstaPayPayment,
    handleAssignOrderProvider,
    handleSettleOrders,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveCartItem,
    handleClearCart,
    handleProceedToPayment,
    handlePaymentCompleted
  };
}
