import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Village Assistant Endpoint (Egyptian Arabic & English)
app.post('/api/village-assistant', async (req: Request, res: Response) => {
  const { question, language, villageName } = req.body || {};
  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(question);
  const vName = villageName || (isArabic ? 'قرية نقباس' : 'Noqbas Village');

  const fallbackReply = isArabic
    ? `أهلاً بيك يا جاري العزيز في منصة ${vName}! تقدر تحجز كشف في قسم أطباء وعيادات، تطلب دواء من الصيدليات، أو أكل من مطاعم وكافيهات، أو مقاضي البيت من بقالة وسوبر ماركت، وكمان تحجز مواصلات أو دروس ومعلمون أو تتواصل مع الجمعيات الخيرية أو تشوف قسم أخرى. اختار القسم اللي محتاجه من فوق!`
    : `Welcome, neighbor to ${vName}! You can book Doctors & Clinics, order from Pharmacies, Restaurants & Cafes, Grocery & Supermarket, find Technicians, book Rides, Tutoring, Charities, or browse Other services from the navigation menu!`;

  if (!aiClient) {
    res.json({ answer: fallbackReply });
    return;
  }

  try {
    const prompt = `You are "Emad" (عماد), a friendly, respectful, and practical village assistant for the Egyptian digital community hub "${vName}" (نقباس | Noqbas).
The user is asking: "${question}"
Preferred language: ${isArabic ? 'Egyptian Colloquial Arabic (عامية مصرية محترمة وبسيطة مفهومة لكل أهل البلد)' : 'English (warm, community-focused, and helpful)'}.
Currency: Egyptian Pound (EGP / ج.م).

Village sections available in the app:
1. أطباء وعيادات (Doctors & Clinics): Dr. Tariq Al-Khatib (Internal Medicine, 100 EGP), Dr. Laila Mansour (Pediatrician, 150 EGP), Nurse Fatima (Home nursing/injections 24/7, 50 EGP).
2. صيدليات (Pharmacies): Al-Shifa Pharmacy (prescription photo upload, chronic meds, distance-based delivery or free pickup).
3. مطاعم وكافيهات (Restaurants & Cafes): Al-Baraka Bakery (Feteer Meshaltet 140 EGP), Um Salem Homemade Kitchen (Duck & Mahshi trays 420 EGP), Al-Wadi Grill & Cafe.
4. فنيون وحرفيون (Technicians): Abu Ahmad (Electrician, 01045678901, 80 EGP), Master Mahmoud (Plumber & water pumps, 01156789012, 70 EGP), Eng. Youssef (AC & Fridges, 120 EGP).
5. مواصلات (Transportation & Rides): Daily carpools and rides from Village Square (25-30 EGP).
6. بقالة وسوبر ماركت (Grocery & Supermarket): Daily pantry staples, cooking oil, rice, dairy, and fresh produce delivered to the house.
7. دروس ومعلمون (Tutoring & Teachers): Math, English, Science, and Quran circles for primary/prep/secondary students.
8. الجمعيات الخيرية (Charities): Community aid, medical convoys, food boxes, and confidential charitable support.
9. أخرى (Other Services): Print shops, stationery, mobile repair, carpet laundry, wedding event tents, and any activity not listed above.
10. إعلانات أهل القرية (Classified Ads): Timed approved resident/shop offers displayed on the Home tab.

Give a concise, helpful response (2-3 short sentences) in ${isArabic ? 'Egyptian Colloquial Arabic' : 'English'} guiding them directly to the right section or provider.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timeout')), 12000)
    );

    const response = await Promise.race([
      aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      }),
      timeoutPromise,
    ]);

    res.json({ answer: response.text || fallbackReply });
  } catch (error) {
    console.error('Village assistant error:', error);
    res.json({ answer: fallbackReply });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Noqbas Village server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
