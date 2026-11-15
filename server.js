// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
var apiKey = process.env.GEMINI_API_KEY;
var GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-4-hydrogen";
var aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/village-assistant", async (req, res) => {
  const { question, language, villageName } = req.body || {};
  if (!question) {
    res.status(400).json({ error: "Question is required" });
    return;
  }
  const isArabic = language === "ar" || /[\u0600-\u06FF]/.test(question);
  const vName = villageName || (isArabic ? "\u0642\u0631\u064A\u0629 \u0646\u0642\u0628\u0627\u0633" : "Noqbas Village");
  const fallbackReply = isArabic ? `\u0623\u0647\u0644\u0627\u064B \u0628\u064A\u0643 \u064A\u0627 \u062C\u0627\u0631\u064A \u0627\u0644\u0639\u0632\u064A\u0632 \u0641\u064A \u0645\u0646\u0635\u0629 ${vName}! \u062A\u0642\u062F\u0631 \u062A\u062D\u062C\u0632 \u0643\u0634\u0641 \u0641\u064A \u0642\u0633\u0645 \u0623\u0637\u0628\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u062A\u0637\u0644\u0628 \u062F\u0648\u0627\u0621 \u0645\u0646 \u0627\u0644\u0635\u064A\u062F\u0644\u064A\u0627\u062A\u060C \u0623\u0648 \u0623\u0643\u0644 \u0645\u0646 \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A\u060C \u0623\u0648 \u0645\u0642\u0627\u0636\u064A \u0627\u0644\u0628\u064A\u062A \u0645\u0646 \u0628\u0642\u0627\u0644\u0629 \u0648\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A\u060C \u0648\u0643\u0645\u0627\u0646 \u062A\u062D\u062C\u0632 \u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0623\u0648 \u062F\u0631\u0648\u0633 \u0648\u0645\u0639\u0644\u0645\u0648\u0646 \u0623\u0648 \u062A\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0627\u0644\u062C\u0645\u0639\u064A\u0627\u062A \u0627\u0644\u062E\u064A\u0631\u064A\u0629 \u0623\u0648 \u062A\u0634\u0648\u0641 \u0642\u0633\u0645 \u0623\u062E\u0631\u0649. \u0627\u062E\u062A\u0627\u0631 \u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0644\u064A \u0645\u062D\u062A\u0627\u062C\u0647 \u0645\u0646 \u0641\u0648\u0642!` : `Welcome, neighbor to ${vName}! You can book Doctors & Clinics, order from Pharmacies, Restaurants & Cafes, Grocery & Supermarket, find Technicians, book Rides, Tutoring, Charities, or browse Other services from the navigation menu!`;
  if (!aiClient) {
    res.json({ answer: fallbackReply });
    return;
  }
  try {
    const prompt = `You are "Emad" (\u0639\u0645\u0627\u062F), a friendly, respectful, and practical village assistant for the Egyptian digital community hub "${vName}" (\u0646\u0642\u0628\u0627\u0633 | Noqbas).
The user is asking: "${question}"
Preferred language: ${isArabic ? "Egyptian Colloquial Arabic (\u0639\u0627\u0645\u064A\u0629 \u0645\u0635\u0631\u064A\u0629 \u0645\u062D\u062A\u0631\u0645\u0629 \u0648\u0628\u0633\u064A\u0637\u0629 \u0645\u0641\u0647\u0648\u0645\u0629 \u0644\u0643\u0644 \u0623\u0647\u0644 \u0627\u0644\u0628\u0644\u062F)" : "English (warm, community-focused, and helpful)"}.
Currency: Egyptian Pound (EGP / \u062C.\u0645).

Village sections available in the app:
1. \u0623\u0637\u0628\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0627\u062A (Doctors & Clinics): Dr. Tariq Al-Khatib (Internal Medicine, 100 EGP), Dr. Laila Mansour (Pediatrician, 150 EGP), Nurse Fatima (Home nursing/injections 24/7, 50 EGP).
2. \u0635\u064A\u062F\u0644\u064A\u0627\u062A (Pharmacies): Al-Shifa Pharmacy (prescription photo upload, chronic meds, distance-based delivery or free pickup).
3. \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A (Restaurants & Cafes): Al-Baraka Bakery (Feteer Meshaltet 140 EGP), Um Salem Homemade Kitchen (Duck & Mahshi trays 420 EGP), Al-Wadi Grill & Cafe.
4. \u0641\u0646\u064A\u0648\u0646 \u0648\u062D\u0631\u0641\u064A\u0648\u0646 (Technicians): Abu Ahmad (Electrician, 01045678901, 80 EGP), Master Mahmoud (Plumber & water pumps, 01156789012, 70 EGP), Eng. Youssef (AC & Fridges, 120 EGP).
5. \u0645\u0648\u0627\u0635\u0644\u0627\u062A (Transportation & Rides): Daily carpools and rides from Village Square (25-30 EGP).
6. \u0628\u0642\u0627\u0644\u0629 \u0648\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A (Grocery & Supermarket): Daily pantry staples, cooking oil, rice, dairy, and fresh produce delivered to the house.
7. \u062F\u0631\u0648\u0633 \u0648\u0645\u0639\u0644\u0645\u0648\u0646 (Tutoring & Teachers): Math, English, Science, and Quran circles for primary/prep/secondary students.
8. \u0627\u0644\u062C\u0645\u0639\u064A\u0627\u062A \u0627\u0644\u062E\u064A\u0631\u064A\u0629 (Charities): Community aid, medical convoys, food boxes, and confidential charitable support.
9. \u0623\u062E\u0631\u0649 (Other Services): Print shops, stationery, mobile repair, carpet laundry, wedding event tents, and any activity not listed above.
10. \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0623\u0647\u0644 \u0627\u0644\u0642\u0631\u064A\u0629 (Classified Ads): Timed approved resident/shop offers displayed on the Home tab.

Give a concise, helpful response (2-3 short sentences) in ${isArabic ? "Egyptian Colloquial Arabic" : "English"} guiding them directly to the right section or provider.`;
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Gemini request timeout")), 12e3)
    );
    const response = await Promise.race([
      aiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      }),
      timeoutPromise
    ]);
    res.json({ answer: response.text || fallbackReply });
  } catch (error) {
    console.error("Village assistant error:", error);
    res.json({ answer: fallbackReply });
  }
});
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Noqbas Village server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
