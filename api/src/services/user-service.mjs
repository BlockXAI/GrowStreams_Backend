import crypto from 'crypto';
import { query, queryOne, queryAll } from './db.mjs';

/**
 * Generate a unique 8-character referral code.
 * Format: GS-XXXXXX (alphanumeric, uppercase)
 */
export function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let code = 'GS-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  return code;
}

/**
 * Create a new user. Generates a unique referral code.
 * Optionally links to a referrer via referral_code.
 */
export async function createUser(wallet, github_handle, x_handle, referral_code_used = null) {
  if (!wallet) throw new Error('wallet is required');

  // Check if user already exists
  const existing = await queryOne(`SELECT * FROM users WHERE wallet = $1`, [wallet]);
  if (existing) {
    const err = new Error('User already registered with this wallet');
    err.status = 409;
    err.user = existing;
    throw err;
  }

  // Resolve referrer if a referral code was provided
  let referrerId = null;
  if (referral_code_used) {
    const referrer = await queryOne(
      `SELECT id FROM users WHERE referral_code = $1`,
      [referral_code_used.toUpperCase()]
    );
    if (!referrer) {
      const err = new Error('Invalid referral code');
      err.status = 400;
      throw err;
    }
    referrerId = referrer.id;
  }

  // Generate a unique referral code for the new user
  let newCode;
  let attempts = 0;
  while (attempts < 10) {
    newCode = generateReferralCode();
    const dup = await queryOne(`SELECT id FROM users WHERE referral_code = $1`, [newCode]);
    if (!dup) break;
    attempts++;
  }
  if (attempts >= 10) throw new Error('Failed to generate unique referral code');

  const display_name = github_handle || x_handle || wallet.slice(0, 12);

  const user = await queryOne(
    `INSERT INTO users (wallet, github_handle, x_handle, display_name, referral_code, referred_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [wallet, github_handle || null, x_handle || null, display_name, newCode, referrerId]
  );

  // If referred, create the referral record
  if (referrerId && user) {
    await queryOne(
      `INSERT INTO referrals (referrer_user_id, referred_user_id)
       VALUES ($1, $2)
       ON CONFLICT (referrer_user_id, referred_user_id) DO NOTHING
       RETURNING *`,
      [referrerId, user.id]
    );
    console.log(`[user] Referral recorded: ${referral_code_used} -> ${wallet}`);
  }

  console.log(`[user] Created user ${wallet} (code: ${newCode})`);
  return user;
}

/**
 * Get a user by wallet address.
 */
export async function getUserByWallet(wallet) {
  return queryOne(`SELECT * FROM users WHERE wallet = $1`, [wallet]);
}

/**
 * Get a user by their UUID.
 */
export async function getUserById(userId) {
  return queryOne(`SELECT * FROM users WHERE id = $1`, [userId]);
}

/**
 * Get a user by referral code.
 */
export async function getUserByReferralCode(code) {
  return queryOne(`SELECT * FROM users WHERE referral_code = $1`, [code.toUpperCase()]);
}

/**
 * Register a referral relationship.
 * Called when a new user signs up with a referral code.
 */
export async function registerReferral(referrerCode, newUserId) {
  const referrer = await queryOne(
    `SELECT id FROM users WHERE referral_code = $1`,
    [referrerCode.toUpperCase()]
  );
  if (!referrer) {
    const err = new Error('Invalid referral code');
    err.status = 400;
    throw err;
  }

  // Prevent self-referral
  if (referrer.id === newUserId) {
    const err = new Error('Cannot refer yourself');
    err.status = 400;
    throw err;
  }

  const ref = await queryOne(
    `INSERT INTO referrals (referrer_user_id, referred_user_id)
     VALUES ($1, $2)
     ON CONFLICT (referrer_user_id, referred_user_id) DO NOTHING
     RETURNING *`,
    [referrer.id, newUserId]
  );

  // Update the user's referred_by field
  await query(
    `UPDATE users SET referred_by = $1, updated_at = NOW() WHERE id = $2 AND referred_by IS NULL`,
    [referrer.id, newUserId]
  );

  return ref;
}

/**
 * Get all users referred by a given user.
 */
export async function getUserReferrals(userId) {
  const referrals = await queryAll(
    `SELECT u.id, u.wallet, u.github_handle, u.x_handle, u.display_name, u.created_at,
            r.created_at AS referred_at
     FROM referrals r
     JOIN users u ON u.id = r.referred_user_id
     WHERE r.referrer_user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return referrals;
}

/**
 * Get referral count for a user.
 */
export async function getReferralCount(userId) {
  const row = await queryOne(
    `SELECT COUNT(*) AS cnt FROM referrals WHERE referrer_user_id = $1`,
    [userId]
  );
  return parseInt(row?.cnt || '0', 10);
}

/**
 * Get user profile with referral stats, XP, and rank.
 */
export async function getUserProfile(wallet) {
  const user = await queryOne(`SELECT * FROM users WHERE wallet = $1`, [wallet]);
  if (!user) return null;

  const referralCount = await getReferralCount(user.id);

  // Get participant data (may not exist if not registered for campaign)
  const participant = await queryOne(
    `SELECT total_xp, track FROM participants WHERE wallet = $1`,
    [wallet]
  );

  // Calculate rank
  let rank = null;
  if (participant && participant.total_xp > 0) {
    const rankRow = await queryOne(
      `SELECT COUNT(*) + 1 AS rank FROM participants WHERE total_xp > $1`,
      [participant.total_xp]
    );
    rank = parseInt(rankRow?.rank || '0', 10);
  }

  return {
    user,
    referralCount,
    totalXP: participant?.total_xp || 0,
    track: participant?.track || null,
    rank,
  };
}
