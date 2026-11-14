import React, { useMemo, useState } from 'react';
import {
  BookingRequest,
  BookingStatus,
  Language,
  UserProfile,
  VillageConfig,
  getVillageTheme,
  getAllowedStatusesForService,
  getServiceStatusLabel,
  isDeliveryServiceType,
  matchesDeliveryReference,
  maskReferenceCode
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { getPaymentMethodLabel } from './OrderStatusModal';
import {
  X,
  Briefcase,
  Phone,
  MapPin,
  Calendar,
  ReceiptText,
  Landmark,
  Banknote,
  CheckCircle2,
  Clock,
  Truck,
  ChefHat,
  Wallet,
  AlertCircle
} from 'lucide-react';

interface ProviderOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeVillage: VillageConfig;
  providerProfile: UserProfile | null;
  orders: BookingRequest[];
  commissionRatePercent: number;
  onUpdateOrderStatus: (
    orderId: string,
    newStatus: BookingStatus,
    deliveryMeta?: { deliveryConfirmedRef: string; deliveryConfirmedAt: string }
  ) => void;
}

export const ProviderOrdersModal: React.FC<ProviderOrdersModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeVillage,
  providerProfile,
  orders,
  commissionRatePercent,
  onUpdateOrderStatus
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [deliveryRefInput, setDeliveryRefInput] = useState<string>('');
  const [deliveryRefError, setDeliveryRefError] = useState<string>('');

  const financialSummary = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== 'cancelled');
    const unsettledOrders = activeOrders.filter((o) => o.settlementStatus !== 'settled');

    const totalGrossEgp = activeOrders.reduce(
      (sum, o) => sum + ((o.subtotalEgp ?? (o.totalAmountEgp || 0) - (o.codFeeEgp || 0))),
      0
    );

    // For InstaPay orders: platform holds full amount (subtotal + delivery), provider owes platform commission on subtotal
    // For COD orders: provider collects cash, owes platform commission + COD collection fee
    let dueFromPlatformEgp = 0;
    let dueToPlatformEgp = 0;

    unsettledOrders.forEach((o) => {
      const baseAmount =
        typeof o.subtotalEgp === 'number' && o.subtotalEgp > 0
          ? o.subtotalEgp
          : Math.max(0, (o.totalAmountEgp || 0) - (o.codFeeEgp || 0));
      const commissionEgp = Math.round((baseAmount * commissionRatePercent) / 100);
      const codFee = o.codFeeEgp || 0;

      if (o.paymentStatus === 'paid' || o.paymentMethod === 'instapay') {
        const providerShare = Math.max(0, (o.totalAmountEgp || baseAmount) - commissionEgp);
        dueFromPlatformEgp += providerShare;
      } else {
        dueToPlatformEgp += commissionEgp + codFee;
      }
    });

    const netBalanceEgp = dueFromPlatformEgp - dueToPlatformEgp;
    const instaPayCount = activeOrders.filter((o) => o.paymentMethod === 'instapay' || o.paymentStatus === 'paid').length;
    const codCount = activeOrders.filter((o) => o.paymentMethod === 'cod' || o.paymentStatus === 'pending_cod').length;

    return {
      totalOrders: orders.length,
      activeCount: activeOrders.filter((o) => o.status !== 'completed').length,
      totalGrossEgp,
      dueFromPlatformEgp,
      dueToPlatformEgp,
      netBalanceEgp,
      instaPayCount,
      codCount
    };
  }, [orders, commissionRatePercent]);

  if (!isOpen) return null;

  const isActiveStatus = (s: BookingStatus) =>
    s === 'pending' || s === 'confirmed' || s === 'preparing' || s === 'on_the_way';

  const visibleOrders = orders.filter((o) => {
    if (filter === 'active') return isActiveStatus(o.status);
    if (filter === 'done') return !isActiveStatus(o.status);
    return true;
  });

  const openDeliveryVerification = (orderId: string) => {
    setVerifyingOrderId(orderId);
    setDeliveryRefInput('');
    setDeliveryRefError('');
  };

  const handleConfirmDeliveryWithRef = (order: BookingRequest) => {
    const trimmed = deliveryRefInput.trim();
    if (!matchesDeliveryReference(trimmed, order.transactionRef)) {
      setDeliveryRefError(
        lang === 'ar'
          ? 'الرقم المرجعي غير مطابق لرقم العميل — اطلب الرقم الصحيح من العميل أولاً.'
          : 'Reference code does not match customer reference.'
      );
      return;
    }
    onUpdateOrderStatus(order.id, 'completed', {
      deliveryConfirmedRef: trimmed.replace(/^#/, '').toUpperCase(),
      deliveryConfirmedAt: new Date().toISOString().split('T')[0]
    });
    setVerifyingOrderId(null);
    setDeliveryRefInput('');
    setDeliveryRefError('');
  };

  const renderQuickActionButton = (order: BookingRequest) => {
    const allowed = getAllowedStatusesForService(order.serviceType);
    const isDelivery = isDeliveryServiceType(order.serviceType);

    if (order.status === 'pending') {
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'confirmed')}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('confirmed', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'confirmed') {
      if (allowed.includes('preparing')) {
        return (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
            className={`px-3 py-1.5 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white font-bold flex items-center gap-1.5 cursor-pointer`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>{getServiceStatusLabel('preparing', order.serviceType, lang)}</span>
          </button>
        );
      }
      if (allowed.includes('on_the_way')) {
        return (
          <button
            type="button"
            onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{getServiceStatusLabel('on_the_way', order.serviceType, lang)}</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('completed', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'preparing' && allowed.includes('on_the_way')) {
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('on_the_way', order.serviceType, lang)}</span>
        </button>
      );
    }
    if (order.status === 'on_the_way') {
      if (isDelivery) {
        return (
          <button
            type="button"
            onClick={() => openDeliveryVerification(order.id)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تأكيد التسليم بالرقم المرجعي' : 'Confirm Delivery w/ Ref'}</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{getServiceStatusLabel('completed', order.serviceType, lang)}</span>
        </button>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${theme.solidBg} text-white flex items-center justify-center`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.providerOrders}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {providerProfile?.displayName}
                {providerProfile?.serviceTitle ? ` · ${providerProfile.serviceTitle}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Pending Notice */}
        {providerProfile?.providerStatus !== 'approved' && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {lang === 'ar'
                ? 'حسابك كمقدم خدمة لسه في المراجعة — يمكنك متابعة الطلبات التجريبية الواردة والتدرب على لوحة التحكم.'
                : 'Your provider profile is pending review — you can still inspect and manage incoming orders below.'}
            </span>
          </div>
        )}

        {/* Financial Coordination Summary Row */}
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="text-[11px] text-slate-500">{lang === 'ar' ? 'طلبات واردة' : 'Incoming Orders'}</div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {financialSummary.totalOrders}
            </div>
            <div className="text-[10px] text-amber-600 font-bold">
              {financialSummary.activeCount} {lang === 'ar' ? 'قيد التنفيذ' : 'active'}
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/25">
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
              {lang === 'ar' ? 'مدفوع InstaPay (عند الإدارة)' : 'InstaPay (At Admin)'}
            </div>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
              {financialSummary.dueFromPlatformEgp} {t.currency}
            </div>
            <div className="text-[10px] text-slate-500">
              {financialSummary.instaPayCount} {lang === 'ar' ? 'طلب أونلاين' : 'online orders'}
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/25">
            <div className="text-[11px] text-amber-800 dark:text-amber-300">
              {lang === 'ar' ? 'مستحق للمنصة (عمولة COD)' : 'Platform Commission Due'}
            </div>
            <div className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 mt-0.5">
              {financialSummary.dueToPlatformEgp} {t.currency}
            </div>
            <div className="text-[10px] text-slate-500">
              {financialSummary.codCount} {lang === 'ar' ? 'طلب كاش' : 'COD'} · {commissionRatePercent}%
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              financialSummary.netBalanceEgp >= 0
                ? 'border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/25'
                : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/25'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'صافي التسوية غير المسددة' : 'Net Unsettled'}</span>
            </div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                financialSummary.netBalanceEgp >= 0
                  ? 'text-sky-700 dark:text-sky-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {financialSummary.netBalanceEgp >= 0 ? '+' : ''}
              {financialSummary.netBalanceEgp} {t.currency}
            </div>
            <div className="text-[10px] font-bold text-slate-500">
              {financialSummary.netBalanceEgp >= 0
                ? lang === 'ar'
                  ? 'مستحق لك من الإدارة'
                  : 'Receivable from Admin'
                : lang === 'ar'
                ? 'مستحق عليك للإدارة'
                : 'Payable to Admin'}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar' ? `الكل (${orders.length})` : `All (${orders.length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filter === 'active'
                  ? `${theme.solidBg} text-white`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar'
                ? `نشط وبانتظار التنفيذ (${orders.filter((o) => isActiveStatus(o.status)).length})`
                : `Active (${orders.filter((o) => isActiveStatus(o.status)).length})`}
            </button>
            <button
              type="button"
              onClick={() => setFilter('done')}
              className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                filter === 'done'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lang === 'ar'
                ? `منتهي (${orders.filter((o) => !isActiveStatus(o.status)).length})`
                : `Finished (${orders.filter((o) => !isActiveStatus(o.status)).length})`}
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {visibleOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="font-bold text-slate-600 dark:text-slate-400">
                {lang === 'ar'
                  ? 'لا توجد طلبات واردة لنشاطك في هذه القائمة حتى الآن.'
                  : 'No orders assigned to your service in this tab yet.'}
              </div>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const isPaidOnline = order.paymentStatus === 'paid' || order.paymentMethod === 'instapay';
              const isSettled = order.settlementStatus === 'settled';
              const baseAmount =
                typeof order.subtotalEgp === 'number' && order.subtotalEgp > 0
                  ? order.subtotalEgp
                  : Math.max(0, (order.totalAmountEgp || 0) - (order.codFeeEgp || 0));
              const commissionEgp = Math.round((baseAmount * commissionRatePercent) / 100);

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  {/* Top Row */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {order.title}
                        </h4>
                        {order.transactionRef && (
                          <span className="font-mono text-[11px] text-slate-400">
                            #
                            {isDeliveryServiceType(order.serviceType) &&
                            order.status !== 'completed' &&
                            order.status !== 'cancelled'
                              ? maskReferenceCode(order.transactionRef)
                              : order.transactionRef}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2">
                        <span className="font-bold">{order.customerName}</span>
                        <span>·</span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-bold text-[11px] ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : order.status === 'cancelled'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {getServiceStatusLabel(order.status, order.serviceType, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5 text-[11px]">
                    {order.itemsSummary && (
                      <div className="flex items-start gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <ReceiptText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{order.itemsSummary}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="text-slate-600 dark:text-slate-400">
                        <span className="font-bold">{lang === 'ar' ? 'ملاحظات العميل:' : 'Customer Notes:'}</span>{' '}
                        {order.notes}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{order.address}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {order.date}
                          {order.time ? ` · ${order.time}` : ''}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Payment & Settlement Instruction Box */}
                  <div
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                      isPaidOnline
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isPaidOnline ? (
                        <Landmark className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">
                          {getPaymentMethodLabel(order.paymentMethod, lang)} —{' '}
                          {isPaidOnline
                            ? lang === 'ar'
                              ? 'تم السداد لحساب المنصة (لا تطلب مبلغ من العميل)'
                              : 'Paid to Platform (Do not charge customer)'
                            : lang === 'ar'
                            ? `حصّل ${order.totalAmountEgp || 0} ج.م كاش عند التسليم`
                            : `Collect ${order.totalAmountEgp || 0} EGP cash on delivery`}
                        </div>
                        <div className="text-[10px] opacity-85">
                          {isSettled
                            ? lang === 'ar'
                              ? `تمت التسوية المالية مع الأدمن ✓${order.settledAt ? ` (${order.settledAt})` : ''}`
                              : `Settled with Admin ✓`
                            : isPaidOnline
                            ? lang === 'ar'
                              ? `صافي مستحقاتك للتسوية: ${Math.max(0, (order.totalAmountEgp || baseAmount) - commissionEgp)} ج.م (بعد خصم ${commissionRatePercent}% عمولة المنصة)`
                              : `Net payable to you: ${Math.max(0, (order.totalAmountEgp || baseAmount) - commissionEgp)} EGP`
                            : lang === 'ar'
                            ? `مستحق للمنصة عند التسوية: ${commissionEgp + (order.codFeeEgp || 0)} ج.م (عمولة + ${order.codFeeEgp || 0} ج.م تحصيل)`
                            : `Due to platform on settlement: ${commissionEgp + (order.codFeeEgp || 0)} EGP`}
                        </div>
                      </div>
                    </div>

                    <div className="font-mono font-extrabold text-sm">
                      {order.totalAmountEgp ? `${order.totalAmountEgp} ${t.currency}` : '—'}
                    </div>
                  </div>

                  {/* Delivery Reference Input Verification Gate */}
                  {verifyingOrderId === order.id && (
                    <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2.5 text-[11px]">
                      <div className="font-bold text-sky-900 dark:text-sky-200">
                        {lang === 'ar'
                          ? 'أدخل الرقم المرجعي من العميل لتأكيد التسليم:'
                          : 'Enter Customer Reference Number to Confirm Delivery:'}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={deliveryRefInput}
                          onChange={(e) => {
                            setDeliveryRefInput(e.target.value);
                            if (deliveryRefError) setDeliveryRefError('');
                          }}
                          placeholder="NQB-XXXXXX / COD-XXXXXX"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmDeliveryWithRef(order)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                        >
                          {lang === 'ar' ? 'تأكيد التسليم' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingOrderId(null);
                            setDeliveryRefError('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                      </div>
                      {deliveryRefError && (
                        <div className="text-rose-600 dark:text-rose-400 font-bold">
                          {deliveryRefError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Provider Status Controls */}
                  {isActiveStatus(order.status) && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderQuickActionButton(order)}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 font-semibold">
                          {lang === 'ar' ? 'تغيير الحالة:' : 'Update status:'}
                        </label>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            const nextStatus = e.target.value as BookingStatus;
                            if (nextStatus === 'completed' && isDeliveryServiceType(order.serviceType)) {
                              openDeliveryVerification(order.id);
                            } else {
                              onUpdateOrderStatus(order.id, nextStatus);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold cursor-pointer"
                        >
                          {getAllowedStatusesForService(order.serviceType).map((st) => (
                            <option key={st} value={st}>
                              {getServiceStatusLabel(st, order.serviceType, lang)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
