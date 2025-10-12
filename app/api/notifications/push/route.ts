/**
 * Push Notification API Route
 * 
 * Sends web push notifications to subscribed users.
 * Requires VAPID keys to be configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { notificationRepository } from '@/lib/repositories/notificationRepository'
import { createClient } from '@/lib/supabase'

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@socai.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, notificationId, title, message, url } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    // Get user's push subscriptions
    const subscriptions = await notificationRepository.getPushSubscriptions(userId)

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No push subscriptions found for user' },
        { status: 200 }
      )
    }

    // Prepare push notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/soc-ai_logo.png',
      badge: '/soc-ai_logo.png',
      url: url || '/',
      notificationId: notificationId || null,
      tag: 'notification',
      requireInteraction: false
    })

    // Send push notification to all user's subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
        return { success: true, endpoint: sub.endpoint }
      } catch (error: unknown) {
        console.error('Error sending push notification:', error)
        const err = error as { statusCode?: number; message?: string }
        
        // If subscription is no longer valid, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await notificationRepository.deletePushSubscription(sub.endpoint, userId)
          console.log('Removed invalid subscription:', sub.endpoint)
        }
        
        return { success: false, endpoint: sub.endpoint, error: err.message || 'Unknown error' }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      message: `Push notifications sent to ${successCount}/${subscriptions.length} subscriptions`,
      results
    })
  } catch (error) {
    console.error('Error in push notification endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

