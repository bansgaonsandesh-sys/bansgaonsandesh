import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// This will be called when a new post is created
export async function POST(request: NextRequest) {
  try {
    const { postId, userId, title, cityName } = await request.json();

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the post author's name
    const { data: authorData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const authorName = authorData?.name || 'Someone';

    // Get all active FCM tokens except the post author
    const { data: tokens, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .neq('id', userId)
      .not('fcm_token', 'is', null);

    if (error || !tokens || tokens.length === 0) {
      return NextResponse.json(
        { message: 'No tokens to send notifications to' },
        { status: 200 }
      );
    }

    // Prepare notification payload
    const notificationTitle = `${authorName} posted in ${cityName}`;
    const notificationBody = title || 'Check out this new post!';
    const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bansgaonsandesh.com'}/post/${postId}`;

    // Send notifications using Firebase Admin SDK
    // Note: You'll need to set up Firebase Admin SDK server-side
    const fcmTokens = tokens.map(t => t.fcm_token).filter(Boolean) as string[];
    
    // For now, we'll use the Firebase Cloud Messaging API directly
    const results = await Promise.allSettled(
      fcmTokens.map(token => sendFCMNotification(token, {
        title: notificationTitle,
        body: notificationBody,
        url: postUrl,
        postId
      }))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: fcmTokens.length
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

// Helper function to send FCM notification
async function sendFCMNotification(token: string, data: {
  title: string;
  body: string;
  url: string;
  postId: string;
}) {
  const serverKey = process.env.FIREBASE_SERVER_KEY;
  
  if (!serverKey) {
    console.warn('FIREBASE_SERVER_KEY not set in environment variables');
    return;
  }

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${serverKey}`
    },
    body: JSON.stringify({
      to: token,
      notification: {
        title: data.title,
        body: data.body,
        icon: '/icon-192x192.png',
        click_action: data.url
      },
      data: {
        url: data.url,
        postId: data.postId
      }
    })
  });

  if (!response.ok) {
    throw new Error(`FCM API error: ${response.statusText}`);
  }

  return response.json();
}
