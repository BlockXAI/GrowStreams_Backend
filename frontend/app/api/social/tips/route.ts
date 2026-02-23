import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET - Get tips for content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT 
        COUNT(*) as tip_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM tips 
      WHERE content_id = $1
    `, [contentId]);

    return NextResponse.json({
      success: true,
      tipCount: parseInt(result.rows[0].tip_count),
      totalAmount: parseFloat(result.rows[0].total_amount),
    });

  } catch (error) {
    console.error('Failed to fetch tips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}

// POST - Send tip
export async function POST(request: NextRequest) {
  try {
    const { 
      fromWalletAddress, 
      contentId, 
      amount, 
      currency = 'CAMP',
      transactionHash 
    } = await request.json();

    if (!fromWalletAddress || !contentId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'From wallet, content ID, and positive amount are required' },
        { status: 400 }
      );
    }

    // Get content and its owner
    const content = await query(
      'SELECT user_id FROM minted_content WHERE id = $1',
      [contentId]
    );

    if (content.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    const toUserId = content.rows[0].user_id;

    // Get or create sender
    let fromUser = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [fromWalletAddress]
    );

    let fromUserId;
    if (fromUser.rows.length === 0) {
      const newUser = await query(
        'INSERT INTO users (wallet_address, handle) VALUES ($1, $2) RETURNING id',
        [fromWalletAddress, `@${fromWalletAddress.slice(0, 8)}`]
      );
      fromUserId = newUser.rows[0].id;
    } else {
      fromUserId = fromUser.rows[0].id;
    }

    // Record the tip
    const result = await query(`
      INSERT INTO tips (from_user_id, to_user_id, content_id, amount, currency, transaction_hash) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, amount, created_at
    `, [fromUserId, toUserId, contentId, amount, currency, transactionHash]);

    // Update recipient's total earnings
    await query(
      'UPDATE users SET total_earnings = total_earnings + $1 WHERE id = $2',
      [amount, toUserId]
    );

    return NextResponse.json({
      success: true,
      tip: {
        id: result.rows[0].id,
        amount: parseFloat(result.rows[0].amount),
        currency,
        createdAt: result.rows[0].created_at,
      },
    });

  } catch (error) {
    console.error('Failed to send tip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send tip' },
      { status: 500 }
    );
  }
}