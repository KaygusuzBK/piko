import { NextRequest, NextResponse } from 'next/server'
import { notificationRepository } from '@/lib/repositories/notificationRepository'

export async function POST(req: NextRequest) {
  try {
    const { userId, title, message, url, icon } = await req.json()

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    // Firebase FCM REST API endpoint
    const firebaseServerKey = process.env.FIREBASE_SERVER_KEY
    const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    if (!firebaseServerKey || !firebaseProjectId) {
      return NextResponse.json(
        { error: 'Firebase configuration missing' },
        { status: 500 }
      )
    }

    // Get user's FCM tokens from our database
    const subscriptions = await notificationRepository.getPushSubscriptions(userId)
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'User has no push subscriptions' },
        { status: 404 }
      )
    }

    // Extract FCM tokens
    const fcmTokens = subscriptions.map(sub => sub.endpoint)

    // Send notification via Firebase FCM REST API
    const notificationPayload = {
      registration_ids: fcmTokens,
      notification: {
        title: title,
        body: message,
        icon: icon || '/soc-ai_logo.png',
        badge: '/soc-ai_logo.png',
        click_action: url || '/',
        tag: 'soc-ai-notification'
      },
      data: {
        url: url || '/',
        timestamp: Date.now().toString(),
        userId: userId
      },
      webpush: {
        fcm_options: {
          link: url || '/'
        },
        notification: {
          icon: icon || '/soc-ai_logo.png',
          badge: '/soc-ai_logo.png',
          requireInteraction: false,
          silent: false
        }
      }
    }

    const response = await fetch(`https://fcm.googleapis.com/fcm/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${firebaseServerKey}`,
      },
      body: JSON.stringify(notificationPayload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Firebase FCM API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to send push notification' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Push notification sent successfully:', result)

    // Handle invalid tokens
    if (result.failure_count > 0) {
      const invalidTokens: string[] = []
      result.results.forEach((result: { error?: string }, index: number) => {
        if (result.error) {
          console.error(`Token ${fcmTokens[index]} failed:`, result.error)
          invalidTokens.push(fcmTokens[index])
        }
      })

      // Remove invalid tokens from database
      for (const token of invalidTokens) {
        await notificationRepository.deletePushSubscription(token, userId)
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result.multicast_id,
      successCount: result.success_count,
      failureCount: result.failure_count,
    })

  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Test endpoint for development
export async function GET() {
  return NextResponse.json({
    message: 'Firebase FCM push notification endpoint is working',
    timestamp: new Date().toISOString(),
  })
}