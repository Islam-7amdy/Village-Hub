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
  serviceCategory?: 'none' | 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride';
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

export interface PlatformPricingConfig {
  adPriceWeekEgp: number;
  adPriceMonthEgp: number;
}

export interface ProviderListing {
  id: string;
  ownerId: string;
  villageId: string;
  nameAr: string;
  nameEn: string;
  category: 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride';
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
}

export interface TechnicianService {
  id: string;
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
}

export interface FoodItem {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  price: number;
  currency: { ar: string; en: string };
  category: 'bakery' | 'traditional' | 'grill' | 'dessert';
  restaurantName: { ar: string; en: string };
  image: string;
}

export interface PharmacyItem {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  category: 'pain' | 'chronic' | 'firstaid' | 'baby' | 'vitamins';
  price: number;
  currency: { ar: string; en: string };
  inStock: boolean;
  requiresPrescription: boolean;
}

export interface GroceryItem {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  storeName: { ar: string; en: string };
  description: { ar: string; en: string };
  category: 'staples' | 'dairy' | 'produce' | 'cleaning';
  price: number;
  unit: { ar: string; en: string };
  currency: { ar: string; en: string };
}

export interface TutoringService {
  id: string;
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
}

export interface CharityOrg {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  focus: { ar: string; en: string };
  activeCampaign: { ar: string; en: string };
  address: { ar: string; en: string };
  phone: string;
  donationExample: { ar: string; en: string };
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
  villageId: string;
  title: { ar: string; en: string };
  category: 'utility' | 'event' | 'community' | 'emergency';
  date: string;
  content: { ar: string; en: string };
  author: { ar: string; en: string };
}

export interface VillageRide {
  id: string;
  villageId: string;
  driverName: { ar: string; en: string };
  from: { ar: string; en: string };
  to: { ar: string; en: string };
  departureTime: string;
  availableSeats: number;
  pricePerSeat: { ar: string; en: string };
  carModel: string;
  phone: string;
}

export interface OtherService {
  id: string;
  villageId: string;
  name: { ar: string; en: string };
  activityType: { ar: string; en: string };
  description: { ar: string; en: string };
  address: { ar: string; en: string };
  priceLabel: { ar: string; en: string };
  hours: { ar: string; en: string };
  phone: string;
}

export interface BookingRequest {
  id: string;
  villageId?: string;
  serviceType: 'doctor' | 'technician' | 'food' | 'pharmacy' | 'grocery' | 'tutoring' | 'charity' | 'other' | 'farm' | 'ride';
  title: string;
  providerName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  distanceKm?: number;
  deliveryFeeEgp?: number;
  totalAmountEgp?: number;
  date: string;
  time?: string;
  notes?: string;
  totalAmount?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
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
    nameAr: 'قرية ىقباس',
    nameEn: 'Noqbas Village',
    governorateAr: 'مركز بنها - القليوبية',
    governorateEn: 'Banha - Qalyubia',
    descriptionAr: 'دكاترة، صيدليات، مطاعم، صنايعية، بقالة، دروس وجمعيات خيرية لأهالي ىقباس',
    descriptionEn: 'Doctors, pharmacies, restaurants, craftsmen, grocery, tutoring & charity for Noqbas',
    baseDeliveryFeeEgp: 10,
    perKmFeeEgp: 5,
    colorCode: 'amber',
    isActive: true,
    districts: DEFAULT_DISTRICTS
  },
  {
    id: 'minya',
    nameAr: 'قرية منية سمنود',
    nameEn: 'Minyat Samanoud',
    governorateAr: 'مركز أجا - الدقهلية',
    governorateEn: 'Aga - Dakahlia',
    descriptionAr: 'خدمات أهالي منية سمنود بالكامل من عيادات وصيدليات وبقالة ومدرسين',
    descriptionEn: 'Full community services, clinics, pharmacies, groceries, and tutors for Minyat Samanoud',
    baseDeliveryFeeEgp: 12,
    perKmFeeEgp: 5,
    colorCode: 'emerald',
    isActive: true,
    districts: DEFAULT_DISTRICTS
  },
  {
    id: 'kafr-saad',
    nameAr: 'قرية كفر سعد',
    nameEn: 'Kafr Saad Village',
    governorateAr: 'محافظة دمياط',
    governorateEn: 'Damietta Governorate',
    descriptionAr: 'بوابة خدمات كفر سعد: عيادات، صنايعية، سوبر ماركت، ومواصلات',
    descriptionEn: 'Kafr Saad services hub: clinics, craftsmen, grocery, and rides',
    baseDeliveryFeeEgp: 10,
    perKmFeeEgp: 6,
    colorCode: 'blue',
    isActive: true,
    districts: DEFAULT_DISTRICTS
  }
];

export const VILLAGE_DOCTORS: DoctorService[] = [
  {
    id: 'doc-1',
    villageId: 'noqbas',
    name: { ar: 'د. طارق الخطيب', en: 'Dr. Tariq Al-Khatib' },
    specialty: { ar: 'دكتور باطنة وطب أسرة - الوحدة الصحية', en: 'Internal Medicine & Family Doctor' },
    clinicName: { ar: 'عيادة ىقباس المركزية', en: 'Noqbas Central Clinic' },
    phone: '01012345678',
    location: { ar: 'الشارع العمومي - جنب الوحدة المحلية', en: 'Main Street - Next to Village Hall' },
    rating: 4.9,
    reviewsCount: 88,
    availableDays: { ar: 'كل يوم ما عدا الجمعة: 9 ص - 3 عصراً', en: 'Sat - Thu: 9:00 AM - 3:00 PM' },
    fee: { ar: '100 ج.م (في العيادة)', en: '100 EGP (Clinic)' },
    supportsHomeVisit: true,
    avatar: '/src/assets/images/doctor_marcus_vance_1794474296129.jpg'
  },
  {
    id: 'doc-2',
    villageId: 'noqbas',
    name: { ar: 'د. ليلى منصور', en: 'Dr. Laila Mansour' },
    specialty: { ar: 'أخصائية أطفال وحديثي الولادة', en: 'Pediatrician & Newborn Specialist' },
    clinicName: { ar: 'عيادة الأمل للأطفال', en: 'Al-Amal Pediatric Clinic' },
    phone: '01123456789',
    location: { ar: 'الناحية الشرقية - عمارة السلام الدور الأول', en: 'East Quarter - Al-Salam Bldg' },
    rating: 4.9,
    reviewsCount: 112,
    availableDays: { ar: 'الحد والتلات والخميس: 4 عصراً - 9 بالليل', en: 'Sun, Tue, Thu: 4:00 PM - 9:00 PM' },
    fee: { ar: '150 ج.م', en: '150 EGP' },
    supportsHomeVisit: true,
    avatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg'
  },
  {
    id: 'nurse-1',
    villageId: 'noqbas',
    name: { ar: 'الممرضة فاطمة عبد الله', en: 'Nurse Fatima Abdullah' },
    specialty: { ar: 'حقن، تغيير على الجروح، وقياس ضغط وسكر في البيت', en: 'Home Nursing, Injections & Wound Dressing' },
    clinicName: { ar: 'خدمة التمريض المنزلي السريع', en: 'Village Home Nursing Dispatch' },
    phone: '01234567890',
    location: { ar: 'بتلف كل بيوت القرية والعزب', en: 'Home Visits across Village' },
    rating: 4.9,
    reviewsCount: 64,
    availableDays: { ar: 'موجودة 24 ساعة للحالات العاجلة', en: 'Daily 24/7 for Injections & Dressing' },
    fee: { ar: '50 ج.م للزيارة', en: '50 EGP per visit' },
    supportsHomeVisit: true,
    avatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg'
  },
  {
    id: 'doc-minya-1',
    villageId: 'minya',
    name: { ar: 'د. شريف عبد الرحمن', en: 'Dr. Sherif Abdelrahman' },
    specialty: { ar: 'أخصائي عظام ومفاصل', en: 'Orthopedic & Joint Specialist' },
    clinicName: { ar: 'عيادة الشفاء - منية سمنود', en: 'Al-Shifa Clinic - Minyat Samanoud' },
    phone: '01098765432',
    location: { ar: 'شارع البحر الرئيسي - قدام المسجد الكبير', en: 'Canal Street - Front of Grand Mosque' },
    rating: 4.8,
    reviewsCount: 45,
    availableDays: { ar: 'السبت والأتنين والأربع: 5 م - 10 م', en: 'Sat, Mon, Wed: 5:00 PM - 10:00 PM' },
    fee: { ar: '180 ج.م', en: '180 EGP' },
    supportsHomeVisit: false,
    avatar: '/src/assets/images/doctor_marcus_vance_1794474296129.jpg'
  },
  {
    id: 'doc-kafr-1',
    villageId: 'kafr-saad',
    name: { ar: 'د. منى السيد', en: 'Dr. Mona El-Sayed' },
    specialty: { ar: 'أخصائية نساء وتوليد ومتابعة حمل', en: 'OB/GYN & Prenatal Care' },
    clinicName: { ar: 'مركز كفر سعد الطبي', en: 'Kafr Saad Medical Center' },
    phone: '01200998877',
    location: { ar: 'ميدان المحطة - كفر سعد', en: 'Station Square - Kafr Saad' },
    rating: 4.9,
    reviewsCount: 73,
    availableDays: { ar: 'يومياً من 1 ظهراً - 7 مساءً', en: 'Daily: 1:00 PM - 7:00 PM' },
    fee: { ar: '160 ج.م', en: '160 EGP' },
    supportsHomeVisit: false,
    avatar: '/src/assets/images/doctor_sarah_jenkins_1794474295843.jpg'
  }
];

export const VILLAGE_TECHNICIANS: TechnicianService[] = [
  {
    id: 'tech-1',
    villageId: 'noqbas',
    name: { ar: 'الأسطى أحمد النجار (أبو أحمد)', en: 'Abu Ahmad (Electrician Ahmad)' },
    craft: { ar: 'كهربائي منازل ومواتير وطوارئ', en: 'Home & Motor Electrician' },
    category: 'electrician',
    phone: '01045678901',
    whatsapp: '201045678901',
    rating: 4.9,
    reviewsCount: 140,
    experienceYears: 18,
    hourlyRate: { ar: '80 ج.م / كشف ومعاينة', en: '80 EGP / Callout' },
    neighborhood: { ar: 'الناحية الغربية ووسط البلد', en: 'West Quarter & Village Square' },
    avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
    bio: {
      ar: 'خبرة 18 سنة في تأسيس شقق العرسان، تصليح القفلات، وتركيب منظم الكهرباء عشان يحمي التلاجات والغسالات.',
      en: '18 years experience in house wiring, voltage stabilizers, breaker panels, and emergency repairs.'
    }
  },
  {
    id: 'tech-2',
    villageId: 'noqbas',
    name: { ar: 'المعلم محمود السباك', en: 'Master Plumber Mahmoud' },
    craft: { ar: 'سباكة صحية ومواتير ميه وطلمبات', en: 'Plumbing & Water Pump Specialist' },
    category: 'plumber',
    phone: '01156789012',
    whatsapp: '201156789012',
    rating: 4.9,
    reviewsCount: 96,
    experienceYears: 14,
    hourlyRate: { ar: '70 ج.م / زيارة', en: '70 EGP / Visit' },
    neighborhood: { ar: 'الناحية الشرقية والعزبة', en: 'East Quarter & Farmlands' },
    avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
    bio: {
      ar: 'صيانة مواتير الميه والأوتوماتيك، تسليك بلاعات، وتركيب سباكة الحمامات والمطابخ بأمانة وسرعة.',
      en: 'Water pump repair, pipe leak detection, bathroom & kitchen plumbing with honest pricing.'
    }
  },
  {
    id: 'tech-3',
    villageId: 'noqbas',
    name: { ar: 'البشمهندس يوسف للتبريد والتكييف', en: 'Eng. Youssef (HVAC & Appliances)' },
    craft: { ar: 'صيانة تكييفات، تلاجات، وسخانات', en: 'AC Units, Fridges & Water Heaters' },
    category: 'hvac',
    phone: '01267890123',
    whatsapp: '201267890123',
    rating: 4.9,
    reviewsCount: 78,
    experienceYears: 10,
    hourlyRate: { ar: '120 ج.م / صيانة', en: '120 EGP / Service' },
    neighborhood: { ar: 'شارع المدارس والطريق الزراعي', en: 'School Road & Agricultural Rd' },
    avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
    bio: {
      ar: 'شحن فريون تكييفات، غسيل وتنظيف التكييف قبل الصيف، وتصليح تلاجات الديب فريزر في البيت.',
      en: 'AC Freon recharge, seasonal unit cleaning, deep freezers, and water heater servicing.'
    }
  },
  {
    id: 'tech-4',
    villageId: 'noqbas',
    name: { ar: 'طارق للطاقة الشمسية والإنفرتر', en: 'Tariq Solar & Battery Systems' },
    craft: { ar: 'تركيب ألواح طاقة شمسية للبيوت والغيطان', en: 'Solar Panels & Farm Pump Inverters' },
    category: 'solar',
    phone: '01578901234',
    whatsapp: '201578901234',
    rating: 4.9,
    reviewsCount: 52,
    experienceYears: 8,
    hourlyRate: { ar: 'معاينة مجانية', en: 'Free Inspection' },
    neighborhood: { ar: 'بيلف كل القرى والعزب', en: 'All Villages & Farms' },
    avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
    bio: {
      ar: 'حلول الطاقة الشمسية لتشغيل طلمبات الري أو إنارة البيوت وقت قطع النور، ببطاريات عمرها طويل.',
      en: 'Off-grid solar inverters for farm irrigation pumps and backup home battery banks.'
    }
  },
  {
    id: 'tech-minya-1',
    villageId: 'minya',
    name: { ar: 'الأسطى كريم للنجارة والألوميتال', en: 'Master Karim (Carpentry & Aluminum)' },
    craft: { ar: 'تصليح أبواب وشبابيك ألوميتال وخشب', en: 'Doors, Windows & Furniture Repair' },
    category: 'carpenter',
    phone: '01033445566',
    whatsapp: '201033445566',
    rating: 4.8,
    reviewsCount: 41,
    experienceYears: 12,
    hourlyRate: { ar: '90 ج.م / زيارة', en: '90 EGP / Visit' },
    neighborhood: { ar: 'منية سمنود - وسط البلد', en: 'Minyat Samanoud Center' },
    avatar: '/src/assets/images/village_technician_electrician_1794475355366.jpg',
    bio: {
      ar: 'تغيير كوالين، تركيب سلك ناموس، وصيانة دولاب ومطبخ الخشب والألوميتال.',
      en: 'Locks, mosquito screens, kitchen cabinets, and aluminum window maintenance.'
    }
  }
];

export const VILLAGE_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'food-1',
    villageId: 'noqbas',
    name: { ar: 'فطير مشلتت فلاحي بالسمن البلدي (فطيرة كبيرة)', en: 'Authentic Feteer Meshaltet with Baladi Ghee' },
    description: { ar: 'مورق وطازة طالع من الفرن البلدي حالا، معمول بسمن جاموسي صافي 100%', en: 'Flaky layered Egyptian country pie baked fresh with pure village ghee' },
    price: 140,
    currency: { ar: 'ج.م', en: 'EGP' },
    category: 'bakery',
    restaurantName: { ar: 'فرن ومخبز البركة البلدي', en: 'Al-Baraka Village Bakery' },
    image: '/src/assets/images/village_fresh_food_bakery_1794475356032.jpg'
  },
  {
    id: 'food-2',
    villageId: 'noqbas',
    name: { ar: 'مناقيش زعتر وجبنة رومي على الصاج (3 قطع)', en: 'Thyme & Cheese Saj Pies (3 Pieces)' },
    description: { ar: 'عجينة طرية بزيت زيتون نقي وجبنة طازة للفطار أو العشا', en: 'Warm freshly baked pies with thyme, olive oil, and local cheese' },
    price: 65,
    currency: { ar: 'ج.م', en: 'EGP' },
    category: 'bakery',
    restaurantName: { ar: 'فرن ومخبز البركة البلدي', en: 'Al-Baraka Village Bakery' },
    image: '/src/assets/images/village_fresh_food_bakery_1794475356032.jpg'
  },
  {
    id: 'food-3',
    villageId: 'noqbas',
    name: { ar: 'صينية بط ومحشي ورق عنب وكرنب بيتي (تكفي 4 أفراد)', en: 'Homemade Duck & Stuffed Vine Leaves Tray (Serves 4)' },
    description: { ar: 'أكل بيتي نضيف على أصوله من إيد الحاجة أم سالم مع شوربة وسلطة بلدي', en: 'Authentic village feast cooked fresh at home with rich broth and salad' },
    price: 420,
    currency: { ar: 'ج.م', en: 'EGP' },
    category: 'traditional',
    restaurantName: { ar: 'مطبخ أم سالم للأكل البيتي', en: "Um Salem's Homemade Kitchen" },
    image: '/src/assets/images/village_fresh_food_bakery_1794475356032.jpg'
  },
  {
    id: 'food-4',
    villageId: 'noqbas',
    name: { ar: 'وجبة كفتة وشيش طاووق على الفحم مع رز بسمتي', en: 'Charcoal Kofta & Shish Tawook Meal with Rice' },
    description: { ar: 'لحمة بلدي مفرومة طازة مشوية على الفحم مع طحينة وسلطة وعيش سخن', en: 'Fresh local grilled kofta & chicken skewers with tahini, salad, and warm bread' },
    price: 210,
    currency: { ar: 'ج.م', en: 'EGP' },
    category: 'grill',
    restaurantName: { ar: 'مشويات الوادي على الفحم', en: 'Al-Wadi Charcoal Grill' },
    image: '/src/assets/images/village_fresh_food_bakery_1794475356032.jpg'
  }
];

export const VILLAGE_PHARMACY_ITEMS: PharmacyItem[] = [
  {
    id: 'ph-1',
    villageId: 'noqbas',
    name: { ar: 'بنادول إكسترا (مسكن صداع وسخونية - شريطين)', en: 'Panadol Extra (24 Tablets)' },
    description: { ar: 'مسكن سريع للصداع، وجع السنان، وتكسير الجسم', en: 'Fast relief for headache, toothache, and fever' },
    category: 'pain',
    price: 45,
    currency: { ar: 'ج.م', en: 'EGP' },
    inStock: true,
    requiresPrescription: false
  },
  {
    id: 'ph-2',
    villageId: 'noqbas',
    name: { ar: 'كونكور 5 مجم (علاج الضغط والقلب - علبة)', en: 'Concor 5mg Bisoprolol (Box)' },
    description: { ar: 'لتنظيم ضغط الدم وضربات القلب — متوفر شهرياً بدون نقص', en: 'Chronic blood pressure & heart rhythm medication' },
    category: 'chronic',
    price: 88,
    currency: { ar: 'ج.م', en: 'EGP' },
    inStock: true,
    requiresPrescription: true
  },
  {
    id: 'ph-3',
    villageId: 'noqbas',
    name: { ar: 'شنطة إسعافات أولية كاملة للبيت', en: 'Complete Home First Aid Kit' },
    description: { ar: 'شاش معقم، ميبو للحروق، بيتادين، بلاستر، ترمومتر ديجيتال وقطن', en: 'Sterile gauze, burn cream, antiseptic, thermometer, and bandages' },
    category: 'firstaid',
    price: 195,
    currency: { ar: 'ج.م', en: 'EGP' },
    inStock: true,
    requiresPrescription: false
  },
  {
    id: 'ph-4',
    villageId: 'noqbas',
    name: { ar: 'لبن أطفال بيبيلاك 1 + باكيت حفاضات', en: 'Bebelac Stage 1 Formula + Diapers Pack' },
    description: { ar: 'عبوة غذائية متكاملة للرضع مع حفاضات مريحة بالقطن', en: 'Fortified infant milk formula bundled with comfort cotton diapers' },
    category: 'baby',
    price: 360,
    currency: { ar: 'ج.م', en: 'EGP' },
    inStock: true,
    requiresPrescription: false
  }
];

export const VILLAGE_FARM_PRODUCE: FarmHarvestItem[] = [
  {
    id: 'farm-1',
    villageId: 'noqbas',
    name: { ar: 'سمن جاموسي فلاحي مرمل صافي (برطمان 1 كيلو)', en: 'Pure Baladi Buffalo Ghee (1 kg Jar)' },
    farmerName: { ar: 'مزرعة الحاج أبو عمر', en: 'Hajj Abu Omar Farm' },
    price: 390,
    unit: { ar: 'برطمان 1 كيلو صافي', en: '1 kg Pure Jar' },
    currency: { ar: 'ج.م', en: 'EGP' },
    description: { ar: 'زبدة جاموسي مسيحة على الهادي بدون أي خلط أو زيوت نباتية — ريحة وطعم الفلاحي الأصلي', en: 'Slow-clarified pure farm ghee with zero additives.' },
    location: { ar: 'طريق الغيطان الجنوبية', en: 'South Farmlands Road' }
  },
  {
    id: 'farm-2',
    villageId: 'noqbas',
    name: { ar: 'بيض بلدي طازة من الغيط (كرتونة 30 بيضة)', en: 'Free-Range Farm Eggs (30 Eggs)' },
    farmerName: { ar: 'مزرعة أم خليل للدواجن البلدي', en: "Um Khalil's Free-Range Farm" },
    price: 165,
    unit: { ar: 'كرتونة 30 بيضة', en: 'Tray (30 eggs)' },
    currency: { ar: 'ج.م', en: 'EGP' },
    description: { ar: 'فراخ بلدي بترعى على الدرة والبرسيم، بيض صابح كل يوم الصبح', en: 'Pasture-raised organic eggs collected fresh every morning.' },
    location: { ar: 'الناحية الشرقية جنب الترعة', en: 'East Quarter by Canal' }
  },
  {
    id: 'farm-3',
    villageId: 'noqbas',
    name: { ar: 'لبن جاموسي طازة بخيره (2 كيلو معبأ مبرد)', en: 'Fresh Whole Buffalo Milk (2 kg)' },
    farmerName: { ar: 'زريبة ومزرعة أبو إبراهيم', en: 'Abu Ibrahim Dairy Farm' },
    price: 75,
    unit: { ar: '2 كيلو معبأ', en: '2 kg Chilled' },
    currency: { ar: 'ج.م', en: 'EGP' },
    description: { ar: 'لبن كامل الدسم بقشطته ممتاز للزبادي والرز بلبن والقشطة البيتي', en: 'Raw grass-fed rich buffalo milk ideal for homemade cream and yoghurt.' },
    location: { ar: 'أول طريق العزبة', en: 'Hamlet Entrance' }
  },
  {
    id: 'farm-4',
    villageId: 'noqbas',
    name: { ar: 'عسل نحل موالح وبرسيم صافي 100% (كيلو)', en: 'Pure Clover & Citrus Blossom Honey (1 kg)' },
    farmerName: { ar: 'مناحل العم فهد', en: 'Uncle Fahad Apiaries' },
    price: 260,
    unit: { ar: 'برطمان 1 كيلو', en: '1 kg Jar' },
    currency: { ar: 'ج.م', en: 'EGP' },
    description: { ar: 'عسل نحل طبيعي فرز أول من مناحل البساتين بدون أي تغذية سكرية', en: '100% natural raw honey from local orchards with zero sugar syrup.' },
    location: { ar: 'بساتين الموالح القبلية', en: 'Southern Citrus Orchards' }
  }
];

export const VILLAGE_ANNOUNCEMENTS: VillageAnnouncement[] = [
  {
    id: 'ann-1',
    villageId: 'noqbas',
    title: { ar: 'مواعيد ضخ ميه الشرب وتنظيف الخزانات الأسبوع ده', en: 'Weekly Water Pumping & Tank Maintenance Schedule' },
    category: 'utility',
    date: '2026-11-13',
    content: {
      ar: 'يا جماعة الخير: ميه الناحية الشرقية هتشتغل بقوة من بكرة الجمعة الصبح الساعة 6 لحد السبت بالليل، والناحية الغربية يوم الحد. ياريت الكل يشيك على العوامات.',
      en: 'Water pumping for the East Quarter starts Friday 6:00 AM through Saturday night; West Quarter follows on Sunday.'
    },
    author: { ar: 'لجنة ميه القرية', en: 'Village Water Committee' }
  },
  {
    id: 'ann-2',
    villageId: 'noqbas',
    title: { ar: 'يوم نضافة وتشجير حوالين المدرسة الابتدائية السبت الجاي', en: 'Community Clean-Up & Tree Planting Saturday' },
    category: 'community',
    date: '2026-11-11',
    content: {
      ar: 'شباب القرية متجمعين يوم السبت الساعة 9 الصبح قدام المدرسة الابتدائية عشان نزرع شجر زيتون وظل وننضف الرصيف. اللي يقدر يشرفنا أهلاً بيه.',
      en: 'Village youth are gathering Saturday at 9:00 AM by the elementary school to plant shade trees and tidy the street.'
    },
    author: { ar: 'شباب الخير بالبلد', en: 'Village Youth Group' }
  }
];

export const INITIAL_VILLAGE_ADS: VillageAd[] = [
  {
    id: 'ad-1',
    ownerId: 'seed-1',
    authorName: 'محل أولاد بركات للأجهزة',
    villageId: 'noqbas',
    title: 'عرض خاص على صيانة وتغيير شمعات فلاتر الميه (7 مراحل)',
    description: 'تغيير طقم الشمعات الأصلي مع غسيل الخزان وقياس الأملاح مجاناً لبيوت ىقباس طول الأسبوع ده.',
    category: 'offer',
    priceText: '220 ج.م بدل 300 ج.م',
    contactPhone: '01022334455',
    status: 'approved',
    createdDate: '2026-11-12'
  },
  {
    id: 'ad-2',
    ownerId: 'seed-2',
    authorName: 'سنتر النور التعليمي',
    villageId: 'noqbas',
    title: 'مجموعات تقوية ومراجعة نهائية للمرحلة الإعدادية والثانوية',
    description: 'مراجعات مكثفة في الرياضة والإنجليزي والعلوم مع نخبة من مدرسين البلد بأسعار مخفضة لغير القادرين.',
    category: 'event',
    priceText: 'خصم 30% للإخوات',
    contactPhone: '01199887766',
    status: 'approved',
    createdDate: '2026-11-11'
  },
  {
    id: 'ad-3',
    ownerId: 'seed-3',
    authorName: 'الحاج رضا للعقارات',
    villageId: 'noqbas',
    title: 'شقة لقطة للإيجار لعرسان أول سكن - الشارع العمومي',
    description: 'شقة 3 غرف وصالة تشطيب سوبر لوكس الدور التاني علوي، قريبة من الموقف والوحدة الصحية، عداد كهرباء وغاز.',
    category: 'property',
    priceText: '2,200 ج.م / شهر',
    contactPhone: '01244556677',
    status: 'approved',
    createdDate: '2026-11-10'
  }
];

export const VILLAGE_RIDES: VillageRide[] = [
  {
    id: 'ride-1',
    villageId: 'noqbas',
    driverName: { ar: 'الأسطى سالم (أبو زيد)', en: 'Abu Zaid (Salem)' },
    from: { ar: 'موقف القرية العمومي', en: 'Village Main Square' },
    to: { ar: 'بنها الجديدة والجامعة وموقف الأتوبيس', en: 'Central City & University Terminal' },
    departureTime: '07:15 AM',
    availableSeats: 3,
    pricePerSeat: { ar: '25 ج.م للكرسي', en: '25 EGP / Seat' },
    carModel: 'Hyundai Elantra 2022',
    phone: '01089012345'
  },
  {
    id: 'ride-2',
    villageId: 'noqbas',
    driverName: { ar: 'محمد عبد الله', en: 'Mohammad Abdullah' },
    from: { ar: 'الناحية الغربية - مفرق المدارس', en: 'West Quarter - School Junction' },
    to: { ar: 'المستشفى العام وسوق الخضار بالبندر', en: 'General Hospital & Central Market' },
    departureTime: '08:30 AM',
    availableSeats: 2,
    pricePerSeat: { ar: '30 ج.م للكرسي', en: '30 EGP / Seat' },
    carModel: 'Kia Cerato',
    phone: '01190123456'
  }
];

export const EMERGENCY_NUMBERS = [
  {
    name: { ar: 'الإسعاف السريع والوحدة الصحية', en: 'Ambulance & Clinic Emergency' },
    number: '123 / 01012345678',
    icon: 'Ambulance'
  },
  {
    name: { ar: 'المطافئ والحماية المدنية', en: 'Fire Brigade & Civil Defense' },
    number: '180 / 122',
    icon: 'Flame'
  },
  {
    name: { ar: 'طوارئ الكهرباء والأعطال', en: 'Electricity Emergency Hotline' },
    number: '121 / 01045678901',
    icon: 'Zap'
  },
  {
    name: { ar: 'طوارئ الميه والصرف الصحي', en: 'Water & Sewage Emergency' },
    number: '125 / 01156789012',
    icon: 'Droplets'
  },
  {
    name: { ar: 'مكتب العمدة والمجلس المحلي', en: 'Village Council & Mayor Office' },
    number: '01200009999',
    icon: 'Landmark'
  }
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    targetId: 'doc-1',
    villageId: 'noqbas',
    author: 'أبو خليل (خليل محمد)',
    neighborhood: { ar: 'الناحية الشرقية', en: 'East Quarter' },
    rating: 5,
    date: '2026-11-10',
    comment: {
      ar: 'دكتور محترم جداً وباله طويل، جه لوالدي البيت وشاف الضغط وكتبلنا علاج ريحه على طول ربنا يباركله.',
      en: 'Very respectful and patient doctor. Did a home visit for my elderly father and prescribed effective treatment.'
    },
    isVerifiedResident: true
  },
  {
    id: 'rev-2',
    targetId: 'doc-1',
    villageId: 'noqbas',
    author: 'أم سالم',
    neighborhood: { ar: 'الناحية الغربية', en: 'West Quarter' },
    rating: 5,
    date: '2026-11-06',
    comment: {
      ar: 'د. طارق بركة البلد، موجود دايماً في العيادة وتشخيصه مظبوط وبيعامل الكل زي أهله.',
      en: 'Dr. Tariq is always reliable and treats every patient like family.'
    },
    isVerifiedResident: true
  },
  {
    id: 'rev-3',
    targetId: 'doc-2',
    villageId: 'noqbas',
    author: 'أم يوسف',
    neighborhood: { ar: 'شارع المدارس', en: 'School Road' },
    rating: 5,
    date: '2026-11-08',
    comment: {
      ar: 'دكتورة ليلى شاطرة جداً وهادية مع العيال الصغيرة، بنتي خفت من دور البرد بعد ما تابعت معاها.',
      en: 'Dr. Laila is great with young kids and very thorough.'
    },
    isVerifiedResident: true
  },
  {
    id: 'rev-5',
    targetId: 'tech-1',
    villageId: 'noqbas',
    author: 'عمر التميمي',
    neighborhood: { ar: 'الناحية الغربية', en: 'West Quarter' },
    rating: 5,
    date: '2026-11-11',
    comment: {
      ar: 'الأسطى أبو أحمد صلح قفلة الكهرباء في نص ساعة ولحق التلاجة والغسالة، راجل أمين وسعره حنين.',
      en: 'Abu Ahmad fixed our breaker box in 30 minutes and saved our appliances. Honest and fairly priced.'
    },
    isVerifiedResident: true
  },
  {
    id: 'rev-7',
    targetId: 'tech-2',
    villageId: 'noqbas',
    author: 'سالم النجار',
    neighborhood: { ar: 'الناحية الشرقية', en: 'East Quarter' },
    rating: 5,
    date: '2026-11-09',
    comment: {
      ar: 'المعلم محمود غير أوتوماتيك الموتور وحل مشكلة ضعف الميه في الدور التالت، شغله نضيف ومظبوط.',
      en: 'Mahmoud fixed our roof water pressure issue cleanly and quickly.'
    },
    isVerifiedResident: true
  }
];

export const VILLAGE_GROCERY_ITEMS: GroceryItem[] = [
  {
    id: 'groc-1',
    villageId: 'noqbas',
    name: { ar: 'شيكارة أرز مصري فاخر حبة عريضة (5 كيلو)', en: 'Egyptian Short-Grain Rice (5 kg Bag)' },
    storeName: { ar: 'سوبر ماركت أولاد علام', en: 'Awlad Allam Supermarket' },
    description: { ar: 'أرز مصري نضيف منقي ومعبأ بدون أي شوائب للأكل اليومي', en: 'Premium sorted Egyptian rice packed fresh for family cooking' },
    category: 'staples',
    price: 165,
    unit: { ar: 'شيكارة 5 كيلو', en: '5 kg Bag' },
    currency: { ar: 'ج.م', en: 'EGP' }
  },
  {
    id: 'groc-2',
    villageId: 'noqbas',
    name: { ar: 'زيت ذرة صافي + زجاجة سمن طبيعي (عرض التوفير)', en: 'Pure Corn Oil + Ghee Value Pack' },
    storeName: { ar: 'سوبر ماركت البركة - وسط البلد', en: 'Al-Baraka Mini Market' },
    description: { ar: 'باكدج المطبخ الشهري بسعر الجملة لأهل القرية مع توصيل سريع', en: 'Monthly cooking oil & ghee bundle at village wholesale pricing' },
    category: 'staples',
    price: 235,
    unit: { ar: 'عبوتين معاً', en: 'Twin Pack' },
    currency: { ar: 'ج.م', en: 'EGP' }
  },
  {
    id: 'groc-3',
    villageId: 'noqbas',
    name: { ar: 'سلة خضار وفاكهة الغيط الطازة (طماطم، بطاطس، بصل، خيار)', en: 'Fresh Farm Veggie Basket (5 kg)' },
    storeName: { ar: 'وكالة الحاج سعيد للخضار', en: 'Hajj Saeed Produce Stand' },
    description: { ar: 'مقطوفة النهاردة الصبح من أراضي البلد — 5 كيلو مشكل بالوزن المظبوط', en: 'Picked fresh this morning from local fields — 5 kg mixed staples' },
    category: 'produce',
    price: 120,
    unit: { ar: 'سلة 5 كيلو مشكل', en: '5 kg Mixed Basket' },
    currency: { ar: 'ج.م', en: 'EGP' }
  },
  {
    id: 'groc-4',
    villageId: 'noqbas',
    name: { ar: 'علبة جبنة قريش طازة + لبن جاموسي بخيره (2 كيلو)', en: 'Fresh Qareesh Cheese + 2kg Whole Milk' },
    storeName: { ar: 'منتجات ألبان النور الفلاحي', en: 'Al-Noor Baladi Dairy' },
    description: { ar: 'جبنة قريش خفيفة الملح مع لبن طازة مبرد يوصل لحد البيت', en: 'Low-salt village qareesh cheese paired with chilled whole buffalo milk' },
    category: 'dairy',
    price: 115,
    unit: { ar: 'علبة جبنة + 2ك لبن', en: 'Cheese + 2kg Milk' },
    currency: { ar: 'ج.م', en: 'EGP' }
  },
  {
    id: 'groc-5',
    villageId: 'minya',
    name: { ar: 'كرتونة مسحوق غسيل أوتوماتيك 4 كيلو + صابون مواعين', en: 'Laundry Detergent 4kg + Dish Soap Pack' },
    storeName: { ar: 'هايبر منية سمنود التعاوني', en: 'Minyat Samanoud Co-op Mart' },
    description: { ar: 'عرض المنظفات الشهري للبيت بخصم أهالي منية سمنود', en: 'Monthly home cleaning bundle with resident discount' },
    category: 'cleaning',
    price: 210,
    unit: { ar: 'طقم منظفات', en: 'Cleaning Bundle' },
    currency: { ar: 'ج.م', en: 'EGP' }
  },
  {
    id: 'groc-6',
    villageId: 'kafr-saad',
    name: { ar: 'شنطة السوبر ماركت الأسبوعية (سكر، شاي، مكرونة، صلصة)', en: 'Weekly Pantry Bag (Sugar, Tea, Pasta, Paste)' },
    storeName: { ar: 'سوق كفر سعد الحديث', en: 'Kafr Saad Modern Grocery' },
    description: { ar: 'مقاضي البيت الأساسية جاهزة للتوصيل لأي حي في كفر سعد', en: 'Essential weekly pantry items ready for home delivery in Kafr Saad' },
    category: 'staples',
    price: 195,
    unit: { ar: 'شنطة كاملة', en: 'Full Bag' },
    currency: { ar: 'ج.م', en: 'EGP' }
  }
];

export const VILLAGE_TUTORING_SERVICES: TutoringService[] = [
  {
    id: 'tut-1',
    villageId: 'noqbas',
    teacherName: { ar: 'أستاذ حسن المنشاوي', en: 'Mr. Hassan El-Menshawy' },
    subject: { ar: 'رياضيات وحساب (تأسيس ومراجعات نهائية)', en: 'Mathematics & Mental Math' },
    category: 'math',
    grades: { ar: 'ابتدائي وإعدادي (مجموعات صغيرة 6 طلاب)', en: 'Primary & Prep (Small Groups)' },
    feePerSession: { ar: '60 ج.م / حصة', en: '60 EGP / Session' },
    schedule: { ar: 'السبت والاتنين والأربعاء: 3 م - 7 م', en: 'Sat, Mon, Wed: 3:00 PM - 7:00 PM' },
    location: { ar: 'سنتر النور التعليمي - الشارع العمومي', en: 'Al-Noor Center - Main Street' },
    phone: '01066778899',
    mode: { ar: 'حضوري في السنتر أو بالبيت', en: 'In-person or Home Tutoring' }
  },
  {
    id: 'tut-2',
    villageId: 'noqbas',
    teacherName: { ar: 'مس أميرة عبد السلام', en: 'Ms. Amira Abdelsalam' },
    subject: { ar: 'لغة إنجليزية (محادثة وتأسيس جرامر)', en: 'English Language & Grammar' },
    category: 'languages',
    grades: { ar: 'من 4 ابتدائي لحد 3 ثانوي', en: 'Grade 4 to High School' },
    feePerSession: { ar: '75 ج.م / حصة', en: '75 EGP / Session' },
    schedule: { ar: 'الحد والتلات والخميس: 4 م - 8 م', en: 'Sun, Tue, Thu: 4:00 PM - 8:00 PM' },
    location: { ar: 'الناحية الغربية - جنب المدرسة الإعدادية', en: 'West Quarter - Near Prep School' },
    phone: '01122334466',
    mode: { ar: 'مجموعات + متابعة أونلاين', en: 'Small Groups + Online Follow-up' }
  },
  {
    id: 'tut-3',
    villageId: 'noqbas',
    teacherName: { ar: 'الشيخ محمود أبو النجا', en: 'Sheikh Mahmoud Abou El-Naga' },
    subject: { ar: 'تحفيظ قرآن كريم وتجويد وأساسيات اللغة العربية', en: 'Quran Memorization, Tajweed & Arabic' },
    category: 'quran',
    grades: { ar: 'الأطفال والشباب (تحفيظ وتأسيس قراءة وكتابة)', en: 'Kids & Youth (Reading & Tajweed)' },
    feePerSession: { ar: 'مجاني / دعم رمزي 30 ج.م', en: 'Free / 30 EGP Symbolic' },
    schedule: { ar: 'يومياً بعد صلاة العصر بالمسجد الكبير', en: 'Daily after Asr at Grand Mosque' },
    location: { ar: 'مكتبة المسجد الكبير - وسط البلد', en: 'Grand Mosque Hall - Center' },
    phone: '01288990011',
    mode: { ar: 'حلقات تحفيظ يومية', en: 'Daily Study Circles' }
  },
  {
    id: 'tut-4',
    villageId: 'minya',
    teacherName: { ar: 'د. مروة الشافعي', en: 'Dr. Marwa El-Shafei' },
    subject: { ar: 'علوم، كيمياء وأحياء للمرحلة الثانوية', en: 'Science, Chemistry & Biology' },
    category: 'science',
    grades: { ar: 'إعدادي وثانوي عام وأزهري', en: 'Prep & Secondary School' },
    feePerSession: { ar: '90 ج.م / حصة', en: '90 EGP / Session' },
    schedule: { ar: 'التلات والجمعة: 2 ظهراً - 6 مساءً', en: 'Tue & Fri: 2:00 PM - 6:00 PM' },
    location: { ar: 'شارع البحر - منية سمنود', en: 'Canal Street - Minyat Samanoud' },
    phone: '01055667788',
    mode: { ar: 'تجارب عملية ومراجعات أسبوعية', en: 'Interactive Labs & Weekly Quizzes' }
  },
  {
    id: 'tut-5',
    villageId: 'kafr-saad',
    teacherName: { ar: 'أستاذ طارق الفقي', en: 'Mr. Tarek El-Feki' },
    subject: { ar: 'فيزياء وتطبيقات التكنولوجيا للثانوية', en: 'Physics & Applied Math' },
    category: 'science',
    grades: { ar: 'الأول والثاني والثالث الثانوي', en: 'High School Grades 10-12' },
    feePerSession: { ar: '85 ج.م / حصة', en: '85 EGP / Session' },
    schedule: { ar: 'السبت والاتنين والخميس: 5 م - 9 م', en: 'Sat, Mon, Thu: 5:00 PM - 9:00 PM' },
    location: { ar: 'ميدان المحطة - كفر سعد', en: 'Station Square - Kafr Saad' },
    phone: '01144559900',
    mode: { ar: 'مجموعات متابعة مكثفة', en: 'Focused Study Groups' }
  }
];

export const VILLAGE_CHARITIES: CharityOrg[] = [
  {
    id: 'char-1',
    villageId: 'noqbas',
    name: { ar: 'جمعية أهل الخير وتكافل ىقباس', en: 'Ahl El-Kheir Noqbas Charity' },
    focus: { ar: 'كفالة الأيتام، شنط المواد الغذائية الشهرية، ودعم المرضى', en: 'Orphan sponsorship, monthly food boxes & medical aid' },
    activeCampaign: { ar: 'حملة تجهيز 150 شنطة غذائية وأغطية شتاء للأسر الأولى بالرعاية', en: 'Campaign: 150 Monthly Pantry Boxes & Winter Blankets' },
    address: { ar: 'بجوار المسجد الكبير - وسط البلد', en: 'Next to Grand Mosque - Center' },
    phone: '01099112233',
    donationExample: { ar: 'سهم الشنطة الشهرية 250 ج.م أو أي مساهمة مفتوحة', en: '250 EGP per family box or any contribution' }
  },
  {
    id: 'char-2',
    villageId: 'noqbas',
    name: { ar: 'مؤسسة شباب ىقباس للتكافل والعلاج', en: 'Noqbas Youth Medical Aid Foundation' },
    focus: { ar: 'قوافل طبية مجانية، شراء أدوية مزمنة، وتجهيز العرائس', en: 'Free medical convoys, chronic medication fund & marriage aid' },
    activeCampaign: { ar: 'صندوق الدواء الخيري لصرف علاج غير القادرين من صيدلية الشفاء', en: 'Charitable Medicine Fund at Al-Shifa Pharmacy' },
    address: { ar: 'الشارع العمومي - عمارة الوحدة المحلية', en: 'Main Street - Civic Building' },
    phone: '01188776655',
    donationExample: { ar: 'سهم علاج مريض 100 ج.م أو التطوع بالوقت', en: '100 EGP Patient Medicine Share or Volunteer' }
  },
  {
    id: 'char-3',
    villageId: 'minya',
    name: { ar: 'جمعية البر والتقوى الخيرية - منية سمنود', en: 'Al-Birr Charity - Minyat Samanoud' },
    focus: { ar: 'مساعدة الأسر المتعففة ومشاريع صغيرة للأرامل', en: 'Family assistance & micro-projects for widows' },
    activeCampaign: { ar: 'توصيل وصلات ميه نظيفة وسقوف منازل لـ 12 بيت بالقرية', en: 'Clean water connections & roof repairs for 12 homes' },
    address: { ar: 'أول شارع البحر - منية سمنود', en: 'Canal Road Entrance - Minyat Samanoud' },
    phone: '01233445577',
    donationExample: { ar: 'تبرع فوري أو تطوع ميداني', en: 'Direct donation or field volunteering' }
  },
  {
    id: 'char-4',
    villageId: 'kafr-saad',
    name: { ar: 'لجنة زكاة وتكافل كفر سعد', en: 'Kafr Saad Zakat & Solidarity Committee' },
    focus: { ar: 'مساعدات دراسية للطلاب ودعم الحالات الطارئة بالمستشفيات', en: 'Student tuition support & emergency hospital aid' },
    activeCampaign: { ar: 'توفير كتب ومستلزمات دراسية لـ 80 طالب وطالبة', en: 'School supplies & tuition support for 80 students' },
    address: { ar: 'ميدان المحطة - كفر سعد', en: 'Station Square - Kafr Saad' },
    phone: '01077889944',
    donationExample: { ar: 'كفالة شنطة مدرسية 180 ج.م', en: '180 EGP School Kit Sponsorship' }
  }
];

export const VILLAGE_OTHER_SERVICES: OtherService[] = [
  {
    id: 'oth-1',
    villageId: 'noqbas',
    name: { ar: 'مكتبة ومركز تصوير الرسالة', en: 'Al-Resala Print & Stationery' },
    activityType: { ar: 'طباعة، تصوير مستندات وأدوات مدرسية', en: 'Printing, Copying & School Supplies' },
    description: { ar: 'تصوير أبيض وألوان، طباعة أبحاث، تغليف حراري، وتجهيز ملفات التقديم', en: 'B&W/color printing, binding, laminating, and official paperwork prep' },
    address: { ar: 'أمام المدرسة الإعدادية - ىقباس', en: 'In front of Prep School - Noqbas' },
    priceLabel: { ar: 'من 2 ج.م / ورقة', en: 'From 2 EGP / page' },
    hours: { ar: 'يومياً: 8 ص - 9 م', en: 'Daily: 8 AM - 9 PM' },
    phone: '01022113344'
  },
  {
    id: 'oth-2',
    villageId: 'noqbas',
    name: { ar: 'سنتر صيانة الموبايلات والإلكترونيات', en: 'Mobile Repair & Accessories Hub' },
    activityType: { ar: 'صيانة موبايلات، شواحن وأكسسوارات', en: 'Smartphone Repair & Accessories' },
    description: { ar: 'تغيير شاشات وبطاريات أصلية، سوفت وير، وشحن رصيد وفواتير فوري', en: 'Screen/battery replacements, software service, and bill payments' },
    address: { ar: 'الشارع العمومي - وسط البلد', en: 'Main Street - Village Center' },
    priceLabel: { ar: 'كشف الأعطال مجاني', en: 'Free Diagnostics' },
    hours: { ar: '10 ص - 11 م', en: '10 AM - 11 PM' },
    phone: '01133224455'
  },
  {
    id: 'oth-3',
    villageId: 'noqbas',
    name: { ar: 'مغسلة السجاد والبطاطين الحديثة', en: 'Modern Carpet & Blanket Laundry' },
    activityType: { ar: 'غسيل وتجفيف سجاد وبطاطين بالمنزل', en: 'Carpet & Blanket Washing Service' },
    description: { ar: 'استلام السجاد والبطاطين من البيت وتعطيرها وتسليمها خلال 48 ساعة', en: 'Home pickup and delivery within 48 hours with deep sanitization' },
    address: { ar: 'مدخل القرية البحري', en: 'North Village Entrance' },
    priceLabel: { ar: '35 ج.م / متر سجاد', en: '35 EGP / sq.meter' },
    hours: { ar: '9 ص - 8 م', en: '9 AM - 8 PM' },
    phone: '01244556677'
  },
  {
    id: 'oth-4',
    villageId: 'minya',
    name: { ar: 'تأجير فراشة وكوش أفراح ومناسبات', en: 'Wedding & Event Tent Rentals' },
    activityType: { ar: 'تجهيز أفراح، سرادقات ومناسبات', en: 'Event Staging & Sound Setup' },
    description: { ar: 'كراسي، ترابيزات، إضاءة ليد وسماعات للمناسبات السعيدة والعزاء', en: 'Full seating, tents, lighting, and sound systems for village events' },
    address: { ar: 'أول طريق منية سمنود', en: 'Minyat Samanoud Entrance' },
    priceLabel: { ar: 'حسب التجهيز', en: 'Custom Quote' },
    hours: { ar: '24 ساعة', en: '24/7 Service' },
    phone: '01099887766'
  }
];
