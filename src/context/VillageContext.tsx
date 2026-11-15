import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Language } from '../data/villageData';
import { useAuth } from '../hooks/useAuth';
import { useVillagePlatform } from '../hooks/useVillagePlatform';
import { useProviders } from '../hooks/useProviders';
import { useBookings } from '../hooks/useBookings';

export function useVillageState() {
  const [lang, setLang] = useState<Language>('ar');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isOrderStatusOpen, setIsOrderStatusOpen] = useState(false);

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

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const promptCompleteProfile = useCallback(() => {
    openAuthModal('register');
  }, [openAuthModal]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const authState = useAuth({
    nowMs,
    isAuthModalOpen,
    onPromptCompleteProfile: promptCompleteProfile
  });

  const platformState = useVillagePlatform({
    lang,
    firebaseUser: authState.firebaseUser,
    effectiveUid: authState.effectiveUid,
    effectiveProfile: authState.effectiveProfile,
    isAdmin: authState.isAdmin,
    isCurrentUserBanned: authState.isCurrentUserBanned
  });

  const handleReviewStatsUpdated = useCallback(
    (targetId: string, rating: number, reviewsCount: number) => {
      setActiveReviewTarget((curr) =>
        curr.id === targetId ? { ...curr, rating, reviewsCount } : curr
      );
    },
    []
  );

  const providersState = useProviders({
    lang,
    activeVillageId: platformState.activeVillage.id,
    firebaseUser: authState.firebaseUser,
    effectiveUid: authState.effectiveUid,
    effectiveProfile: authState.effectiveProfile,
    activeDemoAccount: authState.activeDemoAccount,
    isSignedIn: authState.isSignedIn,
    isAdmin: authState.isAdmin,
    demoProfilePatch: authState.demoProfilePatch,
    deletedDemoUids: authState.deletedDemoUids,
    demoProviderStatusMap: authState.demoProviderStatusMap,
    markDemoUidDeleted: authState.markDemoUidDeleted,
    onReviewStatsUpdated: handleReviewStatsUpdated
  });

  const requireAuth = useCallback(
    (next: () => void) => {
      if (!authState.isSignedIn) {
        openAuthModal('login');
        return;
      }
      if (!authState.isAdmin && (!authState.effectiveProfile || !authState.effectiveProfile.phone)) {
        openAuthModal('register');
        return;
      }
      if (authState.isCurrentUserBanned) {
        openAuthModal('login');
        return;
      }
      next();
    },
    [
      authState.isSignedIn,
      authState.isAdmin,
      authState.effectiveProfile,
      authState.isCurrentUserBanned,
      openAuthModal
    ]
  );

  const onOrderCompletedOpenTracker = useCallback(() => {
    setIsOrderStatusOpen(true);
  }, []);

  const bookingsState = useBookings({
    lang,
    nowMs,
    activeVillage: platformState.activeVillage,
    firebaseUser: authState.firebaseUser,
    effectiveUid: authState.effectiveUid,
    effectiveProfile: authState.effectiveProfile,
    userProfile: authState.userProfile,
    activeDemoAccount: authState.activeDemoAccount,
    profileLoaded: authState.profileLoaded,
    isSignedIn: authState.isSignedIn,
    isAdmin: authState.isAdmin,
    isCurrentUserBanned: authState.isCurrentUserBanned,
    ownPhoneBan: authState.ownPhoneBan,
    mergedProviders: providersState.mergedProviders,
    firestoreAds: platformState.firestoreAds,
    allAds: platformState.allAds,
    trackAnalyticsEvent: platformState.trackAnalyticsEvent,
    requireAuth,
    onOrderCompletedOpenTracker
  });

  return {
    lang,
    setLang,
    darkMode,
    setDarkMode,
    nowMs,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    openAuthModal,
    isOrderStatusOpen,
    setIsOrderStatusOpen,
    activeReviewTarget,
    setActiveReviewTarget,
    requireAuth,
    ...authState,
    ...platformState,
    ...providersState,
    ...bookingsState
  };
}

export type VillageContextValue = ReturnType<typeof useVillageState>;

const VillageContext = createContext<VillageContextValue | null>(null);

export const VillageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useVillageState();
  return <VillageContext.Provider value={value}>{children}</VillageContext.Provider>;
};

export function useVillage(): VillageContextValue {
  const ctx = useContext(VillageContext);
  if (!ctx) {
    throw new Error('useVillage must be used inside a VillageProvider');
  }
  return ctx;
}
