importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB7qemx31vboXKguwrPP2rtp9YsNgkWFNk",
  authDomain: "smart-maintenance-494503.firebaseapp.com",
  projectId: "smart-maintenance-494503",
  storageBucket: "smart-maintenance-494503.firebasestorage.app",
  messagingSenderId: "812446110775",
  appId: "1:812446110775:web:55cf4badd4dc7c19829bb2",
  measurementId: "G-B34JEHQYYY"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Emergency Update';
  const notificationOptions = {
    body: payload.notification?.body || 'There is an update on your emergency request.',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
