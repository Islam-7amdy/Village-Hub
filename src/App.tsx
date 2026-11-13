/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  BookingRequest,
  ReviewItem,
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
  INITIAL_REVIEWS,
  INITIAL_VILLAGE_ADS
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
import { AdsSection } from './components/ServiceSections/AdsSection';

import { UniversalBookingModal } from './components/Modals/UniversalBookingModal';
import { PrescriptionUploadModal } from './components/Modals/PrescriptionUploadModal';
import { CartModal, CartItem } from './components/Modals/CartModal';
import { EmergencyDirectoryModal } from './components/Modals/EmergencyDirectoryModal';
import { VillageAssistantModal } from './components/Modals/VillageAssistantModal';
import { MyBookingsModal } from './components/Modals/MyBookingsModal';
import { ReviewModal } from './components/Modals/ReviewModal';
import { ProviderReviewsModal } from './components/Modals/ProviderReviewsModal';
import { AuthModal } from './components/Modals/AuthModal';
import { AdminDashboardModal } from './components/Modals/AdminDashboardModal';

import { Clock, ShieldCheck, Briefcase, AlertCircle, MapPin } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Firebase Auth & Profile State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const isAdmin = Boolean(
    firebaseUser?.email === ADMIN_EMAIL && firebaseUser?.emailVerified
  );

  // Modular Multi-Village State
  const [villages, setVillages] = useState<VillageConfig[]>(DEFAULT_VILLAGES);
  const [activeVillageId, setActiveVillageId] = useState<string>('noqbas');

  // Firestore Collections State
  const [firestoreProviders, setFirestoreProviders] = useState<ProviderListing[]>([]);
  const [firestoreAds, setFirestoreAds] = useState<VillageAd[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<ReviewItem[]>([]);

  // Village Base Data State
  const [localDoctors, setLocalDoctors] = useState<DoctorService[]>(VILLAGE_DOCTORS);
  const [localTechnicians, setLocalTechnicians] = useState<TechnicianService[]>(VILLAGE_TECHNICIANS);

  // Cart & Bookings
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([
    {
      id: 'book-init-1',
      villageId: 'noqbas',
      serviceType: 'doctor',
      title: 'كشف باطنة ومتابعة ضغط وسكر',
      providerName: 'د. طارق الخطيب',
      customerName: 'الحاج خليل محمد',
      customerPhone: '01011122233',
      address: 'الناحية الشرقية - جنب الجامع الكبير',
      date: '2026-11-14',
      time: '10:00 AM',
      totalAmountEgp: 100,
      status: 'confirmed',
      createdAt: '2026-11-12'
    }
  ]);

  // Modals state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    type: 'doctor' | 'technician' | 'ride' | 'tutoring' | 'charity';
    providerName: string;
    title: string;
  }>({ type: 'doctor', providerName: '', title: '' });

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);

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
      },
      (err) => {
        console.warn('User profile listener skipped:', err.message);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  // 3. Modular Villages + Global Active Village Listener
  useEffect(() => {
    const unsubVillages = onSnapshot(
      collection(db, 'villages'),
      (snap) => {
        const remoteMap = new Map<string, VillageConfig>();
        DEFAULT_VILLAGES.forEach((v) => remoteMap.set(v.id, v));
        snap.docs.forEach((d) => {
          const data = d.data() as Partial<VillageConfig>;
          if (data.id && data.nameAr && data.nameEn) {
            remoteMap.set(data.id, {
              id: data.id,
              nameAr: data.nameAr,
              nameEn: data.nameEn,
              governorateAr: data.governorateAr || 'مصر',
              governorateEn: data.governorateEn || 'Egypt',
              descriptionAr: data.descriptionAr || '',
              descriptionEn: data.descriptionEn || '',
              baseDeliveryFeeEgp: Number(data.baseDeliveryFeeEgp ?? 10),
              perKmFeeEgp: Number(data.perKmFeeEgp ?? 5),
              colorCode: (data.colorCode as VillageColorCode) || 'amber',
              isActive: data.isActive !== false,
              districts: data.districts || DEFAULT_DISTRICTS
            });
          }
        });
        setVillages(Array.from(remoteMap.values()));
      },
      (err) => {
        console.warn('Villages listener warning:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'appConfig', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { activeVillageId?: string };
          if (data.activeVillageId) {
            setActiveVillageId(data.activeVillageId);
          }
        }
      },
      (err) => {
        console.warn('Settings listener warning:', err.message);
      }
    );

    return () => {
      unsubVillages();
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

  // 7. User Bookings Listener (when signed in)
  useEffect(() => {
    if (!firebaseUser) return;
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
  }, [isAdmin, firebaseUser?.uid]);

  // Derived active village + per-village color theme
  const activeVillage = useMemo(
    () => villages.find((v) => v.id === activeVillageId) || villages[0] || DEFAULT_VILLAGES[0],
    [villages, activeVillageId]
  );
  const theme = getVillageTheme(activeVillage.colorCode);

  const handleSwitchVillage = async (vid: string) => {
    setActiveVillageId(vid);
    if (isAdmin) {
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId: vid,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Could not persist active village to Firestore:', err);
      }
    }
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
    () => firestoreProviders.filter((p) => p.status === 'approved'),
    [firestoreProviders]
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
      firestoreProviders.filter((p) => p.status === 'pending').length +
      firestoreAds.filter((a) => a.status === 'pending').length,
    [firestoreProviders, firestoreAds]
  );

  // Save Booking to Firestore (when signed in) + Local State
  const persistBooking = async (booking: BookingRequest) => {
    setBookings((prev) => [booking, ...prev]);
    if (firebaseUser) {
      try {
        const payload: Record<string, unknown> = {
          ownerId: firebaseUser.uid,
          villageId: activeVillage.id,
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

  // Cart actions
  const handleAddToCart = (item: { id: string; name: string; price: number; type: 'food' | 'pharmacy' | 'grocery' | 'farm' }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
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
  const handleOpenDoctorBooking = (docItem: DoctorService) => {
    setBookingDetails({
      type: 'doctor',
      providerName: docItem.name[lang],
      title: `${t.bookClinicVisit}: ${docItem.specialty[lang]}`
    });
    setIsBookingOpen(true);
  };

  const handleOpenTechnicianBooking = (tech: TechnicianService) => {
    setBookingDetails({
      type: 'technician',
      providerName: tech.name[lang],
      title: `${t.requestRepair}: ${tech.craft[lang]}`
    });
    setIsBookingOpen(true);
  };

  const handleOpenRideBooking = (ride: VillageRide) => {
    setBookingDetails({
      type: 'ride',
      providerName: ride.driverName[lang],
      title: `${t.bookSeat} (${ride.from[lang]} -> ${ride.to[lang]})`
    });
    setIsBookingOpen(true);
  };

  const handleOpenTutorBooking = (tutor: TutoringService) => {
    setBookingDetails({
      type: 'tutoring',
      providerName: tutor.teacherName[lang],
      title: `${t.bookLesson}: ${tutor.subject[lang]}`
    });
    setIsBookingOpen(true);
  };

  const handleOpenCharityContact = (org: CharityOrg) => {
    setBookingDetails({
      type: 'charity',
      providerName: org.name[lang],
      title: `${t.charityAction}: ${org.activeCampaign[lang]}`
    });
    setIsBookingOpen(true);
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

  const activeVillageName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white transition-colors">
      {/* Top Bar Header */}
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
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        onOpenAssistant={() => setIsAssistantModalOpen(true)}
        activeVillage={activeVillage}
        villages={villages}
        onSwitchVillage={handleSwitchVillage}
        isSignedIn={Boolean(firebaseUser)}
        isAdmin={isAdmin}
        userProfile={userProfile}
        pendingAdminCount={pendingAdminCount}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero Banner with Search & Exact 9 Category Shortcuts */}
        <VillageHeroBanner
          lang={lang}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onSelectCategory={(cat) => {
            setActiveTab(cat);
            setSearchQuery('');
          }}
          activeVillage={activeVillage}
        />

        {/* Provider Account Status Notice (Pending / Rejected) */}
        {userProfile?.role === 'provider' && userProfile.providerStatus === 'pending' && (
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

        {userProfile?.role === 'provider' && userProfile.providerStatus === 'rejected' && (
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

        {/* Quick Context Bar for Active Village, Color Code, Delivery Rate & Bookings */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${theme.dotBg} shrink-0`} aria-hidden="true" />
            <MapPin className={`w-4 h-4 ${theme.text} shrink-0`} />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'ar'
                ? `إنت دلوقتي في ${activeVillage.nameAr} · التوصيل بيبدأ من ${activeVillage.baseDeliveryFeeEgp} ج.م + ${activeVillage.perKmFeeEgp} ج.م/كم`
                : `Active Village: ${activeVillage.nameEn} · Delivery starts at ${activeVillage.baseDeliveryFeeEgp} EGP + ${activeVillage.perKmFeeEgp} EGP/km`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${theme.text}`} />
                <span>{t.adminPanel} ({pendingAdminCount})</span>
              </button>
            )}

            <button
              onClick={() => setIsMyBookingsOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${theme.text} ${theme.softBg} border ${theme.border} transition-colors cursor-pointer`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.myBookings} ({bookings.length})</span>
            </button>
          </div>
        </div>

        {/* SECTION ROUTING (9 Core Sections + Classified Ads on Home) */}
        {activeTab === 'all' && (
          <AdsSection
            ads={allAds}
            lang={lang}
            activeVillageId={activeVillage.id}
            activeVillageName={activeVillageName}
            currentUserId={firebaseUser?.uid || null}
            currentUserName={userProfile?.displayName || firebaseUser?.displayName || (lang === 'ar' ? 'معلن من القرية' : 'Village Advertiser')}
            isAdmin={isAdmin}
            onRequireLogin={() => setIsAuthModalOpen(true)}
          />
        )}

        {(activeTab === 'all' || activeTab === 'doctors') && (
          filteredDoctors.length > 0 ? (
            <DoctorsSection
              doctors={filteredDoctors}
              lang={lang}
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
                onClick={() => setIsAuthModalOpen(true)}
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
            onAddToCart={handleAddToCart}
            onOpenUploadPrescription={() => setIsPrescriptionModalOpen(true)}
          />
        )}

        {(activeTab === 'all' || activeTab === 'food') && filteredFoods.length > 0 && (
          <FoodSection
            foods={filteredFoods}
            lang={lang}
            onAddToCart={handleAddToCart}
          />
        )}

        {(activeTab === 'all' || activeTab === 'technicians') && (
          filteredTechnicians.length > 0 ? (
            <TechniciansSection
              technicians={filteredTechnicians}
              lang={lang}
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
                onClick={() => setIsAuthModalOpen(true)}
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
            onBookRide={handleOpenRideBooking}
          />
        )}

        {(activeTab === 'all' || activeTab === 'grocery') && filteredGrocery.length > 0 && (
          <GrocerySection
            items={filteredGrocery}
            lang={lang}
            onAddToCart={handleAddToCart}
          />
        )}

        {(activeTab === 'all' || activeTab === 'tutoring') && filteredTutors.length > 0 && (
          <TutoringSection
            tutors={filteredTutors}
            lang={lang}
            onBookTutor={handleOpenTutorBooking}
          />
        )}

        {(activeTab === 'all' || activeTab === 'charity') && filteredCharities.length > 0 && (
          <CharitySection
            charities={filteredCharities}
            lang={lang}
            onContactCharity={handleOpenCharityContact}
          />
        )}
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        firebaseUser={firebaseUser}
        userProfile={userProfile}
        isAdmin={isAdmin}
        villages={villages}
        activeVillageId={activeVillage.id}
        onProfileSaved={() => {}}
        onOpenAdminPanel={() => setIsAdminModalOpen(true)}
      />

      {isAdmin && (
        <AdminDashboardModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          lang={lang}
          providers={firestoreProviders}
          ads={firestoreAds}
          villages={villages}
          activeVillageId={activeVillage.id}
          onSwitchVillage={handleSwitchVillage}
          onVillageAdded={(v) => {
            setVillages((prev) => {
              const exists = prev.some((item) => item.id === v.id);
              return exists ? prev.map((item) => (item.id === v.id ? v : item)) : [...prev, v];
            });
          }}
        />
      )}

      <UniversalBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        serviceType={bookingDetails.type}
        providerName={bookingDetails.providerName}
        serviceTitle={bookingDetails.title}
        lang={lang}
        defaultName={userProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={userProfile?.phone || ''}
        onConfirmBooking={persistBooking}
      />

      <PrescriptionUploadModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        lang={lang}
        activeVillage={activeVillage}
        onPrescriptionSent={handlePrescriptionSent}
      />

      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        items={cart}
        lang={lang}
        activeVillage={activeVillage}
        defaultName={userProfile?.displayName || firebaseUser?.displayName || ''}
        defaultPhone={userProfile?.phone || ''}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
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

      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={bookings}
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
          setIsReviewModalOpen(true);
        }}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetId={activeReviewTarget.id}
        targetName={activeReviewTarget.name}
        targetRole={activeReviewTarget.role}
        lang={lang}
        defaultName={userProfile?.displayName || firebaseUser?.displayName || ''}
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
            <span>·</span>
            <span>{lang === 'ar' ? 'الأسعار بالجنيه المصري (ج.م)' : 'Currency: EGP'}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-slate-700 dark:text-slate-300 font-semibold hover:underline cursor-pointer"
            >
              {firebaseUser ? t.account : t.login}
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
              onClick={() => setIsAssistantModalOpen(true)}
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
