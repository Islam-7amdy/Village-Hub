import React, { useState } from 'react';
import {
  Language,
  PaymentMethod,
  PaymentStatus,
  PendingPaymentOrder,
  VillageConfig,
  getVillageTheme
} from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';
import { VillageLogo } from './VillageLogo';
import {
  ArrowRight,
  ArrowLeft,
  Landmark,
  Banknote,
  ShieldCheck,
  Lock,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Calendar,
  Truck,
  Loader2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const INSTAPAY_RECEIVER_PHONE = '01012405014';
export const COD_SERVICE_FEE_EGP = 10;

interface PaymentPageProps {
  lang: Language;
  activeVillage: VillageConfig;
  order: PendingPaymentOrder;
  onBackToOrder: () => void;
  onPaymentCompleted: (result: {
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionRef: string;
    codFeeEgp: number;
    finalTotalAmountEgp: number;
    instaPaySender?: string;
    instaPayCustomerRef?: string;
  }) => void | Promise<void>;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  lang,
  activeVillage,
  order,
  onBackToOrder,
  onPaymentCompleted
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);

  const [method, setMethod] = useState<'instapay' | 'cod'>('instapay');

  // InstaPay Fields
  const [instaHandle, setInstaHandle] = useState(order.customerPhone || '');
  const [instaRef, setInstaRef] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // COD confirmation
  const [codAgreed, setCodAgreed] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const codFeeEgp = method === 'cod' ? COD_SERVICE_FEE_EGP : 0;
  const finalTotalEgp = order.totalAmountEgp + codFeeEgp;

  const handleCopyPhone = () => {
    try {
      navigator.clipboard?.writeText(INSTAPAY_RECEIVER_PHONE);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const validateAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (method === 'instapay') {
      if (instaHandle.trim().length < 4) {
        setErrorMsg(
          lang === 'ar'
            ? 'اكتب رقم هاتفك أو حساب InstaPay المحول منه.'
            : 'Enter your InstaPay phone number or IPA handle.'
        );
        return;
      }
      if (instaRef.trim().length < 4) {
        setErrorMsg(
          lang === 'ar'
            ? 'اكتب رقم مرجع التحويل (4 أرقام أو أحرف على الأقل).'
            : 'Enter your InstaPay transfer reference (min 4 chars).'
        );
        return;
      }
    } else if (method === 'cod' && !codAgreed) {
      setErrorMsg(
        lang === 'ar'
          ? 'يرجى تأكيد الموافقة على سداد المبلغ شامل رسوم خدمة التحصيل عند الاستلام.'
          : 'Please confirm cash-on-delivery agreement including collection fee.'
      );
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const suffix = String(Date.now()).slice(-6);
      const isInstaPay = method === 'instapay';
      const transactionRef = isInstaPay ? `NQB-${suffix}` : `COD-${suffix}`;
      const paymentStatus: PaymentStatus = isInstaPay ? 'pending_verification' : 'pending_cod';
      await onPaymentCompleted({
        paymentMethod: method,
        paymentStatus,
        transactionRef,
        codFeeEgp,
        finalTotalAmountEgp: finalTotalEgp,
        instaPaySender: isInstaPay ? instaHandle.trim().slice(0, 60) : undefined,
        instaPayCustomerRef: isInstaPay ? instaRef.trim().slice(0, 60) : undefined
      });
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : lang === 'ar'
          ? 'تعذر حفظ الطلب في قاعدة البيانات. تأكد من اتصالك وحالة التحقق من الحساب وحاول مرة أخرى.'
          : 'Failed to save your order. Please check your connection and account verification, then try again.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const brandName = lang === 'ar' ? activeVillage.nameAr : activeVillage.nameEn;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Payment Checkout Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBackToOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <BackArrow className="w-4 h-4" />
              <span>{lang === 'ar' ? 'الرجوع للطلب' : 'Back'}</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <VillageLogo village={activeVillage} lang={lang} size="sm" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {t.paymentPageTitle}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {brandName} · {lang === 'ar' ? 'بوابة سداد آمنة قبل إتمام الطلب' : 'Secure Checkout Gate'}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'دفع آمن' : 'Secure Payment'}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* 3-Step Checkout Progress Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{lang === 'ar' ? '١. بيانات الطلب' : '1. Order Info'}</span>
          </div>
          <div className={`flex items-center gap-2 font-extrabold ${theme.text}`}>
            <span className={`w-5 h-5 rounded-full ${theme.solidBg} text-white text-[11px] flex items-center justify-center shrink-0`}>
              {lang === 'ar' ? '٢' : '2'}
            </span>
            <span className="truncate">{lang === 'ar' ? '٢. صفحة الدفع' : '2. Payment'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-semibold">
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] flex items-center justify-center shrink-0">
              {lang === 'ar' ? '٣' : '3'}
            </span>
            <span className="truncate">{lang === 'ar' ? '٣. متابعة الحالة' : '3. Order Status'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Form: Restricted to InstaPay & Cash on Delivery */}
          <form onSubmit={validateAndPay} className="lg:col-span-7 space-y-5">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'اختر وسيلة الدفع' : 'Choose Payment Method'}
                </h2>
                <span className="text-[11px] font-bold text-slate-500">
                  {lang === 'ar' ? 'إنستا باي أو كاش عند الاستلام' : 'InstaPay or Cash only'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Option 1: InstaPay */}
                <button
                  type="button"
                  onClick={() => {
                    setMethod('instapay');
                    setErrorMsg('');
                  }}
                  className={`w-full p-4 rounded-2xl border text-start transition-all flex items-start gap-3 cursor-pointer ${
                    method === 'instapay'
                      ? `${theme.softBg} ${theme.border} ring-1 ring-amber-500/30`
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      method === 'instapay'
                        ? `${theme.solidBg} text-white`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'إنستا باي (InstaPay)' : 'InstaPay Instant Transfer'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                        {lang === 'ar' ? 'بدون رسوم إضافية' : '0 EGP Fee'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'ar'
                        ? `تحويل على ${INSTAPAY_RECEIVER_PHONE} — تُراجعه الإدارة وتؤكده قبل إرساله لمقدم الخدمة`
                        : `Transfer to ${INSTAPAY_RECEIVER_PHONE} — Admin verifies payment before sending to provider`}
                    </p>
                  </div>
                </button>

                {/* Option 2: Cash on Delivery (+10 EGP) */}
                <button
                  type="button"
                  onClick={() => {
                    setMethod('cod');
                    setErrorMsg('');
                  }}
                  className={`w-full p-4 rounded-2xl border text-start transition-all flex items-start gap-3 cursor-pointer ${
                    method === 'cod'
                      ? `${theme.softBg} ${theme.border} ring-1 ring-amber-500/30`
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      method === 'cod'
                        ? `${theme.solidBg} text-white`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {lang === 'ar' ? 'الدفع كاش عند الاستلام' : 'Cash on Delivery'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                        {lang === 'ar'
                          ? `+${COD_SERVICE_FEE_EGP} ج.م رسوم تحصيل`
                          : `+${COD_SERVICE_FEE_EGP} EGP COD Fee`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'ar'
                        ? `ادفع نقداً عند الاستلام (يُضاف ${COD_SERVICE_FEE_EGP} ج.م رسوم خدمة التحصيل عند الاستلام)`
                        : `Pay cash on arrival (+${COD_SERVICE_FEE_EGP} EGP cash collection service fee)`}
                    </p>
                  </div>
                </button>
              </div>

              {/* Dynamic Details Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                {method === 'instapay' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">
                          {lang === 'ar'
                            ? 'رقم الهاتف للتحويل عبر InstaPay:'
                            : 'InstaPay Transfer Phone Number:'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPhone}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
                        >
                          {copiedPhone ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{lang === 'ar' ? 'نسخ الرقم' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-lg font-mono font-black tracking-wider text-indigo-700 dark:text-indigo-300" dir="ltr">
                        {INSTAPAY_RECEIVER_PHONE}
                      </div>

                      <div className="text-[11px] opacity-90 leading-relaxed">
                        {lang === 'ar'
                          ? `حول مبلغ ${finalTotalEgp.toFixed(0)} ج.م على رقم ${INSTAPAY_RECEIVER_PHONE} عبر تطبيق InstaPay ثم أدخل رقم هاتفك ومرجع التحويل. سيظل الطلب "قيد المراجعة" حتى تراجع الإدارة التحويل وتُفعّله لمقدم الخدمة.`
                          : `Transfer ${finalTotalEgp.toFixed(0)} EGP to ${INSTAPAY_RECEIVER_PHONE} via InstaPay and enter your sender info & transfer reference below. Your order stays "Pending Review" until Admin confirms receipt.`}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'ar' ? 'رقم هاتفك أو حساب InstaPay المحول منه *' : 'Your InstaPay Phone / Handle *'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          maxLength={60}
                          value={instaHandle}
                          onChange={(e) => setInstaHandle(e.target.value)}
                          placeholder="010XXXXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {lang === 'ar' ? 'رقم مرجع التحويل *' : 'Transfer Reference ID *'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          maxLength={60}
                          value={instaRef}
                          onChange={(e) => setInstaRef(e.target.value)}
                          placeholder="IPN-4481"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'cod' && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200">
                      <span className="font-bold">
                        {lang === 'ar' ? 'رسوم خدمة التحصيل عند الاستلام:' : 'Cash Collection Service Fee:'}
                      </span>
                      <span className="font-mono font-extrabold text-sm">
                        +{COD_SERVICE_FEE_EGP} {t.currency}
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={codAgreed}
                        onChange={(e) => setCodAgreed(e.target.checked)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {lang === 'ar'
                          ? `أوافق على سداد إجمالي المبلغ (${finalTotalEgp.toFixed(0)} ج.م شامل ${COD_SERVICE_FEE_EGP} ج.م رسوم خدمة التحصيل عند الاستلام) نقداً عند وصول المندوب أو وقت الخدمة.`
                          : `I agree to pay ${finalTotalEgp.toFixed(0)} EGP in cash (including ${COD_SERVICE_FEE_EGP} EGP cash collection service fee) upon delivery.`}
                      </span>
                    </label>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3.5 px-5 rounded-2xl ${theme.solidBg} ${theme.hoverBg} text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-70`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {lang === 'ar' ? 'جاري تأكيد عملية الدفع...' : 'Verifying payment...'}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {method === 'cod'
                        ? lang === 'ar'
                          ? `تأكيد الدفع كاش وإتمام الطلب (${finalTotalEgp.toFixed(0)} ${t.currency})`
                          : `Confirm Cash Payment & Complete Order (${finalTotalEgp.toFixed(0)} ${t.currency})`
                        : lang === 'ar'
                        ? `إرسال بيانات التحويل والمراجعة (${finalTotalEgp.toFixed(0)} ${t.currency})`
                        : `Submit InstaPay Transfer for Review (${finalTotalEgp.toFixed(0)} ${t.currency})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Sidebar: Full Order Summary Receipt */}
          <aside className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'ملخص الطلب والفاتورة' : 'Order Summary'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{order.providerName}</p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {order.title}
              </div>

              {order.cartItems && order.cartItems.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                  {order.cartItems.map((ci) => (
                    <div key={ci.id} className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {ci.name} × {ci.quantity}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">
                        {(ci.price * ci.quantity).toFixed(0)} {t.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {order.itemsSummary && (!order.cartItems || order.cartItems.length === 0) && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                  {order.itemsSummary}
                </div>
              )}
            </div>

            {/* Customer & Delivery Details */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{order.customerPhone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">
                  {order.date}
                  {order.time ? ` · ${order.time}` : ''}
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>
                  {order.source === 'cart'
                    ? t.subtotal
                    : lang === 'ar'
                    ? 'قيمة الخدمة / الحجز'
                    : 'Service Fee'}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {order.subtotalEgp.toFixed(0)} {t.currency}
                </span>
              </div>

              {typeof order.deliveryFeeEgp === 'number' && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {t.deliveryFee}
                      {typeof order.distanceKm === 'number' && order.distanceKm > 0
                        ? ` (${order.distanceKm.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'})`
                        : ''}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {order.deliveryFeeEgp === 0
                      ? lang === 'ar'
                        ? 'مجاني'
                        : 'FREE'
                      : `${order.deliveryFeeEgp} ${t.currency}`}
                  </span>
                </div>
              )}

              {/* Cash on Delivery Collection Fee Line Item */}
              {method === 'cod' && (
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ar'
                        ? 'رسوم خدمة التحصيل عند الاستلام'
                        : 'Cash Collection Service Fee'}
                    </span>
                  </span>
                  <span className="font-mono font-bold">
                    +{COD_SERVICE_FEE_EGP} {t.currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.total}
                </span>
                <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {finalTotalEgp.toFixed(0)} {t.currency}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
