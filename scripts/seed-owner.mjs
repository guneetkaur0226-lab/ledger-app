// Creates the one Owner account. Run once: npm run seed
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
const id = process.env.OWNER_LOGIN.trim().toLowerCase();
const email = id.includes('@') ? id : `${id}@ledger.invalid`;
const user = await getAuth(app).createUser({ email, password: process.env.OWNER_PASSWORD, displayName: process.env.OWNER_NAME });
await getAuth(app).setCustomUserClaims(user.uid, { role: 'owner' });
await getFirestore(app).doc(`users/${user.uid}`).set({
  name: process.env.OWNER_NAME, loginId: id, role: 'owner', active: true, createdAt: FieldValue.serverTimestamp(),
});
console.log(`Owner created. Sign in with "${id}".`);
