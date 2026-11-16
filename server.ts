import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  getFirestore as getAdminFirestore,
  FieldValue,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch
} from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseWebConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

function loadFirebaseConfig(): FirebaseWebConfig {
  const candidates = [
    path.resolve(__dirname, 'firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8')) as FirebaseWebConfig;
      }
    } catch {
      // Try next path
    }
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    apiKey: process.env.FIREBASE_WEB_API_KEY || '',
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)'
  };
}

const firebaseConfig = loadFirebaseConfig();

// Optional Firebase Admin SDK initialization (enabled when FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is valid)
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let adminSdkIssue: string | null = null;

type ParsedServiceAccount = ServiceAccount & {
  project_id?: string;
  private_key?: string;
  client_email?: string;
};

function parseServiceAccountInput(rawInput: string): ParsedServiceAccount | null {
  let candidate = rawInput.trim();
  if (
    (candidate.startsWith('"') && candidate.endsWith('"')) ||
    (candidate.startsWith("'") && candidate.endsWith("'"))
  ) {
    candidate = candidate.slice(1, -1).trim();
  }
  if (!candidate) return null;

  let jsonText = '';
  if (candidate.startsWith('{')) {
    jsonText = candidate;
  } else if (candidate.endsWith('.json') && fs.existsSync(candidate)) {
    try {
      jsonText = fs.readFileSync(candidate, 'utf8').trim();
    } catch {
      return null;
    }
  } else {
    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8').trim();
      if (decoded.startsWith('{')) {
        jsonText = decoded;
      }
    } catch {
      return null;
    }
  }

  if (!jsonText.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(jsonText) as ParsedServiceAccount;
    if (!parsed || typeof parsed !== 'object') return null;
    const clientEmail = parsed.clientEmail || parsed.client_email;
    const rawPrivateKey = parsed.privateKey || parsed.private_key;
    if (typeof clientEmail !== 'string' || !clientEmail.includes('@')) return null;
    if (typeof rawPrivateKey !== 'string' || !rawPrivateKey.includes('PRIVATE KEY')) return null;
    const normalizedKey = rawPrivateKey.replace(/\\n/g, '\n');
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

function initFirebaseAdmin(): void {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!rawJson && !credsPath) return;

  try {
    let appInstance: App;
    if (getApps().length > 0) {
      appInstance = getApp();
    } else if (rawJson) {
      const serviceAccount = parseServiceAccountInput(rawJson);
      if (!serviceAccount) {
        adminSdkIssue =
          'FIREBASE_SERVICE_ACCOUNT_JSON is not a valid Firebase service account JSON key.';
        return;
      }
      appInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId || serviceAccount.projectId || serviceAccount.project_id
      });
    } else {
      appInstance = initializeApp({
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId || undefined
      });
    }
    adminAuth = getAuth(appInstance);
    adminDb = firebaseConfig.firestoreDatabaseId
      ? getAdminFirestore(appInstance, firebaseConfig.firestoreDatabaseId)
      : getAdminFirestore(appInstance);
    adminSdkIssue = null;
  } catch (err) {
    adminSdkIssue = err instanceof Error ? err.message : String(err);
    adminAuth = null;
    adminDb = null;
  }
}

initFirebaseAdmin();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

interface VerifiedAuthUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: VerifiedAuthUser;
}

async function verifyIdTokenFallback(idToken: string): Promise<VerifiedAuthUser | null> {
  if (!firebaseConfig.apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        phoneNumber?: string;
        disabled?: boolean;
      }>;
    };
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

async function isUidOrPhoneBannedInAdminDb(uid: string, phoneNumber?: string): Promise<boolean> {
  if (!adminDb) return false;
  const now = Date.now();
  try {
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (userSnap.exists) {
      const data = userSnap.data() as { isBanned?: boolean; banUntilMs?: number } | undefined;
      if (data?.isBanned && (!data.banUntilMs || data.banUntilMs <= 0 || now < data.banUntilMs)) {
        return true;
      }
    }
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      const normalized = digits.startsWith('20') && digits.length === 12 ? digits.slice(1) : digits;
      if (normalized.length >= 8) {
        const banSnap = await adminDb.collection('bannedPhones').doc(normalized).get();
        if (banSnap.exists) {
          const ban = banSnap.data() as { isPermanent?: boolean; banUntilMs?: number } | undefined;
          if (ban?.isPermanent || (ban?.banUntilMs && now < ban.banUntilMs)) {
            return true;
          }
        }
      }
    }
  } catch {
    // Do not break assistant if Firestore lookup fails transiently
  }
  return false;
}

async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match?.[1]?.trim();

  if (!idToken || idToken.length > 4096) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let verified: VerifiedAuthUser;
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken, true);
      verified = {
        uid: decoded.uid,
        email: decoded.email,
        phoneNumber: decoded.phone_number
      };
    } catch {
      res.status(401).json({ error: 'Invalid or expired authentication token' });
      return;
    }
  } else {
    const fallbackUser = await verifyIdTokenFallback(idToken);
    if (!fallbackUser) {
      res.status(401).json({ error: 'Invalid or expired authentication token' });
      return;
    }
    verified = fallbackUser;
  }

  const banned = await isUidOrPhoneBannedInAdminDb(verified.uid, verified.phoneNumber);
  if (banned) {
    res.status(403).json({ error: 'Account is currently banned' });
    return;
  }

  req.authUser = verified;
  next();
}

const banCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification checks, please wait.' }
});

const adminActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests, please slow down.' }
});

// Pre-SMS / Pre-Auth phone ban check (active when Firebase Admin SDK is configured)
app.post('/api/auth/check-ban', banCheckLimiter, async (req: Request, res: Response) => {
  const rawPhone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const digits = rawPhone.replace(/\D/g, '');
  const normalized =
    digits.startsWith('20') && digits.length === 12
      ? digits.slice(1)
      : digits.startsWith('0020') && digits.length === 14
      ? digits.slice(3)
      : digits;

  if (normalized.length < 8 || normalized.length > 20) {
    res.status(400).json({ error: 'Invalid phone number' });
    return;
  }

  if (!adminDb) {
    res.json({ configured: false, banned: false });
    return;
  }

  try {
    const snap = await adminDb.collection('bannedPhones').doc(normalized).get();
    if (!snap.exists) {
      res.json({ configured: true, banned: false });
      return;
    }
    // This endpoint is public (it runs before sign-in), so it never returns the ban reason.
    const ban = snap.data() as {
      isPermanent?: boolean;
      banUntilMs?: number;
    };
    const now = Date.now();
    const active = Boolean(ban.isPermanent) || Boolean(ban.banUntilMs && now < ban.banUntilMs);
    res.json({
      configured: true,
      banned: active,
      isPermanent: active && Boolean(ban.isPermanent),
      banUntilMs: active ? ban.banUntilMs || 0 : 0
    });
  } catch (err) {
    console.warn('Pre-auth ban lookup warning:', err);
    res.json({ configured: true, banned: false });
  }
});

const BATCH_LIMIT = 400;

// Removes or anonymizes everything a deleted user left behind, so no name/phone/address survives.
// Ads and analytics are deleted; reviews keep their rating but lose the author; orders are kept
// (providers and admins need them for settlement) with the customer's personal fields blanked.
async function cleanupUserData(db: Firestore, uid: string): Promise<void> {
  const applyInChunks = async (
    docs: QueryDocumentSnapshot[],
    apply: (batch: WriteBatch, snap: QueryDocumentSnapshot) => void
  ): Promise<void> => {
    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = db.batch();
      for (const snap of docs.slice(i, i + BATCH_LIMIT)) apply(batch, snap);
      await batch.commit();
    }
  };

  for (const name of ['ads', 'analyticsEvents']) {
    const snap = await db.collection(name).where('ownerId', '==', uid).get();
    await applyInChunks(snap.docs, (batch, d) => batch.delete(d.ref));
  }

  const reviews = await db.collection('reviews').where('ownerId', '==', uid).get();
  await applyInChunks(reviews.docs, (batch, d) =>
    batch.update(d.ref, { author: 'deleted-user', neighborhood: FieldValue.delete() })
  );

  // Placeholder phone is 3 chars because firestore.rules requires customerPhone.size() >= 3.
  const bookings = await db.collection('bookings').where('ownerId', '==', uid).get();
  await applyInChunks(bookings.docs, (batch, d) =>
    batch.update(d.ref, {
      customerName: 'deleted-user',
      customerPhone: '---',
      address: FieldValue.delete(),
      notes: FieldValue.delete(),
      instaPaySender: FieldValue.delete(),
      instaPayCustomerRef: FieldValue.delete()
    })
  );
}

// Full Account Deletion via Firebase Admin SDK (deletes Auth account + Firestore user/provider/cart docs + cleans up user data)
app.post(
  '/api/admin/delete-user',
  adminActionLimiter,
  requireFirebaseAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const targetUid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : '';
    if (!targetUid || !/^[a-zA-Z0-9_-]{1,128}$/.test(targetUid)) {
      res.status(400).json({ ok: false, error: 'Valid target user uid is required' });
      return;
    }

    if (req.authUser?.uid === targetUid) {
      res.status(400).json({ ok: false, error: 'Cannot delete the active admin account' });
      return;
    }

    if (!adminAuth || !adminDb) {
      res.status(501).json({
        ok: false,
        authDeleted: false,
        reason: 'ADMIN_SDK_UNCONFIGURED',
        error: adminSdkIssue || 'Firebase Admin SDK is not configured on the server.'
      });
      return;
    }

    try {
      const callerAdminSnap = await adminDb
        .collection('admins')
        .doc(req.authUser!.uid)
        .get();
      if (!callerAdminSnap.exists) {
        res.status(403).json({ ok: false, error: 'Admin privileges required' });
        return;
      }

      const targetAdminSnap = await adminDb.collection('admins').doc(targetUid).get();
      if (targetAdminSnap.exists) {
        res.status(400).json({ ok: false, error: 'Cannot delete an admin account' });
        return;
      }

      let authDeleted = false;
      try {
        await adminAuth.deleteUser(targetUid);
        authDeleted = true;
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/user-not-found') {
          authDeleted = true;
        } else {
          throw err;
        }
      }

      await Promise.allSettled([
        adminDb.collection('users').doc(targetUid).delete(),
        adminDb.collection('providers').doc(targetUid).delete(),
        adminDb.collection('carts').doc(targetUid).delete()
      ]);

      let dataCleaned = true;
      try {
        await cleanupUserData(adminDb, targetUid);
      } catch (err) {
        dataCleaned = false;
        console.error('Admin delete user: data cleanup failed:', err);
      }

      res.json({ ok: true, authDeleted, dataCleaned });
    } catch (err) {
      console.error('Admin delete user error:', err);
      res.status(500).json({
        ok: false,
        authDeleted: false,
        error: 'Failed to delete user account on server'
      });
    }
  }
);

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Village Service Hub server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
