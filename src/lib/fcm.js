import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

// You can find this VAPID key in Firebase Console > Project Settings > Cloud Messaging > Web configuration
const VAPID_KEY = "AdrTqXHzuCiAMX81wjRb13VGICXHJap9_aaEwuY1k6dGILM9ZL0k9bEo6z_MINP_qnLeqpuq5cBbKqyyK3zaa4hkwu1ttVhPygcpbuIIDZVHT7spwBCwnS1_3o2YC1mSf91avgGX9UXfAjW0i_CYdR3NUA"; 


export const requestNotificationPermission = async (userId) => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token generated');
        // Store it in Firestore under the user's profile to send targeted notifications
        await setDoc(doc(db, "users", userId), {
          fcmToken: currentToken
        }, { merge: true });
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
  return null;
};
