import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
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

// AI Clinical Triage Endpoint
app.post('/api/triage', async (req: Request, res: Response) => {
  try {
    const { symptoms, duration, severity, age, existingConditions } = req.body;
    if (!symptoms) {
      res.status(400).json({ error: 'Symptoms description is required' });
      return;
    }

    if (!aiClient) {
      // Fallback rule-based guidance if GEMINI_API_KEY is not configured
      res.json({
        urgency: severity === 'severe' ? 'Urgent / Emergency Care' : 'Moderate / Schedule Primary Care',
        urgencyLevel: severity === 'severe' ? 'urgent' : 'moderate',
        summary: `Assessment for reported symptoms: "${symptoms}". Given the ${duration || 'current'} timeframe and ${severity || 'reported'} severity level.`,
        potentialConsiderations: [
          'Acute symptom escalation monitoring',
          'Primary care or specialist follow-up recommended',
          'Vitals tracking: blood pressure, pulse, temperature',
        ],
        recommendedSpecialist: symptoms.toLowerCase().includes('chest') || symptoms.toLowerCase().includes('heart') ? 'Cardiology' : 'Internal Medicine / Primary Care',
        questionsForDoctor: [
          'What tests or blood panels are recommended to isolate the cause?',
          'Are there specific warning signs that warrant immediate emergency room care?',
          'Do my existing medications interact with these symptoms?'
        ],
        selfCareGuidelines: [
          'Rest in a comfortable, ventilated space and stay well hydrated',
          'Log your temperature and blood pressure twice daily',
          'Avoid strenuous physical exertion until evaluated by a licensed clinician'
        ],
        emergencyWarningSigns: [
          'Sudden chest tightness radiating to the jaw, neck, or left arm',
          'Severe acute shortness of breath or blue-tinted lips/fingers',
          'Sudden loss of balance, confusion, or slurred speech'
        ],
        disclaimer: 'This guidance is an algorithmic triage reference and does not replace medical diagnosis by a licensed physician.'
      });
      return;
    }

    const prompt = `You are a clinical decision support and triage assistant. A patient is reporting the following details:
- Symptoms: ${symptoms}
- Duration: ${duration || 'Not specified'}
- Self-reported Severity: ${severity || 'Moderate'}
- Patient Age: ${age || 'Adult'}
- Known Conditions: ${existingConditions ? existingConditions.join(', ') : 'None specified'}

Provide a structured, compassionate, and medically sound triage evaluation in valid JSON format matching this schema:
{
  "urgency": "Urgent Care Required | Prompt Consultation (24-48h) | Routine Care | Self-Care & Monitor",
  "urgencyLevel": "urgent" | "moderate" | "routine",
  "summary": "1-2 sentence empathetic medical synthesis of what the patient reported",
  "potentialConsiderations": ["3 concise clinical possibilities or physiological factors to investigate"],
  "recommendedSpecialist": "e.g. Cardiology, Internal Medicine, Pulmonology, Neurology, etc.",
  "questionsForDoctor": ["3 specific, high-yield questions the patient should bring to their consultation"],
  "selfCareGuidelines": ["2-3 safe, conservative symptomatic measures before seeing the doctor"],
  "emergencyWarningSigns": ["3 specific red flags that require immediate ER/911 call"],
  "disclaimer": "Vitalis Clinical Triage is for informational and scheduling assistance only and does not constitute a formal medical diagnosis."
}
Respond with raw JSON only, no markdown wrapping.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    console.error('Triage error:', error);
    res.status(500).json({
      error: 'Unable to complete AI triage assessment. Please consult your physician directly.',
    });
  }
});

// AI Doctor Clinical Note & SOAP Summary Endpoint
app.post('/api/clinical-summary', async (req: Request, res: Response) => {
  try {
    const { patientName, age, vitals, subjectiveNotes, diagnosis, currentMedications } = req.body;

    if (!aiClient) {
      res.json({
        soapNote: {
          subjective: subjectiveNotes || 'Patient presents for evaluation of current health status.',
          objective: `Vitals recorded: BP ${vitals?.bp || '120/80'}, HR ${vitals?.hr || '72'} bpm, Temp ${vitals?.temp || '98.6'}°F, SpO2 ${vitals?.spo2 || '98'}%. Physical examination benign.`,
          assessment: diagnosis || 'Clinical stability maintained. Ongoing therapeutic protocol active.',
          plan: 'Continue prescribed pharmacotherapy. Schedule repeat vitals check in 14 days. Routine metabolic panel ordered.'
        },
        patientFriendlySummary: `Dr. evaluated your current symptoms and vitals. Your clinical indicators are stable. Please continue taking your medications as prescribed and return for your follow-up appointment.`
      });
      return;
    }

    const prompt = `Generate a structured clinical SOAP note and a patient-friendly consultation summary based on:
Patient: ${patientName}, Age: ${age}
Current Vitals: BP: ${vitals?.bp}, HR: ${vitals?.hr}, Temp: ${vitals?.temp}, SpO2: ${vitals?.spo2}
Doctor notes & observations: ${subjectiveNotes}
Assessment / Working Diagnosis: ${diagnosis}
Current Medications: ${currentMedications ? JSON.stringify(currentMedications) : 'None'}

Return valid JSON with:
{
  "soapNote": {
    "subjective": "Professional medical summary of patient presentation",
    "objective": "Documented vitals and clinical findings",
    "assessment": "Diagnostic impressions and stability grading",
    "plan": "Actionable therapeutic and follow-up plan"
  },
  "patientFriendlySummary": "Warm, jargon-free 2-3 sentence overview that the patient can read in their portal"
}
Respond with raw JSON only.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    console.error('Clinical summary error:', error);
    res.status(500).json({ error: 'Failed to generate clinical summary' });
  }
});

// AI Village Assistant Endpoint (Egyptian Arabic & English)
app.post('/api/village-assistant', async (req: Request, res: Response) => {
  const { question, language, villageName } = req.body || {};
  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const isArabic = language === 'ar' || /[\u0600-\u06FF]/.test(question);
  const vName = villageName || (isArabic ? 'قرية ىقباس' : 'Noqbas Village');

  const fallbackReply = isArabic
    ? `أهلاً بيك يا جاري العزيز في منصة ${vName}! تقدر تحجز كشف في قسم أطباء وعيادات، تطلب دواء من الصيدليات، أو أكل من مطاعم وكافيهات، أو مقاضي البيت من بقالة وسوبر ماركت، وكمان تحجز مواصلات أو دروس ومعلمون أو تتواصل مع الجمعيات الخيرية. اختار القسم اللي محتاجه من فوق!`
    : `Welcome, neighbor to ${vName}! You can book Doctors & Clinics, order from Pharmacies, Restaurants & Cafes, Grocery & Supermarket, find Technicians, book Rides, Tutoring, or reach Charities from the navigation menu!`;

  if (!aiClient) {
    res.json({ answer: fallbackReply });
    return;
  }

  try {
    const prompt = `You are "Emad" (عماد), a friendly, respectful, and practical village assistant for the Egyptian digital community hub "${vName}" (ىقباس | Noqbas).
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
9. إعلانات أهل القرية (Classified Ads): Approved resident/shop offers displayed on the Home tab.

Give a concise, helpful response (2-3 short sentences) in ${isArabic ? 'Egyptian Colloquial Arabic' : 'English'} guiding them directly to the right section or provider.`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timeout')), 12000)
    );

    const response = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
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
    console.log(`Vitalis Health server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
