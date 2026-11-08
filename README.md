# Daily Ledger

Next.js (PWA) on Vercel · Firebase Auth + Firestore + FCM · packaged as an internal APK.

Reads are real-time (Firestore listeners, locked down by `firestore.rules`). Every write goes through the
Next.js API routes (`src/app/api`) using the Admin SDK, which enforce roles, "today only" for members,
the Online ⇒ IN rule, attendance lockout, auto-creating the day's ledger, and push notifications.

## 1. Firebase (once)
1. Create a project; set Firestore location to **asia-south1** (cannot be changed later).
2. Enable Authentication > Email/Password.
3. Add a Web app; copy its config into `.env.local` (see `.env.example`).
4. Project settings > Cloud Messaging > Web Push certificates > generate key pair; copy into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
5. Project settings > Service accounts > generate a key. Paste the JSON as one line into `FIREBASE_SERVICE_ACCOUNT_JSON`.
6. Deploy rules and indexes: `npx firebase-tools deploy --only firestore`.

## 2. Run locally
```
npm install
cp .env.example .env.local   # fill in values
npm run seed                 # creates the Owner (OWNER_LOGIN / OWNER_PASSWORD)
npm run dev
```
Sign in as the owner, then add members in the Members tab.

## 3. Deploy on Vercel
Import the repo, add every variable from `.env.example` (except the OWNER_* ones) under Project > Settings > Environment Variables, deploy.
Add the Vercel domain under Firebase > Authentication > Settings > Authorized domains.

## 4. Internal APK
Use PWABuilder.com (enter the Vercel URL > Android > generate) or Bubblewrap. This wraps the site as a Trusted Web Activity.
Host the generated `assetlinks.json` at `public/.well-known/assetlinks.json` so the app opens full screen.

## Notes
- Money is stored as integer paise. "Today" is always computed in IST.
- Login IDs without "@" are stored as `<id>@ledger.invalid` in Firebase Auth. No email is ever sent.
- Members absent today are rejected by the API and the rules, and skipped for notifications.
- History queries run across all ledgers via a collection-group index on `date` (in `firestore.indexes.json`).
