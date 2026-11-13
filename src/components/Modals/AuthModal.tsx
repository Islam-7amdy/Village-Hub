import React, { useState, useEffect } from 'react';
import { User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  handleFirestoreError,
  OperationType
} from '../../firebase';
import { Language, UserProfile, VillageConfig } from '../../data/villageData';
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
  Phone
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  villages: VillageConfig[];
  activeVillageId: string;
  onProfileSaved: () => void;
  onOpenAdminPanel: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang,
  firebaseUser,
  userProfile,
  isAdmin,
  villages,
  activeVillageId,
  onProfileSaved,
  onOpenAdminPanel
}) => {
  const t = TRANSLATIONS[lang];
  const [role, setRole] = useState<'resident' | 'provider'>('resident');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [villageId, setVillageId] = useState(activeVillageId);
  const [neighborhood, setNeighborhood] = useState('');
  const [serviceCategory, setServiceCategory] = useState<'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'farm' | 'ride'>('technician');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceFeeEgp, setServiceFeeEgp] = useState('');
  const [serviceBio, setServiceBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (firebaseUser) {
      setDisplayName(userProfile?.displayName || firebaseUser.displayName || '');
      setPhone(userProfile?.phone || '');
      setVillageId(userProfile?.villageId || activeVillageId);
      setNeighborhood(userProfile?.neighborhood || '');
      if (userProfile?.role) setRole(userProfile.role);
      if (userProfile?.serviceCategory && userProfile.serviceCategory !== 'none') {
        setServiceCategory(userProfile.serviceCategory);
      }
      setServiceTitle(userProfile?.serviceTitle || '');
      setServiceFeeEgp(userProfile?.serviceFeeEgp || '');
      setServiceBio(userProfile?.serviceBio || '');
    } else {
      setVillageId(activeVillageId);
    }
  }, [firebaseUser, userProfile, activeVillageId, isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(
        lang === 'ar'
          ? 'حصلت مشكلة في تسجيل الدخول بجوجل، جرب تاني.'
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

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!displayName.trim() || !phone.trim()) {
      setError(lang === 'ar' ? 'لازم تكتب اسمك ورقم موبايلك' : 'Please enter your name and phone number');
      return;
    }
    if (role === 'provider' && !serviceTitle.trim()) {
      setError(lang === 'ar' ? 'اكتب تخصصك أو نوع خدمتك' : 'Please specify your service specialty');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const isEditingExisting = Boolean(userProfile);

      if (!isEditingExisting) {
        const initialProviderStatus = role === 'provider' ? 'pending' : 'none';
        try {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            displayName: displayName.trim(),
            email: firebaseUser.email || '',
            phone: phone.trim(),
            role,
            villageId,
            neighborhood: neighborhood.trim() || (lang === 'ar' ? 'وسط البلد' : 'Village Center'),
            providerStatus: initialProviderStatus,
            serviceCategory: role === 'provider' ? serviceCategory : 'none',
            serviceTitle: role === 'provider' ? serviceTitle.trim() : '',
            serviceFeeEgp: role === 'provider' ? serviceFeeEgp.trim() || '100 ج.م' : '',
            serviceBio: role === 'provider' ? serviceBio.trim() : '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
        }

        if (role === 'provider') {
          const providerRef = doc(db, 'providers', firebaseUser.uid);
          try {
            await setDoc(providerRef, {
              ownerId: firebaseUser.uid,
              villageId,
              nameAr: displayName.trim(),
              nameEn: displayName.trim(),
              category: serviceCategory,
              specialtyAr: serviceTitle.trim(),
              specialtyEn: serviceTitle.trim(),
              phone: phone.trim(),
              neighborhoodAr: neighborhood.trim() || 'وسط البلد',
              neighborhoodEn: neighborhood.trim() || 'Village Center',
              priceLabelAr: serviceFeeEgp.trim() || 'حسب الاتفاق',
              priceLabelEn: serviceFeeEgp.trim() || 'By agreement',
              bioAr: serviceBio.trim() || 'مقدم خدمة من أهالي القرية',
              bioEn: serviceBio.trim() || 'Local village service provider',
              status: 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `providers/${firebaseUser.uid}`);
          }
        }
      } else {
        try {
          await setDoc(
            userRef,
            {
              displayName: displayName.trim(),
              phone: phone.trim(),
              villageId,
              neighborhood: neighborhood.trim(),
              serviceCategory: userProfile?.role === 'provider' ? serviceCategory : 'none',
              serviceTitle: userProfile?.role === 'provider' ? serviceTitle.trim() : '',
              serviceFeeEgp: userProfile?.role === 'provider' ? serviceFeeEgp.trim() : '',
              serviceBio: userProfile?.role === 'provider' ? serviceBio.trim() : '',
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
        }
      }

      setSuccessMsg(
        role === 'provider' && !isEditingExisting
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
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceCategories = [
    { id: 'doctor', ar: 'دكتور / عيادة / تمريض', en: 'Doctor / Clinic / Nurse' },
    { id: 'pharmacy', ar: 'صيدلية / مستلزمات طبية', en: 'Pharmacy' },
    { id: 'food', ar: 'مطعم / كافيه / أكل بيتي / فرن', en: 'Restaurant / Cafe / Bakery' },
    { id: 'technician', ar: 'فني وحرفي (كهربائي، سباك، نجار، تكييف)', en: 'Technician / Craftsman' },
    { id: 'ride', ar: 'سواق / مواصلات وتوصيل', en: 'Driver / Rides' },
    { id: 'grocery', ar: 'بقالة وسوبر ماركت', en: 'Grocery & Supermarket' },
    { id: 'tutoring', ar: 'مدرس / دروس ومعلمون', en: 'Tutoring & Teachers' },
    { id: 'charity', ar: 'جمعية خيرية / تكافل', en: 'Charitable Organization' },
    { id: 'farm', ar: 'مزرعة / ألبان / خير الغيط', en: 'Farm & Produce' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {!firebaseUser
                ? t.login
                : isAdmin
                ? lang === 'ar'
                  ? 'حساب الأدمن العام'
                  : 'Platform Admin Account'
                : t.account}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {!firebaseUser
                ? lang === 'ar'
                  ? 'ادخل كمستخدم عادي أو سجل كمقدم خدمة (دكتور / صنايعي / محل)'
                  : 'Sign in as a resident or apply as a service provider'
                : firebaseUser.email}
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {!firebaseUser ? (
            /* Step 1: Not signed in yet */
            <div className="space-y-5 text-center py-2">
              <div className="grid grid-cols-2 gap-3 text-start">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'حساب مستخدم (من أهالي البلد)' : 'Resident Account'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'ar'
                      ? 'احجز دكاترة، اطلب أكل ودواء، اكتب تقييم، واعمل إعلانات.'
                      : 'Book clinics, order food/pharmacy, review, and post ads.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                  <div className="font-bold text-slate-900 dark:text-white">
                    {lang === 'ar' ? 'حساب مقدم خدمة' : 'Service Provider'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'ar'
                      ? 'سجل عيادتك أو حرفتك، والأدمن هيراجعها ويفعلها على المنصة.'
                      : 'Register your clinic or trade; admin approves before listing.'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold text-xs flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {isLoading
                    ? lang === 'ar'
                      ? 'جاري تسجيل الدخول...'
                      : 'Signing in...'
                    : lang === 'ar'
                    ? 'تسجيل الدخول بحساب جوجل (Google)'
                    : 'Continue with Google'}
                </span>
              </button>

              <p className="text-[11px] text-slate-400">
                {lang === 'ar'
                  ? `حساب الأدمن المعتمد (${ADMIN_EMAIL}) بيدخل بصلاحيات الإدارة كاملة تلقائياً.`
                  : `Designated Admin (${ADMIN_EMAIL}) receives full moderation privileges automatically.`}
              </p>
            </div>
          ) : (
            /* Step 2: Signed In */
            <div className="space-y-4">
              {/* Admin Quick Banner */}
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
                          ? 'تقدر توافق على مقدمي الخدمات والإعلانات وتبدل القرى.'
                          : 'Approve providers, approve ads, and switch villages.'}
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

              {/* Provider Status Notice if already registered as provider */}
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
                  <div>
                    <div className="font-bold">
                      {userProfile.providerStatus === 'approved'
                        ? lang === 'ar'
                          ? 'حسابك كمقدم خدمة مقبول ومفعل على المنصة ✓'
                          : 'Your provider account is Approved & Live ✓'
                        : userProfile.providerStatus === 'rejected'
                        ? lang === 'ar'
                          ? 'للأسف الأدمن مرفض الطلب حالياً — راجع بياناتك'
                          : 'Provider request not approved yet'
                        : lang === 'ar'
                        ? 'حسابك كمقدم خدمة لسه في المراجعة من الأدمن'
                        : 'Your provider profile is Pending Admin Approval'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {userProfile.providerStatus === 'pending' &&
                        (lang === 'ar'
                          ? 'أول ما الأدمن يوافق على طلبك، اسمك وخدمتك هتظهر لكل أهل القرية.'
                          : 'Once approved by admin, your listing will appear publicly.')}
                    </div>
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

              {/* Registration / Profile Form */}
              <form onSubmit={handleRegisterProfile} className="space-y-3.5">
                {/* Role choice only on initial registration */}
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
                      {t.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <MapPin className="w-3 h-3 inline me-1" />
                      {lang === 'ar' ? 'القرية' : 'Village'}
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
                      {lang === 'ar' ? 'المنطقة / الشارع' : 'Neighborhood'}
                    </label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: الناحية الشرقية' : 'East Quarter'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Extra fields for Service Providers */}
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
                          onChange={(e) => setServiceCategory(e.target.value as any)}
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
                        placeholder={lang === 'ar' ? 'مثال: سباك ومصلح مواتير ميه / دكتور أسنان' : 'e.g. Plumber & Pump Repair'}
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
                        placeholder={lang === 'ar' ? 'احكي لأهل البلد عن خبرتك ومواعيد الشغل...' : 'Describe your experience and working hours...'}
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
                      : role === 'provider'
                      ? lang === 'ar'
                        ? 'إرسال طلب الانضمام للأدمن'
                        : 'Submit Provider Application'
                      : lang === 'ar'
                      ? 'تأكيد تسجيل الحساب'
                      : 'Complete Registration'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
