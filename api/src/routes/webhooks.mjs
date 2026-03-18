import { Router } from 'express';
import crypto from 'crypto';
import {
  handlePROpened,
  handlePRSynchronized,
  handlePRMerged,
  handlePRClosed,
} from '../services/github-agent.mjs';

const router = Router();

// In-memory deduplication: track last 1000 delivery IDs
const recentDeliveries = new Set();
const deliveryQueue = [];
const MAX_DELIVERIES = 1000;

function trackDelivery(deliveryId) {
  if (recentDeliveries.has(deliveryId)) return false; // duplicate
  recentDeliveries.add(deliveryId);
  deliveryQueue.push(deliveryId);
  if (deliveryQueue.length > MAX_DELIVERIES) {
    const oldest = deliveryQueue.shift();
    recentDeliveries.delete(oldest);
  }
  return true; // new
}

// ---------------------------------------------------------------------------
// POST /api/webhooks/github
// ---------------------------------------------------------------------------
router.post('/github', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];

  // Verify webhook secret — MUST be configured, reject all if missing
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] GITHUB_WEBHOOK_SECRET not configured, rejecting request');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  {
    if (!signature) {
      console.warn('[webhook] Missing X-Hub-Signature-256 header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      console.warn('[webhook] Invalid HMAC signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // Deduplicate
  if (deliveryId && !trackDelivery(deliveryId)) {
    console.log(`[webhook] Duplicate delivery ${deliveryId}, skipping`);
    return res.status(200).json({ status: 'duplicate' });
  }

  // Parse body (it arrives as raw Buffer from express.raw())
  let payload;
  try {
    payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
  } catch (err) {
    console.error('[webhook] Failed to parse body:', err.message);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Return 200 immediately, process async
  res.status(200).json({ status: 'accepted', event, delivery: deliveryId });

  // Route to handler
  try {
    if (event === 'pull_request') {
      const action = payload.action;
      const merged = payload.pull_request?.merged;

      console.log(`[webhook] pull_request.${action} #${payload.pull_request?.number} (merged=${merged})`);

      if (action === 'opened') {
        await handlePROpened(payload);
      } else if (action === 'synchronize') {
        await handlePRSynchronized(payload);
      } else if (action === 'closed' && merged) {
        await handlePRMerged(payload);
      } else if (action === 'closed' && !merged) {
        await handlePRClosed(payload);
      } else {
        console.log(`[webhook] Ignoring pull_request.${action}`);
      }
    } else if (event === 'ping') {
      console.log('[webhook] Ping received, webhook configured correctly');
    } else {
      console.log(`[webhook] Ignoring event: ${event}`);
    }
  } catch (err) {
    console.error(`[webhook] Handler error for ${event}: ${err.message}`);
  }
});

export default router;
