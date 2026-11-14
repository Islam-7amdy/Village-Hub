import React, { useState, useEffect } from 'react';
import {
  Language,
  PendingPaymentOrder,
  VillageConfig,
  calculateDeliveryFeeEgp
} from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, ShoppingBag, Plus, Minus, Trash2, Truck, MapPin, Store, CreditCard } from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'food' | 'pharmacy' | 'grocery' | 'farm';
  providerName?: string;
  providerOwnerId?: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  lang: Language;
  activeVillage: VillageConfig;
  defaultName?: string;
  defaultPhone?: string;
  defaultAddress?: string;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToPayment: (order: PendingPaymentOrder) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  items,
  lang,
  activeVillage,
  defaultName = '',
  defaultPhone = '',
  defaultAddress = '',
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment
}) => {
  const t = TRANSLATIONS[lang];
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedDistrictId, setSelectedDistrictId] = useState(
    activeVillage.districts[0]?.id || 'dist-center'
  );
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(
    activeVillage.districts[0]?.distanceKm || 1.0
  );

  useEffect(() => {
    if (defaultName && !customerName) setCustomerName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (defaultPhone && !customerPhone) setCustomerPhone(defaultPhone);
  }, [defaultPhone]);

  useEffect(() => {
    if (defaultAddress && !address) setAddress(defaultAddress);
  }, [defaultAddress]);

  useEffect(() => {
    const first = activeVillage.districts[0];
    if (first) {
      setSelectedDistrictId(first.id);
      setCustomDistanceKm(first.distanceKm);
    }
  }, [activeVillage.id]);

  if (!isOpen) return null;

  const subtotalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isPickup = deliveryMode === 'pickup';
  const distanceKm = isPickup ? 0 : customDistanceKm;
  const deliveryFeeEgp = calculateDeliveryFeeEgp(
    distanceKm,
    isPickup,
    activeVillage.baseDeliveryFeeEgp,
    activeVillage.perKmFeeEgp
  );
  const totalAmount = subtotalAmount + deliveryFeeEgp;

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const found = activeVillage.districts.find((d) => d.id === districtId);
    if (found) {
      setCustomDistanceKm(found.distanceKm);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || defaultName;
    const finalPhone = customerPhone.trim() || defaultPhone;
    if (!finalName || !finalPhone || items.length === 0) return;

    const selectedDist = activeVillage.districts.find((d) => d.id === selectedDistrictId);
    const fullAddress = isPickup
      ? lang === 'ar'
        ? 'استلام من المحل بالقرية'
        : 'Store Pickup'
      : `${selectedDist ? selectedDist.name[lang] : ''}${address.trim() ? ` - ${address.trim()}` : ''}`;

    const summaryText = items
      .map((i) => `${i.name} × ${i.quantity}`)
      .join(' · ')
      .slice(0, 380);

    const primaryProviderName =
      items.find((i) => i.providerName)?.providerName ||
      (lang === 'ar' ? `مطابخ ومتاجر ${activeVillage.nameAr}` : `${activeVillage.nameEn} Merchants`);
    const primaryProviderOwnerId = items.find((i) => i.providerOwnerId)?.providerOwnerId;

    const pendingOrder: PendingPaymentOrder = {
      source: 'cart',
      serviceType: items[0]?.type || 'food',
      title: `${lang === 'ar' ? 'طلب مشتريات وتوصيل منزلي' : 'Village Delivery Order'} (${items.length} ${lang === 'ar' ? 'أصناف' : 'items'})`,
      providerOwnerId: primaryProviderOwnerId,
      providerName: primaryProviderName,
      customerName: finalName,
      customerPhone: finalPhone,
      address: fullAddress,
      distanceKm,
      deliveryFeeEgp,
      subtotalEgp: subtotalAmount,
      totalAmountEgp: totalAmount,
      date: new Date().toISOString().split('T')[0],
      itemsSummary: summaryText,
      cartItems: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
    };

    onClose();
    onProceedToPayment(pendingOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.cart}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t.emptyCart}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded-xl cursor-pointer"
            >
              {lang === 'ar' ? 'ارجع شوف الأكل والصيدلية وخير الغيط' : 'Browse local shops'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
              {/* Items list */}
              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {item.price.toFixed(0)} {t.currency}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Mode Toggle (Doorstep by distance vs Store Pickup) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'ar' ? 'تحب تستلم الطلب إزاي؟' : 'Delivery Method'}
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('delivery')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      deliveryMode === 'delivery'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'توصيل للبيت' : 'Home Delivery'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('pickup')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      deliveryMode === 'pickup'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>{t.pickupFree}</span>
                  </button>
                </div>

                {/* Distance selector when Home Delivery is chosen */}
                {deliveryMode === 'delivery' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <MapPin className="w-3.5 h-3.5 inline me-1 text-amber-600" />
                        {t.deliveryZone}
                      </label>
                      <select
                        value={selectedDistrictId}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {activeVillage.districts.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name[lang]} ({d.distanceKm} {lang === 'ar' ? 'كم' : 'km'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        <span>{t.distanceKm}:</span>
                        <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                          {customDistanceKm.toFixed(1)} {lang === 'ar' ? 'كيلومتر' : 'km'} · {deliveryFeeEgp} {t.currency}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={customDistanceKm}
                        onChange={(e) => setCustomDistanceKm(Number(e.target.value))}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {lang === 'ar'
                          ? `حساب التوصيل في ${activeVillage.nameAr}: ${activeVillage.baseDeliveryFeeEgp} ج.م أساسي + ${activeVillage.perKmFeeEgp} ج.م لكل كيلومتر`
                          : `Rate in ${activeVillage.nameEn}: ${activeVillage.baseDeliveryFeeEgp} EGP base + ${activeVillage.perKmFeeEgp} EGP/km`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.name} *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={defaultName || (lang === 'ar' ? 'اسم المستلم' : 'Recipient Name')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required={!defaultName}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.phone} *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={defaultPhone || '010XXXXXXXX'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required={!defaultPhone}
                    />
                  </div>
                </div>

                {deliveryMode === 'delivery' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.address} *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={lang === 'ar' ? 'الشارع / جنب بيت مين / علامة مميزة' : 'Street / Nearby landmark'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Totals & Submit */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5 shrink-0 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{t.subtotal}</span>
                <span className="font-mono tabular-nums font-bold">
                  {subtotalAmount.toFixed(0)} {t.currency}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {t.deliveryFee} {isPickup ? '' : `(${distanceKm.toFixed(1)} ${lang === 'ar' ? 'كم' : 'km'})`}
                  </span>
                </span>
                <span className={`font-mono tabular-nums font-bold ${isPickup ? 'text-emerald-600' : ''}`}>
                  {isPickup
                    ? lang === 'ar'
                      ? 'ببلاش (0 ج.م)'
                      : 'FREE (0 EGP)'
                    : `${deliveryFeeEgp} ${t.currency}`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t.total}</span>
                <span className="text-xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {totalAmount.toFixed(0)} {t.currency}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{t.proceedToPayment} ({totalAmount.toFixed(0)} {t.currency})</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
