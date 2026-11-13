import React, { useState, useEffect, useRef } from 'react';
import {
  User as FirebaseUser,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  handleFirestoreError,
  OperationType
} from '../../firebase';
import {
  Language,
  UserProfile,
  VillageConfig,
  BannedPhoneRecord,
  normalizePhone,
  toE164Phone,
  isBanCurrentlyActive
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  X,
  UserCheck,
  Briefcase,
  ShieldCheck,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  MapPin,
  Phone,
  Camera,
  Trash2,
  Ban,
  MessageSquareCode,
  UserPlus,
  ArrowRight,
  Home
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialMode?: 'login' | 'register';
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isBanned?: boolean;
  banReason?: string;
  banUntilMs?: number;
  villages: VillageConfig[];
  activeVillageId: string;
  onProfileSaved: () => void;
  onOpenAdminPanel: () => void;
}

type ProviderCategory =
  | 'doctor'
  | 'technician'
  | 'food'
  | 'pharmacy'
  | 'grocery'
  | 'tutoring'
  | 'charity'
  | 'other'
  | 'ride';

async function compressAvatarToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not available'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialMode = 'login',
  firebaseUser,
  userProfile,
  isAdmin,
  isBanned,
  banReason,
  banUntilMs,
  villages,
  activeVillageId,
  onProfileSaved,
  onOpenAdminPanel
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recaptchaDivRef = useRef<HTMLDivElement | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Explicit dual auth mode: 'login' (لديك حساب بالفعل) vs 'register' (مستخدم جديد)
  const [authTab, setAuthTab] = useState<'login' | 'register'>(initialMode);
  const [smsStep, setSmsStep] = useState<'form' | 'otp'>('form');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sentToDisplay, setSentToDisplay] = useState('');

  // Profile / Registration fields (Name + Phone + Address, NO email)
  const [role, setRole] = useState<'resident' | 'provider'>('resident');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [villageId, setVillageId] = useState(activeVillageId);
  const [serviceCategory, setServiceCategory] = useState<ProviderCategory>('technician');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceFeeEgp, setServiceFeeEgp] = useState('');
  const [serviceBio, setServiceBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore cleanup warning
        }
        recaptchaRef.current = null;
      }
      return;
    }

    setAuthTab(initialMode);
    setSmsStep('form');
    setConfirmationResult(null);
    setOtpCode('');
    setSentToDisplay('');
    setError('');
    setSuccessMsg('');
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (firebaseUser) {
      const normalizedAuthPhone = firebaseUser.phoneNumber
        ? normalizePhone(firebaseUser.phoneNumber)
        : '';
      setDisplayName(userProfile?.displayName || firebaseUser.displayName || '');
      setPhone(userProfile?.phone || normalizedAuthPhone || '');
      setAddress(userProfile?.address || userProfile?.neighborhood || '');
      setPhotoUrl(userProfile?.photoUrl || '');
      setVillageId(userProfile?.villageId || activeVillageId);
      if (userProfile?.role) setRole(userProfile.role);
      if (
        userProfile?.serviceCategory &&
        userProfile.serviceCategory !== 'none' &&
        userProfile.serviceCategory !== 'farm'
      ) {
        setServiceCategory(userProfile.serviceCategory);
      }
      setServiceTitle(userProfile?.serviceTitle || '');
      setServiceFeeEgp(userProfile?.serviceFeeEgp || '');
      setServiceBio(userProfile?.serviceBio || '');
    } else {
      setVillageId(activeVillageId);
    }
  }, [firebaseUser, userProfile, activeVillageId, isOpen]);

  useEffect(() => {
    return () => {
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch {
          // Ignore cleanup
        }
        recaptchaRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const mapPhoneAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return lang === 'ar'
        ? 'خدمة التحقق برقم الهاتف (SMS) غير مفعلة حالياً في إعدادات Firebase Authentication. من فضلك فعّل Phone Sign-in من Firebase Console.'
        : 'Phone SMS authentication is not enabled in Firebase Console yet (Authentication -> Sign-in method -> Phone -> Enable).';
    }
    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      return lang === 'ar'
        ? 'هذا الدومين غير مضاف في Authorized domains داخل Firebase Authentication. أضف رابط الموقع الحالي في إعدادات Firebase.'
        : 'Current domain is not in Firebase Authorized Domains. Add it under Authentication -> Settings -> Authorized domains.';
    }
    if (code === 'auth/invalid-phone-number') {
      return lang === 'ar'
        ? 'رقم الموبايل غير صحيح. اكتب رقم مصري مثل 01012345678 أو رقم دولي بصيغة +2010XXXXXXXX.'
        : 'Invalid phone number format. Enter an Egyptian mobile like 01012345678 or E.164 format (+20...).';
    }
    if (code === 'auth/invalid-verification-code') {
      return lang === 'ar'
        ? 'كود التأكيد غلط! اتأكد من الـ 6 أرقام اللي وصلوك في الرسالة النصية.'
        : 'Incorrect 6-digit verification code. Please check your SMS and try again.';
    }
    if (code === 'auth/code-expired') {
      return lang === 'ar'
        ? 'انتهت صلاحية الكود، اطلب رسالة تأكيد جديدة.'
        : 'Verification code expired. Please request a new SMS code.';
    }
    if (code === 'auth/too-many-requests') {
      return lang === 'ar'
        ? 'تم إرسال محاولات كثيرة متتالية، استنى شوية وجرب تاني.'
        : 'Too many SMS attempts. Please wait a few minutes and try again.';
    }
    if (code === 'auth/billing-not-enabled') {
      return lang === 'ar'
        ? 'إرسال رسائل SMS حقيقية يتطلب تفعيل خطة Blaze أو إضافة رقم اختبار (Test phone number) في Firebase Authentication.'
        : 'Real SMS delivery requires Blaze plan or a configured Test Phone Number in Firebase Console -> Authentication -> Sign-in method -> Phone.';
    }
    return lang === 'ar'
      ? `تعذر إرسال أو تأكيد الرسالة النصية (${code || msg}).`
      : `Could not complete SMS verification (${code || msg}).`;
  };

  const getOrCreateRecaptcha = () => {
    if (recaptchaRef.current) {
      try {
        recaptchaRef.current.clear();
      } catch {
        // Ignore clear error
      }
      recaptchaRef.current = null;
    }
    const container = recaptchaDivRef.current;
    if (!container) {
      throw new Error('reCAPTCHA container is missing');
    }
    container.innerHTML = '';
    auth.languageCode = lang === 'ar' ? 'ar' : 'en';
    const verifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible'
    });
    recaptchaRef.current = verifier;
    return verifier;
  };

  const checkBanForPhone = async (normalizedPhone: string): Promise<string | null> => {
    try {
      const banSnap = await getDoc(doc(db, 'bannedPhones', normalizedPhone));
      if (banSnap.exists()) {
        const banData = banSnap.data() as BannedPhoneRecord;
        if (isBanCurrentlyActive(true, banData.banUntilMs, banData.isPermanent)) {
          const expiryText = banData.isPermanent
            ? lang === 'ar'
              ? 'حظر دائم'
              : 'Permanent ban'
            : new Date(banData.banUntilMs).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');
          return lang === 'ar'
            ? `رقم الموبايل (${normalizedPhone}) محظور من المنصة (${expiryText})${banData.reason ? ` - السبب: ${banData.reason}` : ''}.`
            : `Phone number (${normalizedPhone}) is currently banned (${expiryText}).`;
        }
      }
    } catch (err) {
      console.warn('Ban lookup warning:', err);
    }
    return null;
  };

  const writeUserAndProviderDocs = async (uid: string, normalizedPhone: string, isNewAccount: boolean) => {
    const cleanAddress = address.trim() || (lang === 'ar' ? 'وسط البلد' : 'Village Center');
    const userRef = doc(db, 'users', uid);

    if (isNewAccount) {
      const initialProviderStatus = role === 'provider' ? 'pending' : 'none';
      try {
        await setDoc(userRef, {
          uid,
          displayName: displayName.trim(),
          phone: normalizedPhone,
          address: cleanAddress,
          neighborhood: cleanAddress,
          photoUrl: photoUrl || '',
          role,
          villageId,
          providerStatus: initialProviderStatus,
          serviceCategory: role === 'provider' ? serviceCategory : 'none',
          serviceTitle: role === 'provider' ? serviceTitle.trim() : '',
          serviceFeeEgp: role === 'provider' ? serviceFeeEgp.trim() || '100 ج.م' : '',
          serviceBio: role === 'provider' ? serviceBio.trim() : '',
          isBanned: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      }

      if (role === 'provider') {
        try {
          await setDoc(doc(db, 'providers', uid), {
            ownerId: uid,
            villageId,
            nameAr: displayName.trim(),
            nameEn: displayName.trim(),
            category: serviceCategory,
            specialtyAr: serviceTitle.trim(),
            specialtyEn: serviceTitle.trim(),
            phone: normalizedPhone,
            neighborhoodAr: cleanAddress,
            neighborhoodEn: cleanAddress,
            priceLabelAr: serviceFeeEgp.trim() || 'حسب الاتفاق',
            priceLabelEn: serviceFeeEgp.trim() || 'By agreement',
            bioAr: serviceBio.trim() || 'مقدم خدمة من أهالي القرية',
            bioEn: serviceBio.trim() || 'Local village service provider',
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `providers/${uid}`);
        }
      }
    } else {
      try {
        await updateDoc(userRef, {
          displayName: displayName.trim(),
          phone: normalizedPhone,
          address: cleanAddress,
          neighborhood: cleanAddress,
          photoUrl: photoUrl || '',
          villageId,
          serviceCategory: userProfile?.role === 'provider' ? serviceCategory : 'none',
          serviceTitle: userProfile?.role === 'provider' ? serviceTitle.trim() : '',
          serviceFeeEgp: userProfile?.role === 'provider' ? serviceFeeEgp.trim() : '',
          serviceBio: userProfile?.role === 'provider' ? serviceBio.trim() : '',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      }

      if (userProfile?.role === 'provider') {
        try {
          await updateDoc(doc(db, 'providers', uid), {
            villageId,
            nameAr: displayName.trim(),
            nameEn: displayName.trim(),
            category: serviceCategory,
            specialtyAr: serviceTitle.trim(),
            specialtyEn: serviceTitle.trim(),
            phone: normalizedPhone,
            neighborhoodAr: cleanAddress,
            neighborhoodEn: cleanAddress,
            priceLabelAr: serviceFeeEgp.trim() || 'حسب الاتفاق',
            priceLabelEn: serviceFeeEgp.trim() || 'By agreement',
            bioAr: serviceBio.trim() || 'مقدم خدمة من أهالي القرية',
            bioEn: serviceBio.trim() || 'Local village service provider',
            updatedAt: serverTimestamp()
          });
        } catch {
          // Provider doc may not exist
        }
      }
    }
  };

  // Step 1 of Phone Auth (Login or New Registration): Send SMS OTP
  const handleSendSmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const normalized = normalizePhone(phone.trim());
    const e164 = toE164Phone(phone.trim());

    if (normalized.length < 10 || !e164.startsWith('+') || e164.length < 11) {
      setError(
        lang === 'ar'
          ? 'اكتب رقم موبايل مصري صحيح (11 رقم مثلاً 01012345678).'
          : 'Please enter a valid mobile number (e.g. 01012345678).'
      );
      return;
    }

    if (authTab === 'register') {
      if (!displayName.trim()) {
        setError(lang === 'ar' ? 'اكتب اسمك بالكامل الأول.' : 'Please enter your full name.');
        return;
      }
      if (!address.trim()) {
        setError(
          lang === 'ar'
            ? 'اكتب عنوانك بالتفصيل (الناحية والشارع أو علامة مميزة).'
            : 'Please enter your full address in the village.'
        );
        return;
      }
      if (role === 'provider' && !serviceTitle.trim()) {
        setError(lang === 'ar' ? 'اكتب تخصصك أو اسم المحل / العيادة.' : 'Please enter your service specialty.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const verifier = getOrCreateRecaptcha();
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      setConfirmationResult(result);
      setSentToDisplay(e164);
      setSmsStep('otp');
      setOtpCode('');
    } catch (err) {
      console.error('Phone SMS send error:', err);
      setError(mapPhoneAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 of Phone Auth: Verify 6-digit SMS Code
  const handleVerifySmsOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    const cleanCode = otpCode.trim();
    if (cleanCode.length < 4) {
      setError(
        lang === 'ar'
          ? 'اكتب كود التأكيد المكون من 6 أرقام اللي وصلك في الرسالة.'
          : 'Enter the 6-digit verification code sent to your phone.'
      );
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(cleanCode);
      const signedInUser = credential.user;
      const normalized = normalizePhone(signedInUser.phoneNumber || phone.trim());

      // Check phone ban now that user is authenticated
      const banMessage = await checkBanForPhone(normalized);
      if (banMessage) {
        setError(banMessage);
        await signOut(auth);
        setSmsStep('form');
        setConfirmationResult(null);
        setIsLoading(false);
        return;
      }

      const existingSnap = await getDoc(doc(db, 'users', signedInUser.uid));

      if (authTab === 'login') {
        if (existingSnap.exists()) {
          const existingProfile = existingSnap.data() as UserProfile;
          if (isBanCurrentlyActive(existingProfile.isBanned, existingProfile.banUntilMs, false)) {
            setError(
              lang === 'ar'
                ? 'حسابك محظور حالياً من استخدام المنصة.'
                : 'Your account is currently banned.'
            );
            await signOut(auth);
            setIsLoading(false);
            return;
          }
          setSuccessMsg(
            lang === 'ar'
              ? `أهلاً بيك يا ${existingProfile.displayName}! تم تسجيل الدخول بنجاح.`
              : `Welcome back, ${existingProfile.displayName}!`
          );
          onProfileSaved();
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 1100);
          return;
        } else {
          // Phone verified, but no profile yet -> let user fill Name & Address right now!
          setPhone(normalized);
          setAuthTab('register');
          setSmsStep('form');
          setError(
            lang === 'ar'
              ? 'تم تأكيد رقم موبايلك! بس لسه مفيش بيانات مسجلة بالرقم ده — اكتب اسمك وعنوانك عشان تفعّل حسابك.'
              : 'Phone verified! No profile found yet — enter your name and address to activate your account.'
          );
          return;
        }
      }

      // Registration flow: Save profile immediately (or keep existing if already created)
      await writeUserAndProviderDocs(signedInUser.uid, normalized, !existingSnap.exists());

      setSuccessMsg(
        role === 'provider' && !existingSnap.exists()
          ? lang === 'ar'
            ? 'تم تأكيد الموبايل وتسجيل طلبك كمقدم خدمة! مستني موافقة الأدمن.'
            : 'Phone verified & provider application submitted for admin approval!'
          : lang === 'ar'
          ? 'تم تأكيد رقم الهاتف وإنشاء حسابك بنجاح! أهلاً بيك في المنصة.'
          : 'Phone verified & account created successfully!'
      );
      onProfileSaved();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1300);
    } catch (err) {
      console.error('OTP verify error:', err);
      setError(mapPhoneAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Admin / Google fallback login
  const handleAdminGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        lang === 'ar'
          ? 'حصلت مشكلة في دخول الإدارة بجوجل، جرب تاني.'
          : 'Could not sign in with Google. Please try again.'
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressAvatarToDataUrl(file);
      if (compressed.length > 42000) {
        setError(
          lang === 'ar'
            ? 'حجم الصورة كبير، جرب صورة أصغر.'
            : 'Image size is too large, please pick a smaller image.'
        );
        return;
      }
      setPhotoUrl(compressed);
    } catch {
      setError(lang === 'ar' ? 'تعذر قراءة الصورة، جرب صورة تانية.' : 'Could not load image.');
    }
  };

  // Save/update profile for an already-authenticated user
  const handleSaveAuthenticatedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    if (isBanned) {
      setError(
        lang === 'ar'
          ? 'حسابك أو رقم موبايلك محظور حالياً من التعديل أو الاستخدام.'
          : 'Your account or phone number is currently banned.'
      );
      return;
    }

    const normalized = normalizePhone(phone.trim());
    if (!displayName.trim() || normalized.length < 10 || !address.trim()) {
      setError(
        lang === 'ar'
          ? 'لازم تدخل الاسم بالكامل ورقم الموبايل (11 رقم) والعنوان بالتفصيل.'
          : 'Please enter your full name, valid mobile phone, and full address.'
      );
      return;
    }

    if (role === 'provider' && !serviceTitle.trim()) {
      setError(lang === 'ar' ? 'اكتب تخصصك أو نوع خدمتك.' : 'Please specify your service specialty.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const banMessage = await checkBanForPhone(normalized);
      if (banMessage) {
        setError(banMessage);
        setIsLoading(false);
        return;
      }

      await writeUserAndProviderDocs(firebaseUser.uid, normalized, !userProfile);

      setSuccessMsg(
        role === 'provider' && !userProfile
          ? lang === 'ar'
            ? 'اتسجل طلبك كمقدم خدمة! مستني موافقة الأدمن عشان خدمتك تظهر لأهل القرية.'
            : 'Provider application submitted! Waiting for admin approval.'
          : lang === 'ar'
          ? 'تم حفظ بيانات حسابك بنجاح!'
          : 'Account profile saved!'
      );
      onProfileSaved();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1300);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceCategories: { id: ProviderCategory; ar: string; en: string }[] = [
    { id: 'doctor', ar: 'دكتور / عيادة / تمريض', en: 'Doctor / Clinic / Nurse' },
    { id: 'pharmacy', ar: 'صيدلية / مستلزمات طبية', en: 'Pharmacy' },
    { id: 'food', ar: 'مطعم / كافيه / أكل بيتي / فرن', en: 'Restaurant / Cafe / Bakery' },
    { id: 'technician', ar: 'فني وحرفي (كهربائي، سباك، نجار، تكييف)', en: 'Technician / Craftsman' },
    { id: 'ride', ar: 'سواق / مواصلات وتوصيل', en: 'Driver / Rides' },
    { id: 'grocery', ar: 'بقالة وسوبر ماركت', en: 'Grocery & Supermarket' },
    { id: 'tutoring', ar: 'مدرس / دروس ومعلمون', en: 'Tutoring & Teachers' },
    { id: 'charity', ar: 'جمعية خيرية / تكافل', en: 'Charitable Organization' },
    { id: 'other', ar: 'أخرى (أي نشاط أو خدمة مش موجودة)', en: 'Other Activities & Services' }
  ];

  const displayAvatar = photoUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden Invisible reCAPTCHA mount container */}
        <div ref={recaptchaDivRef} id="noqbas-recaptcha-container" className="hidden" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {!firebaseUser
                ? authTab === 'login'
                  ? lang === 'ar'
                    ? 'تسجيل الدخول (لديك حساب بالفعل)'
                    : 'Sign In (Existing Account)'
                  : lang === 'ar'
                  ? 'تسجيل حساب جديد (مستخدم جديد)'
                  : 'Create New Account'
                : isAdmin
                ? lang === 'ar'
                  ? 'حساب الأدمن العام'
                  : 'Platform Admin Account'
                : t.account}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {!firebaseUser
                ? lang === 'ar'
                  ? 'التسجيل بالاسم ورقم الهاتف والعنوان — مع تأكيد الهاتف برسالة SMS'
                  : 'Register with Name, Phone & Address — verified via SMS code'
                : userProfile?.phone || firebaseUser.phoneNumber || firebaseUser.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {!firebaseUser ? (
            <div className="space-y-4">
              {/* Two Explicit Mode Tabs: Existing Account vs New User */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setSmsStep('form');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'لديك حساب بالفعل' : 'Have an Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setSmsStep('form');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'مستخدم جديد (تسجيل)' : 'New User (Register)'}</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 leading-relaxed">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold">
                  {successMsg}
                </div>
              )}

              {smsStep === 'otp' ? (
                /* Step 2: SMS Verification Code Entry */
                <form onSubmit={handleVerifySmsOtp} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-center">
                    <MessageSquareCode className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-950 dark:text-emerald-100">
                      {lang === 'ar'
                        ? 'تم إرسال رسالة نصية بكود التأكيد!'
                        : 'SMS Verification Code Sent!'}
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {lang === 'ar'
                        ? `شوف الرسايل على رقم الموبايل (${sentToDisplay}) واكتب كود التأكيد لتفعيل الدخول:`
                        : `Enter the 6-digit code sent via SMS to ${sentToDisplay}:`}
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.smsOtpLabel} *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSmsStep('form');
                        setOtpCode('');
                        setError('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تعديل الرقم' : 'Change Number'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري التحقق...'
                          : 'Verifying...'
                        : authTab === 'register'
                        ? lang === 'ar'
                          ? 'تأكيد الهاتف وإنشاء الحساب'
                          : 'Verify & Create Account'
                        : t.verifySmsCode}
                    </button>
                  </div>
                </form>
              ) : authTab === 'login' ? (
                /* Tab 1 Form: Existing Account Sign-In by Phone */
                <form onSubmit={handleSendSmsOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {lang === 'ar'
                      ? 'اكتب رقم موبايلك المسجل عشان نبعتلك كود دخول في رسالة نصية SMS وتفتح خدمات القرية.'
                      : 'Enter your registered mobile phone number to receive an SMS login code.'}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline me-1 text-amber-600" />
                      {t.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageSquareCode className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري إرسال الرسالة...'
                          : 'Sending SMS...'
                        : t.sendSmsCode}
                    </span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('register');
                        setError('');
                      }}
                      className="text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      {lang === 'ar'
                        ? 'مستخدم جديد ومعندكش حساب؟ سجل حساب جديد دلوقتي'
                        : 'New user? Create a new account'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Tab 2 Form: New User Registration (Name + Phone + Address + SMS Verification, NO Email) */
                <form onSubmit={handleSendSmsOtp} className="space-y-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ar' ? 'نوع الحساب إيه؟' : 'Account Type'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('resident')}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          role === 'resident'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'مستخدم (أهالي البلد)' : 'Resident'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('provider')}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          role === 'provider'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'مقدم خدمة / محل' : 'Service Provider'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Avatar */}
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'ar' ? 'صورة شخصية (اختياري)' : 'Photo (Optional)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
                      >
                        {photoUrl ? (lang === 'ar' ? 'تغيير' : 'Change') : (lang === 'ar' ? 'اختيار صورة' : 'Upload')}
                      </button>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="p-1.5 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t.name} *
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: الحاج محمد علي' : 'Full name'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Phone className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'رقم الهاتف (لتأكيد SMS) *' : 'Mobile Phone (SMS Verified) *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <MapPin className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'القرية *' : 'Village *'}
                      </label>
                      <select
                        value={villageId}
                        onChange={(e) => setVillageId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        {villages.map((v) => (
                          <option key={v.id} value={v.id}>
                            {lang === 'ar' ? v.nameAr : v.nameEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Home className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'العنوان بالتفصيل *' : 'Full Address *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={lang === 'ar' ? 'الناحية / الشارع / علامة مميزة' : 'Quarter / Street / Landmark'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {role === 'provider' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                      <div className="font-bold text-amber-900 dark:text-amber-300">
                        {lang === 'ar' ? 'بيانات الخدمة (يوافق عليها الأدمن)' : 'Provider Details'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <select
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value as ProviderCategory)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          {serviceCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {lang === 'ar' ? c.ar : c.en}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={serviceFeeEgp}
                          onChange={(e) => setServiceFeeEgp(e.target.value)}
                          placeholder={lang === 'ar' ? 'السعر المبدئي (مثلاً: 80 ج.م)' : 'Starting Fee (e.g. 80 EGP)'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <input
                        type="text"
                        required
                        value={serviceTitle}
                        onChange={(e) => setServiceTitle(e.target.value)}
                        placeholder={lang === 'ar' ? 'التخصص أو اسم المحل / العيادة *' : 'Specialty / Shop Name *'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <textarea
                        rows={2}
                        value={serviceBio}
                        onChange={(e) => setServiceBio(e.target.value)}
                        placeholder={lang === 'ar' ? 'نبذة عن شغلك أو مواعيدك...' : 'Short bio & hours...'}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <MessageSquareCode className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري إرسال رسالة التأكيد...'
                          : 'Sending SMS...'
                        : lang === 'ar'
                        ? 'إرسال رسالة نصية لتأكيد الهاتف والمتابعة'
                        : 'Send SMS Verification Code'}
                    </span>
                  </button>
                </form>
              )}

              {/* Discreet Admin Sign-In Section (Admin RBAC preserved) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="truncate">
                  {lang === 'ar'
                    ? `دخول الإدارة (${ADMIN_EMAIL}):`
                    : `Platform Admin (${ADMIN_EMAIL}):`}
                </span>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleAdminGoogleSignIn}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'ar' ? 'دخول الأدمن (Google)' : 'Admin Google Login'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Signed-in Account / Complete Registration Form */
            <div className="space-y-4">
              {isBanned && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200">
                  <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">
                      {lang === 'ar' ? 'حسابك / رقم هاتفك محظور حالياً على المنصة' : 'Your account/phone is banned'}
                    </div>
                    <div className="text-[11px]">
                      {banUntilMs && banUntilMs > 0
                        ? lang === 'ar'
                          ? `ينتهي الحظر في: ${new Date(banUntilMs).toLocaleString('ar-EG')}`
                          : `Ban expires: ${new Date(banUntilMs).toLocaleString('en-US')}`
                        : lang === 'ar'
                        ? 'حظر دائم بقرار من إدارة المنصة'
                        : 'Permanent platform ban'}
                      {banReason ? ` · ${banReason}` : ''}
                    </div>
                  </div>
                </div>
              )}

              {(!userProfile || !userProfile.phone || !userProfile.address) && !isBanned && !isAdmin && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold">
                  {lang === 'ar'
                    ? 'كمل بيانات حسابك (الاسم، رقم الهاتف، والعنوان) واضغط حفظ عشان تستفيد بكل خدمات المنصة.'
                    : 'Please complete your Name, Phone Number, and Address to unlock all platform services.'}
                </div>
              )}

              {isAdmin && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-amber-950 dark:text-amber-100">
                        {lang === 'ar' ? 'أهلاً يا أدمن المنصة!' : 'Welcome, Platform Admin!'}
                      </div>
                      <div className="text-[11px] text-amber-700 dark:text-amber-300">
                        {lang === 'ar'
                          ? 'تقدر تتابع الإحصائيات والمستخدمين والحظر وتبديل القرى.'
                          : 'View analytics, manage users/bans, and moderate ads & providers.'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminPanel();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap cursor-pointer"
                  >
                    {t.adminPanel}
                  </button>
                </div>
              )}

              {userProfile?.role === 'provider' && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                    userProfile.providerStatus === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : userProfile.providerStatus === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {userProfile.providerStatus === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : userProfile.providerStatus === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div className="font-bold">
                    {userProfile.providerStatus === 'approved'
                      ? lang === 'ar'
                        ? 'حسابك كمقدم خدمة مقبول ومفعل على المنصة ✓'
                        : 'Your provider account is Approved & Live ✓'
                      : userProfile.providerStatus === 'rejected'
                      ? lang === 'ar'
                        ? 'للأسف الأدمن رفض الطلب حالياً — راجع بياناتك'
                        : 'Provider request not approved yet'
                      : lang === 'ar'
                      ? 'حسابك كمقدم خدمة لسه في المراجعة من الأدمن'
                      : 'Your provider profile is Pending Admin Approval'}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Optional Profile Photo Upload */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {(displayName || phone || 'U').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'صورة الحساب (اختياري)' : 'Profile Photo (Optional)'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lang === 'ar'
                        ? 'تقدر تضيف صورة شخصية أو تغيرها في أي وقت.'
                        : 'Upload or change your avatar anytime.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 hover:bg-slate-100 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{photoUrl ? (lang === 'ar' ? 'تغيير' : 'Change') : (lang === 'ar' ? 'إضافة صورة' : 'Upload')}</span>
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      title={lang === 'ar' ? 'حذف الصورة' : 'Remove photo'}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveAuthenticatedProfile} className="space-y-3.5">
                {!userProfile && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ar' ? 'نوع الحساب إيه؟' : 'Account Type'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('resident')}
                        className={`p-2.5 rounded-xl border font-bold text-center transition-colors cursor-pointer ${
                          role === 'resident'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lang === 'ar' ? 'مستخدم (أهالي القرية)' : 'Village Resident'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('provider')}
                        className={`p-2.5 rounded-xl border font-bold text-center transition-colors cursor-pointer ${
                          role === 'provider'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lang === 'ar' ? 'مقدم خدمة (شغل/عيادة)' : 'Service Provider'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.name} *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: الحاج محمد علي' : 'Full name'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <Phone className="w-3 h-3 inline me-1" />
                      {lang === 'ar' ? 'رقم الهاتف *' : 'Mobile Phone *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <MapPin className="w-3 h-3 inline me-1" />
                      {lang === 'ar' ? 'القرية *' : 'Village *'}
                    </label>
                    <select
                      value={villageId}
                      onChange={(e) => setVillageId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {lang === 'ar' ? v.nameAr : v.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <Home className="w-3 h-3 inline me-1" />
                      {lang === 'ar' ? 'العنوان بالتفصيل *' : 'Full Address *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: الناحية الشرقية - شارع المسجد' : 'East Quarter - Mosque St'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {role === 'provider' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-3">
                    <div className="font-bold text-amber-900 dark:text-amber-300">
                      {lang === 'ar' ? 'بيانات الخدمة (تظهر بعد موافقة الأدمن)' : 'Service Provider Details'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'ar' ? 'مجال الشغل' : 'Category'}
                        </label>
                        <select
                          value={serviceCategory}
                          onChange={(e) => setServiceCategory(e.target.value as ProviderCategory)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          {serviceCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {lang === 'ar' ? c.ar : c.en}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'ar' ? 'السعر المبدئي (ج.م)' : 'Starting Fee (EGP)'}
                        </label>
                        <input
                          type="text"
                          value={serviceFeeEgp}
                          onChange={(e) => setServiceFeeEgp(e.target.value)}
                          placeholder={lang === 'ar' ? 'مثال: 80 ج.م / زيارة' : 'e.g. 80 EGP / visit'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'اسم التخصص / المحل / العيادة *' : 'Specialty / Shop Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceTitle}
                        onChange={(e) => setServiceTitle(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: سباك ومصلح مواتير ميه' : 'e.g. Plumber & Pump Repair'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'نبذة عن شغلك أو مواعيدك' : 'Short Bio & Hours'}
                      </label>
                      <textarea
                        rows={2}
                        value={serviceBio}
                        onChange={(e) => setServiceBio(e.target.value)}
                        placeholder={lang === 'ar' ? 'احكي لأهل البلد عن خبرتك ومواعيد الشغل...' : 'Describe your experience and hours...'}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </button>

                  {!isBanned && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري الحفظ...'
                          : 'Saving...'
                        : userProfile
                        ? lang === 'ar'
                          ? 'تحديث البيانات'
                          : 'Update Profile'
                        : lang === 'ar'
                        ? 'حفظ وتفعيل الحساب'
                        : 'Complete Account Setup'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
