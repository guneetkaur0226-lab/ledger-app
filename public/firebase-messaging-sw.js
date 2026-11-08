importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
const p = new URL(self.location).searchParams;
firebase.initializeApp({ apiKey: p.get('apiKey'), projectId: p.get('projectId'), messagingSenderId: p.get('messagingSenderId'), appId: p.get('appId') });
firebase.messaging(); // shows notification payloads automatically while the app is in the background
