import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Phone,
  Send
} from 'lucide-react';
import { Language, VillageConfig, getVillageTheme, normalizePhone } from '../data/villageData';
import { TRANSLATIONS } from '../data/translations';

const SUPPORT_WHATSAPP_LOCAL = '01126660508';
const SUPPORT_WHATSAPP_INTL = '201126660508';

type ContactTopic = 'suggestion' | 'complaint' | 'inquiry';

interface ContactPageProps {
  lang: Language;
  activeVillage: VillageConfig;
  defaultName?: string;
  defaultPhone?: string;
  onBackHome: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  lang,
  activeVillage,
  defaultName = '',
  defaultPhone = '',
  onBackHome
}) => {
  const t = TRANSLATIONS[lang];
  const theme = getVillageTheme(activeVillage.colorCode);
  const BackArrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const waAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const [topic, setTopic] = useState<ContactTopic>('suggestion');
  const [senderName, setSenderName] = useState(defaultName);
  const [senderPhone, setSenderPhone] = useState(defaultPhone);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [submittedPreview, setSubmittedPreview] = useState('');
  const [copied, setCopied] = useState(false);

  const topics: { id: ContactTopic; labelAr: string; labelEn: string }[] = [
    { id: 'suggestion', labelAr: 'مقترح لتطوير التطبيق', labelEn: 'Suggestion' },
    { id: 'complaint', labelAr: 'شكوى أو مشكلة', labelEn: 'Complaint' },
    { id: 'inquiry', labelAr: 'استفسار أو مساعدة', labelEn: 'Inquiry' }
  ];

  const getTopicLabel = (id: ContactTopic) => {
    const found = topics.find((item) => item.id === id);
    return found ? (lang === 'ar' ? found.labelAr : found.labelEn) : id;
  };

  const formattedMessage = useMemo(() => {
    const cleanName = senderName.trim() || (lang === 'ar' ? 'أحد مستخدمي المنصة' : 'Platform User');
    const cleanPhone = senderPhone.trim();
    const cleanBody = message.trim();
    const header =
      lang === 'ar'
        ? `رسالة جديدة عبر منصة بلدنا (Village Service Hub)`
        : `New message from Baladna (Village Service Hub)`;

    const lines = [
      header,
      `${lang === 'ar' ? 'نوع الرسالة' : 'Type'}: ${getTopicLabel(topic)}`,
      `${lang === 'ar' ? 'الاسم' : 'Name'}: ${cleanName}`
    ];
    if (cleanPhone) {
      lines.push(`${lang === 'ar' ? 'رقم التواصل' : 'Phone'}: ${cleanPhone}`);
    }
    lines.push(`${lang === 'ar' ? 'التفاصيل' : 'Details'}:\n${cleanBody}`);
    return lines.join('\n');
  }, [lang, message, senderName, senderPhone, topic]);

  const liveWhatsappUrl = useMemo(
    () => `https://wa.me/${SUPPORT_WHATSAPP_INTL}?text=${encodeURIComponent(formattedMessage)}`,
    [formattedMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = senderName.trim();
    const cleanPhone = senderPhone.trim();
    const cleanMessage = message.trim();

    if (cleanName.length < 2) {
      setErrorMsg(
        lang === 'ar'
          ? 'من فضلك اكتب اسمك (حرفين على الأقل).'
          : 'Please enter your name (at least 2 characters).'
      );
      return;
    }

    if (cleanPhone) {
      const normalized = normalizePhone(cleanPhone);
      if (normalized.length < 8 || normalized.length > 15) {
        setErrorMsg(
          lang === 'ar'
            ? 'رقم الموبايل غير صحيح، تأكد من كتابة الرقم بشكل سليم أو اتركه فارغاً.'
            : 'Please enter a valid phone number or leave it blank.'
        );
        return;
      }
    }

    if (cleanMessage.length < 5) {
      setErrorMsg(
        lang === 'ar'
          ? 'من فضلك اكتب تفاصيل المقترح أو الشكوى (5 أحرف على الأقل).'
          : 'Please enter your suggestion or complaint (at least 5 characters).'
      );
      return;
    }

    setSubmittedPreview(formattedMessage);
    setSubmittedUrl(liveWhatsappUrl);
    setCopied(false);

    window.setTimeout(() => {
      waAnchorRef.current?.click();
    }, 0);
  };

  const handleCopyText = async () => {
    if (!submittedPreview) return;
    try {
      await navigator.clipboard.writeText(submittedPreview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const handleReset = () => {
    setSubmittedUrl('');
    setSubmittedPreview('');
    setMessage('');
    setErrorMsg('');
    setCopied(false);
  };

  return (
    <div className="space-y-8 pb-8">
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
          <span className="font-bold text-slate-900 dark:text-white">{t.contactUs}</span>
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

      {/* Main 2-Column Contact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Info Column */}
        <section className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{lang === 'ar' ? activeVillage.nameAr || 'بلدنا' : activeVillage.nameEn || 'Village Service Hub'}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'ar' ? 'المقترحات والشكاوى' : 'Suggestions & Complaints'}</span>
            </div>

            <h1
              className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
              style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.45rem)', textWrap: 'balance' }}
            >
              {lang === 'ar'
                ? 'تواصل معنا — رأيك يهمنا لتطوير بلدنا'
                : 'Contact Us — Suggestions & Complaints'}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ar'
                ? 'لو عندك أي مقترح لإضافة خدمة أو تحسين في التطبيق، أو واجهتك أي شكوى بخصوص طلب أو مقدم خدمة، ابعتلنا رسالتك مباشرة على الواتساب وهنتابع معاك فوراً.'
                : 'Have a suggestion to improve the platform or a complaint regarding an order or provider? Send your message directly to our support team on WhatsApp.'}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? 'رقم الواتساب المخصص للمقترحات والشكاوى' : 'Direct WhatsApp Support Number'}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 shrink-0" />
                  <span>{SUPPORT_WHATSAPP_LOCAL}</span>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP_INTL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{lang === 'ar' ? 'فتح محادثة واتساب مباشرة' : 'Chat Directly on WhatsApp'}</span>
              </a>

              <a
                href={`tel:${SUPPORT_WHATSAPP_LOCAL}`}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اتصال هاتفي' : 'Call Support'}</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              {lang === 'ar' ? 'إيه اللي تبعته لينا؟' : 'What can you send us?'}
            </div>
            <p>
              {lang === 'ar'
                ? 'طلب إضافة قسم أو خدمة جديدة · الإبلاغ عن مشكلة في الحجز أو التوصيل · اقتراح لتسهيل الاستخدام · الاستفسار عن حسابات مقدمي الخدمات.'
                : 'Requests for new service categories · Order or delivery complaints · Usability suggestions · Provider onboarding questions.'}
            </p>
          </div>
        </section>

        {/* Right / Interactive WhatsApp Form */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <a
            ref={waAnchorRef}
            href={liveWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            WhatsApp
          </a>

          {submittedUrl ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ar'
                      ? 'تم تجهيز رسالتك لإرسالها على الواتساب'
                      : 'Your WhatsApp Message Is Ready'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {lang === 'ar'
                      ? `إذا لم يفتح تطبيق واتساب تلقائياً، اضغط على زر الإرسال أدناه للتواصل مع الرقم ${SUPPORT_WHATSAPP_LOCAL}.`
                      : `If WhatsApp did not open automatically, click the button below to send directly to ${SUPPORT_WHATSAPP_LOCAL}.`}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {submittedPreview}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={submittedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال عبر واتساب الآن' : 'Send via WhatsApp Now'}</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>
                    {copied
                      ? lang === 'ar'
                        ? 'تم نسخ النص'
                        : 'Copied'
                      : lang === 'ar'
                      ? 'نسخ نص الرسالة'
                      : 'Copy Message'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'ar' ? 'نموذج المقترحات والشكاوى' : 'Send a Suggestion or Complaint'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'اكتب رسالتك وهيتم تجهيزها وإرسالها مباشرة إلى واتساب الدعم.'
                    : 'Fill in your message below to open WhatsApp directly with your details.'}
                </p>
              </div>

              {/* Topic Segmented Control */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'نوع الرسالة' : 'Message Type'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  {topics.map((item) => {
                    const active = topic === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTopic(item.id)}
                        className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {lang === 'ar' ? item.labelAr : item.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الاسم *' : 'Your Name *'}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أحمد محمود' : 'e.g. Ahmed Mahmoud'}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'رقم الموبايل (اختياري)' : 'Phone Number (Optional)'}
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    dir="ltr"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'تفاصيل المقترح أو الشكوى *' : 'Message Details *'}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    topic === 'complaint'
                      ? lang === 'ar'
                        ? 'اشرح المشكلة أو الشكوى بالتفصيل عشان نقدر نساعدك بسرعة...'
                        : 'Describe the issue or complaint clearly...'
                      : lang === 'ar'
                      ? 'اكتب مقترحك أو استفسارك هنا...'
                      : 'Write your suggestion or question here...'
                  }
                  className="w-full p-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200"
                >
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums" dir="ltr">
                  WhatsApp: {SUPPORT_WHATSAPP_LOCAL}
                </span>

                <button
                  type="submit"
                  className={`min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0`}
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إرسال على الواتساب' : 'Send via WhatsApp'}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
