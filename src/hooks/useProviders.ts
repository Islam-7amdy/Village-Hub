import { useState, useEffect, useMemo, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
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
  CharityOrg,
  DemoTestAccount,
  DoctorService,
  FoodItem,
  GroceryItem,
  INITIAL_REVIEWS,
  Language,
  OtherService,
  PharmacyItem,
  ProviderAvailabilityConfig,
  ProviderListing,
  ReviewItem,
  TEST_DEMO_PROVIDERS,
  TechnicianService,
  TutoringService,
  UserProfile,
  VILLAGE_CHARITIES,
  VILLAGE_DOCTORS,
  VILLAGE_FOOD_ITEMS,
  VILLAGE_GROCERY_ITEMS,
  VILLAGE_OTHER_SERVICES,
  VILLAGE_PHARMACY_ITEMS,
  VILLAGE_RIDES,
  VILLAGE_TECHNICIANS,
  VILLAGE_TUTORING_SERVICES,
  VillageRide
} from '../data/villageData';

export interface UseProvidersOptions {
  lang: Language;
  activeVillageId: string;
  firebaseUser: FirebaseUser | null;
  effectiveUid: string | null;
  effectiveProfile: UserProfile | null;
  activeDemoAccount: DemoTestAccount | null;
  isSignedIn: boolean;
  isAdmin: boolean;
  demoProfilePatch: Record<string, Partial<DemoTestAccount>>;
  deletedDemoUids: string[];
  demoProviderStatusMap: Record<string, 'approved' | 'pending' | 'rejected'>;
  markDemoUidDeleted: (uid: string) => void;
  onReviewStatsUpdated?: (targetId: string, rating: number, reviewsCount: number) => void;
}

export function toAvailabilityConfig(p: ProviderListing): ProviderAvailabilityConfig {
  return {
    isAcceptingOrders: p.isAcceptingOrders,
    manualClosedReason: p.manualClosedReason,
    scheduleEnabled: p.scheduleEnabled,
    openTime: p.openTime,
    closeTime: p.closeTime,
    workingDays: p.workingDays
  };
}

export function useProviders({
  lang,
  activeVillageId,
  firebaseUser,
  effectiveUid,
  effectiveProfile,
  activeDemoAccount,
  isSignedIn,
  isAdmin,
  demoProfilePatch,
  deletedDemoUids,
  demoProviderStatusMap,
  markDemoUidDeleted,
  onReviewStatsUpdated
}: UseProvidersOptions) {
  const [firestoreProviders, setFirestoreProviders] = useState<ProviderListing[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<ReviewItem[]>([]);
  const [localDoctors, setLocalDoctors] = useState<DoctorService[]>(VILLAGE_DOCTORS);
  const [localTechnicians, setLocalTechnicians] = useState<TechnicianService[]>(VILLAGE_TECHNICIANS);
  const [demoProviderAvailabilityMap, setDemoProviderAvailabilityMap] = useState<
    Record<string, ProviderAvailabilityConfig>
  >(() => {
    try {
      const saved = window.localStorage.getItem('noqbas_demo_provider_availability');
      return saved ? (JSON.parse(saved) as Record<string, ProviderAvailabilityConfig>) : {};
    } catch {
      return {};
    }
  });

  // 1. Service Providers Directory Listener
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

    const approvedQuery = query(collection(db, 'providers'), where('status', '==', 'approved'));
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
            ? { ...(snap.data() as ProviderListing), id: snap.id }
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
  }, [isAdmin, firebaseUser]);

  // 2. Reviews Listener
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

  const mergedProviders = useMemo<ProviderListing[]>(() => {
    const map = new Map<string, ProviderListing>();
    firestoreProviders.forEach((p) => map.set(p.id, p));
    TEST_DEMO_PROVIDERS.forEach((p) => {
      if (deletedDemoUids.includes(p.ownerId)) return;
      if (!map.has(p.id)) {
        const patch = demoProfilePatch[p.ownerId] || {};
        const availPatch =
          demoProviderAvailabilityMap[p.id] || demoProviderAvailabilityMap[p.ownerId] || {};
        map.set(p.id, {
          ...p,
          ...availPatch,
          nameAr: patch.displayName || p.nameAr,
          nameEn: patch.displayName || p.nameEn,
          status: demoProviderStatusMap[p.id] || p.status
        });
      }
    });
    return Array.from(map.values());
  }, [
    firestoreProviders,
    deletedDemoUids,
    demoProfilePatch,
    demoProviderStatusMap,
    demoProviderAvailabilityMap
  ]);

  const approvedProviders = useMemo(
    () => mergedProviders.filter((p) => p.status === 'approved'),
    [mergedProviders]
  );

  const isProviderMode = Boolean(isSignedIn && !isAdmin && effectiveProfile?.role === 'provider');

  const activeProviderListing = useMemo(
    () =>
      isProviderMode && effectiveUid
        ? mergedProviders.find((p) => p.ownerId === effectiveUid || p.id === effectiveUid)
        : undefined,
    [isProviderMode, effectiveUid, mergedProviders]
  );

  const reviews = useMemo(() => {
    const map = new Map<string, ReviewItem>();
    firestoreReviews.forEach((r) => map.set(r.id, r));
    INITIAL_REVIEWS.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  }, [firestoreReviews]);

  const providerReviews = useMemo(() => {
    if (!isProviderMode || !effectiveUid) return [];
    const candidateIds = new Set<string>([effectiveUid]);
    if (activeProviderListing) {
      candidateIds.add(activeProviderListing.id);
      candidateIds.add(`prov-${activeProviderListing.id}`);
    }
    return reviews.filter((r) => candidateIds.has(r.targetId));
  }, [isProviderMode, effectiveUid, activeProviderListing, reviews]);

  const handleUpdateProviderAvailability = useCallback(
    async (availability: ProviderAvailabilityConfig) => {
      const validTime = (val?: string, fallback = '09:00') =>
        val && /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim()) ? val.trim() : fallback;

      const cleanConfig: ProviderAvailabilityConfig = {
        isAcceptingOrders: availability.isAcceptingOrders !== false,
        manualClosedReason: (availability.manualClosedReason || '').trim().slice(0, 120),
        scheduleEnabled: Boolean(availability.scheduleEnabled),
        openTime: validTime(availability.openTime, '09:00'),
        closeTime: validTime(availability.closeTime, '22:00'),
        workingDays: Array.isArray(availability.workingDays)
          ? Array.from(
              new Set(
                availability.workingDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
              )
            )
          : [6, 0, 1, 2, 3, 4]
      };

      if (activeDemoAccount || !firebaseUser) {
        const targetKey = activeProviderListing?.id || effectiveUid || '';
        if (!targetKey) return;
        setDemoProviderAvailabilityMap((prev) => {
          const next: Record<string, ProviderAvailabilityConfig> = {
            ...prev,
            [targetKey]: cleanConfig
          };
          if (effectiveUid) next[effectiveUid] = cleanConfig;
          try {
            window.localStorage.setItem('noqbas_demo_provider_availability', JSON.stringify(next));
          } catch {
            // Ignore storage quota errors
          }
          return next;
        });
        return;
      }

      const providerDocId = activeProviderListing?.id || firebaseUser.uid;
      setFirestoreProviders((prev) =>
        prev.map((p) => (p.id === providerDocId ? { ...p, ...cleanConfig } : p))
      );
      try {
        await updateDoc(doc(db, 'providers', providerDocId), {
          isAcceptingOrders: cleanConfig.isAcceptingOrders,
          manualClosedReason: cleanConfig.manualClosedReason,
          scheduleEnabled: cleanConfig.scheduleEnabled,
          openTime: cleanConfig.openTime,
          closeTime: cleanConfig.closeTime,
          workingDays: cleanConfig.workingDays,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `providers/${providerDocId}`);
      }
    },
    [activeDemoAccount, firebaseUser, activeProviderListing?.id, effectiveUid]
  );

  const handleAdminToggleProviderOpen = useCallback(
    async (provider: ProviderListing, isAcceptingOrders: boolean) => {
      const manualClosedReason = isAcceptingOrders ? '' : 'مغلق مؤقتاً من إدارة المنصة';
      if (provider.id.startsWith('test-')) {
        setDemoProviderAvailabilityMap((prev) => {
          const existing = prev[provider.id] || prev[provider.ownerId] || {};
          const updated: ProviderAvailabilityConfig = {
            ...existing,
            isAcceptingOrders,
            manualClosedReason
          };
          const next = {
            ...prev,
            [provider.id]: updated,
            [provider.ownerId]: updated
          };
          try {
            window.localStorage.setItem('noqbas_demo_provider_availability', JSON.stringify(next));
          } catch {
            // Ignore storage errors
          }
          return next;
        });
        return;
      }

      setFirestoreProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id ? { ...p, isAcceptingOrders, manualClosedReason } : p
        )
      );
      if (firebaseUser && isAdmin) {
        try {
          await updateDoc(doc(db, 'providers', provider.id), {
            isAcceptingOrders,
            manualClosedReason,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `providers/${provider.id}`);
        }
      }
    },
    [firebaseUser, isAdmin]
  );

  const handleAdminDeleteProvider = useCallback(
    async (provider: ProviderListing) => {
      if (provider.id.startsWith('test-') || provider.ownerId.startsWith('test-')) {
        markDemoUidDeleted(provider.ownerId);
        return;
      }
      setFirestoreProviders((prev) => prev.filter((p) => p.id !== provider.id));
      if (firebaseUser && isAdmin) {
        try {
          await deleteDoc(doc(db, 'providers', provider.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `providers/${provider.id}`);
        }
      }
    },
    [firebaseUser, isAdmin, markDemoUidDeleted]
  );

  const handleAddReview = useCallback(
    async (newReview: ReviewItem) => {
      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'reviews', newReview.id), {
            ownerId: firebaseUser.uid,
            targetId: newReview.targetId,
            villageId: activeVillageId,
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
            onReviewStatsUpdated?.(d.id, newRating, newCount);
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
            onReviewStatsUpdated?.(tech.id, newRating, newCount);
            return { ...tech, reviewsCount: newCount, rating: newRating };
          }
          return tech;
        })
      );
    },
    [firebaseUser, activeVillageId, lang, onReviewStatsUpdated]
  );

  // Derived Service Catalog Arrays
  const allDoctors = useMemo<DoctorService[]>(() => {
    const customDocs: DoctorService[] = approvedProviders
      .filter((p) => p.category === 'doctor')
      .map((p) => ({
        id: `prov-${p.id}`,
        ownerId: p.ownerId,
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
        avatar: '/images/doctor_marcus_vance_1794474296129.webp',
        availability: toAvailabilityConfig(p)
      }));
    return [...customDocs, ...localDoctors];
  }, [approvedProviders, localDoctors]);

  const allTechnicians = useMemo<TechnicianService[]>(() => {
    const customTechs: TechnicianService[] = approvedProviders
      .filter((p) => p.category === 'technician')
      .map((p) => ({
        id: `prov-${p.id}`,
        ownerId: p.ownerId,
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
        avatar: '/images/village_technician_electrician_1794475355366.webp',
        bio: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
        availability: toAvailabilityConfig(p)
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
          ownerId: p.ownerId,
          villageId: p.villageId,
          name: { ar: p.specialtyAr, en: p.specialtyEn },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          price: numeric,
          currency: { ar: 'ج.م', en: 'EGP' },
          category: 'traditional',
          restaurantName: { ar: p.nameAr, en: p.nameEn },
          image: '/images/village_fresh_food_bakery_1794475356032.webp',
          availability: toAvailabilityConfig(p)
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
          ownerId: p.ownerId,
          villageId: p.villageId,
          name: { ar: `${p.nameAr} - ${p.specialtyAr}`, en: `${p.nameEn} - ${p.specialtyEn}` },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          category: 'firstaid',
          price: numeric,
          currency: { ar: 'ج.م', en: 'EGP' },
          inStock: true,
          requiresPrescription: false,
          availability: toAvailabilityConfig(p)
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
          ownerId: p.ownerId,
          villageId: p.villageId,
          name: { ar: p.specialtyAr, en: p.specialtyEn },
          storeName: { ar: p.nameAr, en: p.nameEn },
          description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
          category: 'staples',
          price: numeric,
          unit: { ar: 'طلب / وحدة', en: '1 Unit' },
          currency: { ar: 'ج.م', en: 'EGP' },
          availability: toAvailabilityConfig(p)
        };
      });
    return [...customGrocery, ...VILLAGE_GROCERY_ITEMS];
  }, [approvedProviders]);

  const allTutors = useMemo<TutoringService[]>(() => {
    const customTutors: TutoringService[] = approvedProviders
      .filter((p) => p.category === 'tutoring')
      .map((p) => ({
        id: `prov-tut-${p.id}`,
        ownerId: p.ownerId,
        villageId: p.villageId,
        teacherName: { ar: p.nameAr, en: p.nameEn },
        subject: { ar: p.specialtyAr, en: p.specialtyEn },
        category: 'math',
        grades: { ar: 'جميع المراحل الدراسية', en: 'All Grade Levels' },
        feePerSession: { ar: p.priceLabelAr || '70 ج.م / حصة', en: p.priceLabelEn || '70 EGP / Session' },
        schedule: { ar: 'مواعيد مرنة بالحجز', en: 'Flexible Schedule' },
        location: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        phone: p.phone,
        mode: { ar: p.bioAr || 'مجموعات أو دروس خاصة', en: p.bioEn || 'Small groups or private' },
        availability: toAvailabilityConfig(p)
      }));
    return [...customTutors, ...VILLAGE_TUTORING_SERVICES];
  }, [approvedProviders]);

  const allCharities = useMemo<CharityOrg[]>(() => {
    const customCharities: CharityOrg[] = approvedProviders
      .filter((p) => p.category === 'charity')
      .map((p) => ({
        id: `prov-char-${p.id}`,
        ownerId: p.ownerId,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        focus: { ar: p.specialtyAr, en: p.specialtyEn },
        activeCampaign: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
        address: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        phone: p.phone,
        donationExample: { ar: p.priceLabelAr || 'مساهمة مفتوحة أو تطوع', en: p.priceLabelEn || 'Any contribution or volunteer' },
        availability: toAvailabilityConfig(p)
      }));
    return [...customCharities, ...VILLAGE_CHARITIES];
  }, [approvedProviders]);

  const allRides = useMemo<VillageRide[]>(() => {
    const customRides: VillageRide[] = approvedProviders
      .filter((p) => p.category === 'ride')
      .map((p) => ({
        id: `prov-ride-${p.id}`,
        ownerId: p.ownerId,
        villageId: p.villageId,
        driverName: { ar: p.nameAr, en: p.nameEn },
        from: { ar: p.neighborhoodAr || 'موقف القرية', en: p.neighborhoodEn || 'Village Square' },
        to: { ar: p.specialtyAr, en: p.specialtyEn },
        departureTime: '08:00 AM',
        availableSeats: 3,
        pricePerSeat: { ar: p.priceLabelAr || '25 ج.م', en: p.priceLabelEn || '25 EGP' },
        carModel: p.bioAr || 'سيارة ملاكي',
        phone: p.phone,
        availability: toAvailabilityConfig(p)
      }));
    return [...customRides, ...VILLAGE_RIDES];
  }, [approvedProviders]);

  const allOtherServices = useMemo<OtherService[]>(() => {
    const customOthers: OtherService[] = approvedProviders
      .filter((p) => p.category === 'other')
      .map((p) => ({
        id: `prov-oth-${p.id}`,
        ownerId: p.ownerId,
        villageId: p.villageId,
        name: { ar: p.nameAr, en: p.nameEn },
        activityType: { ar: p.specialtyAr, en: p.specialtyEn },
        description: { ar: p.bioAr || p.specialtyAr, en: p.bioEn || p.specialtyEn },
        address: { ar: p.neighborhoodAr || 'وسط البلد', en: p.neighborhoodEn || 'Village Center' },
        priceLabel: { ar: p.priceLabelAr || 'حسب الاتفاق', en: p.priceLabelEn || 'By agreement' },
        hours: { ar: 'يومياً حسب الاتفاق', en: 'Daily by appointment' },
        phone: p.phone,
        availability: toAvailabilityConfig(p)
      }));
    return [...customOthers, ...VILLAGE_OTHER_SERVICES];
  }, [approvedProviders]);

  return {
    mergedProviders,
    approvedProviders,
    isProviderMode,
    activeProviderListing,
    reviews,
    providerReviews,
    allDoctors,
    allTechnicians,
    allFoods,
    allPharmacy,
    allGrocery,
    allTutors,
    allCharities,
    allRides,
    allOtherServices,
    handleUpdateProviderAvailability,
    handleAdminToggleProviderOpen,
    handleAdminDeleteProvider,
    handleAddReview
  };
}
