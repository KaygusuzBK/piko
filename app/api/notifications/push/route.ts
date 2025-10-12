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

    // OneSignal REST API endpoint
    const oneSignalAppId = process.env.ONESIGNAL_APP_ID
    const oneSignalApiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!oneSignalAppId || !oneSignalApiKey) {
      return NextResponse.json(
        { error: 'OneSignal configuration missing' },
        { status: 500 }
      )
    }

    // Get user's OneSignal player ID from our database
    const subscriptions = await notificationRepository.getPushSubscriptions(userId)
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'User has no push subscriptions' },
        { status: 404 }
      )
    }

    // Extract OneSignal player IDs from our custom endpoint format
    const playerIds = subscriptions
      .filter(sub => sub.endpoint.startsWith('onesignal:'))
      .map(sub => sub.endpoint.replace('onesignal:', ''))

    if (playerIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid OneSignal subscriptions found' },
        { status: 404 }
      )
    }

    // Send notification via OneSignal REST API
    const notificationPayload = {
      app_id: oneSignalAppId,
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      url: url || '/',
      chrome_web_icon: icon || '/soc-ai_logo.png',
      chrome_web_badge: '/soc-ai_logo.png',
      priority: 10,
      ttl: 3600, // 1 hour
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OneSignal API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to send push notification' },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Push notification sent successfully:', result.id)

    return NextResponse.json({
      success: true,
      notificationId: result.id,
      recipients: result.recipients,
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
    message: 'Push notification endpoint is working',
    timestamp: new Date().toISOString(),
  })
}