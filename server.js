// server.ts
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function loadFirebaseConfig() {
  const candidates = [
    path.resolve(__dirname, "firebase-applet-config.json"),
    path.resolve(process.cwd(), "firebase-applet-config.json")
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      }
    } catch {
    }
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    apiKey: process.env.FIREBASE_WEB_API_KEY || "",
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)"
  };
}
var firebaseConfig = loadFirebaseConfig();
var adminAuth = null;
var adminDb = null;
var adminSdkIssue = null;
function parseServiceAccountInput(rawInput) {
  let candidate = rawInput.trim();
  if (candidate.startsWith('"') && candidate.endsWith('"') || candidate.startsWith("'") && candidate.endsWith("'")) {
    candidate = candidate.slice(1, -1).trim();
  }
  if (!candidate) return null;
  let jsonText = "";
  if (candidate.startsWith("{")) {
    jsonText = candidate;
  } else if (candidate.endsWith(".json") && fs.existsSync(candidate)) {
    try {
      jsonText = fs.readFileSync(candidate, "utf8").trim();
    } catch {
      return null;
    }
  } else {
    try {
      const decoded = Buffer.from(candidate, "base64").toString("utf8").trim();
      if (decoded.startsWith("{")) {
        jsonText = decoded;
      }
    } catch {
      return null;
    }
  }
  if (!jsonText.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") return null;
    const clientEmail = parsed.clientEmail || parsed.client_email;
    const rawPrivateKey = parsed.privateKey || parsed.private_key;
    if (typeof clientEmail !== "string" || !clientEmail.includes("@")) return null;
    if (typeof rawPrivateKey !== "string" || !rawPrivateKey.includes("PRIVATE KEY")) return null;
    const normalizedKey = rawPrivateKey.replace(/\\n/g, "\n");
    return {
      ...parsed,
      client_email: clientEmail,
      clientEmail,
      private_key: normalizedKey,
      privateKey: normalizedKey
    };
  } catch {
    return null;
  }
}
function initFirebaseAdmin() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!rawJson && !credsPath) return;
  try {
    let appInstance;
    if (getApps().length > 0) {
      appInstance = getApp();
    } else if (rawJson) {
      const serviceAccount = parseServiceAccountInput(rawJson);
      if (!serviceAccount) {
        adminSdkIssue = "FIREBASE_SERVICE_ACCOUNT_JSON is not a valid Firebase service account JSON key.";
        return;
      }
      appInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId || serviceAccount.projectId || serviceAccount.project_id
      });
    } else {
      appInstance = initializeApp({
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId || void 0
      });
    }
    adminAuth = getAuth(appInstance);
    adminDb = firebaseConfig.firestoreDatabaseId ? getAdminFirestore(appInstance, firebaseConfig.firestoreDatabaseId) : getAdminFirestore(appInstance);
    adminSdkIssue = null;
  } catch (err) {
    adminSdkIssue = err instanceof Error ? err.message : String(err);
    adminAuth = null;
    adminDb = null;
  }
}
initFirebaseAdmin();
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var MAX_ASSISTANT_QUESTION_CHARS = 300;
app.set("trust proxy", 1);
app.use(express.json({ limit: "32kb" }));
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
async function verifyIdTokenFallback(idToken) {
  if (!firebaseConfig.apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5e3);
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: controller.signal
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const u = data.users?.[0];
    if (!u?.localId || u.disabled) return null;
    return {
      uid: u.localId,
      email: u.email,
      phoneNumber: u.phoneNumber
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
async function isUidOrPhoneBannedInAdminDb(uid, phoneNumber) {
  if (!adminDb) return false;
  const now = Date.now();
  try {
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (userSnap.exists) {
      const data = userSnap.data();
      if (data?.isBanned && (!data.banUntilMs || data.banUntilMs <= 0 || now < data.banUntilMs)) {
        return true;
      }
    }
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, "");
      const normalized = digits.startsWith("20") && digits.length === 12 ? digits.slice(1) : digits;
      if (normalized.length >= 8) {
        const banSnap = await adminDb.collection("bannedPhones").doc(normalized).get();
        if (banSnap.exists) {
          const ban = banSnap.data();
          if (ban?.isPermanent || ban?.banUntilMs && now < ban.banUntilMs) {
            return true;
          }
        }
      }
    }
  } catch {
  }
  return false;
}
async function requireFirebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim();
  if (!idToken || idToken.length > 4096) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  let verified;
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      verified = {
        uid: decoded.uid,
        email: decoded.email,
        phoneNumber: decoded.phone_number
      };
    } catch {
      res.status(401).json({ error: "Invalid or expired authentication token" });
      return;
    }
  } else {
    const fallbackUser = await verifyIdTokenFallback(idToken);
    if (!fallbackUser) {
      res.status(401).json({ error: "Invalid or expired authentication token" });
      return;
    }
    verified = fallbackUser;
  }
  const banned = await isUidOrPhoneBannedInAdminDb(verified.uid, verified.phoneNumber);
  if (banned) {
    res.status(403).json({ error: "Account is currently banned" });
    return;
  }
  req.authUser = verified;
  next();
}
var assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many assistant requests, please wait before trying again." }
});
var banCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification checks, please wait." }
});
var adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please slow down." }
});
app.post(
  "/api/village-assistant",
  assistantLimiter,
  requireFirebaseAuth,
  async (req, res) => {
    const rawQuestion = req.body?.question;
    const language = req.body?.language;
    const villageName = typeof req.body?.villageName === "string" ? req.body.villageName.trim().slice(0, 80) : "";
    if (typeof rawQuestion !== "string") {
      res.status(400).json({ error: "Question must be a non-empty string" });
      return;
    }
    const cleanQuestion = rawQuestion.trim();
    if (!cleanQuestion) {
      res.status(400).json({ error: "Question is required" });
      return;
    }
    if (cleanQuestion.length > MAX_ASSISTANT_QUESTION_CHARS) {
      res.status(400).json({
        error: `Question exceeds maximum length of ${MAX_ASSISTANT_QUESTION_CHARS} characters`
      });
      return;
    }
    const isArabic = language === "ar" || /[\u0600-\u06FF]/.test(cleanQuestion);
    const vName = villageName || (isArabic ? "\u0642\u0631\u064A\u0629 \u0646\u0642\u0628\u0627\u0633" : "Noqbas Village");
    const fallbackReply = isArabic ? `\u0623\u0647\u0644\u0627\u064B \u0628\u064A\u0643 \u064A\u0627 \u062C\u0627\u0631\u064A \u0627\u0644\u0639\u0632\u064A\u0632 \u0641\u064A \u0645\u0646\u0635\u0629 ${vName}! \u062A\u0642\u062F\u0631 \u062A\u062A\u0635\u0641\u062D \u0623\u0642\u0633\u0627\u0645 \u0623\u0637\u0628\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0627\u062A\u060C \u0635\u064A\u062F\u0644\u064A\u0627\u062A\u060C \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A\u060C \u0628\u0642\u0627\u0644\u0629 \u0648\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A\u060C \u0641\u0646\u064A\u064A\u0646 \u0648\u062D\u0631\u0641\u064A\u064A\u0646\u060C \u0645\u0648\u0627\u0635\u0644\u0627\u062A\u060C \u062F\u0631\u0648\u0633 \u0648\u0645\u0639\u0644\u0645\u0648\u0646\u060C \u0627\u0644\u062C\u0645\u0639\u064A\u0627\u062A \u0627\u0644\u062E\u064A\u0631\u064A\u0629 \u0623\u0648 \u0642\u0633\u0645 \u0623\u062E\u0631\u0649 \u0648\u062A\u062E\u062A\u0627\u0631 \u0645\u0642\u062F\u0645 \u0627\u0644\u062E\u062F\u0645\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0627\u0644\u0623\u0642\u0631\u0628 \u0644\u064A\u0643 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629.` : `Welcome to ${vName}! You can browse Doctors & Clinics, Pharmacies, Restaurants & Cafes, Grocery & Supermarket, Technicians, Rides, Tutoring, Charities, or Other Services directly from the category tabs to choose an approved local provider.`;
    if (!aiClient) {
      res.json({ answer: fallbackReply });
      return;
    }
    try {
      const prompt = `You are "Emad" (\u0639\u0645\u0627\u062F), a friendly, respectful, and practical village assistant for the Egyptian digital community hub "${vName}" (\u0646\u0642\u0628\u0627\u0633 | Noqbas).
The resident is asking: "${cleanQuestion}"
Preferred language: ${isArabic ? "Egyptian Colloquial Arabic (\u0639\u0627\u0645\u064A\u0629 \u0645\u0635\u0631\u064A\u0629 \u0645\u062D\u062A\u0631\u0645\u0629 \u0648\u0628\u0633\u064A\u0637\u0629 \u0645\u0641\u0647\u0648\u0645\u0629 \u0644\u0643\u0644 \u0623\u0647\u0644 \u0627\u0644\u0628\u0644\u062F)" : "English (warm, community-focused, and helpful)"}.
Currency: Egyptian Pound (EGP / \u062C.\u0645).
Important rules:
- Do NOT invent specific doctor names, technician names, phone numbers, or prices that are not provided by the user.
- Guide the resident to the matching category tab in the platform so they can browse currently registered and approved local providers, check open/closed availability, and place their booking or order safely.

Platform categories available:
1. \u0623\u0637\u0628\u0627\u0621 \u0648\u0639\u064A\u0627\u062F\u0627\u062A (Doctors & Clinics): Clinic visits, consultations, and home nursing appointments.
2. \u0635\u064A\u062F\u0644\u064A\u0627\u062A (Pharmacies): Medication orders, health supplies, and prescription uploads with delivery or pickup.
3. \u0645\u0637\u0627\u0639\u0645 \u0648\u0643\u0627\u0641\u064A\u0647\u0627\u062A (Restaurants & Cafes): Local meals, bakeries, grills, and village kitchens.
4. \u0641\u0646\u064A\u0648\u0646 \u0648\u062D\u0631\u0641\u064A\u0648\u0646 (Technicians & Craftsmen): Electricians, plumbers, HVAC, carpentry, and home maintenance.
5. \u0645\u0648\u0627\u0635\u0644\u0627\u062A (Transportation & Rides): Local rides and inter-village commutes.
6. \u0628\u0642\u0627\u0644\u0629 \u0648\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A (Grocery & Supermarket): Daily pantry staples, dairy, and fresh produce.
7. \u062F\u0631\u0648\u0633 \u0648\u0645\u0639\u0644\u0645\u0648\u0646 (Tutoring & Teachers): Academic tutoring and study circles.
8. \u0627\u0644\u062C\u0645\u0639\u064A\u0627\u062A \u0627\u0644\u062E\u064A\u0631\u064A\u0629 (Charities): Community aid, medical convoys, and charitable support.
9. \u0623\u062E\u0631\u0649 (Other Services): Printing, electronics repair, laundry, and miscellaneous village services.
10. \u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0623\u0647\u0644 \u0627\u0644\u0642\u0631\u064A\u0629 (Classified Ads): Approved neighborhood offers and listings on the Home tab.

Give a concise, helpful response (2-3 short sentences) in ${isArabic ? "Egyptian Colloquial Arabic" : "English"} guiding them to the right section.`;
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
  }
);
app.post("/api/auth/check-ban", banCheckLimiter, async (req, res) => {
  const rawPhone = typeof req.body?.phone === "string" ? req.body.phone : "";
  const digits = rawPhone.replace(/\D/g, "");
  const normalized = digits.startsWith("20") && digits.length === 12 ? digits.slice(1) : digits.startsWith("0020") && digits.length === 14 ? digits.slice(3) : digits;
  if (normalized.length < 8 || normalized.length > 20) {
    res.status(400).json({ error: "Invalid phone number" });
    return;
  }
  if (!adminDb) {
    res.json({ configured: false, banned: false });
    return;
  }
  try {
    const snap = await adminDb.collection("bannedPhones").doc(normalized).get();
    if (!snap.exists) {
      res.json({ configured: true, banned: false });
      return;
    }
    const ban = snap.data();
    const now = Date.now();
    const active = Boolean(ban.isPermanent) || Boolean(ban.banUntilMs && now < ban.banUntilMs);
    res.json({
      configured: true,
      banned: active,
      isPermanent: Boolean(ban.isPermanent),
      banUntilMs: ban.banUntilMs || 0,
      reason: active ? ban.reason || "" : ""
    });
  } catch (err) {
    console.warn("Pre-auth ban lookup warning:", err);
    res.json({ configured: true, banned: false });
  }
});
app.post(
  "/api/admin/delete-user",
  adminActionLimiter,
  requireFirebaseAuth,
  async (req, res) => {
    const targetUid = typeof req.body?.uid === "string" ? req.body.uid.trim() : "";
    if (!targetUid || !/^[a-zA-Z0-9_-]{1,128}$/.test(targetUid)) {
      res.status(400).json({ ok: false, error: "Valid target user uid is required" });
      return;
    }
    if (req.authUser?.uid === targetUid) {
      res.status(400).json({ ok: false, error: "Cannot delete the active admin account" });
      return;
    }
    if (!adminAuth || !adminDb) {
      res.status(501).json({
        ok: false,
        authDeleted: false,
        reason: "ADMIN_SDK_UNCONFIGURED",
        error: adminSdkIssue || "Firebase Admin SDK is not configured on the server."
      });
      return;
    }
    try {
      const callerAdminSnap = await adminDb.collection("admins").doc(req.authUser.uid).get();
      if (!callerAdminSnap.exists) {
        res.status(403).json({ ok: false, error: "Admin privileges required" });
        return;
      }
      const targetAdminSnap = await adminDb.collection("admins").doc(targetUid).get();
      if (targetAdminSnap.exists) {
        res.status(400).json({ ok: false, error: "Cannot delete an admin account" });
        return;
      }
      let authDeleted = false;
      try {
        await adminAuth.deleteUser(targetUid);
        authDeleted = true;
      } catch (err) {
        const code = err?.code || "";
        if (code === "auth/user-not-found") {
          authDeleted = true;
        } else {
          throw err;
        }
      }
      await Promise.allSettled([
        adminDb.collection("users").doc(targetUid).delete(),
        adminDb.collection("providers").doc(targetUid).delete(),
        adminDb.collection("carts").doc(targetUid).delete()
      ]);
      res.json({ ok: true, authDeleted });
    } catch (err) {
      console.error("Admin delete user error:", err);
      res.status(500).json({
        ok: false,
        authDeleted: false,
        error: "Failed to delete user account on server"
      });
    }
  }
);
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
