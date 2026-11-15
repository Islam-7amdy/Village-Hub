import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL } from '../firebase';
import {
  BannedPhoneRecord,
  DemoTestAccount,
  DemoUserAdminAction,
  TEST_DEMO_ACCOUNTS,
  UserProfile,
  isBanCurrentlyActive,
  normalizePhone
} from '../data/villageData';

export interface UseAuthOptions {
  nowMs: number;
  isAuthModalOpen: boolean;
  onPromptCompleteProfile: () => void;
}

export function useAuth({ nowMs, isAuthModalOpen, onPromptCompleteProfile }: UseAuthOptions) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState<boolean>(false);
  const [ownPhoneBan, setOwnPhoneBan] = useState<BannedPhoneRecord | null>(null);
  const promptedPhoneForUidRef = useRef<string | null>(null);

  const isAdmin = Boolean(
    firebaseUser?.email === ADMIN_EMAIL && firebaseUser?.emailVerified
  );

  // Demo Test Accounts Session State
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

  // Admin-only Users & Banned Phones State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [bannedPhones, setBannedPhones] = useState<BannedPhoneRecord[]>([]);

  // 1. Firebase Auth Listener
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

  const handleLoginDemoAccount = useCallback(
    (account: DemoTestAccount) => {
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
    },
    [firebaseUser]
  );

  const handleLogoutDemoAccount = useCallback(() => {
    setDemoUid(null);
    try {
      window.localStorage.removeItem('noqbas_demo_uid');
    } catch {
      // Ignore storage errors
    }
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
        setProfileLoaded(true);
      },
      (err) => {
        console.warn('User profile listener skipped:', err.message);
        setProfileLoaded(true);
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // 3. Phone Ban Listener
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
  }, [firebaseUser, userProfile?.phone]);

  // 4. Prompt signed-in user once if mobile phone missing
  useEffect(() => {
    if (
      firebaseUser &&
      profileLoaded &&
      !isAdmin &&
      !isAuthModalOpen &&
      (!userProfile || !userProfile.phone) &&
      promptedPhoneForUidRef.current !== firebaseUser.uid
    ) {
      promptedPhoneForUidRef.current = firebaseUser.uid;
      onPromptCompleteProfile();
    }
  }, [
    firebaseUser,
    profileLoaded,
    isAdmin,
    isAuthModalOpen,
    userProfile,
    onPromptCompleteProfile
  ]);

  // 5. Admin-only Users & Banned Phones Listeners
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

  const handleDemoUserAction = useCallback(
    (action: DemoUserAdminAction) => {
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
    },
    [demoUid, handleLogoutDemoAccount]
  );

  const handleDemoProviderDecision = useCallback(
    (providerId: string, decision: 'approved' | 'rejected') => {
      setDemoProviderStatusMap((prev) => ({ ...prev, [providerId]: decision }));
    },
    []
  );

  const markDemoUidDeleted = useCallback((uid: string) => {
    setDeletedDemoUids((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
  }, []);

  const canUsePlatformServices = Boolean(
    isSignedIn && !isCurrentUserBanned && (isAdmin || (effectiveProfile && effectiveProfile.phone))
  );

  return {
    firebaseUser,
    userProfile,
    profileLoaded,
    ownPhoneBan,
    isAdmin,
    activeDemoAccount,
    demoProfilePatch,
    deletedDemoUids,
    demoProviderStatusMap,
    effectiveUid,
    effectiveProfile,
    isSignedIn,
    isCurrentUserBanned,
    canUsePlatformServices,
    mergedUsers,
    mergedBannedPhones,
    handleLoginDemoAccount,
    handleLogoutDemoAccount,
    handleDemoUserAction,
    handleDemoProviderDecision,
    markDemoUidDeleted
  };
}
