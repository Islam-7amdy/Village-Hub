import React, { useState } from 'react';
import {
  BookingRequest,
  BookingStatus,
  Language,
  PaymentMethod,
  VillageConfig,
  getVillageTheme,
  getServiceStatusLabel,
  getServiceTimelineSteps,
  isDeliveryServiceType
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import {
  X,
  PackageCheck,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
  MapPin,
  Calendar,
  ReceiptText,
  ShieldAlert,
  KeyRound
} from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  orders: BookingRequest[];
  activeVillage: VillageConfig;
  highlightedOrderId?: string | null;
  onCancelOrder?: (orderId: string) => void;
}

export function getStatusLabel(
  status: BookingStatus,
  lang: Language,
  serviceType?: BookingRequest['serviceType']
): string {
  return getServiceStatusLabel(status, serviceType || 'food', lang);
}

export function getPaymentMethodLabel(method: PaymentMethod | undefined, lang: Language): string {
  switch (method) {
    case 'card':
      return lang === 'ar' ? 'بطاقة بنكية' : 'Bank Card';
    case 'vodafone_cash':
      return lang === 'ar' ? 'محفظة إلكترونية' : 'Mobile Wallet';
    case 'instapay':
      return 'InstaPay';
    case 'cod':
    default:
      return lang === 'ar' ? 'كاش عند الاستلام' : 'Cash on Delivery';
  }
}

function getStepIcon(key: BookingStatus) {
  switch (key) {
    case 'pending':
      return Clock;
    case 'confirmed':
      return CheckCircle2;
    case 'preparing':
      return ChefHat;
    case 'on_the_way':
      return Truck;
    case 'completed':
      return PackageCheck;
    default:
      return Clock;
  }
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onClose,
  lang,
  orders,
  activeVillage,
  highlightedOrderId,
  onCancelOrder
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isActiveStatus = (s: BookingStatus) =>
    s === 'pending' || s === 'confirmed' || s === 'preparing' || s === 'on_the_way';

  const activeCount = orders.filter((o) => isActiveStatus(o.status)).length;
  const finishedCount = orders.filter((o) => !isActiveStatus(o.status)).length;

  const visibleOrders = orders.filter((o) => {
    if (filter === 'active') return isActiveStatus(o.status);
    if (filter === 'finished') return !isActiveStatus(o.status);
    return true;
  });

  const highlightedOrder = highlightedOrderId
    ? orders.find((o) => o.id === highlightedOrderId)
    : undefined;
  const isHighlightedPendingVerification =
    highlightedOrder?.paymentMethod === 'instapay' &&
    highlightedOrder?.paymentStatus === 'pending_verification';

  const renderPaymentIcon = (method?: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-3.5 h-3.5" />;
      case 'vodafone_cash':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'instapay':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'cod':
      default:
        return <Banknote className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${theme.softBg} ${theme.text} flex items-center justify-center`}>
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {t.orderStatus}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'متابعة حالة طلباتك وحجوزاتك حسب نوع الخدمة'
                  : 'Track your orders & bookings by service workflow'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Newly Submitted Confirmation Banner */}
        {highlightedOrderId && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs shrink-0 ${
              isHighlightedPendingVerification
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {isHighlightedPendingVerification ? (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div className="font-bold">
              {isHighlightedPendingVerification
                ? lang === 'ar'
                  ? 'تم استلام بيانات تحويل InstaPay! طلبك الآن "قيد المراجعة" وسيتم إرساله لمقدم الخدمة فور تأكيد الإدارة لوصول المبلغ.'
                  : 'InstaPay transfer details received! Your order is "Pending Review" until Admin confirms receipt.'
                : lang === 'ar'
                ? 'تم تسجيل طلبك وإرساله لمقدم الخدمة بنجاح! يمكنك متابعة حالة الطلب من هنا.'
                : 'Order placed & dispatched to the service provider! Track live status below.'}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
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
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
              filter === 'active'
                ? `${theme.solidBg} text-white`
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? `نشط الآن (${activeCount})` : `Active (${activeCount})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('finished')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
              filter === 'finished'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {lang === 'ar' ? `مكتمل / ملغي (${finishedCount})` : `Completed / Cancelled (${finishedCount})`}
          </button>
        </div>

        {/* Orders List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {visibleOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <PackageCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <div className="font-bold text-slate-600 dark:text-slate-400">
                {lang === 'ar' ? 'مفيش طلبات في القائمة دي حالياً.' : 'No orders found in this view.'}
              </div>
            </div>
          ) : (
            visibleOrders.map((order) => {
              const steps = getServiceTimelineSteps(order.serviceType);
              const stepIdx = steps.findIndex((s) => s.key === order.status);
              const isHighlighted = highlightedOrderId === order.id;
              const canCancel = isActiveStatus(order.status) && Boolean(onCancelOrder);
              const isAwaitingPaymentReview =
                order.paymentMethod === 'instapay' &&
                order.paymentStatus === 'pending_verification';
              const isPaymentRejected = order.paymentStatus === 'rejected';
              const showDeliveryRefToCustomer =
                isDeliveryServiceType(order.serviceType) &&
                Boolean(order.transactionRef) &&
                isActiveStatus(order.status) &&
                !isAwaitingPaymentReview;

              const statusBadgeStyle =
                order.status === 'completed'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : order.status === 'cancelled'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : order.status === 'on_the_way'
                  ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                  : order.status === 'preparing' || order.status === 'confirmed'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

              const gridColsClass =
                steps.length === 3
                  ? 'grid-cols-3'
                  : steps.length === 4
                  ? 'grid-cols-4'
                  : 'grid-cols-5';

              return (
                <div
                  key={order.id}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
                    isHighlighted
                      ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/15'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
                  }`}
                >
                  {/* Top Row: Title, Provider, Service-Specific Status Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {order.title}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.providerName}
                        {order.transactionRef && (
                          <span className="font-mono ms-2 text-slate-500 dark:text-slate-400">
                            · #{order.transactionRef}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl font-bold text-[11px] shrink-0 ${statusBadgeStyle}`}>
                      {isAwaitingPaymentReview
                        ? lang === 'ar'
                          ? 'قيد المراجعة'
                          : 'Pending Review'
                        : getServiceStatusLabel(order.status, order.serviceType, lang)}
                    </span>
                  </div>

                  {/* InstaPay Admin Verification Gate Banner */}
                  {isAwaitingPaymentReview && order.status !== 'cancelled' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2 text-[11px]">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">
                          {lang === 'ar'
                            ? 'الطلب قيد المراجعة — بانتظار تأكيد الإدارة لتحويل InstaPay'
                            : 'Order Under Review — Awaiting Admin InstaPay Verification'}
                        </div>
                        <div className="opacity-85 mt-0.5">
                          {lang === 'ar'
                            ? 'لن يظهر الطلب لمقدم الخدمة إلا بعد مراجعة الإدارة والتأكد من إتمام الدفع على 01012405014.'
                            : 'The service provider will receive this order once Admin verifies your transfer to 01012405014.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {isPaymentRejected && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 text-[11px] font-bold">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        {lang === 'ar'
                          ? 'تم إلغاء الطلب لعدم تأكيد تحويل InstaPay من الإدارة.'
                          : 'Order cancelled — InstaPay transfer could not be verified.'}
                      </span>
                    </div>
                  )}

                  {/* Service-Specific Visual Progress Stepper */}
                  {order.status === 'cancelled' ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {lang === 'ar' ? 'تم إلغاء هذا الطلب.' : 'This order was cancelled.'}
                      </span>
                    </div>
                  ) : (
                    <div className={`grid ${gridColsClass} gap-1.5 pt-1`}>
                      {steps.map((s, idx) => {
                        const StepIcon = getStepIcon(s.key);
                        const reached = stepIdx >= idx;
                        const isCurrent = stepIdx === idx;
                        return (
                          <div key={s.key} className="flex flex-col items-center text-center gap-1">
                            <div className="flex items-center w-full">
                              <div
                                className={`h-1 flex-1 rounded-full ${
                                  idx === 0
                                    ? 'opacity-0'
                                    : reached
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  reached
                                    ? isCurrent && order.status !== 'completed'
                                      ? `${theme.solidBg} text-white ring-2 ring-amber-400/40`
                                      : 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                }`}
                              >
                                <StepIcon className="w-3.5 h-3.5" />
                              </div>
                              <div
                                className={`h-1 flex-1 rounded-full ${
                                  idx === steps.length - 1
                                    ? 'opacity-0'
                                    : stepIdx > idx
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-bold leading-tight ${
                                reached
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {lang === 'ar' ? s.labelAr : s.labelEn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Customer Delivery Reference Box (For Delivery Orders: give to courier on arrival) */}
                  {showDeliveryRefToCustomer && (
                    <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
                        <KeyRound className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <div className="font-bold">
                            {lang === 'ar'
                              ? 'الرقم المرجعي لتأكيد الاستلام:'
                              : 'Delivery Confirmation Reference:'}
                          </div>
                          <div className="opacity-85">
                            {lang === 'ar'
                              ? 'أعطِ هذا الرقم للدليفري عند استلام الطلب لتأكيد التسليم.'
                              : 'Share this reference with the courier upon arrival to confirm delivery.'}
                          </div>
                        </div>
                      </div>
                      <span
                        dir="ltr"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 font-mono tabular-nums font-black text-sm text-sky-700 dark:text-sky-300"
                      >
                        {order.transactionRef}
                      </span>
                    </div>
                  )}

                  {/* Delivery Confirmed Proof */}
                  {order.status === 'completed' && order.deliveryConfirmedRef && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {lang === 'ar'
                          ? `تم تأكيد التسليم بالرقم المرجعي #${order.deliveryConfirmedRef}`
                          : `Delivery verified with reference #${order.deliveryConfirmedRef}`}
                      </span>
                    </div>
                  )}

                  {/* Details & Payment Summary */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2 text-[11px]">
                    {order.itemsSummary && (
                      <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <ReceiptText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{order.itemsSummary}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
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

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                          {renderPaymentIcon(order.paymentMethod)}
                          <span>{getPaymentMethodLabel(order.paymentMethod, lang)}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : order.paymentStatus === 'rejected'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {order.paymentStatus === 'paid'
                            ? lang === 'ar'
                              ? 'تم اعتماد الدفع ✓'
                              : 'Payment Verified ✓'
                            : order.paymentStatus === 'pending_verification'
                            ? lang === 'ar'
                              ? 'بانتظار تأكيد الإدارة'
                              : 'Awaiting Admin Verification'
                            : order.paymentStatus === 'rejected'
                            ? lang === 'ar'
                              ? 'تحويل مرفوض'
                              : 'Transfer Rejected'
                            : lang === 'ar'
                            ? 'الدفع عند الاستلام'
                            : 'Pay on Delivery'}
                        </span>
                      </div>

                      <div className="text-end">
                        {order.codFeeEgp && order.codFeeEgp > 0 ? (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                            {lang === 'ar'
                              ? `شامل ${order.codFeeEgp} ج.م رسوم تحصيل`
                              : `Includes ${order.codFeeEgp} EGP COD fee`}
                          </div>
                        ) : null}
                        <div className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                          {order.totalAmountEgp ? `${order.totalAmountEgp} ${t.currency}` : order.totalAmount || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Action */}
                  {canCancel && (
                    <div className="flex items-center justify-end gap-2">
                      {confirmCancelId === order.id ? (
                        <>
                          <span className="text-[11px] font-semibold text-rose-600">
                            {lang === 'ar' ? 'متأكد من إلغاء الطلب؟' : 'Cancel this order?'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onCancelOrder?.(order.id);
                              setConfirmCancelId(null);
                            }}
                            className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            {lang === 'ar' ? 'نعم، إلغاء' : 'Yes, Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            {t.close}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(order.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-100 cursor-pointer"
                        >
                          {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                        </button>
                      )}
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

