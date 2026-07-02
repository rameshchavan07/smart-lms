import api from '../services/api';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) return;
  if (!('PushManager' in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered for push notifications');

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const { data: publicVapidKey } = await api.get('/notifications/vapid-public-key');
      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // Send subscription to backend
    await api.post('/notifications/subscribe', subscription);
    console.log('Push notification subscription saved');
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
};
