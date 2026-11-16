export type Language = 'ar' | 'en';

export type VillageColorCode = 'amber' | 'emerald' | 'blue' | 'teal' | 'rose' | 'indigo';

export interface VillageColorTheme {
  id: VillageColorCode;
  label: { ar: string; en: string };
  hex: string;
  solidBg: string;
  hoverBg: string;
  text: string;
  softBg: string;
  border: string;
  dotBg: string;
  underlineBg: string;
  heroTint: string;
}

export const VILLAGE_COLOR_THEMES: Record<VillageColorCode, VillageColorTheme> = {
  amber: {
    id: 'amber',
    label: { ar: 'عنبري ذهبي', en: 'Amber Gold' },
    hex: '#d97706',
    solidBg: 'bg-amber-600',
    hoverBg: 'hover:bg-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
    softBg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-300 dark:border-amber-700',
    dotBg: 'bg-amber-500',
    underlineBg: 'bg-amber-600 dark:bg-amber-400',
    heroTint: 'from-amber-950/85 via-slate-950/60 to-amber-900/20'
  },
  emerald: {
    id: 'emerald',
    label: { ar: 'أخضر زمردي', en: 'Nile Emerald' },
    hex: '#059669',
    solidBg: 'bg-emerald-600',
    hoverBg: 'hover:bg-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-400',
    softBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-300 dark:border-emerald-700',
    dotBg: 'bg-emerald-500',
    underlineBg: 'bg-emerald-600 dark:bg-emerald-400',
    heroTint: 'from-emerald-950/85 via-slate-950/60 to-emerald-900/20'
  },
  blue: {
    id: 'blue',
    label: { ar: 'أزرق نيلي', en: 'Nile Blue' },
    hex: '#0284c7',
    solidBg: 'bg-sky-600',
    hoverBg: 'hover:bg-sky-700',
    text: 'text-sky-700 dark:text-sky-400',
    softBg: 'bg-sky-50 dark:bg-sky-950/50',
    border: 'border-sky-300 dark:border-sky-700',
    dotBg: 'bg-sky-500',
    underlineBg: 'bg-sky-600 dark:bg-sky-400',
    heroTint: 'from-sky-950/85 via-slate-950/60 to-sky-900/20'
  },
  teal: {
    id: 'teal',
    label: { ar: 'تركواز هادي', en: 'Oasis Teal' },
    hex: '#0d9488',
    solidBg: 'bg-teal-600',
    hoverBg: 'hover:bg-teal-700',
    text: 'text-teal-700 dark:text-teal-400',
    softBg: 'bg-teal-50 dark:bg-teal-950/50',
    border: 'border-teal-300 dark:border-teal-700',
    dotBg: 'bg-teal-500',
    underlineBg: 'bg-teal-600 dark:bg-teal-400',
    heroTint: 'from-teal-950/85 via-slate-950/60 to-teal-900/20'
  },
  rose: {
    id: 'rose',
    label: { ar: 'قرمزي دافي', en: 'Terracotta Rose' },
    hex: '#e11d48',
    solidBg: 'bg-rose-600',
    hoverBg: 'hover:bg-rose-700',
    text: 'text-rose-700 dark:text-rose-400',
    softBg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-300 dark:border-rose-700',
    dotBg: 'bg-rose-500',
    underlineBg: 'bg-rose-600 dark:bg-rose-400',
    heroTint: 'from-rose-950/85 via-slate-950/60 to-rose-900/20'
  },
  indigo: {
    id: 'indigo',
    label: { ar: 'نيلي غامق', en: 'Deep Indigo' },
    hex: '#4f46e5',
    solidBg: 'bg-indigo-600',
    hoverBg: 'hover:bg-indigo-700',
    text: 'text-indigo-700 dark:text-indigo-400',
    softBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-indigo-300 dark:border-indigo-700',
    dotBg: 'bg-indigo-500',
    underlineBg: 'bg-indigo-600 dark:bg-indigo-400',
    heroTint: 'from-indigo-950/85 via-slate-950/60 to-indigo-900/20'
  }
};

export function getVillageTheme(colorCode?: string): VillageColorTheme {
  if (colorCode && colorCode in VILLAGE_COLOR_THEMES) {
    return VILLAGE_COLOR_THEMES[colorCode as VillageColorCode];
  }
  return VILLAGE_COLOR_THEMES.amber;
}

export interface VillageDistrict {
  id: string;
  name: { ar: string; en: string };
  distanceKm: number;
}

export type VillageLogoIconId =
  | 'wheat'
  | 'trees'
  | 'landmark'
  | 'waves'
  | 'sun'
  | 'building'
  | 'sprout'
  | 'compass';

export const VILLAGE_LOGO_PRESETS: { id: VillageLogoIconId; label: { ar: string; en: string } }[] = [
  { id: 'wheat', label: { ar: 'سنبلة القمح', en: 'Wheat' } },
  { id: 'trees', label: { ar: 'نخيل وخضرة', en: 'Trees' } },
  { id: 'landmark', label: { ar: 'معلم القرية', en: 'Landmark' } },
  { id: 'waves', label: { ar: 'النيل والترعة', en: 'Waterway' } },
  { id: 'sun', label: { ar: 'شمس البلد', en: 'Sun' } },
  { id: 'building', label: { ar: 'مبنى البلد', en: 'Town Hall' } },
  { id: 'sprout', label: { ar: 'زرعة الخير', en: 'Sprout' } },
  { id: 'compass', label: { ar: 'دليل القرية', en: 'Compass' } }
];

export interface VillageConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateAr: string;
  governorateEn: string;
  descriptionAr: string;
  descriptionEn: string;
  baseDeliveryFeeEgp: number;
  perKmFeeEgp: number;
  colorCode: VillageColorCode;
  logoIcon?: VillageLogoIconId;
  logoUrl?: string;
  isActive: boolean;
  districts: VillageDistrict[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phone: string;
  address?: string;
  photoUrl?: string;
  role: 'resident' | 'provider';
  villageId: string;
  neighborhood?: string;
  providerStatus: 'none' | 'pending' | 'approved' | 'rejected';
  serviceCategory?: 'none' | 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride' | (string & {});
  serviceTitle?: string;
  serviceFeeEgp?: string;
  serviceBio?: string;
  isBanned?: boolean;
  banUntilMs?: number;
  banReason?: string;
}

export interface BannedPhoneRecord {
  phone: string;
  userId?: string;
  userName?: string;
  reason?: string;
  banUntilMs: number;
  isPermanent: boolean;
}

export type DemoUserAdminAction =
  | { type: 'ban'; uid: string; banUntilMs: number; reason: string; isPermanent: boolean }
  | { type: 'unban'; uid: string }
  | { type: 'delete'; uid: string };

export interface PlatformPricingConfig {
  adPriceWeekEgp: number;
  adPriceMonthEgp: number;
  commissionRatePercent?: number;
}

export interface ProviderAvailabilityConfig {
  isAcceptingOrders?: boolean;
  manualClosedReason?: string;
  scheduleEnabled?: boolean;
  openTime?: string; // 24h HH:MM
  closeTime?: string; // 24h HH:MM
  workingDays?: number[]; // 0=Sun..6=Sat
}

export interface ProviderAvailabilityStatus {
  isOpen: boolean;
  reason: 'open' | 'manual_closed' | 'outside_hours' | 'day_off';
  labelAr: string;
  labelEn: string;
  scheduleTextAr?: string;
  scheduleTextEn?: string;
  manualClosedReason?: string;
}

export interface ProviderListing extends ProviderAvailabilityConfig {
  id: string;
  ownerId: string;
  villageId: string;
  nameAr: string;
  nameEn: string;
  category: 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride' | (string & {});
  specialtyAr: string;
  specialtyEn: string;
  phone: string;
  neighborhoodAr?: string;
  neighborhoodEn?: string;
  priceLabelAr?: string;
  priceLabelEn?: string;
  bioAr?: string;
  bioEn?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface VillageAd {
  id: string;
  ownerId: string;
  authorName: string;
  villageId: string;
  title: string;
  description: string;
  category: 'offer' | 'shop' | 'property' | 'job' | 'event';
  priceText?: string;
  contactPhone: string;
  durationPlan?: 'week' | 'month';
  durationDays?: number;
  costEgp?: number;
  expiresAtMs?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdDate?: string;
}

export interface ReviewItem {
  id: string;
  bookingId?: string;
  targetId: string;
  villageId?: string;
  author: string;
  neighborhood: { ar: string; en: string };
  rating: number;
  date: string;
  comment: { ar: string; en: string };
  isVerifiedResident: boolean;
}

export interface DoctorService {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  specialty: { ar: string; en: string };
  clinicName: { ar: string; en: string };
  phone: string;
  location: { ar: string; en: string };
  rating: number;
  reviewsCount: number;
  availableDays: { ar: string; en: string };
  fee: { ar: string; en: string };
  supportsHomeVisit: boolean;
  avatar: string;
  availability?: ProviderAvailabilityConfig;
}

export interface TechnicianService {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  craft: { ar: string; en: string };
  category: 'electrician' | 'plumber' | 'hvac' | 'carpenter' | 'solar' | 'auto';
  phone: string;
  whatsapp: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  hourlyRate: { ar: string; en: string };
  neighborhood: { ar: string; en: string };
  avatar: string;
  bio: { ar: string; en: string };
  availability?: ProviderAvailabilityConfig;
}

export interface FoodItem {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  price: number;
  currency: { ar: string; en: string };
  category: 'bakery' | 'traditional' | 'grill' | 'dessert';
  restaurantName: { ar: string; en: string };
  image: string;
  availability?: ProviderAvailabilityConfig;
}

export interface PharmacyItem {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  category: 'pain' | 'chronic' | 'firstaid' | 'baby' | 'vitamins';
  price: number;
  currency: { ar: string; en: string };
  inStock: boolean;
  requiresPrescription: boolean;
  availability?: ProviderAvailabilityConfig;
}

export interface GroceryItem {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  storeName: { ar: string; en: string };
  description: { ar: string; en: string };
  category: 'staples' | 'dairy' | 'produce' | 'cleaning';
  price: number;
  unit: { ar: string; en: string };
  currency: { ar: string; en: string };
  availability?: ProviderAvailabilityConfig;
}

export interface TutoringService {
  id: string;
  ownerId?: string;
  villageId: string;
  teacherName: { ar: string; en: string };
  subject: { ar: string; en: string };
  category: 'math' | 'languages' | 'science' | 'quran';
  grades: { ar: string; en: string };
  feePerSession: { ar: string; en: string };
  schedule: { ar: string; en: string };
  location: { ar: string; en: string };
  phone: string;
  mode: { ar: string; en: string };
  availability?: ProviderAvailabilityConfig;
}

export interface CharityOrg {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  focus: { ar: string; en: string };
  activeCampaign: { ar: string; en: string };
  address: { ar: string; en: string };
  phone: string;
  donationExample: { ar: string; en: string };
  availability?: ProviderAvailabilityConfig;
}

export interface FarmHarvestItem {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  farmerName: { ar: string; en: string };
  price: number;
  unit: { ar: string; en: string };
  currency: { ar: string; en: string };
  description: { ar: string; en: string };
  location: { ar: string; en: string };
}

export interface VillageAnnouncement {
  id: string;
  ownerId: string;
  authorName: string;
  authorNameEn?: string;
  villageId: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  category: 'official' | 'utility' | 'community' | 'event' | 'emergency';
  date: string;
  contactPhone?: string;
  isPinned?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAtMs?: number;
}

export interface VillageRide {
  id: string;
  ownerId?: string;
  villageId: string;
  driverName: { ar: string; en: string };
  from: { ar: string; en: string };
  to: { ar: string; en: string };
  departureTime: string;
  availableSeats: number;
  pricePerSeat: { ar: string; en: string };
  carModel: string;
  phone: string;
  availability?: ProviderAvailabilityConfig;
}

export interface OtherService {
  id: string;
  ownerId?: string;
  villageId: string;
  name: { ar: string; en: string };
  activityType: { ar: string; en: string };
  description: { ar: string; en: string };
  address: { ar: string; en: string };
  priceLabel: { ar: string; en: string };
  hours: { ar: string; en: string };
  phone: string;
  availability?: ProviderAvailabilityConfig;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'instapay' | 'cod';
export type PaymentStatus = 'paid' | 'pending_verification' | 'pending_cod' | 'rejected';
export type SettlementStatus = 'pending' | 'settled';

export interface BookingRequest {
  id: string;
  ownerId?: string;
  villageId?: string;
  serviceType: 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride' | (string & {});
  title: string;
  providerOwnerId?: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distanceKm?: number;
  deliveryFeeEgp?: number;
  codFeeEgp?: number;
  subtotalEgp?: number;
  totalAmountEgp?: number;
  date: string;
  time?: string;
  notes?: string;
  itemsSummary?: string;
  totalAmount?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  providerVisible?: boolean;
  instaPaySender?: string;
  instaPayCustomerRef?: string;
  paymentVerifiedAt?: string;
  transactionRef?: string;
  deliveryConfirmedRef?: string;
  deliveryConfirmedAt?: string;
  settlementStatus?: SettlementStatus;
  settledAt?: string;
  adminNotes?: string;
  status: BookingStatus;
  createdAt: string;
}

export function isDeliveryServiceType(serviceType: BookingRequest['serviceType']): boolean {
  return (
    serviceType === 'food' ||
    serviceType === 'pharmacy' ||
    serviceType === 'grocery' ||
    serviceType === 'farm'
  );
}

export function getAllowedStatusesForService(
  serviceType: BookingRequest['serviceType']
): BookingStatus[] {
  if (isDeliveryServiceType(serviceType)) {
    return ['pending', 'confirmed', 'preparing', 'on_the_way', 'completed', 'cancelled'];
  }
  if (serviceType === 'technician' || serviceType === 'ride') {
    return ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
  }
  return ['pending', 'confirmed', 'completed', 'cancelled'];
}

export function getServiceStatusLabel(
  status: BookingStatus,
  serviceType: BookingRequest['serviceType'] | undefined,
  lang: Language
): string {
  const st = serviceType || 'other';
  if (st === 'doctor') {
    switch (status) {
      case 'pending':
        return lang === 'ar' ? 'بانتظار تأكيد الحجز' : 'Pending Confirmation';
      case 'confirmed':
        return lang === 'ar' ? 'تم تأكيد الموعد' : 'Appointment Confirmed';
      case 'completed':
        return lang === 'ar' ? 'تم الكشف' : 'Visit Completed';
      case 'cancelled':
        return lang === 'ar' ? 'ملغي' : 'Cancelled';
      default:
        return lang === 'ar' ? 'تم تأكيد الموعد' : 'Confirmed';
    }
  }
  if (st === 'technician') {
    switch (status) {
      case 'pending':
        return lang === 'ar' ? 'بانتظار تأكيد الفني' : 'Pending Confirmation';
      case 'confirmed':
        return lang === 'ar' ? 'تم تأكيد الزيارة' : 'Visit Confirmed';
      case 'on_the_way':
        return lang === 'ar' ? 'الفني في الطريق' : 'Technician En Route';
      case 'completed':
        return lang === 'ar' ? 'تم إنجاز الصيانة' : 'Repair Completed';
      case 'cancelled':
        return lang === 'ar' ? 'ملغي' : 'Cancelled';
      default:
        return lang === 'ar' ? 'تم تأكيد الزيارة' : 'Confirmed';
    }
  }
  if (st === 'ride') {
    switch (status) {
      case 'pending':
        return lang === 'ar' ? 'بانتظار تأكيد السائق' : 'Pending Driver';
      case 'confirmed':
        return lang === 'ar' ? 'تم حجز المقعد' : 'Seat Confirmed';
      case 'on_the_way':
        return lang === 'ar' ? 'الرحلة جارية' : 'Trip In Progress';
      case 'completed':
        return lang === 'ar' ? 'تم الوصول' : 'Arrived';
      case 'cancelled':
        return lang === 'ar' ? 'ملغي' : 'Cancelled';
      default:
        return lang === 'ar' ? 'تم حجز المقعد' : 'Confirmed';
    }
  }
  if (!isDeliveryServiceType(st)) {
    switch (status) {
      case 'pending':
        return lang === 'ar' ? 'قيد المراجعة' : 'Pending Review';
      case 'confirmed':
        return lang === 'ar' ? 'تم التأكيد' : 'Confirmed';
      case 'completed':
        return lang === 'ar' ? 'مكتمل' : 'Completed';
      case 'cancelled':
        return lang === 'ar' ? 'ملغي' : 'Cancelled';
      default:
        return lang === 'ar' ? 'تم التأكيد' : 'Confirmed';
    }
  }

  switch (status) {
    case 'pending':
      return lang === 'ar' ? 'قيد المراجعة' : 'Pending Review';
    case 'confirmed':
      return lang === 'ar' ? 'تم قبول الطلب' : 'Order Accepted';
    case 'preparing':
      return lang === 'ar' ? 'جاري تجهيز الطلب' : 'Preparing Order';
    case 'on_the_way':
      return lang === 'ar' ? 'في الطريق للتسليم' : 'Out for Delivery';
    case 'completed':
      return lang === 'ar' ? 'تم التسليم' : 'Delivered';
    case 'cancelled':
      return lang === 'ar' ? 'ملغي' : 'Cancelled';
    default:
      return status;
  }
}

export function getServiceTimelineSteps(
  serviceType: BookingRequest['serviceType']
): { key: BookingStatus; labelAr: string; labelEn: string }[] {
  const allowed = getAllowedStatusesForService(serviceType).filter((s) => s !== 'cancelled');
  return allowed.map((key) => ({
    key,
    labelAr: getServiceStatusLabel(key, serviceType, 'ar'),
    labelEn: getServiceStatusLabel(key, serviceType, 'en')
  }));
}

export function matchesDeliveryReference(inputRef: string, expectedRef?: string): boolean {
  const cleanInput = inputRef.trim().replace(/^#/, '').toUpperCase();
  if (cleanInput.length < 4) return false;
  if (!expectedRef || !expectedRef.trim()) return true;
  const cleanExpected = expectedRef.trim().replace(/^#/, '').toUpperCase();
  if (cleanInput === cleanExpected) return true;
  const expectedSuffix = cleanExpected.includes('-')
    ? cleanExpected.split('-').pop() || cleanExpected
    : cleanExpected;
  return cleanInput === expectedSuffix || (cleanInput.length >= 4 && cleanExpected.endsWith(cleanInput));
}

export function maskReferenceCode(ref?: string): string {
  if (!ref) return '••••••';
  const clean = ref.trim();
  if (clean.length <= 2) return '••••';
  return `••••${clean.slice(-2)}`;
}

export const WEEKDAY_LABELS: { day: number; labelAr: string; labelEn: string }[] = [
  { day: 6, labelAr: 'السبت', labelEn: 'Sat' },
  { day: 0, labelAr: 'الأحد', labelEn: 'Sun' },
  { day: 1, labelAr: 'الإثنين', labelEn: 'Mon' },
  { day: 2, labelAr: 'الثلاثاء', labelEn: 'Tue' },
  { day: 3, labelAr: 'الأربعاء', labelEn: 'Wed' },
  { day: 4, labelAr: 'الخميس', labelEn: 'Thu' },
  { day: 5, labelAr: 'الجمعة', labelEn: 'Fri' }
];

function parseHhMmToMinutes(hhmm?: string, fallbackMinutes = 540): number {
  if (!hhmm) return fallbackMinutes;
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallbackMinutes;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallbackMinutes;
  return h * 60 + m;
}

export function formatTimeDisplay(hhmm: string, lang: Language): string {
  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return hhmm;
  const h24 = Number(match[1]);
  const m = Number(match[2]);
  const period = h24 >= 12 ? (lang === 'ar' ? 'م' : 'PM') : lang === 'ar' ? 'ص' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(m).padStart(2, '0');
  return `${h12}:${mm} ${period}`;
}

export function evaluateProviderAvailability(
  config?: ProviderAvailabilityConfig,
  nowMs = Date.now()
): ProviderAvailabilityStatus {
  const scheduleEnabled = Boolean(config?.scheduleEnabled);
  const openTime = config?.openTime || '09:00';
  const closeTime = config?.closeTime || '22:00';
  const scheduleTextAr = scheduleEnabled
    ? `${formatTimeDisplay(openTime, 'ar')} - ${formatTimeDisplay(closeTime, 'ar')}`
    : undefined;
  const scheduleTextEn = scheduleEnabled
    ? `${formatTimeDisplay(openTime, 'en')} - ${formatTimeDisplay(closeTime, 'en')}`
    : undefined;

  if (config?.isAcceptingOrders === false) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      labelAr: 'مغلق الآن — متوقف عن استلام الطلبات',
      labelEn: 'Closed Now — Not Accepting Orders',
      scheduleTextAr,
      scheduleTextEn,
      manualClosedReason: config.manualClosedReason?.trim() || undefined
    };
  }

  if (scheduleEnabled) {
    const now = new Date(nowMs);
    const today = now.getDay();
    const yesterday = (today + 6) % 7;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseHhMmToMinutes(openTime, 9 * 60);
    const closeMinutes = parseHhMmToMinutes(closeTime, 22 * 60);
    const days = Array.isArray(config?.workingDays) ? config.workingDays : [6, 0, 1, 2, 3, 4];

    let withinSchedule = false;
    let isDayOff = false;

    if (openMinutes === closeMinutes) {
      withinSchedule = days.includes(today);
      isDayOff = !withinSchedule;
    } else if (openMinutes < closeMinutes) {
      if (!days.includes(today)) {
        isDayOff = true;
      } else {
        withinSchedule = nowMinutes >= openMinutes && nowMinutes < closeMinutes;
      }
    } else {
      // Overnight shift (e.g., 18:00 -> 02:00)
      const inTonightShift = days.includes(today) && nowMinutes >= openMinutes;
      const inYesterdayShift = days.includes(yesterday) && nowMinutes < closeMinutes;
      withinSchedule = inTonightShift || inYesterdayShift;
      if (!withinSchedule && !days.includes(today)) {
        isDayOff = true;
      }
    }

    if (!withinSchedule) {
      return {
        isOpen: false,
        reason: isDayOff ? 'day_off' : 'outside_hours',
        labelAr: isDayOff
          ? 'مغلق اليوم — خارج أيام العمل'
          : 'مغلق الآن — خارج مواعيد العمل',
        labelEn: isDayOff
          ? 'Closed Today — Day Off'
          : 'Closed Now — Outside Working Hours',
        scheduleTextAr,
        scheduleTextEn
      };
    }
  }

  return {
    isOpen: true,
    reason: 'open',
    labelAr: 'مفتوح الآن',
    labelEn: 'Open Now',
    scheduleTextAr,
    scheduleTextEn
  };
}

export type SectionIconKey =
  | 'layout'
  | 'stethoscope'
  | 'pill'
  | 'utensils'
  | 'wrench'
  | 'car'
  | 'shopping_basket'
  | 'graduation_cap'
  | 'heart_handshake'
  | 'shapes'
  | 'store'
  | 'hammer'
  | 'sparkles';

export type SectionColorKey =
  | 'amber'
  | 'emerald'
  | 'rose'
  | 'orange'
  | 'blue'
  | 'lime'
  | 'indigo'
  | 'teal'
  | 'purple'
  | 'slate';

export interface ServiceSectionConfig {
  id: string;
  providerCategoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconKey: SectionIconKey;
  colorCode: SectionColorKey;
  isEnabled: boolean;
  sortOrder: number;
  isBuiltIn: boolean;
}

export const DEFAULT_SERVICE_SECTIONS: ServiceSectionConfig[] = [
  {
    id: 'doctors',
    providerCategoryId: 'doctor',
    nameAr: 'أطباء وعيادات',
    nameEn: 'Doctors & Clinics',
    descriptionAr: 'حجز عيادات الأطباء والتمريض والزيارات المنزلية في القرية',
    descriptionEn: 'Village clinic appointments, doctors, and home visits',
    iconKey: 'stethoscope',
    colorCode: 'rose',
    isEnabled: true,
    sortOrder: 1,
    isBuiltIn: true
  },
  {
    id: 'pharmacy',
    providerCategoryId: 'pharmacy',
    nameAr: 'صيدليات',
    nameEn: 'Pharmacies',
    descriptionAr: 'طلب الأدوية ومستلزمات الصيدلية ورفع الروشتة',
    descriptionEn: 'Medications, pharmacy essentials, and prescription upload',
    iconKey: 'pill',
    colorCode: 'emerald',
    isEnabled: true,
    sortOrder: 2,
    isBuiltIn: true
  },
  {
    id: 'food',
    providerCategoryId: 'food',
    nameAr: 'مطاعم وكافيهات',
    nameEn: 'Restaurants & Cafes',
    descriptionAr: 'أكلات بيتي، مخابز، مشويات وكافيهات القرية',
    descriptionEn: 'Home cooking, bakeries, grills, and local cafes',
    iconKey: 'utensils',
    colorCode: 'orange',
    isEnabled: true,
    sortOrder: 3,
    isBuiltIn: true
  },
  {
    id: 'technicians',
    providerCategoryId: 'technician',
    nameAr: 'فنيون وحرفيون',
    nameEn: 'Technicians & Craftsmen',
    descriptionAr: 'كهربائي، سباك، نجار، فني تكييف وصيانة منزلية',
    descriptionEn: 'Electricians, plumbers, carpenters, and home repair technicians',
    iconKey: 'wrench',
    colorCode: 'amber',
    isEnabled: true,
    sortOrder: 4,
    isBuiltIn: true
  },
  {
    id: 'rides',
    providerCategoryId: 'ride',
    nameAr: 'مواصلات',
    nameEn: 'Transportation',
    descriptionAr: 'توصيلات داخل القرية والمراكز والمدن المجاورة',
    descriptionEn: 'Local rides and transit trips',
    iconKey: 'car',
    colorCode: 'blue',
    isEnabled: true,
    sortOrder: 5,
    isBuiltIn: true
  },
  {
    id: 'grocery',
    providerCategoryId: 'grocery',
    nameAr: 'بقالة وسوبر ماركت',
    nameEn: 'Grocery & Market',
    descriptionAr: 'سلع غذائية، خضار وفاكهة، وألبان بلدي',
    descriptionEn: 'Groceries, fresh produce, and village dairy products',
    iconKey: 'shopping_basket',
    colorCode: 'lime',
    isEnabled: true,
    sortOrder: 6,
    isBuiltIn: true
  },
  {
    id: 'tutoring',
    providerCategoryId: 'tutoring',
    nameAr: 'دروس ومعلمون',
    nameEn: 'Tutoring & Teachers',
    descriptionAr: 'دروس تقوية لجميع المراحل الدراسية وتحفيظ القرآن',
    descriptionEn: 'Academic tutoring and study circles for all grade levels',
    iconKey: 'graduation_cap',
    colorCode: 'indigo',
    isEnabled: true,
    sortOrder: 7,
    isBuiltIn: true
  },
  {
    id: 'charity',
    providerCategoryId: 'charity',
    nameAr: 'الجمعيات الخيرية',
    nameEn: 'Charities & Aid',
    descriptionAr: 'مبادرات التكافل، الكفالة، والمساعدات الطبية والغذائية',
    descriptionEn: 'Local charity campaigns and community aid',
    iconKey: 'heart_handshake',
    colorCode: 'teal',
    isEnabled: true,
    sortOrder: 8,
    isBuiltIn: true
  },
  {
    id: 'other',
    providerCategoryId: 'other',
    nameAr: 'أخرى',
    nameEn: 'Other Activities',
    descriptionAr: 'مكتبات، صيانة موبايلات، مغاسل، وأنشطة متنوعة بالقرية',
    descriptionEn: 'Printing, phone repair, laundry, and other village services',
    iconKey: 'shapes',
    colorCode: 'purple',
    isEnabled: true,
    sortOrder: 9,
    isBuiltIn: true
  }
];

export type AnalyticsEventType =
  | 'section_view'
  | 'ad_view'
  | 'ad_click'
  | 'news_view'
  | 'news_click'
  | 'provider_view';

export interface AnalyticsEventRecord {
  id: string;
  ownerId: string;
  userRole?: 'resident' | 'provider' | 'admin' | 'guest';
  eventType: AnalyticsEventType;
  targetId: string;
  targetLabel: string;
  villageId: string;
  createdAtMs: number;
}

export interface PendingPaymentOrder {
  source: 'cart' | 'booking' | 'prescription';
  serviceType: BookingRequest['serviceType'];
  title: string;
  providerOwnerId?: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distanceKm?: number;
  deliveryFeeEgp?: number;
  subtotalEgp: number;
  totalAmountEgp: number;
  date: string;
  time?: string;
  notes?: string;
  itemsSummary?: string;
  cartItems?: { id: string; name: string; price: number; quantity: number }[];
}

export function parsePriceEgp(priceLabel?: string, fallback = 50): number {
  if (!priceLabel) return fallback;
  const normalized = priceLabel.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return fallback;
  const val = Number(match[1]);
  return Number.isFinite(val) && val > 0 ? Math.round(val) : fallback;
}

export function calculateDeliveryFeeEgp(
  distanceKm: number,
  isPickup: boolean,
  baseFeeEgp = 10,
  perKmFeeEgp = 5
): number {
  if (isPickup) return 0;
  return Math.max(0, Math.round(baseFeeEgp + distanceKm * perKmFeeEgp));
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length === 12) {
    return digits.slice(1); // Convert 2010xxxxxxxx -> 010xxxxxxxx
  }
  if (digits.startsWith('0020') && digits.length === 14) {
    return digits.slice(3);
  }
  return digits;
}

export function phoneToAuthEmail(rawPhone: string): string {
  const normalized = normalizePhone(rawPhone);
  return `u${normalized}@phone.noqbas.app`;
}

export function toE164Phone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }
  if (digits.startsWith('20') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+2${digits}`;
  }
  return `+${digits}`;
}

export function isBanCurrentlyActive(
  isBanned?: boolean,
  banUntilMs?: number,
  isPermanent?: boolean,
  nowMs = Date.now()
): boolean {
  if (isPermanent) return true;
  if (banUntilMs && banUntilMs > 0) {
    return nowMs < banUntilMs;
  }
  return Boolean(isBanned);
}

export function isAdExpired(expiresAtMs?: number, nowMs = Date.now()): boolean {
  if (!expiresAtMs || expiresAtMs <= 0) return false;
  return nowMs > expiresAtMs;
}

export function validateBookingFinancials(input: {
  subtotalEgp?: number;
  deliveryFeeEgp?: number;
  codFeeEgp?: number;
  totalAmountEgp?: number;
  paymentMethod?: PaymentMethod;
}): boolean {
  const subtotal = Number(input.subtotalEgp ?? 0);
  const delivery = Number(input.deliveryFeeEgp ?? 0);
  const codFee = Number(input.codFeeEgp ?? 0);
  const total = Number(input.totalAmountEgp ?? 0);
  if (
    !Number.isFinite(subtotal) ||
    !Number.isFinite(delivery) ||
    !Number.isFinite(codFee) ||
    !Number.isFinite(total)
  ) {
    return false;
  }
  if (subtotal <= 0 || delivery < 0 || codFee < 0 || total <= 0) return false;
  if (input.paymentMethod === 'instapay' && codFee !== 0) return false;
  if (input.paymentMethod === 'cod' && codFee !== 10) return false;
  return Math.round(subtotal + delivery + codFee) === Math.round(total);
}

export function isOrderEligibleForReview(
  booking: BookingRequest,
  targetId: string,
  reviewerUid: string | null | undefined,
  existingReviews: ReviewItem[]
): boolean {
  if (!reviewerUid || booking.ownerId !== reviewerUid) return false;
  if (booking.status !== 'completed') return false;
  if (!booking.providerOwnerId) return false;
  const matchesTarget =
    targetId === booking.providerOwnerId || targetId === `prov-${booking.providerOwnerId}`;
  if (!matchesTarget) return false;
  const expectedReviewId = `rev-${booking.id}`;
  return !existingReviews.some(
    (rev) => rev.id === expectedReviewId || rev.bookingId === booking.id
  );
}

export const DEFAULT_DISTRICTS: VillageDistrict[] = [
  { id: 'dist-center', name: { ar: 'وسط البلد - عند الميدان والجامع', en: 'Village Center & Square' }, distanceKm: 0.5 },
  { id: 'dist-east', name: { ar: 'الناحية الشرقية - طريق الترعة', en: 'East Quarter - Canal Road' }, distanceKm: 1.5 },
  { id: 'dist-west', name: { ar: 'الناحية الغربية - مفرق المدارس', en: 'West Quarter - School Junction' }, distanceKm: 2.2 },
  { id: 'dist-farms', name: { ar: 'العزبة والغيطان الجنوبية', en: 'South Hamlet & Farmlands' }, distanceKm: 3.8 },
  { id: 'dist-neighbor', name: { ar: 'طريق البندر / القرية المجاورة', en: 'Neighboring Hamlet Road' }, distanceKm: 6.0 }
];

export const DEFAULT_VILLAGES: VillageConfig[] = [
  {
    id: 'noqbas',
    nameAr: 'بلدنا',
    nameEn: 'Village Service Hub',
    governorateAr: 'مركز بنها - القليوبية',
    governorateEn: 'Banha - Qalyubia',
    descriptionAr: 'دكاترة، صيدليات، مطاعم، صنايعية، بقالة، دروس وجمعيات خيرية لكل أهالي بلدنا',
    descriptionEn: 'Doctors, pharmacies, restaurants, craftsmen, grocery, tutoring & charity for the whole village community',
    baseDeliveryFeeEgp: 10,
    perKmFeeEgp: 5,
    colorCode: 'amber',
    logoIcon: 'wheat',
    isActive: true,
    districts: DEFAULT_DISTRICTS
  }
];

export interface DemoTestAccount extends UserProfile {
  password: string;
  labelAr: string;
  labelEn: string;
}

export const EMERGENCY_NUMBERS = [
  {
    name: { ar: 'الإسعاف السريع والوحدة الصحية', en: 'Ambulance Emergency' },
    number: '123',
    icon: 'Ambulance'
  },
  {
    name: { ar: 'المطافئ والحماية المدنية', en: 'Fire Brigade & Civil Defense' },
    number: '180 / 122',
    icon: 'Flame'
  },
  {
    name: { ar: 'طوارئ الكهرباء والأعطال', en: 'Electricity Emergency Hotline' },
    number: '121',
    icon: 'Zap'
  },
  {
    name: { ar: 'طوارئ الميه والصرف الصحي', en: 'Water & Sewage Emergency' },
    number: '125',
    icon: 'Droplets'
  },
  {
    name: { ar: 'الخط الساخن للمحافظة والشكاوى', en: 'Governorate Local Council Hotline' },
    number: '114',
    icon: 'Landmark'
  }
];


