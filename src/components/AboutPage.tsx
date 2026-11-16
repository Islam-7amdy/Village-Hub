import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { Language, VillageConfig, getVillageTheme } from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';

interface AboutPageProps {
  lang: Language;
  activeVillage: VillageConfig;
  activeSectionsCount: number;
  approvedProvidersCount: number;
  isSignedIn: boolean;
  onBackHome: () => void;
  onOpenRegister: () => void;
  onOpenEmergency: () => void;
  onOpenContact?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  lang,
  activeVillage,
  activeSectionsCount,
  approvedProvidersCount,
  isSignedIn,
  onBackHome,
  onOpenRegister,
  onOpenEmergency,
  onOpenContact
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);
  const [heroImageError, setHeroImageError] = useState(false);

  const platformName = lang === 'ar' ? activeVillage.nameAr || 'بلدنا' : activeVillage.nameEn || 'Village Service Hub';
  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const ForwardArrow = lang === 'ar' ? ArrowLeft : ArrowRight;

  const capabilities =
    lang === 'ar'
      ? [
          {
            num: '01.',
            title: 'دليل معتمد لكل خدمات البلد',
            body: 'عيادات وأطباء، صيدليات مع إمكانية رفع صورة الروشتة، مطاعم وأكل بيتي، بقالة، صنايعية ومواصلات، دروس تعليمية وجمعيات خيرية في مكان واحد واضح بمواعيد العمل وحالة الفتح والإغلاق الفعلية.',
            span: 'lg:col-span-2'
          },
          {
            num: '02.',
            title: 'توصيل محسوب بالمسافة أو استلام مجاني',
            body: 'السلة بتحسب مصاريف التوصيل بشفافية حسب منطقتك أو تتيح الاستلام المباشر من المحل مجاناً بدون أي مصاريف إضافية.',
            span: 'lg:col-span-1'
          },
          {
            num: '03.',
            title: 'دفع مرن: كاش عند الاستلام أو InstaPay',
            body: 'اختر الدفع كاش وقت التسليم بكود تأكيد للمشتري ومقدم الخدمة، أو التحويل الفوري عبر InstaPay مع متابعة حالة الطلب خطوة بخطوة.',
            span: 'lg:col-span-1'
          },
          {
            num: '04.',
            title: 'تقييمات حقيقية ولوحة مستقلة لمقدمي الخدمات',
            body: 'التقييمات متاحة فقط لمن أتمّ الطلب فعلاً لضمان المصداقية، مع لوحة إدارة متكاملة لأصحاب المحلات والأطباء والفنيين لمتابعة الطلبات والتسويات.',
            span: 'lg:col-span-2'
          }
        ]
      : [
          {
            num: '01.',
            title: 'Verified Local Services Directory',
            body: 'Doctors and clinics, pharmacies with prescription uploads, local kitchens, groceries, craftsmen, rides, tutoring, and charities in one clear hub showing real working hours and live availability.',
            span: 'lg:col-span-2'
          },
          {
            num: '02.',
            title: 'Distance-Based Delivery or Free Pickup',
            body: 'Transparent doorstep delivery pricing calculated by your village district, or zero-fee in-store pickup.',
            span: 'lg:col-span-1'
          },
          {
            num: '03.',
            title: 'Flexible Cash on Delivery & InstaPay',
            body: 'Pay cash on delivery with a verified handover reference code, or transfer via InstaPay with step-by-step live order tracking.',
            span: 'lg:col-span-1'
          },
          {
            num: '04.',
            title: 'Verified Reviews & Provider Portals',
            body: 'Reviews are restricted to completed orders so neighbors can trust every rating, paired with dedicated provider and admin settlement portals.',
            span: 'lg:col-span-2'
          }
        ];

  const steps =
    lang === 'ar'
      ? [
          {
            step: '01',
            title: 'سجّل برقم موبايلك',
            desc: 'سجّل حسابك باسمك وعنوانك في البلد لتفعيل الحجوزات والطلبات وتتبع الإشعارات.'
          },
          {
            step: '02',
            title: 'اختر الخدمة أو أضف للسلة',
            desc: 'تصفح الأقسام أو ابحث باسم الدكتور أو الصيدلية أو الصنعة وحدد الميعاد أو الأصناف.'
          },
          {
            step: '03',
            title: 'تابع طلبك وشارك تقييمك',
            desc: 'استلم طلبك في ميعاده بكود التأكيد، واكتب تقييمك الحقيقي لمساعدة أهالي بلدك.'
          }
        ]
      : [
          {
            step: '01',
            title: 'Sign In With Your Phone',
            desc: 'Create an account with your name and village address to unlock bookings, cart orders, and notifications.'
          },
          {
            step: '02',
            title: 'Browse, Book, or Add to Cart',
            desc: 'Explore service categories or search for a doctor, pharmacy, shop, or technician and pick your preferred slot.'
          },
          {
            step: '03',
            title: 'Track Delivery & Leave a Review',
            desc: 'Follow your order live through handover confirmation and share verified feedback with neighbors.'
          }
        ];

  const zonesCount = activeVillage.districts?.length || 5;

  return (
    <div className="space-y-10 pb-8">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onBackHome}
            className="font-semibold hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
          >
            {t.allServices}
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-slate-900 dark:text-white">{t.aboutApp}</span>
        </div>

        <button
          type="button"
          onClick={onBackHome}
          className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <BackArrow className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}</span>
        </button>
      </div>

      {/* Section 1: Proposition Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between gap-6 py-2">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{platformName}</span>
              <span aria-hidden="true">·</span>
              <span>Village Service Hub</span>
              <span aria-hidden="true">·</span>
              <span>
                {lang === 'ar' ? activeVillage.governorateAr || 'منصة خدمات البلد' : activeVillage.governorateEn || 'Community Platform'}
              </span>
            </div>

            <h1
              className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight max-w-2xl"
              style={{ fontSize: 'clamp(1.85rem, 3.6vw, 2.85rem)', textWrap: 'balance' }}
            >
              {lang === 'ar'
                ? 'منصة بلدنا — كل خدمات قريتك وأهلك في حتة واحدة'
                : 'Village Service Hub — Your Local Community & Services Platform'}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? '«بلدنا» هو الدليل والوسيط الخدمي الموحد لأهل القرية والبلد. بدل ما تسأل وتلف على رقم دكتور، صيدلية فاتحة، صنايعي أمين، أو مطعم وبقالة يوصلوا لحد البيت — المنصة بتجمع كل مقدمي الخدمات المعتمدين في بلدك بمواعيدهم الفعلية، وأسعار التوصيل الواضحة، وتتبع الطلبات من الحجز لحد الاستلام.'
                : 'Baladna (Village Service Hub) brings every essential local service together for residents and neighboring communities — from clinics, pharmacies, and home repairs to bakeries, groceries, tutoring, rides, and charitable initiatives with transparent pricing and live order tracking.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBackHome}
              className={`min-h-[44px] px-6 py-2.5 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-sm font-bold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0`}
            >
              <span>{lang === 'ar' ? 'استعرض الخدمات الآن' : 'Explore Services'}</span>
              <ForwardArrow className="w-4 h-4" />
            </button>

            {!isSignedIn && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Briefcase className="w-4 h-4" />
                <span>{lang === 'ar' ? 'انضم كمقدم خدمة أو مستخدم' : 'Join as Resident or Provider'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative h-full min-h-[260px] lg:min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            {!heroImageError ? (
              <img
                src="/images/village_fresh_food_bakery_1794475356032.webp"
                alt={lang === 'ar' ? 'خدمات وأسواق منصة بلدنا' : 'Local community services on Village Service Hub'}
                referrerPolicy="no-referrer"
                onError={() => setHeroImageError(true)}
                className="w-full h-full object-cover lg:h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-3 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                <Building2 className={`w-10 h-10 ${theme.text}`} />
                <div className="text-sm font-bold">{platformName}</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
              <div className="text-xs text-slate-200 font-medium">
                {lang === 'ar' ? 'أطباء · صيدليات · صنايعية · مطاعم · بقالة · مواصلات' : 'Clinics · Pharmacies · Craftsmen · Dining · Groceries · Rides'}
              </div>
              <div className="text-base font-bold mt-1">
                {lang === 'ar' ? 'كل احتياجات بيتك من أقرب مكان مضمون في بلدك' : 'Everyday essentials from trusted local providers near you'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Real Platform Scope Strip (Full-Width 4-Column Row) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-slate-200 dark:border-slate-800 py-6">
        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'أقسام الخدمات المفعّلة' : 'Active Service Categories'}
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {activeSectionsCount}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'مقدمو خدمات معتمدون' : 'Approved Providers Listed'}
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {approvedProvidersCount}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'مناطق التغطية والتوصيل' : 'Covered Delivery Zones'}
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {zonesCount}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'ar' ? 'بداية مصاريف التوصيل' : 'Base Delivery Fee'}
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {activeVillage.baseDeliveryFeeEgp} {t.currency}
          </div>
        </div>
      </section>

      {/* Section 3: Core Capabilities Asymmetric Bento Grid */}
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {lang === 'ar' ? 'إيه اللي بيقدمه تطبيق بلدنا؟' : 'What Village Service Hub Delivers'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'مصمم مخصوص ليكون عملي، سريع، وواضح لكل أفراد الأسرة في القرية.'
              : 'Built to be straightforward, practical, and reliable for every household and local business.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => (
            <div
              key={cap.num}
              className={`${cap.span} p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5`}
            >
              <div className="flex items-baseline gap-2.5">
                <span className={`text-sm font-bold font-mono tabular-nums ${theme.text}`}>{cap.num}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{cap.title}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{cap.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: How It Works (3 Clear Steps) */}
      <section className="space-y-5 pt-2 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {lang === 'ar' ? 'طريقة الاستخدام في ٣ خطوات' : 'How It Works in 3 Steps'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((item) => (
            <div key={item.step} className="space-y-2">
              <div className={`text-2xl font-extrabold font-mono tabular-nums ${theme.text}`}>{item.step}</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Trust & Quick Actions Strip */}
      <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className={`w-4 h-4 ${theme.text} shrink-0`} />
            <span>
              {lang === 'ar' ? 'منصة موثوقة وتحت إشراف إدارة البلد' : 'Moderated & Verified Local Marketplace'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {lang === 'ar'
              ? 'كل مقدم خدمة وإعلان على منصة بلدنا بيتم مراجعته واعتماده من الإدارة قبل ما يظهر للأهالي، مع دليل طوارئ متاح دائماً لأي حالة عاجلة.'
              : 'Every provider profile and neighborhood ad is reviewed by platform administrators before going live, alongside an always-available emergency directory.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.contactUs}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenEmergency}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{t.emergency}</span>
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className={`min-h-[42px] px-5 py-2 rounded-xl ${theme.solidBg} ${theme.hoverBg} text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{lang === 'ar' ? 'ابدأ تصفح الخدمات' : 'Start Browsing'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
