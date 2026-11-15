import React, { useState, useEffect, useRef } from 'react';
import {
  User as FirebaseUser,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  updatePassword,
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
  BannedPhoneRecord,
  DemoTestAccount,
  ServiceSectionConfig,
  TEST_DEMO_ACCOUNTS,
  normalizePhone,
  phoneToAuthEmail,
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
  Home,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialMode?: 'login' | 'register';
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeDemoAccount?: DemoTestAccount | null;
  onLoginDemoAccount: (account: DemoTestAccount) => void;
  onLogoutDemoAccount: () => void;
  isAdmin: boolean;
  isBanned?: boolean;
  banReason?: string;
  banUntilMs?: number;
  sections?: ServiceSectionConfig[];
  onProfileSaved: () => void;
  onOpenAdminPanel: () => void;
}

type ProviderCategory = string;

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
  activeDemoAccount = null,
  onLoginDemoAccount,
  onLogoutDemoAccount,
  isAdmin,
  isBanned,
  banReason,
  banUntilMs,
  sections,
  onProfileSaved,
  onOpenAdminPanel
}) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recaptchaDivRef = useRef<HTMLDivElement | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Dual Auth Tabs: 'login' (Phone + Password) vs 'register' (Details + Password + SMS OTP)
  const [authTab, setAuthTab] = useState<'login' | 'register'>(initialMode);
  const [smsStep, setSmsStep] = useState<'form' | 'otp'>('form');
  const [forgotStep, setForgotStep] = useState<'none' | 'phone' | 'otp' | 'new_password'>('none');
  const [isCompletingRegister, setIsCompletingRegister] = useState(false);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [sentToDisplay, setSentToDisplay] = useState('');

  // Login / Register / Reset Password Inputs
  const [role, setRole] = useState<'resident' | 'provider'>('resident');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Optional Change Password inside Profile
  const [showChangePwdBox, setShowChangePwdBox] = useState(false);
  const [profileNewPwd, setProfileNewPwd] = useState('');
  const [profileConfirmPwd, setProfileConfirmPwd] = useState('');

  const [photoUrl, setPhotoUrl] = useState('');
  const villageId = 'noqbas';
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
      setForgotStep('none');
      setIsCompletingRegister(false);
      return;
    }

    setAuthTab(initialMode);
    setSmsStep('form');
    setForgotStep('none');
    setIsCompletingRegister(false);
    setConfirmationResult(null);
    setOtpCode('');
    setSentToDisplay('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowChangePwdBox(false);
    setProfileNewPwd('');
    setProfileConfirmPwd('');
    setError('');
    setSuccessMsg('');
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (activeDemoAccount) {
      setDisplayName(activeDemoAccount.displayName || '');
      setPhone(activeDemoAccount.phone || '');
      setAddress(activeDemoAccount.address || activeDemoAccount.neighborhood || '');
      setPhotoUrl(activeDemoAccount.photoUrl || '');
      setRole(activeDemoAccount.role);
      if (
        activeDemoAccount.serviceCategory &&
        activeDemoAccount.serviceCategory !== 'none' &&
        activeDemoAccount.serviceCategory !== 'farm'
      ) {
        setServiceCategory(activeDemoAccount.serviceCategory);
      }
      setServiceTitle(activeDemoAccount.serviceTitle || '');
      setServiceFeeEgp(activeDemoAccount.serviceFeeEgp || '');
      setServiceBio(activeDemoAccount.serviceBio || '');
    } else if (firebaseUser) {
      const normalizedAuthPhone = firebaseUser.phoneNumber
        ? normalizePhone(firebaseUser.phoneNumber)
        : '';
      setDisplayName(userProfile?.displayName || firebaseUser.displayName || '');
      setPhone(userProfile?.phone || normalizedAuthPhone || '');
      setAddress(userProfile?.address || userProfile?.neighborhood || '');
      setPhotoUrl(userProfile?.photoUrl || '');
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
    }
  }, [activeDemoAccount, firebaseUser, userProfile, isOpen]);

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

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      return lang === 'ar'
        ? 'خدمة تسجيل الدخول بكلمة السر أو التحقق بـ SMS غير مفعلة حالياً في إعدادات Firebase Authentication. فعّل كل من Phone و Email/Password من Firebase Console.'
        : 'Phone or Email/Password sign-in is not enabled in Firebase Console yet (Authentication -> Sign-in method -> enable both Phone and Email/Password).';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return lang === 'ar'
        ? 'رقم الموبايل أو كلمة السر مش صحيحة! تأكد من البيانات أو اضغط «نسيت كلمة المرور؟».'
        : 'Incorrect mobile phone number or password. Please check or click Forgot Password.';
    }
    if (code === 'auth/weak-password') {
      return lang === 'ar'
        ? 'كلمة السر ضعيفة! لازم تكون 6 حروف أو أرقام على الأقل.'
        : 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
      return lang === 'ar'
        ? 'رقم الموبايل ده مسجل بالفعل بحساب! جرب تسجيل الدخول أو اضغط «نسيت كلمة المرور؟».'
        : 'This phone number already has a registered password account. Please sign in or reset your password.';
    }
    if (code === 'auth/requires-recent-login') {
      return lang === 'ar'
        ? 'محتاج تأكيد حديث للهاتف! سجل خروج واستخدم «نسيت كلمة المرور؟» لإعادة تعيين كلمة السر برسالة SMS.'
        : 'Recent verification required. Sign out and use Forgot Password via SMS OTP.';
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
        ? 'محاولات كتير ورا بعض، استنى شوية وجرب تاني.'
        : 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (code === 'auth/billing-not-enabled') {
      return lang === 'ar'
        ? 'إرسال رسائل SMS حقيقية يتطلب تفعيل خطة Blaze أو إضافة رقم اختبار (Test phone number) في Firebase Authentication.'
        : 'Real SMS delivery requires Blaze plan or a configured Test Phone Number in Firebase Console -> Authentication -> Sign-in method -> Phone.';
    }
    return lang === 'ar'
      ? `حصل خطأ (${code || msg}).`
      : `Authentication error (${code || msg}).`;
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

  // =========================================================================
  // FLOW 1: Login with Phone + Password (NO OTP)
  // =========================================================================
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const normalized = normalizePhone(phone.trim());
    if (normalized.length < 10) {
      setError(
        lang === 'ar'
          ? 'اكتب رقم موبايل صحيح (مثلاً 01012345678).'
          : 'Please enter a valid mobile number (e.g. 01012345678).'
      );
      return;
    }
    if (password.length < 6) {
      setError(
        lang === 'ar'
          ? 'اكتب كلمة السر (6 حروف أو أرقام على الأقل).'
          : 'Please enter your password (at least 6 characters).'
      );
      return;
    }

    // Support Test Demo Accounts via Phone + Password (123456)
    const matchedDemo = TEST_DEMO_ACCOUNTS.find(
      (acc) => normalizePhone(acc.phone) === normalized && acc.password === password
    );
    if (matchedDemo) {
      onLoginDemoAccount(matchedDemo);
      setSuccessMsg(
        lang === 'ar'
          ? `أهلاً بيك يا ${matchedDemo.displayName}! تم تسجيل الدخول بحساب التجربة.`
          : `Welcome back, ${matchedDemo.displayName}!`
      );
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
      return;
    }

    setIsLoading(true);
    try {
      const authEmail = phoneToAuthEmail(normalized);
      const cred = await signInWithEmailAndPassword(auth, authEmail, password);
      const signedInUser = cred.user;

      // Check phone ban
      const banMessage = await checkBanForPhone(normalized);
      if (banMessage) {
        setError(banMessage);
        await signOut(auth);
        setIsLoading(false);
        return;
      }

      const existingSnap = await getDoc(doc(db, 'users', signedInUser.uid));
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
      } else {
        setSuccessMsg(
          lang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!'
        );
      }

      onProfileSaved();
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 950);
    } catch (err) {
      console.error('Phone+Password login error:', err);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // FLOW 2: New Registration (Step 1: Send SMS OTP, Step 2: Verify + Link Password)
  // =========================================================================
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
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
    if (password.length < 6) {
      setError(
        lang === 'ar'
          ? 'اختار كلمة سر قوية (6 حروف أو أرقام على الأقل).'
          : 'Password must be at least 6 characters.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setError(
        lang === 'ar'
          ? 'كلمتا السر مش متطابقتين! تأكد منهم.'
          : 'Passwords do not match.'
      );
      return;
    }
    if (role === 'provider' && !serviceTitle.trim()) {
      setError(lang === 'ar' ? 'اكتب تخصصك أو اسم المحل / العيادة.' : 'Please enter your service specialty.');
      return;
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
      console.error('Register SMS send error:', err);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
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
    setIsCompletingRegister(true);
    try {
      const credential = await confirmationResult.confirm(cleanCode);
      const signedInUser = credential.user;
      const normalized = normalizePhone(signedInUser.phoneNumber || phone.trim());

      // 1. Check ban status
      const banMessage = await checkBanForPhone(normalized);
      if (banMessage) {
        setError(banMessage);
        await signOut(auth);
        setIsCompletingRegister(false);
        setSmsStep('form');
        setConfirmationResult(null);
        setIsLoading(false);
        return;
      }

      // 2. Check if already registered
      const existingSnap = await getDoc(doc(db, 'users', signedInUser.uid));
      if (existingSnap.exists()) {
        await signOut(auth);
        setIsCompletingRegister(false);
        setAuthTab('login');
        setSmsStep('form');
        setConfirmationResult(null);
        setOtpCode('');
        setPassword('');
        setConfirmPassword('');
        setError(
          lang === 'ar'
            ? 'رقم الموبايل ده مسجل بالفعل! سجل دخولك برقم الهاتف وكلمة السر، أو اضغط «نسيت كلمة المرور؟» لو نسيتها.'
            : 'This phone number is already registered! Sign in with Phone & Password, or use Forgot Password.'
        );
        setIsLoading(false);
        return;
      }

      // 3. Link password credential so future logins use Phone + Password without OTP
      const authEmail = phoneToAuthEmail(normalized);
      const hasPasswordProvider = signedInUser.providerData.some(
        (p) => p.providerId === 'password'
      );
      if (hasPasswordProvider) {
        await updatePassword(signedInUser, password);
      } else {
        await linkWithCredential(
          signedInUser,
          EmailAuthProvider.credential(authEmail, password)
        );
      }

      // 4. Save user & optional provider doc
      await writeUserAndProviderDocs(signedInUser.uid, normalized, true);

      setSuccessMsg(
        role === 'provider'
          ? lang === 'ar'
            ? 'تم تأكيد الموبايل وتسجيل طلبك كمقدم خدمة! مستني موافقة الأدمن.'
            : 'Phone verified & provider application submitted for admin approval!'
          : lang === 'ar'
          ? 'تم تأكيد رقم الهاتف وإنشاء حسابك بنجاح! تقدر تدخل برقمك وكلمة السر في أي وقت.'
          : 'Phone verified & account created successfully!'
      );
      onProfileSaved();
      setTimeout(() => {
        setSuccessMsg('');
        setIsCompletingRegister(false);
        onClose();
      }, 1300);
    } catch (err) {
      console.error('Register OTP verify error:', err);
      setIsCompletingRegister(false);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // FLOW 3: Forgot Password (SMS OTP -> Set New Password)
  // =========================================================================
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const normalized = normalizePhone(phone.trim());
    const e164 = toE164Phone(phone.trim());
    if (normalized.length < 10 || !e164.startsWith('+') || e164.length < 11) {
      setError(
        lang === 'ar'
          ? 'اكتب رقم الموبايل المسجل بشكل صحيح (مثلاً 01012345678).'
          : 'Please enter a valid registered mobile number.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const verifier = getOrCreateRecaptcha();
      const result = await signInWithPhoneNumber(auth, e164, verifier);
      setConfirmationResult(result);
      setSentToDisplay(e164);
      setForgotStep('otp');
      setOtpCode('');
    } catch (err) {
      console.error('Forgot password SMS error:', err);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    const cleanCode = otpCode.trim();
    if (cleanCode.length < 4) {
      setError(
        lang === 'ar'
          ? 'اكتب كود التأكيد المكون من 6 أرقام.'
          : 'Please enter the 6-digit SMS verification code.'
      );
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const credential = await confirmationResult.confirm(cleanCode);
      const signedInUser = credential.user;
      const normalized = normalizePhone(signedInUser.phoneNumber || phone.trim());

      const banMessage = await checkBanForPhone(normalized);
      if (banMessage) {
        setError(banMessage);
        await signOut(auth);
        setForgotStep('phone');
        setConfirmationResult(null);
        setIsLoading(false);
        return;
      }

      const existingSnap = await getDoc(doc(db, 'users', signedInUser.uid));
      if (!existingSnap.exists()) {
        await signOut(auth);
        setForgotStep('none');
        setAuthTab('register');
        setSmsStep('form');
        setError(
          lang === 'ar'
            ? 'الرقم ده مش متسجل قبل كده! اعمل حساب جديد من هنا.'
            : 'No account found for this phone number yet. Please create a new account.'
        );
        setIsLoading(false);
        return;
      }

      setNewPassword('');
      setConfirmNewPassword('');
      setForgotStep('new_password');
    } catch (err) {
      console.error('Forgot password OTP verify error:', err);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError(
        lang === 'ar'
          ? 'كلمة السر الجديدة لازم تكون 6 حروف أو أرقام على الأقل.'
          : 'New password must be at least 6 characters.'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(
        lang === 'ar'
          ? 'كلمتا السر الجداد مش متطابقتين!'
          : 'Passwords do not match.'
      );
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError(lang === 'ar' ? 'انتهت جلسة التحقق، جرب إرسال الكود تاني.' : 'Verification session expired.');
      setForgotStep('phone');
      return;
    }

    setIsLoading(true);
    try {
      const normalized = normalizePhone(currentUser.phoneNumber || phone.trim());
      const authEmail = phoneToAuthEmail(normalized);
      const hasPasswordProvider = currentUser.providerData.some(
        (p) => p.providerId === 'password'
      );

      if (hasPasswordProvider) {
        await updatePassword(currentUser, newPassword);
      } else {
        await linkWithCredential(
          currentUser,
          EmailAuthProvider.credential(authEmail, newPassword)
        );
      }

      setSuccessMsg(
        lang === 'ar'
          ? 'تم تغيير كلمة السر بنجاح! تقدر تسجل دخولك بيها بعد كده مباشرة.'
          : 'Password updated successfully! You can now sign in with your phone & new password.'
      );
      onProfileSaved();
      setTimeout(() => {
        setSuccessMsg('');
        setForgotStep('none');
        onClose();
      }, 1300);
    } catch (err) {
      console.error('Set new password error:', err);
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Change Password inside Signed-in Profile View
  const handleProfileChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError('');
    setSuccessMsg('');

    if (profileNewPwd.length < 6) {
      setError(
        lang === 'ar'
          ? 'كلمة السر الجديدة لازم تكون 6 حروف أو أرقام على الأقل.'
          : 'Password must be at least 6 characters.'
      );
      return;
    }
    if (profileNewPwd !== profileConfirmPwd) {
      setError(lang === 'ar' ? 'كلمتا السر مش متطابقتين.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const normalized = normalizePhone(userProfile?.phone || firebaseUser.phoneNumber || phone.trim());
      const hasPasswordProvider = firebaseUser.providerData.some((p) => p.providerId === 'password');
      if (hasPasswordProvider) {
        await updatePassword(firebaseUser, profileNewPwd);
      } else {
        await linkWithCredential(
          firebaseUser,
          EmailAuthProvider.credential(phoneToAuthEmail(normalized), profileNewPwd)
        );
      }
      setShowChangePwdBox(false);
      setProfileNewPwd('');
      setProfileConfirmPwd('');
      setSuccessMsg(lang === 'ar' ? 'تم تحديث كلمة السر بنجاح ✓' : 'Password updated successfully ✓');
    } catch (err) {
      setError(mapAuthError(err));
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
    if (activeDemoAccount) {
      onLogoutDemoAccount();
      onClose();
      return;
    }
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
    if (activeDemoAccount) {
      onLoginDemoAccount({
        ...activeDemoAccount,
        displayName: displayName.trim() || activeDemoAccount.displayName,
        address: address.trim() || activeDemoAccount.address,
        neighborhood: address.trim() || activeDemoAccount.neighborhood,
        photoUrl: photoUrl || activeDemoAccount.photoUrl,
        serviceTitle: activeDemoAccount.role === 'provider' ? serviceTitle.trim() : '',
        serviceFeeEgp: activeDemoAccount.role === 'provider' ? serviceFeeEgp.trim() : '',
        serviceBio: activeDemoAccount.role === 'provider' ? serviceBio.trim() : ''
      });
      setSuccessMsg(
        lang === 'ar'
          ? 'تم تحديث بيانات حساب التجربة بنجاح ✓'
          : 'Test account profile updated ✓'
      );
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 900);
      return;
    }

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

  const defaultServiceCategories: { id: ProviderCategory; ar: string; en: string }[] = [
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

  const serviceCategories: { id: ProviderCategory; ar: string; en: string }[] =
    sections && sections.length > 0
      ? sections
          .filter((s) => s.isEnabled !== false)
          .slice()
          .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
          .map((s) => ({
            id: s.providerCategoryId || s.id,
            ar: s.nameAr,
            en: s.nameEn
          }))
      : defaultServiceCategories;

  const displayAvatar = photoUrl || '';
  const effectiveProfile = activeDemoAccount || userProfile;
  const effectiveSignedIn = Boolean(firebaseUser || activeDemoAccount);
  const showUnauthOrFlowView = !effectiveSignedIn || forgotStep !== 'none' || isCompletingRegister;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden Invisible reCAPTCHA mount container */}
        <div ref={recaptchaDivRef} id="noqbas-recaptcha-container" className="hidden" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {forgotStep !== 'none'
                ? lang === 'ar'
                  ? 'استعادة كلمة المرور'
                  : 'Reset Password'
                : showUnauthOrFlowView
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
              {forgotStep !== 'none'
                ? lang === 'ar'
                  ? 'تأكيد رقم الموبايل برسالة SMS لتعيين كلمة سر جديدة'
                  : 'Verify mobile phone via SMS OTP to set a new password'
                : showUnauthOrFlowView
                ? authTab === 'login'
                  ? lang === 'ar'
                    ? 'ادخل برقم الموبايل وكلمة السر مباشرة — قرية نقباس'
                    : 'Sign in with your mobile phone & password — Noqbas Village'
                  : lang === 'ar'
                  ? 'التسجيل بالاسم ورقم الهاتف والعنوان وكلمة السر — مع تأكيد الهاتف برسالة SMS'
                  : 'Register with Name, Phone, Address & Password — verified via SMS OTP'
                : effectiveProfile?.phone || firebaseUser?.phoneNumber || firebaseUser?.email}
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
          {showUnauthOrFlowView ? (
            <div key="auth-flow-container" className="space-y-4">
              {/* Two Explicit Mode Tabs (Hidden while in Forgot Password flow) */}
              {forgotStep === 'none' && (
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
              )}

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

              {forgotStep === 'phone' ? (
                /* Forgot Password Step 1: Enter Phone -> Send SMS OTP */
                <form key="forgot-phone-form" onSubmit={handleSendForgotOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 leading-relaxed">
                    {lang === 'ar'
                      ? 'اكتب رقم الموبايل المسجل بيه حسابك عشان نبعتلك كود تأكيد في رسالة SMS وتعمل كلمة سر جديدة.'
                      : 'Enter your registered mobile phone number to receive an SMS code and reset your password.'}
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

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('none');
                        setError('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'رجوع' : 'Back'}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MessageSquareCode className="w-4 h-4" />
                      <span>
                        {isLoading
                          ? lang === 'ar'
                            ? 'جاري الإرسال...'
                            : 'Sending SMS...'
                          : t.sendSmsCode}
                      </span>
                    </button>
                  </div>
                </form>
              ) : forgotStep === 'otp' ? (
                /* Forgot Password Step 2: Verify SMS OTP */
                <form key="forgot-otp-form" onSubmit={handleVerifyForgotOtp} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-center">
                    <MessageSquareCode className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-950 dark:text-emerald-100">
                      {lang === 'ar' ? 'تم إرسال رسالة التأكيد!' : 'SMS Verification Code Sent!'}
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {lang === 'ar'
                        ? `اكتب الـ 6 أرقام اللي وصلوك في رسالة على (${sentToDisplay}):`
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

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('phone');
                        setOtpCode('');
                        setError('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تعديل الرقم' : 'Change Phone'}</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري التأكيد...'
                          : 'Verifying...'
                        : lang === 'ar'
                        ? 'تأكيد الكود'
                        : 'Verify Code'}
                    </button>
                  </div>
                </form>
              ) : forgotStep === 'new_password' ? (
                /* Forgot Password Step 3: Set New Password */
                <form key="forgot-new-password-form" onSubmit={handleSaveForgotPassword} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'تم تأكيد رقم الهاتف! اكتب كلمة السر الجديدة لحسابك:'
                        : 'Phone verified! Enter a new password for your account:'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <Lock className="w-3.5 h-3.5 inline me-1 text-amber-600" />
                      {lang === 'ar' ? 'كلمة السر الجديدة *' : 'New Password *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={lang === 'ar' ? '6 حروف أو أرقام على الأقل' : 'Min 6 characters'}
                        className="w-full ps-3.5 pe-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute inset-y-0 end-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <Lock className="w-3.5 h-3.5 inline me-1 text-amber-600" />
                      {lang === 'ar' ? 'تأكيد كلمة السر الجديدة *' : 'Confirm New Password *'}
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder={lang === 'ar' ? 'اكتب كلمة السر الجديدة تاني' : 'Re-enter new password'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
                  >
                    {isLoading
                      ? lang === 'ar'
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                      : lang === 'ar'
                      ? 'حفظ كلمة السر الجديدة والدخول'
                      : 'Save New Password & Sign In'}
                  </button>
                </form>
              ) : smsStep === 'otp' ? (
                /* Register Step 2: SMS Verification Code Entry */
                <form key="register-otp-form" onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-center">
                    <MessageSquareCode className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="font-bold text-emerald-950 dark:text-emerald-100">
                      {lang === 'ar'
                        ? 'تم إرسال رسالة نصية بكود التأكيد!'
                        : 'SMS Verification Code Sent!'}
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {lang === 'ar'
                        ? `شوف الرسايل على رقم الموبايل (${sentToDisplay}) واكتب كود التأكيد لتفعيل الحساب:`
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
                      disabled={isLoading}
                      onClick={() => {
                        setSmsStep('form');
                        setOtpCode('');
                        setError('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تعديل البيانات' : 'Edit Info'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري التأكيد وإنشاء الحساب...'
                          : 'Creating Account...'
                        : lang === 'ar'
                        ? 'تأكيد الهاتف وإنشاء الحساب'
                        : 'Verify & Create Account'}
                    </button>
                  </div>
                </form>
              ) : authTab === 'login' ? (
                /* Tab 1 Form: Sign In by Phone + Password (NO OTP) */
                <form key="login-password-form" onSubmit={handlePasswordLogin} className="space-y-3.5">
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

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        <Lock className="w-3.5 h-3.5 inline me-1 text-amber-600" />
                        {lang === 'ar' ? 'كلمة السر *' : 'Password *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('phone');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={lang === 'ar' ? 'اكتب كلمة السر' : 'Enter password'}
                        className="w-full ps-3.5 pe-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 end-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? lang === 'ar'
                          ? 'جاري تسجيل الدخول...'
                          : 'Signing in...'
                        : lang === 'ar'
                        ? 'تسجيل الدخول'
                        : 'Sign In'}
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

                  {/* Quick Test Accounts Showcase (2 Users + 2 Service Providers) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {lang === 'ar'
                          ? 'حسابات التجربة السريعة (قرية نقباس)'
                          : 'Quick Test Accounts (Noqbas Village)'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? 'كلمة السر: 123456' : 'Pass: 123456'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TEST_DEMO_ACCOUNTS.map((acc) => {
                        const isProvider = acc.role === 'provider';
                        return (
                          <button
                            key={acc.uid}
                            type="button"
                            onClick={() => {
                              onLoginDemoAccount(acc);
                              onClose();
                            }}
                            className={`p-2.5 rounded-2xl border text-start transition-all cursor-pointer hover:shadow-xs ${
                              isProvider
                                ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50'
                                : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {acc.displayName}
                              </span>
                              <span
                                className={`text-[10px] font-bold shrink-0 ${
                                  isProvider
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {isProvider
                                  ? acc.providerStatus === 'approved'
                                    ? lang === 'ar'
                                      ? 'مقدم خدمة ✓'
                                      : 'Provider ✓'
                                    : lang === 'ar'
                                    ? 'مقدم خدمة (مراجعة)'
                                    : 'Provider (Pending)'
                                  : lang === 'ar'
                                  ? 'مستخدم'
                                  : 'User'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                {acc.phone}
                              </span>
                              <span className="font-bold text-amber-700 dark:text-amber-400">
                                {lang === 'ar' ? 'دخول سريع ←' : 'Quick Sign In →'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              ) : (
                /* Tab 2 Form: New User Registration (Name + Phone + Address + Password + SMS OTP) */
                <form key="register-form" onSubmit={handleSendRegisterOtp} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ar' ? 'نوع الحساب' : 'Account Type'}
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
                        <span>{lang === 'ar' ? 'مستخدم' : 'User'}</span>
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
                        <span>{lang === 'ar' ? 'مقدم خدمة' : 'Service Provider'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Avatar */}
                  <div className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
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
                        key="register-avatar-file-input"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        {lang === 'ar' ? 'رقم الهاتف (تأكيد SMS) *' : 'Mobile Phone (SMS) *'}
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

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        <Home className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'العنوان بالتفصيل في قرية نقباس *' : 'Full Address in Noqbas *'}
                      </label>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lang === 'ar' ? 'قرية نقباس' : 'Noqbas Village'}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={lang === 'ar' ? 'الناحية / الشارع / علامة مميزة' : 'Quarter / Street / Landmark'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Lock className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'كلمة السر *' : 'Password *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={lang === 'ar' ? '6 أحرف/أرقام على الأقل' : 'Min 6 characters'}
                          className="w-full ps-3 pe-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 end-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Lock className="w-3 h-3 inline me-1" />
                        {lang === 'ar' ? 'تأكيد كلمة السر *' : 'Confirm Password *'}
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={lang === 'ar' ? 'أعد كتابة كلمة السر' : 'Re-enter password'}
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
              {forgotStep === 'none' && (
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
              )}
            </div>
          ) : (
            /* Signed-in Account / Complete Registration Form */
            <div key="signed-in-profile-container" className="space-y-4">
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

              {(!effectiveProfile || !effectiveProfile.phone || !effectiveProfile.address) && !isBanned && !isAdmin && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold">
                  {lang === 'ar'
                    ? 'كمل بيانات حسابك (الاسم، رقم الهاتف، والعنوان) واضغط حفظ عشان تستفيد بكل خدمات المنصة.'
                    : 'Please complete your Name, Phone Number, and Address to unlock all platform services.'}
                </div>
              )}

              {activeDemoAccount && (
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 flex items-center justify-between gap-2">
                  <span className="font-bold">
                    {lang === 'ar'
                      ? `أنت مسجل حالياً بحساب تجربة (${activeDemoAccount.labelAr})`
                      : `Signed in with Test Account (${activeDemoAccount.labelEn})`}
                  </span>
                  <span className="font-mono text-[11px] font-bold">{activeDemoAccount.phone}</span>
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
                          ? 'تقدر تتابع الإحصائيات المفصلة، المستخدمين، الحظر، الإعلانات، وإعدادات قرية نقباس.'
                          : 'View analytics, manage users/bans, moderate ads, and customize Noqbas.'}
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

              {effectiveProfile?.role === 'provider' && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                    effectiveProfile.providerStatus === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : effectiveProfile.providerStatus === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {effectiveProfile.providerStatus === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : effectiveProfile.providerStatus === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div className="font-bold">
                    {effectiveProfile.providerStatus === 'approved'
                      ? lang === 'ar'
                        ? 'حسابك كمقدم خدمة مقبول ومفعل على المنصة ✓'
                        : 'Your provider account is Approved & Live ✓'
                      : effectiveProfile.providerStatus === 'rejected'
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
                    key="profile-avatar-file-input"
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

              <form key="authenticated-profile-form" onSubmit={handleSaveAuthenticatedProfile} className="space-y-3.5">
                {!effectiveProfile && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ar' ? 'نوع الحساب' : 'Account Type'}
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
                        {lang === 'ar' ? 'مستخدم' : 'User'}
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
                        {lang === 'ar' ? 'مقدم خدمة' : 'Service Provider'}
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
                      readOnly={Boolean(activeDemoAccount)}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      <Home className="w-3 h-3 inline me-1" />
                      {lang === 'ar' ? 'العنوان بالتفصيل في قرية نقباس *' : 'Full Address in Noqbas *'}
                    </label>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lang === 'ar' ? 'قرية نقباس' : 'Noqbas Village'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: الناحية الشرقية - شارع المسجد' : 'East Quarter - Mosque St'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
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
                        : effectiveProfile
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

              {/* Optional Change Password Toggle for Phone Accounts */}
              {!isAdmin && !isBanned && !activeDemoAccount && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePwdBox((v) => !v);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تغيير كلمة السر الحالية' : 'Change Password'}</span>
                  </button>

                  {showChangePwdBox && (
                    <form onSubmit={handleProfileChangePassword} className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={profileNewPwd}
                          onChange={(e) => setProfileNewPwd(e.target.value)}
                          placeholder={lang === 'ar' ? 'كلمة السر الجديدة (6+ حروف)' : 'New password'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={profileConfirmPwd}
                          onChange={(e) => setProfileConfirmPwd(e.target.value)}
                          placeholder={lang === 'ar' ? 'تأكيد كلمة السر الجديدة' : 'Confirm new password'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold cursor-pointer"
                      >
                        {lang === 'ar' ? 'حفظ كلمة السر الجديدة' : 'Save Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
