/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  auth,
  db,
  ADMIN_EMAIL
} from './firebase';
import {
  Language,
  VillageConfig,
  VillageColorCode,
  getVillageTheme,
  UserProfile,
  BannedPhoneRecord,
  PlatformPricingConfig,
  ProviderListing,
  VillageAd,
  DoctorService,
  TechnicianService,
  FoodItem,
  PharmacyItem,
  VillageRide,
  GroceryItem,
  TutoringService,
  CharityOrg,
  OtherService,
  BookingRequest,
  ReviewItem,
  DemoTestAccount,
  DEFAULT_VILLAGES,
  DEFAULT_DISTRICTS,
  VILLAGE_DOCTORS,
  VILLAGE_TECHNICIANS,
  VILLAGE_FOOD_ITEMS,
  VILLAGE_PHARMACY_ITEMS,
  VILLAGE_RIDES,
  VILLAGE_GROCERY_ITEMS,
  VILLAGE_TUTORING_SERVICES,
  VILLAGE_CHARITIES,
  VILLAGE_OTHER_SERVICES,
  INITIAL_REVIEWS,
  INITIAL_VILLAGE_ADS,
  TEST_DEMO_ACCOUNTS,
  TEST_DEMO_PROVIDERS,
  TEST_DEMO_BOOKINGS,
  normalizePhone,
  isBanCurrentlyActive
} from './data/villageData';
import { TRANSLATIONS } from './data/translations';

import { VillageHeader } from './components/VillageHeader';
import { VillageHeroBanner } from './components/VillageHeroBanner';
import { DoctorsSection } from './components/ServiceSections/DoctorsSection';
import { TechniciansSection } from './components/ServiceSections/TechniciansSection';
import { FoodSection } from './components/ServiceSections/FoodSection';
import { PharmacySection } from './components/ServiceSections/PharmacySection';
import { VillageRidesSection } from './components/ServiceSections/VillageRidesSection';
import { GrocerySection } from './components/ServiceSections/GrocerySection';
import { TutoringSection } from './components/ServiceSections/TutoringSection';
import { CharitySection } from './components/ServiceSections/CharitySection';
import { OtherServicesSection } from './components/ServiceSections/OtherServicesSection';
import { AdsSection } from './components/ServiceSections/AdsSection';

import { UniversalBookingModal } from './components/Modals/UniversalBookingModal';
import { PrescriptionUploadModal } from './components/Modals/PrescriptionUploadModal';
import { CartModal, CartItem } from './components/Modals/CartModal';
import { EmergencyDirectoryModal } from './components/Modals/EmergencyDirectoryModal';
import { VillageAssistantModal } from './components/Modals/VillageAssistantModal';
import { NotificationsModal, AppNotificationItem } from './components/Modals/NotificationsModal';
import { ReviewModal } from './components/Modals/ReviewModal';
import { ProviderReviewsModal } from './components/Modals/ProviderReviewsModal';
import { AuthModal } from './components/Modals/AuthModal';
import { AdminDashboardModal, DemoUserAdminAction } from './components/Modals/AdminDashboardModal';

import { Briefcase, AlertCircle, Ban, Phone } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firebase Auth & Profile State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [ownPhoneBan, setOwnPhoneBan] = useState<BannedPhoneRecord | null>(null);
  const [promptedPhoneForUid, setPromptedPhoneForUid] = useState<string | null>(null);
  const isAdmin = Boolean(
    firebaseUser?.email === ADMIN_EMAIL && firebaseUser?.emailVerified
  );

  // Test Demo Accounts Session State (2 Test Users + 2 Test Service Providers in Noqbas)
  const [demoUid, setDemoUid] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem('noqbas_demo_uid');
    } catch {
      return null;
    }
  });
  const [demoProfilePatch, setDemoProfilePatch] = useState<Record<string, Partial<DemoTestAccount>>>({});
  const [deletedDemoUids, setDeletedDemoUids] = useState<string[]>([]);
  const [demoProviderStatusMap, setDemoProviderStatusMap] = useState<
    Record<string, 'approved' | 'pending' | 'rejected'>
  >({});

  // Single Village (قرية نقباس) + Platform Pricing State
  const [activeVillage, setActiveVillage] = useState<VillageConfig>(DEFAULT_VILLAGES[0]);
  const [adPricing, setAdPricing] = useState<PlatformPricingConfig>({
    adPriceWeekEgp: 20,
    adPriceMonthEgp: 50
  });
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Firestore Collections State
  const [firestoreProviders, setFirestoreProviders] = useState<ProviderListing[]>([]);
  const [firestoreAds, setFirestoreAds] = useState<VillageAd[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<ReviewItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [bannedPhones, setBannedPhones] = useState<BannedPhoneRecord[]>([]);

  // Village Base Data State
  const [localDoctors, setLocalDoctors] = useState<DoctorService[]>(VILLAGE_DOCTORS);
  const [localTechnicians, setLocalTechnicians] = useState<TechnicianService[]>(VILLAGE_TECHNICIANS);

  // Per-User Isolated Cart & Bookings
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>(TEST_DEMO_BOOKINGS);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    type: 'doctor' | 'technician' | 'ride' | 'tutoring' | 'charity' | 'other';
    providerName: string;
    title: string;
  }>({ type: 'doctor', providerName: '', title: '' });

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Reviews Modals state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isProviderReviewsModalOpen, setIsProviderReviewsModalOpen] = useState(false);
  const [activeReviewTarget, setActiveReviewTarget] = useState<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    rating: number;
    reviewsCount: number;
  }>({
    id: '',
    name: '',
    role: '',
    avatar: '',
    rating: 5,
    reviewsCount: 0
  });

  // Periodic timer for auto-expiring ads & time-limited phone bans
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setProfileLoaded(false);
      if (user) {
        setDemoUid(null);
        try {
          window.localStorage.removeItem('noqbas_demo_uid');
        } catch {
          // Ignore storage issues
        }
      } else {
        setUserProfile(null);
        setOwnPhoneBan(null);
      }
    });
    return () => unsub();
  }, []);

  const activeDemoAccount = useMemo<DemoTestAccount | null>(() => {
    if (firebaseUser || !demoUid || deletedDemoUids.includes(demoUid)) return null;
    const base = TEST_DEMO_ACCOUNTS.find((a) => a.uid === demoUid);
    if (!base) return null;
    const patch = demoProfilePatch[demoUid] || {};
    const statusOverride = demoProviderStatusMap[demoUid];
    return {
      ...base,
      ...patch,
      providerStatus: statusOverride || patch.providerStatus || base.providerStatus
    };
  }, [firebaseUser, demoUid, deletedDemoUids, demoProfilePatch, demoProviderStatusMap]);

  const effectiveUid = firebaseUser?.uid || activeDemoAccount?.uid || null;
  const effectiveProfile: UserProfile | null = activeDemoAccount || userProfile;
  const isSignedIn = Boolean(firebaseUser || activeDemoAccount);

  const handleLoginDemoAccount = (account: DemoTestAccount) => {
    if (firebaseUser) {
      signOut(auth).catch(() => {});
    }
    setDemoProfilePatch((prev) => ({
      ...prev,
      [account.uid]: {
        ...(prev[account.uid] || {}),
        displayName: account.displayName,
        address: account.address,
        neighborhood: account.neighborhood,
        photoUrl: account.photoUrl,
        serviceTitle: account.serviceTitle,
        serviceFeeEgp: account.serviceFeeEgp,
        serviceBio: account.serviceBio
      }
    }));
    setDemoUid(account.uid);
    try {
      window.localStorage.setItem('noqbas_demo_uid', account.uid);
    } catch {
      // Ignore storage errors
    }
  };

  const handleLogoutDemoAccount = () => {
    setDemoUid(null);
    try {
      window.localStorage.removeItem('noqbas_demo_uid');
    } catch {
      // Ignore storage errors
    }
  };

  // 2. Active User Profile Listener
  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setProfileLoaded(true);
      },
      (err) => {
        console.warn('User profile listener skipped:', err.message);
        setProfileLoaded(true);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  // 2b. Check Ban status on the signed-in user's normalized phone number
  useEffect(() => {
    if (!firebaseUser || !userProfile?.phone) {
      setOwnPhoneBan(null);
      return;
    }
    const normalized = normalizePhone(userProfile.phone);
    if (normalized.length < 8) {
      setOwnPhoneBan(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'bannedPhones', normalized),
      (snap) => {
        if (snap.exists()) {
          setOwnPhoneBan(snap.data() as BannedPhoneRecord);
        } else {
          setOwnPhoneBan(null);
        }
      },
      () => setOwnPhoneBan(null)
    );
    return () => unsub();
  }, [firebaseUser?.uid, userProfile?.phone]);

  // 2c. Prompt signed-in user once if they haven't linked a mobile phone yet
  useEffect(() => {
    if (
      firebaseUser &&
      profileLoaded &&
      !isAdmin &&
      !isAuthModalOpen &&
      (!userProfile || !userProfile.phone) &&
      promptedPhoneForUid !== firebaseUser.uid
    ) {
      setPromptedPhoneForUid(firebaseUser.uid);
      openAuthModal('register');
    }
  }, [firebaseUser, profileLoaded, isAdmin, isAuthModalOpen, userProfile, promptedPhoneForUid]);

  // 2d. Per-User Isolated Cart Listener (Firestore /carts/{uid} + UID-scoped localStorage)
  const cartStorageKey = effectiveUid ? `noqbas_cart_${effectiveUid}` : 'noqbas_cart_guest';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart(Array.isArray(parsed) ? parsed : []);
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
  }, [firebaseUser?.uid, cartStorageKey]);

  // 2e. Admin-only Users & Banned Phones Listeners
  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      setBannedPhones([]);
      return;
    }
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id })));
      },
      (err) => console.warn('Admin users listener warning:', err.message)
    );
    const unsubBans = onSnapshot(
      collection(db, 'bannedPhones'),
      (snap) => {
        setBannedPhones(snap.docs.map((d) => d.data() as BannedPhoneRecord));
      },
      (err) => console.warn('Admin bannedPhones listener warning:', err.message)
    );
    return () => {
      unsubUsers();
      unsubBans();
    };
  }, [isAdmin]);

  // 3. Single Village (قرية نقباس) + Ad Pricing Listener
  useEffect(() => {
    const unsubVillage = onSnapshot(
      doc(db, 'villages', 'noqbas'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<VillageConfig>;
          setActiveVillage({
            ...DEFAULT_VILLAGES[0],
            id: 'noqbas',
            nameAr: 'قرية نقباس',
            nameEn: 'Noqbas Village',
            governorateAr: data.governorateAr || DEFAULT_VILLAGES[0].governorateAr,
            governorateEn: data.governorateEn || DEFAULT_VILLAGES[0].governorateEn,
            descriptionAr: (data.descriptionAr || DEFAULT_VILLAGES[0].descriptionAr).replace(/ىقباس/g, 'نقباس'),
            descriptionEn: data.descriptionEn || DEFAULT_VILLAGES[0].descriptionEn,
            baseDeliveryFeeEgp: Number(data.baseDeliveryFeeEgp ?? DEFAULT_VILLAGES[0].baseDeliveryFeeEgp),
            perKmFeeEgp: Number(data.perKmFeeEgp ?? DEFAULT_VILLAGES[0].perKmFeeEgp),
            colorCode: (data.colorCode as VillageColorCode) || DEFAULT_VILLAGES[0].colorCode,
            logoIcon: data.logoIcon || DEFAULT_VILLAGES[0].logoIcon || 'wheat',
            logoUrl: data.logoUrl || '',
            isActive: true,
            districts: data.districts || DEFAULT_DISTRICTS
          });
        }
      },
      (err) => {
        console.warn('Noqbas village listener warning:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'appConfig', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as {
            adPriceWeekEgp?: number;
            adPriceMonthEgp?: number;
          };
          if (typeof data.adPriceWeekEgp === 'number' || typeof data.adPriceMonthEgp === 'number') {
            setAdPricing({
              adPriceWeekEgp: typeof data.adPriceWeekEgp === 'number' ? data.adPriceWeekEgp : 20,
              adPriceMonthEgp: typeof data.adPriceMonthEgp === 'number' ? data.adPriceMonthEgp : 50
            });
          }
        }
      },
      (err) => {
        console.warn('Settings listener warning:', err.message);
      }
    );

    return () => {
      unsubVillage();
      unsubSettings();
    };
  }, []);

  // 4. Service Providers Directory Listener (Respects firestore.rules list rules)
  useEffect(() => {
    if (isAdmin) {
      const unsubAll = onSnapshot(
        collection(db, 'providers'),
        (snap) => {
          setFirestoreProviders(
            snap.docs.map((d) => ({ ...(d.data() as ProviderListing), id: d.id }))
          );
        },
        (err) => console.warn('Admin providers listener warning:', err.message)
      );
      return () => unsubAll();
    }

    const approvedQuery = query(
      collection(db, 'providers'),
      where('status', '==', 'approved')
    );
    let approvedList: ProviderListing[] = [];
    let ownListing: ProviderListing | null = null;

    const syncCombined = () => {
      const map = new Map<string, ProviderListing>();
      approvedList.forEach((p) => map.set(p.id, p));
      if (ownListing) map.set(ownListing.id, ownListing);
      setFirestoreProviders(Array.from(map.values()));
    };

    const unsubApproved = onSnapshot(
      approvedQuery,
      (snap) => {
        approvedList = snap.docs.map((d) => ({ ...(d.data() as ProviderListing), id: d.id }));
        syncCombined();
      },
      (err) => console.warn('Providers listener warning:', err.message)
    );

    let unsubOwn: (() => void) | null = null;
    if (firebaseUser) {
      unsubOwn = onSnapshot(
        doc(db, 'providers', firebaseUser.uid),
        (snap) => {
          ownListing = snap.exists()
            ? ({ ...(snap.data() as ProviderListing), id: snap.id })
            : null;
          syncCombined();
        },
        () => {
          ownListing = null;
        }
      );
    }

    return () => {
      unsubApproved();
      if (unsubOwn) unsubOwn();
    };
  }, [isAdmin, firebaseUser?.uid]);

  // 5. Classified Ads Listener (Respects firestore.rules list rules)
  useEffect(() => {
    if (isAdmin) {
      const unsubAll = onSnapshot(
        collection(db, 'ads'),
        (snap) => {
          setFirestoreAds(
            snap.docs.map((d) => ({ ...(d.data() as VillageAd), id: d.id }))
          );
        },
        (err) => console.warn('Admin ads listener warning:', err.message)
      );
      return () => unsubAll();
    }

    let approvedList: VillageAd[] = [];
    let ownList: VillageAd[] = [];

    const syncAds = () => {
      const map = new Map<string, VillageAd>();
      approvedList.forEach((a) => map.set(a.id, a));
      ownList.forEach((a) => map.set(a.id, a));
      setFirestoreAds(Array.from(map.values()));
    };

    const unsubApproved = onSnapshot(
      query(collection(db, 'ads'), where('status', '==', 'approved')),
      (snap) => {
        approvedList = snap.docs.map((d) => ({ ...(d.data() as VillageAd), id: d.id }));
        syncAds();
      },
      (err) => console.warn('Approved ads listener warning:', err.message)
    );

    let unsubOwn: (() => void) | null = null;
    if (firebaseUser) {
      unsubOwn = onSnapshot(
        query(collection(db, 'ads'), where('ownerId', '==', firebaseUser.uid)),
        (snap) => {
          ownList = snap.docs.map((d) => ({ ...(d.data() as VillageAd), id: d.id }));
          syncAds();
        },
        (err) => console.warn('Own ads listener warning:', err.message)
      );
    }

    return () => {
      unsubApproved();
      if (unsubOwn) unsubOwn();
    };
  }, [isAdmin, firebaseUser?.uid]);

  // 6. Reviews Listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const mapped: ReviewItem[] = snap.docs.map((d) => {
          const data = d.data() as {
            targetId: string;
            villageId?: string;
            author: string;
            neighborhood?: string;
            rating: number;
            date: string;
            comment: string;
            isVerifiedResident: boolean;
          };
          const nb = data.neighborhood || 'وسط البلد';
          return {
            id: d.id,
            targetId: data.targetId,
            villageId: data.villageId,
            author: data.author,
            neighborhood: { ar: nb, en: nb },
            rating: Number(data.rating || 5),
            date: data.date || new Date().toISOString().split('T')[0],
            comment: { ar: data.comment || '', en: data.comment || '' },
            isVerifiedResident: data.isVerifiedResident !== false
          };
        });
        setFirestoreReviews(mapped);
      },
      (err) => console.warn('Reviews listener warning:', err.message)
    );
    return () => unsub();
  }, []);

  // 7. User Bookings Listener (when signed in via Firebase or Test Account)
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
        if (Array.isArray(parsed)) setSeenNotificationIds(parsed);
      } else {
        setSeenNotificationIds([]);
      }
    } catch {
      setSeenNotificationIds([]);
    }

    if (!firebaseUser) {
      setBookings(TEST_DEMO_BOOKINGS);
      return;
    }

    const qBookings = isAdmin
      ? collection(db, 'bookings')
      : query(collection(db, 'bookings'), where('ownerId', '==', firebaseUser.uid));

    const unsub = onSnapshot(
      qBookings,
      (snap) => {
        if (snap.empty) return;
        const remote: BookingRequest[] = snap.docs.map((d) => {
          const data = d.data() as BookingRequest;
          return {
            ...data,
            id: d.id,
            createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toLocaleDateString()
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
  }, [isAdmin, firebaseUser?.uid, effectiveUid]);

  // Derived color theme for قرية نقباس
  const theme = getVillageTheme(activeVillage.colorCode);

  const isCurrentUserBanned = useMemo(
    () =>
      !isAdmin &&
      (isBanCurrentlyActive(effectiveProfile?.isBanned, effectiveProfile?.banUntilMs, false, nowMs) ||
        Boolean(
          ownPhoneBan &&
            isBanCurrentlyActive(true, ownPhoneBan.banUntilMs, ownPhoneBan.isPermanent, nowMs)
        )),
    [isAdmin, effectiveProfile, ownPhoneBan, nowMs]
  );

  // Merge Firestore + Demo Test Accounts (2 Test Users + 2 Test Service Providers)
  const mergedUsers = useMemo<UserProfile[]>(() => {
    const map = new Map<string, UserProfile>();
    allUsers.forEach((u) => map.set(u.uid, u));
    TEST_DEMO_ACCOUNTS.forEach((acc) => {
      if (deletedDemoUids.includes(acc.uid)) return;
      if (!map.has(acc.uid)) {
        const patch = demoProfilePatch[acc.uid] || {};
        const statusOverride = demoProviderStatusMap[acc.uid];
        map.set(acc.uid, {
          ...acc,
          ...patch,
          providerStatus: statusOverride || patch.providerStatus || acc.providerStatus
        });
      }
    });
    return Array.from(map.values());
  }, [allUsers, deletedDemoUids, demoProfilePatch, demoProviderStatusMap]);

  const mergedProviders = useMemo<ProviderListing[]>(() => {
    const map = new Map<string, ProviderListing>();
    firestoreProviders.forEach((p) => map.set(p.id, p));
    TEST_DEMO_PROVIDERS.forEach((p) => {
      if (deletedDemoUids.includes(p.ownerId)) return;
      if (!map.has(p.id)) {
        const patch = demoProfilePatch[p.ownerId] || {};
        map.set(p.id, {
          ...p,
          nameAr: patch.displayName || p.nameAr,
          nameEn: patch.displayName || p.nameEn,
          status: demoProviderStatusMap[p.id] || p.status
        });
      }
    });
    return Array.from(map.values());
  }, [firestoreProviders, deletedDemoUids, demoProfilePatch, demoProviderStatusMap]);

  const mergedBannedPhones = useMemo<BannedPhoneRecord[]>(() => {
    const map = new Map<string, BannedPhoneRecord>();
    bannedPhones.forEach((bp) => map.set(bp.phone, bp));
    TEST_DEMO_ACCOUNTS.forEach((acc) => {
      if (deletedDemoUids.includes(acc.uid)) return;
      const patch = demoProfilePatch[acc.uid];
      if (patch?.isBanned) {
        const norm = normalizePhone(acc.phone);
        map.set(norm, {
          phone: norm,
          userId: acc.uid,
          userName: patch.displayName || acc.displayName,
          reason: patch.banReason || '',
          banUntilMs: patch.banUntilMs || 0,
          isPermanent: !patch.banUntilMs
        });
      }
    });
    return Array.from(map.values());
  }, [bannedPhones, deletedDemoUids, demoProfilePatch]);

  const handleDemoUserAction = (action: DemoUserAdminAction) => {
    if (action.type === 'ban') {
      setDemoProfilePatch((prev) => ({
        ...prev,
        [action.uid]: {
          ...(prev[action.uid] || {}),
          isBanned: true,
          banUntilMs: action.isPermanent ? 0 : action.banUntilMs,
          banReason: action.reason
        }
      }));
    } else if (action.type === 'unban') {
      setDemoProfilePatch((prev) => ({
        ...prev,
        [action.uid]: {
          ...(prev[action.uid] || {}),
          isBanned: false,
          banUntilMs: 0,
          banReason: ''
        }
      }));
    } else if (action.type === 'delete') {
      setDeletedDemoUids((prev) => (prev.includes(action.uid) ? prev : [...prev, action.uid]));
      if (demoUid === action.uid) {
        handleLogoutDemoAccount();
      }
    }
  };

  const handleDemoProviderDecision = (providerId: string, decision: 'approved' | 'rejected') => {
    setDemoProviderStatusMap((prev) => ({ ...prev, [providerId]: decision }));
  };

  // Merge Firestore reviews + Initial reviews
  const reviews = useMemo(() => {
    const map = new Map<string, ReviewItem>();
    firestoreReviews.forEach((r) => map.set(r.id, r));
    INITIAL_REVIEWS.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [firestoreReviews]);

  // Merge approved custom providers into section arrays
  const approvedProviders = useMemo(
    () => mergedProviders.filter((p) => p.status === 'approved'),
    [mergedProviders]
  );

  const allDoctors = useMemo<DoctorService[]>(() => {
    const customDocs: DoctorService[] = approvedProviders
      .filter((p) => p.category === 'doctor')
      .map((p) => ({
        id: `prov-${p.id}`,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        specialty: { ar: p.specialtyAr, en: p.specialtyEn },
        clinicName: { ar: `عيادة ${p.nameAr}`, en: `${p.nameEn} Clinic` },
        phone: p.phone,
        location: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        rating: 5.0,
        reviewsCount: 1,
        availableDays: { ar: 'مواعيد يومية بالحجز', en: 'Daily by appointment' },
        fee: { ar: p.priceLabelAr || '100 ج.م', en: p.priceLabelEn || '100 EGP' },
        supportsHomeVisit: true,
        avatar: '/src/assets/images/doctor_marcus_vance_1794474296129.jpg'
      }));
    return [...customDocs, ...localDoctors];
  }, [approvedProviders, localDoctors]);

  const allTechnicians = useMemo<TechnicianService[]>(() => {
    const customTechs: TechnicianService[] = approvedProviders
      .filter((p) => p.category === 'technician')
      .map((p) => ({
        id: `prov-${p.id}`,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        craft: { ar: p.specialtyAr, en: p.specialtyEn },
        category: 'electrician',
        phone: p.phone,
        whatsapp: p.phone.startsWith('0') ? `2${p.phone}` : p.phone,
        rating: 5.0,
        reviewsCount: 1,
        experienceYears: 5,
        hourlyRate: { ar: p.priceLabelAr || '70 ج.م / زيارة', en: p.priceLabelEn || '70 EGP / Visit' },
        neighborhood: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
        bio: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn }
      }));
    return [...customTechs, ...localTechnicians];
  }, [approvedProviders, localTechnicians]);

  const allFoods = useMemo<FoodItem[]>(() => {
    const customFoods: FoodItem[] = approvedProviders
      .filter((p) => p.category === 'food')
      .map((p) => {
        const numeric = parseFloat((p.priceLabelAr || '100').replace(/[^\d.]/g, '')) || 100;
        return {
          id: `prov-food-${p.id}`,
          villageId: p.villageId,
          name: { ar: p.specialtyAr, en: p.specialtyEn },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          price: numeric,
          currency: { ar: 'ج.م', en: 'EGP' },
          category: 'traditional',
          restaurantName: { ar: p.nameAr, en: p.nameEn },
          image: '/src/assets/images/village_fresh_food_bakery_1794475356032.jpg'
        };
      });
    return [...customFoods, ...VILLAGE_FOOD_ITEMS];
  }, [approvedProviders]);

  const allPharmacy = useMemo<PharmacyItem[]>(() => {
    const customPh: PharmacyItem[] = approvedProviders
      .filter((p) => p.category === 'pharmacy')
      .map((p) => {
        const numeric = parseFloat((p.priceLabelAr || '50').replace(/[^\d.]/g, '')) || 50;
        return {
          id: `prov-ph-${p.id}`,
          villageId: p.villageId,
          name: { ar: `${p.nameAr} - ${p.specialtyAr}`, en: `${p.nameEn} - ${p.specialtyEn}` },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          category: 'firstaid',
          price: numeric,
          currency: { ar: 'ج.م', en: 'EGP' },
          inStock: true,
          requiresPrescription: false
        };
      });
    return [...customPh, ...VILLAGE_PHARMACY_ITEMS];
  }, [approvedProviders]);

  const allGrocery = useMemo<GroceryItem[]>(() => {
    const customGrocery: GroceryItem[] = approvedProviders
      .filter((p) => p.category === 'grocery' || p.category === 'farm')
      .map((p) => {
        const numeric = parseFloat((p.priceLabelAr || '95').replace(/[^\d.]/g, '')) || 95;
        return {
          id: `prov-groc-${p.id}`,
          villageId: p.villageId,
          name: { ar: p.specialtyAr, en: p.specialtyEn },
          storeName: { ar: p.nameAr, en: p.nameEn },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          category: 'staples',
          price: numeric,
          unit: { ar: 'طلب / وحدة', en: '1 Unit' },
          currency: { ar: 'ج.م', en: 'EGP' }
        };
      });
    return [...customGrocery, ...VILLAGE_GROCERY_ITEMS];
  }, [approvedProviders]);

  const allTutors = useMemo<TutoringService[]>(() => {
    const customTutors: TutoringService[] = approvedProviders
      .filter((p) => p.category === 'tutoring')
      .map((p) => ({
        id: `prov-tut-${p.id}`,
        villageId: p.villageId,
        teacherName: { ar: p.nameAr, en: p.nameEn },
        subject: { ar: p.specialtyAr, en: p.specialtyEn },
        category: 'math',
        grades: { ar: 'جميع المراحل الدراسية', en: 'All Grade Levels' },
        feePerSession: { ar: p.priceLabelAr || '70 ج.م / حصة', en: p.priceLabelEn || '70 EGP / Session' },
        schedule: { ar: 'مواعيد مرنة بالحجز', en: 'Flexible Schedule' },
        location: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        phone: p.phone,
        mode: { ar: p.bioAr || 'مجموعات أو دروس خاصة', en: p.bioEn || 'Small groups or private' }
      }));
    return [...customTutors, ...VILLAGE_TUTORING_SERVICES];
  }, [approvedProviders]);

  const allCharities = useMemo<CharityOrg[]>(() => {
    const customCharities: CharityOrg[] = approvedProviders
      .filter((p) => p.category === 'charity')
      .map((p) => ({
        id: `prov-char-${p.id}`,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        focus: { ar: p.specialtyAr, en: p.specialtyEn },
        activeCampaign: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
        address: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        phone: p.phone,
        donationExample: { ar: p.priceLabelAr || 'مساهمة مفتوحة أو تطوع', en: p.priceLabelEn || 'Any contribution or volunteer' }
      }));
    return [...customCharities, ...VILLAGE_CHARITIES];
  }, [approvedProviders]);

  const allRides = useMemo<VillageRide[]>(() => {
    const customRides: VillageRide[] = approvedProviders
      .filter((p) => p.category === 'ride')
      .map((p) => ({
        id: `prov-ride-${p.id}`,
        villageId: p.villageId,
        driverName: { ar: p.nameAr, en: p.nameEn },
        from: { ar: p.neighborhoodAr || 'موقف القرية', en: p.neighborhoodEn || 'Village Square' },
        to: { ar: p.specialtyAr, en: p.specialtyEn },
        departureTime: '08:00 AM',
        availableSeats: 3,
        pricePerSeat: { ar: p.priceLabelAr || '25 ج.م', en: p.priceLabelEn || '25 EGP' },
        carModel: p.bioAr || 'سيارة ملاكي',
        phone: p.phone
      }));
    return [...customRides, ...VILLAGE_RIDES];
  }, [approvedProviders]);

  const allOtherServices = useMemo<OtherService[]>(() => {
    const customOthers: OtherService[] = approvedProviders
      .filter((p) => p.category === 'other')
      .map((p) => ({
        id: `prov-oth-${p.id}`,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        activityType: { ar: p.specialtyAr, en: p.specialtyEn },
        description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
        address: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        priceLabel: { ar: p.priceLabelAr || 'حسب الاتفاق', en: p.priceLabelEn || 'By agreement' },
        hours: { ar: 'يومياً حسب الاتفاق', en: 'Daily by appointment' },
        phone: p.phone
      }));
    return [...customOthers, ...VILLAGE_OTHER_SERVICES];
  }, [approvedProviders]);

  // Merge Firestore Ads + Seed Ads
  const allAds = useMemo<VillageAd[]>(() => {
    const map = new Map<string, VillageAd>();
    firestoreAds.forEach((a) => map.set(a.id, a));
    INITIAL_VILLAGE_ADS.forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  }, [firestoreAds]);

  const pendingAdminCount = useMemo(
    () =>
      mergedProviders.filter((p) => p.status === 'pending').length +
      firestoreAds.filter((a) => a.status === 'pending').length,
    [mergedProviders, firestoreAds]
  );

  // Live Notifications for Signed-In User
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
          title: lang === 'ar' ? `طلبات مقدمي خدمة جديدة (${pendingProv})` : `${pendingProv} Pending Provider Request(s)`,
          body: lang === 'ar'
            ? 'فيه مقدمي خدمة جداد مستنيين موافقتك من لوحة الأدمن عشان يظهروا للناس.'
            : 'New service provider applications await your review in the Admin Panel.'
        });
      }
      if (pendingAds > 0) {
        list.push({
          id: `admin-ads-${pendingAds}`,
          type: 'admin',
          tone: 'warning',
          title: lang === 'ar' ? `إعلانات بانتظار المراجعة (${pendingAds})` : `${pendingAds} Pending Ad(s)`,
          body: lang === 'ar'
            ? 'فيه إعلانات جديدة مستنية موافقتك في لوحة الأدمن.'
            : 'New submitted ads await your approval in the Admin Panel.'
        });
      }
    }

    if (isCurrentUserBanned) {
      list.push({
        id: `ban-${ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs || 'perm'}`,
        type: 'ban',
        tone: 'danger',
        title: lang === 'ar' ? 'الحساب محظور حالياً' : 'Account Currently Restricted',
        body: lang === 'ar'
          ? 'حسابك محظور مؤقتاً أو دائماً من تقديم طلبات جديدة.'
          : 'Your account is restricted from submitting new requests.'
      });
    } else if (!activeDemoAccount && profileLoaded && !isAdmin && (!userProfile || !userProfile.phone)) {
      list.push({
        id: 'complete-profile-reminder',
        type: 'account',
        tone: 'warning',
        title: lang === 'ar' ? 'استكمال بيانات الحساب' : 'Complete Your Profile',
        body: lang === 'ar'
          ? 'كمل بياناتك (الاسم ورقم الموبايل والعنوان) لتفعيل كل خدمات المنصة.'
          : 'Add your name, mobile number, and address to unlock all services.'
      });
    }

    if (effectiveProfile?.role === 'provider') {
      if (effectiveProfile.providerStatus === 'approved') {
        list.push({
          id: 'prov-status-approved',
          type: 'provider',
          tone: 'success',
          title: lang === 'ar' ? 'تم تفعيل حسابك كمقدم خدمة' : 'Provider Account Approved',
          body: lang === 'ar'
            ? 'مبروك! نشاطك ظاهر دلوقتي لكل أهالي قرية نقباس.'
            : 'Your service profile is now live across Noqbas Village.'
        });
      } else if (effectiveProfile.providerStatus === 'pending') {
        list.push({
          id: 'prov-status-pending',
          type: 'provider',
          tone: 'warning',
          title: lang === 'ar' ? 'طلب مقدم الخدمة قيد المراجعة' : 'Provider Application Under Review',
          body: lang === 'ar'
            ? 'الأدمن بيراجع بياناتك وهيتفعل حسابك قريب.'
            : 'Admin is reviewing your provider application.'
        });
      } else if (effectiveProfile.providerStatus === 'rejected') {
        list.push({
          id: 'prov-status-rejected',
          type: 'provider',
          tone: 'danger',
          title: lang === 'ar' ? 'تم رفض طلب مقدم الخدمة' : 'Provider Application Declined',
          body: lang === 'ar'
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
          tone: ad.status === 'approved' ? 'success' : ad.status === 'rejected' ? 'danger' : 'warning',
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
      .filter((b) => b.ownerId === effectiveUid || normalizePhone(b.customerPhone) === normalizePhone(effectiveProfile?.phone || ''))
      .forEach((b) => {
        list.push({
          id: `booking-${b.id}`,
          type: 'booking',
          tone: 'success',
          title: b.title,
          body: `${b.providerName}${b.totalAmountEgp ? ` · ${b.totalAmountEgp} ${lang === 'ar' ? 'ج.م' : 'EGP'}` : ''}`,
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
    allAds,
    bookings,
    lang
  ]);

  const unreadNotificationsCount = useMemo(
    () => userNotifications.filter((n) => !seenNotificationIds.includes(n.id)).length,
    [userNotifications, seenNotificationIds]
  );

  const handleMarkAllNotificationsRead = () => {
    if (!effectiveUid) return;
    const allIds = userNotifications.map((n) => n.id);
    setSeenNotificationIds(allIds);
    try {
      window.localStorage.setItem(`noqbas_seen_notifs_${effectiveUid}`, JSON.stringify(allIds));
    } catch {
      // Ignore storage quota errors
    }
  };

  // Save Booking to Firestore (when real Firebase user signed in) + Local State
  const persistBooking = async (booking: BookingRequest) => {
    const withOwner: BookingRequest = effectiveUid
      ? { ...booking, ownerId: booking.ownerId || effectiveUid }
      : booking;
    setBookings((prev) => [withOwner, ...prev]);
    if (firebaseUser) {
      try {
        const payload: Record<string, unknown> = {
          ownerId: firebaseUser.uid,
          villageId: 'noqbas',
          serviceType: booking.serviceType,
          title: booking.title.slice(0, 160),
          providerName: booking.providerName.slice(0, 100),
          customerName: booking.customerName.slice(0, 80),
          customerPhone: booking.customerPhone.slice(0, 30),
          status: booking.status,
          createdAt: serverTimestamp()
        };
        if (booking.address) payload.address = booking.address.slice(0, 160);
        if (typeof booking.distanceKm === 'number') payload.distanceKm = booking.distanceKm;
        if (typeof booking.deliveryFeeEgp === 'number') payload.deliveryFeeEgp = booking.deliveryFeeEgp;
        if (typeof booking.totalAmountEgp === 'number') payload.totalAmountEgp = booking.totalAmountEgp;
        if (booking.date) payload.date = booking.date.slice(0, 40);
        if (booking.time) payload.time = booking.time.slice(0, 40);
        if (booking.notes) payload.notes = booking.notes.slice(0, 400);

        await setDoc(doc(db, 'bookings', booking.id), payload);
      } catch (err) {
        console.warn('Firestore booking save warning:', err);
      }
    }
  };

  // Review Handlers
  const handleOpenReviewsModal = (
    targetId: string,
    name: string,
    role: string,
    avatar: string,
    rating: number,
    reviewsCount: number
  ) => {
    setActiveReviewTarget({
      id: targetId,
      name,
      role,
      avatar,
      rating,
      reviewsCount
    });
    setIsProviderReviewsModalOpen(true);
  };

  const handleOpenAddReviewModal = (targetId: string, name: string, role: string) => {
    requireAuth(() => {
      const docItem = allDoctors.find((d) => d.id === targetId);
      const tech = allTechnicians.find((tItem) => tItem.id === targetId);
      setActiveReviewTarget({
        id: targetId,
        name,
        role,
        avatar: docItem?.avatar || tech?.avatar || '',
        rating: docItem?.rating || tech?.rating || 5,
        reviewsCount: docItem?.reviewsCount || tech?.reviewsCount || 0
      });
      setIsReviewModalOpen(true);
    });
  };

  const handleAddReview = async (newReview: ReviewItem) => {
    // Persist to Firestore if signed in
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'reviews', newReview.id), {
          ownerId: firebaseUser.uid,
          targetId: newReview.targetId,
          villageId: activeVillage.id,
          author: newReview.author.slice(0, 80),
          neighborhood: (newReview.neighborhood[lang] || 'وسط البلد').slice(0, 100),
          rating: newReview.rating,
          comment: (newReview.comment[lang] || '').slice(0, 500),
          date: newReview.date.slice(0, 30),
          isVerifiedResident: newReview.isVerifiedResident,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore review save warning:', err);
      }
    } else {
      setFirestoreReviews((prev) => [newReview, ...prev]);
    }

    setLocalDoctors((prev) =>
      prev.map((d) => {
        if (d.id === newReview.targetId) {
          const newCount = d.reviewsCount + 1;
          const newRating = Number(
            ((d.rating * d.reviewsCount + newReview.rating) / newCount).toFixed(1)
          );
          if (activeReviewTarget.id === d.id) {
            setActiveReviewTarget((curr) => ({ ...curr, rating: newRating, reviewsCount: newCount }));
          }
          return { ...d, reviewsCount: newCount, rating: newRating };
        }
        return d;
      })
    );

    setLocalTechnicians((prev) =>
      prev.map((tech) => {
        if (tech.id === newReview.targetId) {
          const newCount = tech.reviewsCount + 1;
          const newRating = Number(
            ((tech.rating * tech.reviewsCount + newReview.rating) / newCount).toFixed(1)
          );
          if (activeReviewTarget.id === tech.id) {
            setActiveReviewTarget((curr) => ({ ...curr, rating: newRating, reviewsCount: newCount }));
          }
          return { ...tech, reviewsCount: newCount, rating: newRating };
        }
        return tech;
      })
    );
  };

  // Sync RTL / LTR direction and document lang
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync dark theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const t = TRANSLATIONS[lang];

  // Per-User Cart Persistence Helper
  const updateCartStateAndStorage = (updater: (prev: CartItem[]) => CartItem[]) => {
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
  };

  // Mandatory Login + Active Account Gate Helper
  const canUsePlatformServices = Boolean(
    isSignedIn && !isCurrentUserBanned && (isAdmin || (effectiveProfile && effectiveProfile.phone))
  );

  const requireAuth = (next: () => void) => {
    if (!isSignedIn) {
      openAuthModal('login');
      return;
    }
    if (!isAdmin && (!effectiveProfile || !effectiveProfile.phone)) {
      openAuthModal('register');
      return;
    }
    if (isCurrentUserBanned) {
      openAuthModal('login');
      return;
    }
    next();
  };

  // Cart actions
  const handleAddToCart = (item: { id: string; name: string; price: number; type: 'food' | 'pharmacy' | 'grocery' | 'farm' }) => {
    requireAuth(() => {
      updateCartStateAndStorage((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    updateCartStateAndStorage((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    updateCartStateAndStorage((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    updateCartStateAndStorage(() => []);
  };

  const handleCheckoutSuccess = (order: {
    name: string;
    phone: string;
    address: string;
    distanceKm: number;
    deliveryFeeEgp: number;
    total: number;
    items: CartItem[];
  }) => {
    if (isCurrentUserBanned) return;
    const newBooking: BookingRequest = {
      id: `order-${Date.now()}`,
      villageId: activeVillage.id,
      serviceType: order.items[0]?.type || 'food',
      title: `${lang === 'ar' ? 'طلب مشتريات وتوصيل منزلي' : 'Village Delivery Order'} (${order.items.length} ${lang === 'ar' ? 'أصناف' : 'items'})`,
      providerName: lang === 'ar' ? `مطابخ ومتاجر ${activeVillage.nameAr}` : `${activeVillage.nameEn} Merchants`,
      customerName: order.name,
      customerPhone: order.phone,
      address: order.address,
      distanceKm: order.distanceKm,
      deliveryFeeEgp: order.deliveryFeeEgp,
      totalAmountEgp: order.total,
      totalAmount: `${order.total.toFixed(0)} ${t.currency}`,
      date: new Date().toLocaleDateString(),
      status: 'confirmed',
      createdAt: new Date().toLocaleDateString()
    };
    persistBooking(newBooking);
  };

  const handlePrescriptionSent = (info: {
    name: string;
    phone: string;
    address: string;
    notes: string;
    distanceKm: number;
    deliveryFeeEgp: number;
  }) => {
    if (isCurrentUserBanned) return;
    const newBooking: BookingRequest = {
      id: `rx-${Date.now()}`,
      villageId: activeVillage.id,
      serviceType: 'pharmacy',
      title: lang === 'ar' ? 'صرف وتوصيل روشتة طبية' : 'Prescription Fulfillment & Delivery',
      providerName: lang === 'ar' ? `صيدلية الشفاء - ${activeVillage.nameAr}` : `Al-Shifa Pharmacy - ${activeVillage.nameEn}`,
      customerName: info.name,
      customerPhone: info.phone,
      address: info.address,
      distanceKm: info.distanceKm,
      deliveryFeeEgp: info.deliveryFeeEgp,
      date: new Date().toLocaleDateString(),
      notes: info.notes,
      status: 'confirmed',
      createdAt: new Date().toLocaleDateString()
    };
    persistBooking(newBooking);
  };

  // Booking Modals
  const guardBannedOrOpenBooking = (next: () => void) => {
    requireAuth(next);
  };

  const handleOpenDoctorBooking = (docItem: DoctorService) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'doctor',
        providerName: docItem.name[lang],
        title: `${t.bookClinicVisit}: ${docItem.specialty[lang]}`
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenTechnicianBooking = (tech: TechnicianService) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'technician',
        providerName: tech.name[lang],
        title: `${t.requestRepair}: ${tech.craft[lang]}`
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenRideBooking = (ride: VillageRide) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'ride',
        providerName: ride.driverName[lang],
        title: `${t.bookSeat} (${ride.from[lang]} -> ${ride.to[lang]})`
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenTutorBooking = (tutor: TutoringService) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'tutoring',
        providerName: tutor.teacherName[lang],
        title: `${t.bookLesson}: ${tutor.subject[lang]}`
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenCharityContact = (org: CharityOrg) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'charity',
        providerName: org.name[lang],
        title: `${t.charityAction}: ${org.activeCampaign[lang]}`
      });
      setIsBookingOpen(true);
    });
  };

  const handleOpenOtherBooking = (svc: OtherService) => {
    guardBannedOrOpenBooking(() => {
      setBookingDetails({
        type: 'other',
        providerName: svc.name[lang],
        title: `${svc.activityType[lang]} - ${svc.name[lang]}`
      });
      setIsBookingOpen(true);
    });
  };

  // Modular Village Scoping + Search Query Filter
  const q = searchQuery.toLowerCase().trim();
  const byVillage = <T extends { villageId?: string }>(items: T[], fallbackToShared = false) => {
    const scoped = items.filter((item) => item.villageId === activeVillage.id);
    if (scoped.length > 0 || !fallbackToShared) return scoped;
    return items;
  };

  const filteredDoctors = byVillage(allDoctors).filter(
    (d) =>
      d.name[lang].toLowerCase().includes(q) ||
      d.specialty[lang].toLowerCase().includes(q) ||
      d.clinicName[lang].toLowerCase().includes(q)
  );

  const filteredTechnicians = byVillage(allTechnicians).filter(
    (tech) =>
      tech.name[lang].toLowerCase().includes(q) ||
      tech.craft[lang].toLowerCase().includes(q) ||
      tech.bio[lang].toLowerCase().includes(q)
  );

  const filteredFoods = byVillage(allFoods, true).filter(
    (f) =>
      f.name[lang].toLowerCase().includes(q) ||
      f.description[lang].toLowerCase().includes(q) ||
      f.restaurantName[lang].toLowerCase().includes(q)
  );

  const filteredPharmacy = byVillage(allPharmacy, true).filter(
    (p) =>
      p.name[lang].toLowerCase().includes(q) ||
      p.description[lang].toLowerCase().includes(q)
  );

  const filteredRides = byVillage(allRides, true).filter(
    (r) =>
      r.driverName[lang].toLowerCase().includes(q) ||
      r.to[lang].toLowerCase().includes(q)
  );

  const filteredGrocery = byVillage(allGrocery, true).filter(
    (g) =>
      g.name[lang].toLowerCase().includes(q) ||
      g.storeName[lang].toLowerCase().includes(q) ||
      g.description[lang].toLowerCase().includes(q)
  );

  const filteredTutors = byVillage(allTutors, true).filter(
    (tut) =>
      tut.teacherName[lang].toLowerCase().includes(q) ||
      tut.subject[lang].toLowerCase().includes(q) ||
      tut.grades[lang].toLowerCase().includes(q)
  );

  const filteredCharities = byVillage(allCharities, true).filter(
    (ch) =>
      ch.name[lang].toLowerCase().includes(q) ||
      ch.focus[lang].toLowerCase().includes(q) ||
      ch.activeCampaign[lang].toLowerCase().includes(q)
  );

  const filteredOtherServices = byVillage(allOtherServices, true).filter(
    (oth) =>
      oth.name[lang].toLowerCase().includes(q) ||
      oth.activityType[lang].toLowerCase().includes(q) ||
      oth.description[lang].toLowerCase().includes(q)
  );

  const activeVillageName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white transition-colors">
      {/* Top Bar Header with Relocated Search */}
      <VillageHeader
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        notificationsCount={unreadNotificationsCount}
        onOpenCart={() => requireAuth(() => setIsCartModalOpen(true))}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenAssistant={() => requireAuth(() => setIsAssistantModalOpen(true))}
        activeVillage={activeVillage}
        isSignedIn={isSignedIn}
        isAdmin={isAdmin}
        userProfile={effectiveProfile}
        userPhotoUrl={effectiveProfile?.photoUrl || ''}
        pendingAdminCount={pendingAdminCount}
        onOpenAuth={() => openAuthModal('login')}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero Space Dedicated to Ads & Offers Showcase (visible across all sections) */}
        <VillageHeroBanner
          lang={lang}
          activeTab={activeTab}
          onSelectCategory={(cat) => {
            setActiveTab(cat);
            setSearchQuery('');
          }}
          activeVillage={activeVillage}
          heroAdsSlot={
            <AdsSection
              ads={allAds}
              lang={lang}
              activeVillageId={activeVillage.id}
              activeVillageName={activeVillageName}
              activeVillage={activeVillage}
              currentUserId={effectiveUid}
              currentUserName={effectiveProfile?.displayName || firebaseUser?.displayName || (lang === 'ar' ? 'معلن من القرية' : 'Village Advertiser')}
              defaultPhone={effectiveProfile?.phone || ''}
              isAdmin={isAdmin}
              isBanned={isCurrentUserBanned}
              adPricing={adPricing}
              nowMs={nowMs}
              canUseServices={canUsePlatformServices}
              onRequireLogin={() => openAuthModal('login')}
            />
          }
        />

        {/* Provider Account Status Notice (Pending / Rejected) */}
        {effectiveProfile?.role === 'provider' && effectiveProfile.providerStatus === 'pending' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'حسابك كمقدم خدمة قيد المراجعة دلوقتي، وهينزل للناس أول ما الأدمن يوافق عليه.'
                  : 'Your service provider application is pending admin approval before appearing publicly.'}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {effectiveProfile?.role === 'provider' && effectiveProfile.providerStatus === 'rejected' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'طلب انضمامك كمقدم خدمة اترفض، تقدر تعدل بياناتك من حسابك وتبعته تاني.'
                  : 'Your provider request was declined. You can update your profile and resubmit.'}
              </span>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {/* Banned Account Notice Banner */}
        {isCurrentUserBanned && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold">
                  {lang === 'ar'
                    ? 'حسابك / رقم موبايلك محظور حالياً من استخدام خدمات المنصة'
                    : 'Your account / mobile phone is currently banned from platform actions'}
                </div>
                <div className="text-[11px] opacity-85">
                  {(ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)
                    ? lang === 'ar'
                      ? `ينتهي الحظر: ${new Date((ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)!).toLocaleString('ar-EG')}`
                      : `Expires: ${new Date((ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs)!).toLocaleString()}`
                    : lang === 'ar'
                    ? 'حظر دائم'
                    : 'Permanent ban'}
                  {(ownPhoneBan?.reason || effectiveProfile?.banReason)
                    ? ` · ${ownPhoneBan?.reason || effectiveProfile?.banReason}`
                    : ''}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
            >
              {t.account}
            </button>
          </div>
        )}

        {/* Mandatory Profile Completion Gate when Phone/Name/Address missing */}
        {firebaseUser && profileLoaded && !isAdmin && !isCurrentUserBanned && (!userProfile || !userProfile.phone) && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
              <Phone className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                {lang === 'ar'
                  ? 'لازم تكمل بيانات حسابك (الاسم ورقم الموبايل والعنوان) عشان تقدر تستفيد من خدمات المنصة.'
                  : 'Please complete your Name, Mobile Phone, and Address to activate platform services.'}
              </span>
            </div>
            <button
              onClick={() => openAuthModal('register')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold cursor-pointer"
            >
              {lang === 'ar' ? 'إكمال بيانات الحساب' : 'Complete Account'}
            </button>
          </div>
        )}

        {/* SECTION ROUTING (10 Core Sections - Free to browse, login required on action) */}

        {(activeTab === 'all' || activeTab === 'doctors') && (
          filteredDoctors.length > 0 ? (
            <DoctorsSection
              doctors={filteredDoctors}
              lang={lang}
              canUseServices={canUsePlatformServices}
              onRequireLogin={() => openAuthModal('login')}
              onBookDoctor={handleOpenDoctorBooking}
              onViewReviews={handleOpenReviewsModal}
              onAddReview={handleOpenAddReviewModal}
            />
          ) : activeTab === 'doctors' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar'
                  ? `لسه مفيش دكاترة معتمدين متضافين في ${activeVillage.nameAr}.`
                  : `No approved doctors registered yet in ${activeVillage.nameEn}.`}
              </p>
              <button
                onClick={() => openAuthModal('register')}
                className={`px-4 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer`}
              >
                {lang === 'ar' ? 'سجل كدكتور أو مقدم خدمة في القرية' : 'Register as a Provider'}
              </button>
            </div>
          ) : null
        )}

        {(activeTab === 'all' || activeTab === 'pharmacy') && filteredPharmacy.length > 0 && (
          <PharmacySection
            items={filteredPharmacy}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onAddToCart={handleAddToCart}
            onOpenUploadPrescription={() => requireAuth(() => setIsPrescriptionModalOpen(true))}
          />
        )}

        {(activeTab === 'all' || activeTab === 'food') && filteredFoods.length > 0 && (
          <FoodSection
            foods={filteredFoods}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onAddToCart={handleAddToCart}
          />
        )}

        {(activeTab === 'all' || activeTab === 'technicians') && (
          filteredTechnicians.length > 0 ? (
            <TechniciansSection
              technicians={filteredTechnicians}
              lang={lang}
              canUseServices={canUsePlatformServices}
              onRequireLogin={() => openAuthModal('login')}
              onRequestTechnician={handleOpenTechnicianBooking}
              onViewReviews={handleOpenReviewsModal}
              onAddReview={handleOpenAddReviewModal}
            />
          ) : activeTab === 'technicians' ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ar'
                  ? `لسه مفيش صنايعية معتمدين متسجلين في ${activeVillage.nameAr}.`
                  : `No approved technicians registered yet in ${activeVillage.nameEn}.`}
              </p>
              <button
                onClick={() => openAuthModal('register')}
                className={`px-4 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold cursor-pointer`}
              >
                {lang === 'ar' ? 'سجل كصنايعي في القرية دي' : 'Register as a Technician'}
              </button>
            </div>
          ) : null
        )}

        {(activeTab === 'all' || activeTab === 'rides') && filteredRides.length > 0 && (
          <VillageRidesSection
            rides={filteredRides}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onBookRide={handleOpenRideBooking}
          />
        )}

        {(activeTab === 'all' || activeTab === 'grocery') && filteredGrocery.length > 0 && (
          <GrocerySection
            items={filteredGrocery}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onAddToCart={handleAddToCart}
          />
        )}

        {(activeTab === 'all' || activeTab === 'tutoring') && filteredTutors.length > 0 && (
          <TutoringSection
            tutors={filteredTutors}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onBookTutor={handleOpenTutorBooking}
          />
        )}

        {(activeTab === 'all' || activeTab === 'charity') && filteredCharities.length > 0 && (
          <CharitySection
            charities={filteredCharities}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onContactCharity={handleOpenCharityContact}
          />
        )}

        {(activeTab === 'all' || activeTab === 'other') && filteredOtherServices.length > 0 && (
          <OtherServicesSection
            items={filteredOtherServices}
            lang={lang}
            canUseServices={canUsePlatformServices}
            onRequireLogin={() => openAuthModal('login')}
            onRequestOther={handleOpenOtherBooking}
          />
        )}
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        initialMode={authModalMode}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        activeDemoAccount={activeDemoAccount}
        onLoginDemoAccount={handleLoginDemoAccount}
        onLogoutDemoAccount={handleLogoutDemoAccount}
        isAdmin={isAdmin}
        isBanned={isCurrentUserBanned}
        banReason={ownPhoneBan?.reason || effectiveProfile?.banReason}
        banUntilMs={ownPhoneBan?.banUntilMs || effectiveProfile?.banUntilMs}
        onProfileSaved={() => {}}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
      />

      {isAdmin && (
        <AdminDashboardModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          lang={lang}
          providers={mergedProviders}
          ads={allAds}
          users={mergedUsers}
          bannedPhones={mergedBannedPhones}
          bookings={bookings}
          reviews={reviews}
          serviceCounts={{
            doctors: allDoctors.length,
            pharmacy: allPharmacy.length,
            food: allFoods.length,
            technicians: allTechnicians.length,
            rides: allRides.length,
            grocery: allGrocery.length,
            tutoring: allTutors.length,
            charity: allCharities.length,
            other: allOtherServices.length
          }}
          activeVillage={activeVillage}
          adPricing={adPricing}
          nowMs={nowMs}
          onVillageUpdated={(updated) => setActiveVillage(updated)}
          onDemoUserAction={handleDemoUserAction}
          onDemoProviderDecision={handleDemoProviderDecision}
        />
      )}

      <UniversalBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType={bookingDetails.type}
        providerName={bookingDetails.providerName}
        serviceTitle={bookingDetails.title}
        lang={lang}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onConfirmBooking={persistBooking}
      />

      <PrescriptionUploadModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        lang={lang}
        activeVillage={activeVillage}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onPrescriptionSent={handlePrescriptionSent}
      />

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        items={cart}
        lang={lang}
        activeVillage={activeVillage}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={effectiveProfile?.phone || ''}
        defaultAddress={effectiveProfile?.address || effectiveProfile?.neighborhood || ''}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleCheckoutSuccess}
      />

      <EmergencyDirectoryModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        lang={lang}
      />

      <VillageAssistantModal
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        lang={lang}
        activeVillageName={activeVillageName}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={userNotifications}
        seenIds={seenNotificationIds}
        onMarkAllRead={handleMarkAllNotificationsRead}
        lang={lang}
      />

      <ProviderReviewsModal
        isOpen={isProviderReviewsModalOpen}
        onClose={() => setIsProviderReviewsModalOpen(false)}
        targetId={activeReviewTarget.id}
        targetName={activeReviewTarget.name}
        targetRole={activeReviewTarget.role}
        targetAvatar={activeReviewTarget.avatar}
        rating={activeReviewTarget.rating}
        reviewsCount={activeReviewTarget.reviewsCount}
        reviews={reviews}
        lang={lang}
        onOpenAddReview={() => {
          setIsProviderReviewsModalOpen(false);
          requireAuth(() => setIsReviewModalOpen(true));
        }}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetId={activeReviewTarget.id}
        targetName={activeReviewTarget.name}
        targetRole={activeReviewTarget.role}
        lang={lang}
        defaultName={effectiveProfile?.displayName || firebaseUser?.displayName || ''}
        onSubmitReview={handleAddReview}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">
              {activeVillageName}
            </span>
            <span>·</span>
            <span>{t.appTagline}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => openAuthModal('login')}
              className="text-slate-700 dark:text-slate-300 font-semibold hover:underline cursor-pointer"
            >
              {isSignedIn ? t.account : t.login}
            </button>
            <span>·</span>
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
            >
              {t.emergency}
            </button>
            <span>·</span>
            <button
              onClick={() => requireAuth(() => setIsAssistantModalOpen(true))}
              className={`${theme.text} font-semibold hover:underline cursor-pointer`}
            >
              {t.aiAssistant}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
