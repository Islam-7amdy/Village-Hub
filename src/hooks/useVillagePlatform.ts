import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  AnalyticsEventRecord,
  AnalyticsEventType,
  DEFAULT_DISTRICTS,
  DEFAULT_SERVICE_SECTIONS,
  DEFAULT_VILLAGES,
  Language,
  PlatformPricingConfig,
  ServiceSectionConfig,
  UserProfile,
  VillageAd,
  VillageColorCode,
  VillageConfig,
  getVillageTheme
} from '../data/villageData';
import { INITIAL_VILLAGE_ADS } from '../data/demoSeedData';

export interface UseVillagePlatformOptions {
  lang: Language;
  firebaseUser: FirebaseUser | null;
  effectiveUid: string | null;
  effectiveProfile: UserProfile | null;
  isAdmin: boolean;
  isCurrentUserBanned: boolean;
}

export function useVillagePlatform({
  lang,
  firebaseUser,
  effectiveUid,
  effectiveProfile,
  isAdmin,
  isCurrentUserBanned
}: UseVillagePlatformOptions) {
  const [activeVillage, setActiveVillage] = useState<VillageConfig>(DEFAULT_VILLAGES[0]);
  const [adPricing, setAdPricing] = useState<PlatformPricingConfig>({
    adPriceWeekEgp: 20,
    adPriceMonthEgp: 50,
    commissionRatePercent: 10
  });

  const [firestoreAds, setFirestoreAds] = useState<VillageAd[]>([]);
  const [editedAdsMap, setEditedAdsMap] = useState<Record<string, VillageAd>>({});
  const [deletedAdIds, setDeletedAdIds] = useState<string[]>([]);

  const [firestoreSections, setFirestoreSections] = useState<ServiceSectionConfig[]>([]);
  const [localSectionsOverride, setLocalSectionsOverride] = useState<
    Record<string, ServiceSectionConfig>
  >(() => {
    try {
      const saved = window.localStorage.getItem('noqbas_custom_sections');
      return saved ? (JSON.parse(saved) as Record<string, ServiceSectionConfig>) : {};
    } catch {
      return {};
    }
  });
  const [deletedSectionIds, setDeletedSectionIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('noqbas_deleted_sections');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEventRecord[]>(() => {
    try {
      const saved = window.localStorage.getItem('noqbas_analytics_events');
      return saved ? (JSON.parse(saved) as AnalyticsEventRecord[]) : [];
    } catch {
      return [];
    }
  });
  const lastTrackedRef = useRef<Map<string, number>>(new Map());

  // 1. Village Config + App Settings Listeners
  useEffect(() => {
    const unsubVillage = onSnapshot(
      doc(db, 'villages', 'noqbas'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<VillageConfig>;
          const rawNameAr = (data.nameAr || '').trim();
          const rawNameEn = (data.nameEn || '').trim();
          const rawDescAr = (data.descriptionAr || '').trim();
          const rawDescEn = (data.descriptionEn || '').trim();
          setActiveVillage({
            ...DEFAULT_VILLAGES[0],
            id: data.id || 'noqbas',
            nameAr: !rawNameAr || /نقباس|ىقباس|أهل البلد/.test(rawNameAr) ? 'بلدنا' : rawNameAr,
            nameEn: !rawNameEn || /noqbas/i.test(rawNameEn) ? 'Village Service Hub' : rawNameEn,
            governorateAr: data.governorateAr || DEFAULT_VILLAGES[0].governorateAr,
            governorateEn: data.governorateEn || DEFAULT_VILLAGES[0].governorateEn,
            descriptionAr:
              !rawDescAr || /نقباس|ىقباس|أهل البلد/.test(rawDescAr)
                ? DEFAULT_VILLAGES[0].descriptionAr
                : rawDescAr,
            descriptionEn:
              !rawDescEn || /noqbas/i.test(rawDescEn)
                ? DEFAULT_VILLAGES[0].descriptionEn
                : rawDescEn,
            baseDeliveryFeeEgp: Number(
              data.baseDeliveryFeeEgp ?? DEFAULT_VILLAGES[0].baseDeliveryFeeEgp
            ),
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
        console.warn('Village config listener warning:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'appConfig', 'settings'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as {
            adPriceWeekEgp?: number;
            adPriceMonthEgp?: number;
            commissionRatePercent?: number;
          };
          if (
            typeof data.adPriceWeekEgp === 'number' ||
            typeof data.adPriceMonthEgp === 'number' ||
            typeof data.commissionRatePercent === 'number'
          ) {
            setAdPricing({
              adPriceWeekEgp: typeof data.adPriceWeekEgp === 'number' ? data.adPriceWeekEgp : 20,
              adPriceMonthEgp: typeof data.adPriceMonthEgp === 'number' ? data.adPriceMonthEgp : 50,
              commissionRatePercent:
                typeof data.commissionRatePercent === 'number' ? data.commissionRatePercent : 10
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

  // 2. Classified Ads Listener
  useEffect(() => {
    if (isAdmin) {
      const unsubAll = onSnapshot(
        collection(db, 'ads'),
        (snap) => {
          setFirestoreAds(snap.docs.map((d) => ({ ...(d.data() as VillageAd), id: d.id })));
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
  }, [isAdmin, firebaseUser]);

  // 3. Service Sections Listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'sections'),
      (snap) => {
        const mapped = snap.docs.map((d) => ({
          ...(d.data() as ServiceSectionConfig),
          id: d.id
        }));
        setFirestoreSections(mapped);
      },
      (err) => console.warn('Sections listener warning:', err.message)
    );
    return () => unsub();
  }, []);

  // 4. Analytics Events Listener
  useEffect(() => {
    if (!firebaseUser) return;
    const eventsSource = isAdmin
      ? collection(db, 'analyticsEvents')
      : query(collection(db, 'analyticsEvents'), where('ownerId', '==', firebaseUser.uid));

    const unsub = onSnapshot(
      eventsSource,
      (snap) => {
        const remote = snap.docs.map((d) => {
          const data = d.data() as AnalyticsEventRecord;
          return {
            ...data,
            id: d.id,
            createdAtMs: typeof data.createdAtMs === 'number' ? data.createdAtMs : Date.now()
          };
        });
        setAnalyticsEvents((prev) => {
          const map = new Map<string, AnalyticsEventRecord>();
          remote.forEach((ev) => map.set(ev.id, ev));
          prev.forEach((ev) => {
            if (!map.has(ev.id)) map.set(ev.id, ev);
          });
          return Array.from(map.values())
            .sort((a, b) => b.createdAtMs - a.createdAtMs)
            .slice(0, 600);
        });
      },
      (err) => console.warn('Analytics events listener warning:', err.message)
    );
    return () => unsub();
  }, [isAdmin, firebaseUser]);

  const theme = getVillageTheme(activeVillage.colorCode);
  const activeVillageName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  const mergedSections = useMemo<ServiceSectionConfig[]>(() => {
    const map = new Map<string, ServiceSectionConfig>();
    DEFAULT_SERVICE_SECTIONS.forEach((sec) => map.set(sec.id, sec));
    firestoreSections.forEach((sec) => map.set(sec.id, sec));
    Object.values(localSectionsOverride).forEach((sec) => map.set(sec.id, sec));
    deletedSectionIds.forEach((delId) => {
      const target = map.get(delId);
      if (target && !target.isBuiltIn) {
        map.delete(delId);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [firestoreSections, localSectionsOverride, deletedSectionIds]);

  const isSectionEnabled = useCallback(
    (sectionId: string): boolean => {
      const found = mergedSections.find((s) => s.id === sectionId);
      return found ? found.isEnabled !== false : true;
    },
    [mergedSections]
  );

  const allAds = useMemo<VillageAd[]>(() => {
    const map = new Map<string, VillageAd>();
    firestoreAds.forEach((a) => map.set(a.id, a));
    if (import.meta.env.DEV) {
      INITIAL_VILLAGE_ADS.forEach((a) => {
        if (!map.has(a.id)) map.set(a.id, a);
      });
    }
    Object.values(editedAdsMap).forEach((a) => map.set(a.id, a));
    deletedAdIds.forEach((id) => map.delete(id));
    return Array.from(map.values());
  }, [firestoreAds, editedAdsMap, deletedAdIds]);

  const trackAnalyticsEvent = useCallback(
    async (eventType: AnalyticsEventType, targetId: string, targetLabel: string) => {
      if (isAdmin) return;
      const now = Date.now();
      const dedupKey = `${eventType}:${targetId.slice(0, 80)}`;
      const prevTs = lastTrackedRef.current.get(dedupKey);
      if (typeof prevTs === 'number' && now - prevTs < 60000) {
        return;
      }
      lastTrackedRef.current.set(dedupKey, now);

      const evt: AnalyticsEventRecord = {
        id: `evt-${now}-${Math.random().toString(36).slice(2, 7)}`,
        ownerId: effectiveUid || 'guest',
        userRole:
          effectiveProfile?.role === 'provider'
            ? 'provider'
            : effectiveUid
            ? 'resident'
            : 'guest',
        eventType,
        targetId: targetId.slice(0, 80),
        targetLabel: targetLabel.slice(0, 120),
        villageId: activeVillage.id,
        createdAtMs: now
      };

      setAnalyticsEvents((prev) => {
        const next = [evt, ...prev].slice(0, 500);
        try {
          window.localStorage.setItem('noqbas_analytics_events', JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });

      if (
        firebaseUser &&
        !isCurrentUserBanned &&
        (firebaseUser.emailVerified || firebaseUser.phoneNumber)
      ) {
        try {
          await setDoc(doc(db, 'analyticsEvents', evt.id), {
            ...evt,
            ownerId: firebaseUser.uid,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.warn('Analytics event save warning:', err);
        }
      }
    },
    [isAdmin, effectiveUid, effectiveProfile?.role, firebaseUser, activeVillage.id, isCurrentUserBanned]
  );

  const handleSaveSection = useCallback(
    async (section: ServiceSectionConfig) => {
      const cleanSection: ServiceSectionConfig = {
        ...section,
        id: section.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40),
        providerCategoryId: (section.providerCategoryId || section.id)
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 40),
        nameAr: section.nameAr.trim().slice(0, 60),
        nameEn: section.nameEn.trim().slice(0, 60),
        descriptionAr: (section.descriptionAr || '').trim().slice(0, 160),
        descriptionEn: (section.descriptionEn || '').trim().slice(0, 160),
        sortOrder: Number.isFinite(Number(section.sortOrder)) ? Number(section.sortOrder) : 99,
        isEnabled: section.isEnabled !== false
      };

      setDeletedSectionIds((prev) => {
        const next = prev.filter((id) => id !== cleanSection.id);
        try {
          window.localStorage.setItem('noqbas_deleted_sections', JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      setLocalSectionsOverride((prev) => {
        const next = { ...prev, [cleanSection.id]: cleanSection };
        try {
          window.localStorage.setItem('noqbas_custom_sections', JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      if (firebaseUser && isAdmin) {
        try {
          await setDoc(doc(db, 'sections', cleanSection.id), {
            ...cleanSection,
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `sections/${cleanSection.id}`);
        }
      }
    },
    [firebaseUser, isAdmin]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      const target = mergedSections.find((s) => s.id === sectionId);
      if (target?.isBuiltIn) {
        await handleSaveSection({ ...target, isEnabled: false });
        return;
      }

      setLocalSectionsOverride((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        try {
          window.localStorage.setItem('noqbas_custom_sections', JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      setDeletedSectionIds((prev) => {
        const next = prev.includes(sectionId) ? prev : [...prev, sectionId];
        try {
          window.localStorage.setItem('noqbas_deleted_sections', JSON.stringify(next));
        } catch {
          // Ignore storage errors
        }
        return next;
      });

      if (firebaseUser && isAdmin) {
        try {
          await deleteDoc(doc(db, 'sections', sectionId));
        } catch (err) {
          console.warn('Section delete warning:', err);
        }
      }
    },
    [mergedSections, handleSaveSection, firebaseUser, isAdmin]
  );

  const handleResetSections = useCallback(async () => {
    setLocalSectionsOverride({});
    setDeletedSectionIds([]);
    try {
      window.localStorage.removeItem('noqbas_custom_sections');
      window.localStorage.removeItem('noqbas_deleted_sections');
    } catch {
      // Ignore storage errors
    }

    if (firebaseUser && isAdmin) {
      for (const sec of firestoreSections) {
        try {
          if (sec.isBuiltIn) {
            const def = DEFAULT_SERVICE_SECTIONS.find((d) => d.id === sec.id);
            if (def) {
              await setDoc(doc(db, 'sections', sec.id), {
                ...def,
                updatedAt: serverTimestamp()
              });
            }
          } else {
            await deleteDoc(doc(db, 'sections', sec.id));
          }
        } catch (err) {
          console.warn('Reset section warning:', err);
        }
      }
    }
  }, [firebaseUser, isAdmin, firestoreSections]);

  const handleAdminSaveAd = useCallback(
    async (
      adId: string,
      payload: Partial<VillageAd> & {
        title: string;
        description: string;
        category: VillageAd['category'];
        contactPhone: string;
      },
      isNew?: boolean
    ) => {
      const existing = allAds.find((a) => a.id === adId);
      const now = Date.now();
      const durationPlan = payload.durationPlan || existing?.durationPlan || 'month';
      const durationDays =
        typeof payload.durationDays === 'number'
          ? payload.durationDays
          : durationPlan === 'week'
          ? 7
          : 30;
      const savedAd: VillageAd = {
        id: adId,
        ownerId: existing?.ownerId || firebaseUser?.uid || 'admin',
        authorName: existing?.authorName || payload.authorName || 'إدارة منصة بلدنا',
        villageId: payload.villageId || existing?.villageId || activeVillage.id,
        title: payload.title.trim().slice(0, 120),
        description: payload.description.trim().slice(0, 600),
        category: payload.category,
        contactPhone: payload.contactPhone.trim().slice(0, 30),
        priceText: (payload.priceText ?? existing?.priceText ?? '').trim().slice(0, 60),
        durationPlan,
        durationDays,
        costEgp: typeof payload.costEgp === 'number' ? payload.costEgp : existing?.costEgp ?? 0,
        status: payload.status || existing?.status || 'approved',
        createdDate: existing?.createdDate || new Date().toISOString().split('T')[0],
        expiresAtMs:
          typeof payload.expiresAtMs === 'number'
            ? payload.expiresAtMs
            : existing?.expiresAtMs || now + durationDays * 24 * 60 * 60 * 1000
      };

      setDeletedAdIds((prev) => prev.filter((id) => id !== adId));
      setEditedAdsMap((prev) => ({ ...prev, [adId]: savedAd }));
      setFirestoreAds((prev) => {
        const existsInRemote = prev.some((a) => a.id === adId);
        if (existsInRemote) return prev.map((a) => (a.id === adId ? savedAd : a));
        return isNew ? [savedAd, ...prev] : prev;
      });

      if (firebaseUser && isAdmin) {
        try {
          await setDoc(
            doc(db, 'ads', adId),
            {
              ...savedAd,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `ads/${adId}`);
        }
      }
    },
    [allAds, firebaseUser, activeVillage.id, isAdmin]
  );

  const handleAdminDeleteAd = useCallback(
    async (adId: string) => {
      setDeletedAdIds((prev) => (prev.includes(adId) ? prev : [...prev, adId]));
      setEditedAdsMap((prev) => {
        const next = { ...prev };
        delete next[adId];
        return next;
      });
      setFirestoreAds((prev) => prev.filter((a) => a.id !== adId));

      if (firebaseUser && isAdmin) {
        try {
          await deleteDoc(doc(db, 'ads', adId));
        } catch (err) {
          console.warn('Admin delete ad warning:', err);
        }
      }
    },
    [firebaseUser, isAdmin]
  );

  const handleCommissionRateChange = useCallback((ratePercent: number) => {
    setAdPricing((prev) => ({ ...prev, commissionRatePercent: ratePercent }));
  }, []);

  return {
    activeVillage,
    setActiveVillage,
    theme,
    activeVillageName,
    adPricing,
    handleCommissionRateChange,
    firestoreAds,
    allAds,
    mergedSections,
    isSectionEnabled,
    analyticsEvents,
    trackAnalyticsEvent,
    handleSaveSection,
    handleDeleteSection,
    handleResetSections,
    handleAdminSaveAd,
    handleAdminDeleteAd
  };
}
