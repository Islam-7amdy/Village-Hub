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

2. تشغيل خادم الإنتاج:
   ```bash
   npm start
   ```
   (يعمل بمتغير `NODE_ENV=production` ويخدم ملفات `dist/` الثابتة مع مسار `/api/village-assistant`).

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

## نشر قواعد Firestore (Firebase Rules)

يتضمن المشروع ملف `firebase.json` و`firestore.rules`. لنشر القواعد باستخدام Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
