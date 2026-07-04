import webPush from 'web-push';
import prisma from '../config/db';

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('Generating temporary VAPID keys for Web Push. Set these in .env for production.');
  vapidKeys = webPush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
}

webPush.setVapidDetails(
  'mailto:support@smartlms.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export const getVapidPublicKey = () => {
  return vapidKeys.publicKey;
};

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const saveSubscription = async (userId: string, subscription: PushSubscriptionData) => {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    }
  });
};

export const sendNotification = async (userId: string, title: string, message: string) => {
  // 1. Save in-app notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message
    }
  });

  // 2. Send Web Push to all user's subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  const payload = JSON.stringify({
    title,
    body: message,
    icon: '/vite.svg',
    url: '/'
  });

  const pushPromises = subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        payload
      );
    } catch (error) {
      const err = error as any;
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.log('Subscription has expired or is no longer valid. Deleting...');
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error('Error sending push notification:', error);
      }
    }
  });

  await Promise.all(pushPromises);
  return notification;
};
