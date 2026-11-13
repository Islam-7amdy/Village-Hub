import React, { useState } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import {
  Language,
  ProviderListing,
  VillageAd,
  VillageConfig,
  VillageColorCode,
  VILLAGE_COLOR_THEMES,
  getVillageTheme,
  DEFAULT_DISTRICTS
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  X,
  ShieldCheck,
  Briefcase,
  Megaphone,
  MapPin,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Phone,
  Clock
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  providers: ProviderListing[];
  ads: VillageAd[];
  villages: VillageConfig[];
  activeVillageId: string;
  onSwitchVillage: (villageId: string) => void;
  onVillageAdded: (village: VillageConfig) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  lang,
  providers,
  ads,
  villages,
  activeVillageId,
  onSwitchVillage,
  onVillageAdded
}) => {
  const t = TRANSLATIONS[lang];
  const [activeSection, setActiveSection] = useState<'providers' | 'ads' | 'villages'>('providers');
  const [busyId, setBusyId] = useState<string | null>(null);

  // New Village Form state
  const [newVillageId, setNewVillageId] = useState('');
  const [newVillageNameAr, setNewVillageNameAr] = useState('');
  const [newVillageNameEn, setNewVillageNameEn] = useState('');
  const [newGovAr, setNewGovAr] = useState('');
  const [newBaseFee, setNewBaseFee] = useState('10');
  const [newPerKmFee, setNewPerKmFee] = useState('5');
  const [newColorCode, setNewColorCode] = useState<VillageColorCode>('teal');
  const [villageMsg, setVillageMsg] = useState('');

  if (!isOpen) return null;

  const pendingProvidersCount = providers.filter((p) => p.status === 'pending').length;
  const pendingAdsCount = ads.filter((a) => a.status === 'pending').length;

  const handleProviderDecision = async (provider: ProviderListing, decision: 'approved' | 'rejected') => {
    setBusyId(provider.id);
    try {
      try {
        await updateDoc(doc(db, 'providers', provider.id), {
          status: decision,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `providers/${provider.id}`);
      }

      // Sync user profile status if doc exists
      try {
        await updateDoc(doc(db, 'users', provider.ownerId), {
          providerStatus: decision,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Ignore if user doc was seeded or missing
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAdDecision = async (ad: VillageAd, decision: 'approved' | 'rejected') => {
    setBusyId(ad.id);
    try {
      try {
        await updateDoc(doc(db, 'ads', ad.id), {
          status: decision,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `ads/${ad.id}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSwitchActiveVillage = async (vid: string) => {
    setBusyId(vid);
    try {
      onSwitchVillage(vid);
      try {
        await setDoc(doc(db, 'appConfig', 'settings'), {
          activeVillageId: vid,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'appConfig/settings');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = (newVillageId.trim() || newVillageNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .replace(/^-+|-+$/g, '') || `village-${Date.now()}`;

    if (!newVillageNameAr.trim() || !newVillageNameEn.trim()) return;

    setBusyId('add-village');
    try {
      const villageData: VillageConfig = {
        id: slug,
        nameAr: newVillageNameAr.trim(),
        nameEn: newVillageNameEn.trim(),
        governorateAr: newGovAr.trim() || 'مصر',
        governorateEn: newGovAr.trim() || 'Egypt',
        descriptionAr: `خدمات أهالي ${newVillageNameAr.trim()} الموحدة`,
        descriptionEn: `Unified community services for ${newVillageNameEn.trim()}`,
        baseDeliveryFeeEgp: Number(newBaseFee) || 10,
        perKmFeeEgp: Number(newPerKmFee) || 5,
        colorCode: newColorCode,
        isActive: true,
        districts: DEFAULT_DISTRICTS
      };

      try {
        await setDoc(doc(db, 'villages', slug), {
          id: villageData.id,
          nameAr: villageData.nameAr,
          nameEn: villageData.nameEn,
          governorateAr: villageData.governorateAr,
          governorateEn: villageData.governorateEn,
          descriptionAr: villageData.descriptionAr,
          descriptionEn: villageData.descriptionEn,
          baseDeliveryFeeEgp: villageData.baseDeliveryFeeEgp,
          perKmFeeEgp: villageData.perKmFeeEgp,
          colorCode: villageData.colorCode,
          isActive: true,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `villages/${slug}`);
      }

      onVillageAdded(villageData);
      setNewVillageId('');
      setNewVillageNameAr('');
      setNewVillageNameEn('');
      setNewGovAr('');
      setVillageMsg(lang === 'ar' ? 'تمت إضافة القرية بنجاح وتقدر تبدل عليها دلوقتي!' : 'Village added!');
      setTimeout(() => setVillageMsg(''), 2500);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.adminPanel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'مراجعة مقدمي الخدمات، اعتماد الإعلانات، والتبديل بين القرى'
                  : 'Approve service providers, moderate ads, and switch active villages'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('providers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'providers'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'طلبات مقدمي الخدمات' : 'Service Providers'}
              {pendingProvidersCount > 0 ? ` (${pendingProvidersCount})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('ads')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'ads'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>
              {lang === 'ar' ? 'مراجعة الإعلانات' : 'Ads Moderation'}
              {pendingAdsCount > 0 ? ` (${pendingAdsCount})` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('villages')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeSection === 'villages'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إدارة وتبديل القرى' : 'Villages Switcher'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: PROVIDERS */}
          {activeSection === 'providers' && (
            <div className="space-y-3">
              {providers.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {lang === 'ar'
                    ? 'مفيش طلبات تسجيل مقدمي خدمات جديدة حالياً.'
                    : 'No new service provider requests yet.'}
                </div>
              ) : (
                providers.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang === 'ar' ? p.nameAr : p.nameEn}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {lang === 'ar' ? p.specialtyAr : p.specialtyEn}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                          className={`font-bold ${
                            p.status === 'approved'
                              ? 'text-emerald-600'
                              : p.status === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {p.status === 'approved'
                            ? lang === 'ar'
                              ? 'مقبول'
                              : 'Approved'
                            : p.status === 'rejected'
                            ? lang === 'ar'
                              ? 'مرفوض'
                              : 'Rejected'
                            : lang === 'ar'
                            ? 'مستني الموافقة'
                            : 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{p.villageId}</span>
                        <span>·</span>
                        <span className="font-mono">{p.phone}</span>
                        {p.priceLabelAr && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{lang === 'ar' ? p.priceLabelAr : p.priceLabelEn}</span>
                          </>
                        )}
                      </div>

                      {p.bioAr && (
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {lang === 'ar' ? p.bioAr : p.bioEn}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.status !== 'approved' && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => handleProviderDecision(p, 'approved')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'قبول وتفعيل' : 'Approve'}</span>
                        </button>
                      )}
                      {p.status !== 'rejected' && (
                        <button
                          disabled={busyId === p.id}
                          onClick={() => handleProviderDecision(p, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: ADS APPROVAL */}
          {activeSection === 'ads' && (
            <div className="space-y-3">
              {ads.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {lang === 'ar' ? 'مفيش إعلانات جديدة للمراجعة دلوقتي.' : 'No ads waiting for review.'}
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {ad.title}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span
                          className={`font-bold ${
                            ad.status === 'approved'
                              ? 'text-emerald-600'
                              : ad.status === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {ad.status === 'approved'
                            ? lang === 'ar'
                              ? 'منشور'
                              : 'Approved'
                            : ad.status === 'rejected'
                            ? lang === 'ar'
                              ? 'مرفوض'
                              : 'Rejected'
                            : lang === 'ar'
                            ? 'مستني الموافقة'
                            : 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{ad.authorName}</span>
                        <span>·</span>
                        <span>{ad.villageId}</span>
                        <span>·</span>
                        <span className="font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ad.contactPhone}
                        </span>
                        {ad.priceText && (
                          <>
                            <span>·</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">{ad.priceText}</span>
                          </>
                        )}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ad.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ad.status !== 'approved' && (
                        <button
                          disabled={busyId === ad.id}
                          onClick={() => handleAdDecision(ad, 'approved')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'نشر الإعلان' : 'Approve Ad'}</span>
                        </button>
                      )}
                      {ad.status !== 'rejected' && (
                        <button
                          disabled={busyId === ad.id}
                          onClick={() => handleAdDecision(ad, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: VILLAGES SWITCHER & MODULAR CREATOR */}
          {activeSection === 'villages' && (
            <div className="space-y-6">
              {/* Switch Active Village */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'التبديل السريع بين القرى (Modular Villages)' : 'Switch Active Village'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {villages.map((v) => {
                    const isCurrent = v.id === activeVillageId;
                    const vTheme = getVillageTheme(v.colorCode);
                    return (
                      <div
                        key={v.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                          isCurrent
                            ? `${vTheme.border} ${vTheme.softBg}`
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${vTheme.dotBg} shrink-0`} />
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {lang === 'ar' ? v.nameAr : v.nameEn}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold ${vTheme.text}`}>
                              {vTheme.label[lang]}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {lang === 'ar' ? v.governorateAr : v.governorateEn}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-2">
                            {lang === 'ar'
                              ? `توصيل أساسي: ${v.baseDeliveryFeeEgp} ج.م + ${v.perKmFeeEgp} ج.م/كم`
                              : `Delivery: ${v.baseDeliveryFeeEgp} + ${v.perKmFeeEgp}/km EGP`}
                          </div>
                        </div>

                        <button
                          disabled={isCurrent || busyId === v.id}
                          onClick={() => handleSwitchActiveVillage(v.id)}
                          className={`w-full py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCurrent
                              ? `${vTheme.solidBg} text-white cursor-default`
                              : 'bg-slate-900 dark:bg-slate-800 hover:opacity-90 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {isCurrent
                              ? lang === 'ar'
                                ? 'القرية النشطة حالياً ✓'
                                : 'Active Village ✓'
                              : lang === 'ar'
                              ? 'شغّل القرية دي'
                              : 'Switch to Village'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Village Form */}
              <form
                onSubmit={handleAddVillage}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'إضافة قرية جديدة للمنصة' : 'Add New Modular Village'}</span>
                  </h4>
                  {villageMsg && (
                    <span className="text-emerald-600 font-bold">{villageMsg}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'اسم القرية بالعربي *' : 'Arabic Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newVillageNameAr}
                      onChange={(e) => setNewVillageNameAr(e.target.value)}
                      placeholder="قرية ميت عاصم"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'اسم القرية بالإنجليزي *' : 'English Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newVillageNameEn}
                      onChange={(e) => setNewVillageNameEn(e.target.value)}
                      placeholder="Meet Assem"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'المركز / المحافظة' : 'Governorate'}
                    </label>
                    <input
                      type="text"
                      value={newGovAr}
                      onChange={(e) => setNewGovAr(e.target.value)}
                      placeholder="مركز بنها - القليوبية"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {lang === 'ar' ? 'اللون المميز للقرية (Color Code)' : 'Village Color Code'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {(Object.keys(VILLAGE_COLOR_THEMES) as VillageColorCode[]).map((code) => {
                      const themeObj = VILLAGE_COLOR_THEMES[code];
                      const selected = newColorCode === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setNewColorCode(code)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                            selected
                              ? `${themeObj.border} ${themeObj.softBg} ${themeObj.text}`
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${themeObj.dotBg}`} />
                          <span>{themeObj.label[lang]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'فتح العداد للتوصيل (ج.م)' : 'Base Delivery Fee (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newBaseFee}
                      onChange={(e) => setNewBaseFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'تكلفة الكيلو متر (ج.م)' : 'Per-KM Fee (EGP)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newPerKmFee}
                      onChange={(e) => setNewPerKmFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busyId === 'add-village'}
                    className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? '+ ضيف القرية للمنصة' : '+ Add Village'}
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
