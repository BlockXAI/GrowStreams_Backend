import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET - Fetch comments for content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const result = await query(`
      SELECT 
        c.*,
        u.wallet_address,
        u.handle,
        u.display_name,
        u.avatar_url,
        u.verified
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.content_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [contentId, limit, offset]);

    const comments = result.rows.map(row => ({
      id: row.id,
      text: row.comment_text,
      createdAt: row.created_at,
      user: {
        walletAddress: row.wallet_address,
        handle: row.handle,
        displayName: row.display_name,
        avatar: row.avatar_url || '/placeholder-avatar.png',
        verified: row.verified,
      }
    }));

    // Get total comment count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM comments WHERE content_id = $1',
      [contentId]
    );

    return NextResponse.json({
      success: true,
      comments,
      total: parseInt(countResult.rows[0].count),
    });

  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add comment to content
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contentId, text } = await request.json();

    if (!walletAddress || !contentId || !text?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Wallet address, content ID, and comment text are required' },
        { status: 400 }
      );
    }

    if (text.trim().length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment must be under 500 characters' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    let userId;
    if (user.rows.length === 0) {
      const newUser = await query(
        'INSERT INTO users (wallet_address, handle) VALUES ($1, $2) RETURNING id',
        [walletAddress, `@${walletAddress.slice(0, 8)}`]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = user.rows[0].id;
    }

    // Add comment
    const result = await query(`
      INSERT INTO comments (user_id, content_id, comment_text) 
      VALUES ($1, $2, $3) 
      RETURNING id, comment_text, created_at
    `, [userId, contentId, text.trim()]);

    // Get user info for response
    const userInfo = await query(
      'SELECT wallet_address, handle, display_name, avatar_url, verified FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      id: result.rows[0].id,
      text: result.rows[0].comment_text,
      createdAt: result.rows[0].created_at,
      user: {
        walletAddress: userInfo.rows[0].wallet_address,
        handle: userInfo.rows[0].handle,
        displayName: userInfo.rows[0].display_name,
        avatar: userInfo.rows[0].avatar_url || '/placeholder-avatar.png',
        verified: userInfo.rows[0].verified,
      }
    };

    return NextResponse.json({
      success: true,
      comment,
    });

  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}