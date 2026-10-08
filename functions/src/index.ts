import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore, FieldValue, type WriteResult } from 'firebase-admin/firestore';
import {
  IMAGE_DATA_URL_PATTERN,
  clampMark,
  extractJsonText,
  validateInput,
  type StudentInput,
  type ValidationError,
} from './validation';
import { buildSystemInstruction, buildUserMessage } from './prompt';
import { deriveTier, findBlockingSubscription, type SubscriptionDoc } from './subscriptions';

initializeApp();

// ---------------------------------------------------------------------------
// Rate-limit constants
// ---------------------------------------------------------------------------
const FREE_TIER_LIMIT = 10;
const PAID_TIER_LIMIT = 500;
const RESET_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Gemini model — override with the GEMINI_MODEL env var (functions/.env) when
// Google retires a model, without a code change.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const ALLOWED_ORIGINS = [
  'https://imagecaptioner-464205.web.app',
  'https://reportrelief.app',
  'https://www.reportrelief.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// ---------------------------------------------------------------------------
// Cloud Functions
// ---------------------------------------------------------------------------

export const generateReport = onRequest(
  {
    // CORS is handled manually below so the same allow-list applies to
    // preflight and real requests (including localhost for development).
    secrets: ['GEMINI_API_KEY'],
  },
  async (req, res) => {
    const origin = req.get('Origin');

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }

    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authHeader = req.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    let decoded: DecodedIdToken;
    try {
      // checkRevoked: tokens of deleted/disabled accounts stop working immediately.
      decoded = await getAuth().verifyIdToken(token, true);
    } catch {
      res.status(401).json({ error: 'Invalid auth token' });
      return;
    }

    // Validate BEFORE touching the quota, so malformed requests don't consume it.
    let input: StudentInput;
    try {
      input = validateInput(req.body);
    } catch (validationErr) {
      const err = validationErr as ValidationError;
      res.status(err.statusCode ?? 400).json({ error: err.message ?? 'Invalid request.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('GEMINI_API_KEY secret is not configured.');
      res
        .status(500)
        .json({ error: "We're experiencing technical difficulties. Please try again later." });
      return;
    }

    const uid = decoded.uid;
    const userRef = getFirestore().doc(`users/${uid}`);
    const now = Date.now();

    let limitResult: { allowed: boolean; tier: string; reason?: string };
    try {
      limitResult = await getFirestore().runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.exists ? (snap.data() ?? {}) : {};
        const tier: string = data.tier ?? 'free';
        const lastReset: number = data.last_reset_date ?? 0;
        const generationCount: number = data.generation_count ?? 0;

        const needsReset = !lastReset || now - lastReset >= RESET_WINDOW_MS;
        const effectiveLimit = tier === 'paid' ? PAID_TIER_LIMIT : FREE_TIER_LIMIT;

        if (needsReset) {
          tx.set(userRef, { generation_count: 1, last_reset_date: now }, { merge: true });
          return { allowed: true, tier };
        }
        if (generationCount >= effectiveLimit) {
          const reason = tier === 'paid' ? 'paid_limit' : 'free_limit';
          return { allowed: false, tier, reason };
        }
        tx.set(userRef, { generation_count: generationCount + 1 }, { merge: true });
        return { allowed: true, tier };
      });
    } catch (error) {
      logger.error('Quota transaction failed:', error);
      res.status(500).json({
        error: "We're experiencing technical difficulties. Please try again in a few moments.",
      });
      return;
    }

    if (!limitResult.allowed) {
      const reason =
        limitResult.reason === 'paid_limit'
          ? 'Monthly generation limit reached on your Pro plan. Limit resets next month.'
          : `Free tier limit reached (${FREE_TIER_LIMIT}/month). Please upgrade to Pro to continue.`;
      res.status(429).json({ error: reason });
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const promptParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> =
        [{ text: buildUserMessage(input) }];

      if (input.imageEvidence) {
        const [, mimeType, data] = IMAGE_DATA_URL_PATTERN.exec(input.imageEvidence) ?? [];
        if (mimeType && data) {
          promptParts.push({ inlineData: { mimeType, data } });
        }
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: { parts: promptParts },
        config: {
          systemInstruction: buildSystemInstruction(input),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mark: { type: Type.NUMBER },
              reportText: { type: Type.STRING },
              actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['mark', 'reportText', 'actionPlan'],
          },
        },
      });

      const result = JSON.parse(extractJsonText(response.text) || '{}') as {
        mark?: number;
        reportText?: string;
        actionPlan?: string[];
      };

      const reportText = typeof result.reportText === 'string' ? result.reportText.trim() : '';
      if (!reportText) throw new Error('Model returned an empty report.');

      res.status(200).json({
        mark: input.targetMark !== undefined ? clampMark(input.targetMark) : clampMark(result.mark),
        reportText,
        actionPlan:
          input.includeActionPlan && Array.isArray(result.actionPlan)
            ? result.actionPlan.filter((s) => typeof s === 'string').slice(0, 5)
            : [],
      });
    } catch (error) {
      // Full details stay in the server logs only.
      logger.error('Gemini Error:', error);

      // The generation failed, so give the user their quota back.
      await userRef
        .update({ generation_count: FieldValue.increment(-1) })
        .catch((refundErr) => logger.error('Quota refund failed:', refundErr));

      const rawMessage = error instanceof Error ? error.message : String(error);
      const status = (error as { status?: number })?.status;
      if (rawMessage.includes('blocked from using Gemini API') || status === 403) {
        logger.error(
          'ACTION REQUIRED: Gemini API key rejected — rotate GEMINI_API_KEY and redeploy.'
        );
      }

      res.status(502).json({
        error: "We're experiencing technical difficulties. Please try again in a few moments.",
      });
    }
  }
);

// Recomputes the user's tier from ALL of their subscriptions, so an update to
// an old cancelled subscription can't downgrade a user with an active one.
export const syncSubscriptionTier = onDocumentWritten(
  'users/{uid}/subscriptions/{subscriptionId}',
  async (event) => {
    const uid = event.params.uid;

    // A deleted account can still get a final Stripe webhook (e.g. a subscription
    // that was set to cancel at period end). Don't recreate data for it.
    const userExists = await getAuth()
      .getUser(uid)
      .then(
        () => true,
        () => false
      );
    if (!userExists) {
      await event.data?.after?.ref.delete().catch(() => undefined);
      return;
    }

    const userRef = getFirestore().doc(`users/${uid}`);
    const subs = await userRef.collection('subscriptions').get();
    const tier = deriveTier(
      subs.docs.map((d) => d.get('status') as string | undefined),
      event.data?.after?.get('status') as string | undefined
    );

    await userRef.set(tier, { merge: true });
  }
);

// ---------------------------------------------------------------------------
// Account deletion (GDPR right to erasure)
// ---------------------------------------------------------------------------
const RECENT_SIGN_IN_MS = 5 * 60 * 1000;

/**
 * Permanently deletes the caller's account: every report, the profile, Stripe
 * mirror documents (checkout sessions, subscriptions, payments) and the Auth user.
 * Stripe's own payment records are kept by Stripe, as the privacy policy states.
 *
 * Requires a sign-in within the last 5 minutes (the client re-authenticates first)
 * and refuses while a subscription would keep billing.
 */
export const deleteAccount = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please sign in to delete your account.');
  }

  const uid = request.auth.uid;
  const authTimeMs = Number(request.auth.token.auth_time) * 1000;
  if (!authTimeMs || Date.now() - authTimeMs > RECENT_SIGN_IN_MS) {
    throw new HttpsError(
      'failed-precondition',
      'For your security, please sign in again before deleting your account.',
      { reason: 'recent-sign-in-required' }
    );
  }

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);

  const subs = await userRef.collection('subscriptions').get();
  if (findBlockingSubscription(subs.docs.map((d) => d.data() as SubscriptionDoc))) {
    throw new HttpsError(
      'failed-precondition',
      'You still have an active Pro subscription. Open "Manage Subscription", cancel it, then try again.',
      { reason: 'active-subscription' }
    );
  }

  // Revoke first so no new requests (e.g. report generation) can recreate data
  // while we delete.
  await getAuth().revokeRefreshTokens(uid);

  await db.recursiveDelete(userRef);
  // Legacy location written by older app versions.
  await db.recursiveDelete(db.doc(`customers/${uid}`));

  await getAuth()
    .deleteUser(uid)
    .catch((err: { code?: string }) => {
      if (err?.code !== 'auth/user-not-found') throw err;
    });

  logger.info('Account deleted', { uid });
  return { deleted: true };
});

export const purgeDeletedReports = onSchedule('every 24 hours', async () => {
  const db = getFirestore();
  const now = Date.now();
  const snapshot = await db.collectionGroup('reports').where('deleteAfter', '<=', now).get();

  if (snapshot.empty) return;

  const batches: Promise<WriteResult[]>[] = [];
  let batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    count += 1;
    if (count % 450 === 0) {
      batches.push(batch.commit());
      batch = db.batch();
    }
  });

  batches.push(batch.commit());
  await Promise.all(batches);
  logger.info(`Purged ${count} expired reports.`);
});
