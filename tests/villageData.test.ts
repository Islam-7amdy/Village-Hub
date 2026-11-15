import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDeliveryFeeEgp,
  evaluateProviderAvailability,
  getAllowedStatusesForService,
  getServiceStatusLabel,
  isAdExpired,
  isBanCurrentlyActive,
  maskReferenceCode,
  matchesDeliveryReference,
  normalizePhone,
  parsePriceEgp,
  toE164Phone
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
