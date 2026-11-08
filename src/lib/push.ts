import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from './firebase';
import { api } from './api';
export async function enablePush(): Promise<string> {
  if (!(await isSupported())) return 'This device does not support notifications.';
  if ((await Notification.requestPermission()) !== 'granted') return 'Notifications are blocked. Allow them in browser settings.';
  const q = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js?' + q);
  const token = await getToken(getMessaging(app), { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: reg });
  await api('POST', '/api/devices', { token });
  return 'Notifications are on.';
}
