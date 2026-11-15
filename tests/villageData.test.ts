import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliveryFeeEgp,
  evaluateProviderAvailability,
  getAllowedStatusesForService,
  getServiceStatusLabel,
  isAdExpired,
  isBanCurrentlyActive,
  isOrderEligibleForReview,
  maskReferenceCode,
  matchesDeliveryReference,
  normalizePhone,
  parsePriceEgp,
  toE164Phone,
  validateBookingFinancials
} from '../src/data/villageData.ts';

test('normalizePhone converts Egyptian local and international numbers consistently', () => {
  assert.equal(normalizePhone('01012405014'), '01012405014');
  assert.equal(normalizePhone('+20 101 240 5014'), '01012405014');
  assert.equal(normalizePhone('00201012405014'), '01012405014');
  assert.equal(normalizePhone('010-1240-5014'), '01012405014');
});

test('toE164Phone formats Egyptian mobile numbers to E.164', () => {
  assert.equal(toE164Phone('01012405014'), '+201012405014');
  assert.equal(toE164Phone('+201012405014'), '+201012405014');
  assert.equal(toE164Phone('00201012405014'), '+201012405014');
});

test('isBanCurrentlyActive respects permanent, timed, and expired bans', () => {
  const now = 1_700_000_000_000;
  assert.equal(isBanCurrentlyActive(false, 0, true, now), true);
  assert.equal(isBanCurrentlyActive(true, now + 60_000, false, now), true);
  assert.equal(isBanCurrentlyActive(true, now - 10_000, false, now), false);
  assert.equal(isBanCurrentlyActive(false, 0, false, now), false);
});

test('isAdExpired checks expiration timestamps accurately', () => {
  const now = 1_700_000_000_000;
  assert.equal(isAdExpired(undefined, now), false);
  assert.equal(isAdExpired(0, now), false);
  assert.equal(isAdExpired(now + 1000, now), false);
  assert.equal(isAdExpired(now - 1000, now), true);
});

test('evaluateProviderAvailability handles manual toggle, hours, and working days', () => {
  // Monday at 12:00 PM local time
  const mondayNoon = new Date(2026, 10, 16, 12, 0, 0).getTime(); // 2026-11-16 is Monday (day 1)
  const mondayMidnight = new Date(2026, 10, 16, 23, 30, 0).getTime();

  const manualClosed = evaluateProviderAvailability(
    { isAcceptingOrders: false, manualClosedReason: 'راحة للصلاة' },
    mondayNoon
  );
  assert.equal(manualClosed.isOpen, false);
  assert.equal(manualClosed.reason, 'manual_closed');

  const withinHours = evaluateProviderAvailability(
    {
      isAcceptingOrders: true,
      scheduleEnabled: true,
      openTime: '09:00',
      closeTime: '22:00',
      workingDays: [1]
    },
    mondayNoon
  );
  assert.equal(withinHours.isOpen, true);
  assert.equal(withinHours.reason, 'open');

  const outsideHours = evaluateProviderAvailability(
    {
      isAcceptingOrders: true,
      scheduleEnabled: true,
      openTime: '09:00',
      closeTime: '22:00',
      workingDays: [1]
    },
    mondayMidnight
  );
  assert.equal(outsideHours.isOpen, false);
  assert.equal(outsideHours.reason, 'outside_hours');

  const dayOff = evaluateProviderAvailability(
    {
      isAcceptingOrders: true,
      scheduleEnabled: true,
      openTime: '09:00',
      closeTime: '22:00',
      workingDays: [5] // Friday only
    },
    mondayNoon
  );
  assert.equal(dayOff.isOpen, false);
  assert.equal(dayOff.reason, 'day_off');
});

test('getAllowedStatusesForService and getServiceStatusLabel match service category semantics', () => {
  const doctorStatuses = getAllowedStatusesForService('doctor');
  assert.deepEqual(doctorStatuses, ['pending', 'confirmed', 'completed', 'cancelled']);
  assert.equal(doctorStatuses.includes('preparing'), false);
  assert.equal(doctorStatuses.includes('on_the_way'), false);
  assert.equal(getServiceStatusLabel('completed', 'doctor', 'ar'), 'تم الكشف');

  const foodStatuses = getAllowedStatusesForService('food');
  assert.equal(foodStatuses.includes('preparing'), true);
  assert.equal(foodStatuses.includes('on_the_way'), true);
  assert.equal(getServiceStatusLabel('preparing', 'food', 'ar'), 'جاري تجهيز الطلب');
});

test('parsePriceEgp and calculateDeliveryFeeEgp handle Arabic numerals and pickup mode', () => {
  assert.equal(parsePriceEgp('١٥٠ ج.م', 50), 150);
  assert.equal(parsePriceEgp('80 EGP / Visit', 50), 80);
  assert.equal(parsePriceEgp('مجاني', 50), 50);

  assert.equal(calculateDeliveryFeeEgp(2, true, 10, 5), 0);
  assert.equal(calculateDeliveryFeeEgp(2, false, 10, 5), 20);
});

test('matchesDeliveryReference and maskReferenceCode verify customer handover codes', () => {
  assert.equal(matchesDeliveryReference('nqb-849201', 'NQB-849201'), true);
  assert.equal(matchesDeliveryReference('849201', 'NQB-849201'), true);
  assert.equal(matchesDeliveryReference('1234', 'NQB-849201'), false);
  assert.equal(maskReferenceCode('NQB-849201'), '••••01');
});

test('validateBookingFinancials checks totals and payment method fees strictly', () => {
  assert.equal(
    validateBookingFinancials({
      subtotalEgp: 100,
      deliveryFeeEgp: 15,
      codFeeEgp: 0,
      totalAmountEgp: 115,
      paymentMethod: 'instapay'
    }),
    true
  );
  assert.equal(
    validateBookingFinancials({
      subtotalEgp: 100,
      deliveryFeeEgp: 15,
      codFeeEgp: 10,
      totalAmountEgp: 125,
      paymentMethod: 'cod'
    }),
    true
  );
  assert.equal(
    validateBookingFinancials({
      subtotalEgp: 100,
      deliveryFeeEgp: 15,
      codFeeEgp: 0,
      totalAmountEgp: 115,
      paymentMethod: 'cod'
    }),
    false
  );
  assert.equal(
    validateBookingFinancials({
      subtotalEgp: 100,
      deliveryFeeEgp: 15,
      codFeeEgp: 0,
      totalAmountEgp: 10,
      paymentMethod: 'instapay'
    }),
    false
  );
});

test('isOrderEligibleForReview restricts reviews to completed unreviewed orders of the reviewer', () => {
  const completedOrder = {
    id: 'book-123',
    ownerId: 'user-1',
    providerOwnerId: 'doc-1',
    serviceType: 'doctor' as const,
    title: 'كشف باطنة',
    providerName: 'د. محمد',
    customerName: 'عميل',
    customerPhone: '01012345678',
    address: 'وسط البلد',
    date: '2026-11-15',
    status: 'completed' as const,
    createdAt: '2026-11-15'
  };

  assert.equal(isOrderEligibleForReview(completedOrder, 'prov-doc-1', 'user-1', []), true);
  assert.equal(isOrderEligibleForReview(completedOrder, 'doc-1', 'user-1', []), true);
  assert.equal(isOrderEligibleForReview(completedOrder, 'prov-doc-1', 'other-user', []), false);
  assert.equal(
    isOrderEligibleForReview(
      { ...completedOrder, status: 'pending' },
      'prov-doc-1',
      'user-1',
      []
    ),
    false
  );
  assert.equal(
    isOrderEligibleForReview(completedOrder, 'prov-doc-1', 'user-1', [
      {
        id: 'rev-book-123',
        bookingId: 'book-123',
        targetId: 'prov-doc-1',
        author: 'عميل',
        neighborhood: { ar: 'وسط البلد', en: 'Center' },
        rating: 5,
        date: '2026-11-15',
        comment: { ar: 'ممتاز', en: 'Great' },
        isVerifiedResident: true
      }
    ]),
    false
  );
});
