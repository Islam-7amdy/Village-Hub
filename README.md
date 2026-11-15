# نقباس | Noqbas Village Services Hub

منصة خدمات أهالي قرية نقباس والقرى المجاورة (Noqbas Village Hub) — تطبيق ويب متكامل (React + Vite + Express + Firebase Firestore/Auth) يربط السكان بمقدمي الخدمات المحليين مع نظام حجز، سلة تسوق، تتبع طلبات، دفع إلكتروني (InstaPay) أو كاش عند الاستلام، ولوحات تحكم مخصصة لمقدمي الخدمات والإدارة.

## المتطلبات الأساسية (Prerequisites)

- **Node.js** 20 أو أحدث
- **npm** (أو **bun**)
- مشروع **Firebase** مفعّل به **Firestore Database** و**Authentication** (ملف الإعدادات: `firebase-applet-config.json`)

## التثبيت والتشغيل المحلي (Local Development)

1. تثبيت الحزم:
   ```bash
   npm install
   ```

2. إعداد متغيرات البيئة:
   ```bash
   cp .env.example .env
   ```
   ثم قم بتعبئة القيم المناسبة داخل `.env`:
   - `PORT`: منفذ السيرفر (الافتراضي `3000`)
   - `GEMINI_API_KEY`: مفتاح Gemini API (اختياري للمساعد الذكي؛ يعمل التطبيق بدونه بردود محلية بديلة)
   - `GEMINI_MODEL`: اسم الموديل المستخدم للمساعد الذكي (الافتراضي `gemini-4-hydrogen`)
   - `APP_URL`: رابط التطبيق
   - `VITE_RECAPTCHA_SITE_KEY`: مفتاح reCAPTCHA v3 لتفعيل Firebase App Check في الواجهة (اختياري)
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: بيانات Service Account الخاصة بـ Firebase Admin SDK بصيغة JSON (لتفعيل التحقق الكامل وحذف المستخدمين من Auth وفحص الحظر قبل إرسال SMS)

3. تشغيل بيئة التطوير (Express + Vite Middleware):
   ```bash
   npm run dev
   ```
   افتح المتصفح على `http://localhost:3000`.

## البناء والتشغيل في الإنتاج (Production)

1. بناء الواجهة وتجميع السيرفر:
   ```bash
   npm run build
   ```
   يتم إنشاء مجلد `dist/` وملف السيرفر المجمّع `server.js`.
   (حسابات التجربة وبيانات العرض الوهمية معزولة تماماً داخل `import.meta.env.DEV` ولا تدخل في حزمة الإنتاج).

2. تشغيل خادم الإنتاج:
   ```bash
   npm start
   ```
   (يعمل بمتغير `NODE_ENV=production` ويخدم ملفات `dist/` الثابتة مع مسارات `/api/village-assistant` و`/api/auth/check-ban` و`/api/admin/delete-user`).

## الأوامر المتاحة (Scripts)

| الأمر | الوصف |
| --- | --- |
| `npm run dev` | تشغيل خادم التطوير عبر `tsx server.ts` |
| `npm run build` | بناء الواجهة (`vite build`) وتجميع السيرفر (`esbuild`) |
| `npm start` | تشغيل نسخة الإنتاج (`NODE_ENV=production node server.js`) |
| `npm run lint` | فحص الأنواع عبر `tsc --noEmit` |
| `npm run lint:eslint` | فحص جودة الكود عبر ESLint |
| `npm test` | تشغيل اختبارات الوحدة (`tsx --test tests/*.test.ts`) |
| `npm run clean` | حذف `dist/` و`server.js` (متوافق مع Windows وLinux وmacOS) |

## نشر قواعد Firestore وإعداد الأمان في الإنتاج (Firebase & GCP Console)

1. **نشر قواعد الأمان (`firestore.rules`):**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **إضافة صلاحية الأدمن (`/admins/{uid}`):**
   لا توجد أي إيميلات أدمن ثابتة في الكود. لتعيين مدير للمنصة، أنشئ مستنداً في Firestore داخل collection باسم `admins` يكون معرفه `uid` الخاص بحساب الأدمن في Firebase Authentication (يمكن أن يحتوي مثلاً `{ active: true }`).

3. **Firebase Admin SDK على الخادم (`FIREBASE_SERVICE_ACCOUNT_JSON`):**
   اضبط `FIREBASE_SERVICE_ACCOUNT_JSON` (أو `GOOGLE_APPLICATION_CREDENTIALS`) حتى يتمكن الخادم من:
   - حذف حسابات المستخدمين نهائياً من Firebase Authentication + Firestore عند الحذف من لوحة الأدمن (`/api/admin/delete-user`).
   - التحقق السريع من أرقام الهواتف المحظورة قبل إرسال رسائل SMS OTP (`/api/auth/check-ban`).

4. **حماية مفتاح Firebase API وSMS Quota (إجراء مطلوب في لوحة التحكم):**
   - **تقييد مفتاح المتصفح (HTTP Referrers):** من Google Cloud Console -> APIs & Services -> Credentials -> تقييد مفتاح المتصفح بنطاقات الموقع المعتمدة فقط (مثل `noqbas.example.com/*`).
   - **تفعيل Firebase App Check:** سجّل موقعك بـ reCAPTCHA v3 في Firebase Console -> App Check، وضع `VITE_RECAPTCHA_SITE_KEY` في البيئة، ثم فعّل Enforce على Firestore وAuthentication.
   - **حظر مناطق SMS غير المصرح بها:** من Firebase Console -> Authentication -> Settings -> SMS region policy -> فعّل **Allow only** لجمهورية مصر العربية (`+20`) لمنع استنزاف رصيد الرسائل النصية دولياً.

