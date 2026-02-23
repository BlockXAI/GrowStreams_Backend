import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// POST - Like/unlike content
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, contentId } = await request.json();

    if (!walletAddress || !contentId) {
      return NextResponse.json(
        { success: false, error: 'Wallet address and content ID are required' },
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

    // Check if like exists
    const existingLike = await query(
      'SELECT id FROM likes WHERE user_id = $1 AND content_id = $2',
      [userId, contentId]
    );

    let action = '';
    if (existingLike.rows.length > 0) {
      // Unlike - remove the like
      await query(
        'DELETE FROM likes WHERE user_id = $1 AND content_id = $2',
        [userId, contentId]
      );
      action = 'unliked';
    } else {
      // Like - add the like
      await query(
        'INSERT INTO likes (user_id, content_id) VALUES ($1, $2)',
        [userId, contentId]
      );
      action = 'liked';
    }

    // Get updated like count
    const likeCount = await query(
      'SELECT COUNT(*) as count FROM likes WHERE content_id = $1',
      [contentId]
    );

    return NextResponse.json({
      success: true,
      action,
      likeCount: parseInt(likeCount.rows[0].count),
    });

  } catch (error) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// GET - Check if user liked content and get like count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get like count
    const likeCount = await query(
      'SELECT COUNT(*) as count FROM likes WHERE content_id = $1',
      [contentId]
    );

    let isLiked = false;
    if (walletAddress) {
      const user = await query(
        'SELECT id FROM users WHERE wallet_address = $1',
        [walletAddress]
      );
      
      if (user.rows.length > 0) {
        const userLike = await query(
          'SELECT id FROM likes WHERE user_id = $1 AND content_id = $2',
          [user.rows[0].id, contentId]
        );
        isLiked = userLike.rows.length > 0;
      }
    }

    return NextResponse.json({
      success: true,
      likeCount: parseInt(likeCount.rows[0].count),
      isLiked,
    });

  } catch (error) {
    console.error('Failed to get like status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get like status' },
      { status: 500 }
    );
  }
}