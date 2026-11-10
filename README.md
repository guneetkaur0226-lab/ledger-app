# Daily Ledger

Next.js web app (installable on phones) on Vercel + Firebase (Auth, Firestore, FCM).

- Sign-in is **Google only**. The owner is always `bakshistock@gmail.com`. Members can sign in only if the owner has added their Google email (Members tab). The owner can pause or remove a member any time.
- Reads are real-time (Firestore, locked by `firestore.rules`). All writes go through the API routes in `src/app/api`.
- Members: today's ledger only, add/read, no export/share, screen cover + watermark deterrents (see limits).
- Owner: everything, history, export, share to WhatsApp, no restrictions.

## A. Firebase setup (about 15 minutes)

1. Go to https://console.firebase.google.com > **Add project** (name it e.g. `daily-ledger`; Analytics not needed).
2. **Firestore database**: Build > Firestore Database > Create database > location **asia-south1 (Mumbai)** (cannot be changed later) > **Production mode** > Enable.
3. **Rules**: Firestore > Rules tab > replace everything with the contents of `firestore.rules` > Publish.
4. **Index**: Firestore > Indexes > **Single field** > Add exemption: Collection ID `transactions`, Field path `date`, then enable **Ascending** and **Descending** for both *Collection* and *Collection group* scopes > Save. (Needed for the History tab.)
5. **Google sign-in**: Build > Authentication > Get started > Sign-in method > **Google** > Enable, pick a support email > Save.
6. **Web app**: Project settings (gear) > General > Your apps > **</>** (Web) > register (no hosting). Copy `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`.
7. **Push key**: Project settings > Cloud Messaging > **Web Push certificates** > Generate key pair. Copy the key (this is the VAPID key).
8. **Service account**: Project settings > Service accounts > **Generate new private key** > download the JSON. Keep it secret; never commit it.

## B. Vercel environment variables

Vercel > your project > Settings > Environment Variables. Add each one for **Production, Preview and Development**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` from step 6 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` from step 6 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` from step 6 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` from step 6 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` from step 6 |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | key from step 7 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | the whole contents of the JSON file from step 8 |

Then **Deployments > Redeploy** (variables only apply to new builds).

After the first deploy, add your Vercel domain (e.g. `your-app.vercel.app`) in Firebase > Authentication > Settings > **Authorized domains**.

## C. First sign-in

Open the Vercel URL and sign in with `bakshistock@gmail.com`. The owner account is created automatically. Then add members in **Members** by their Google email.

## D. Put it on phones

Open the Vercel URL in Chrome on Android > menu > **Add to Home screen / Install app**. For a sideloadable APK of the same site, paste the URL into pwabuilder.com > Android.

## Limits to know
- **No web app can block the phone's screenshot or screen-recording button.** For anyone who is not the owner, the app instead:
  covers the screen when the page loses focus or a PrintScreen/print/save key is pressed, stamps their name and email across the screen,
  and disables copy, right-click and printing. Photos from another phone and some screenshots cannot be stopped; the watermark makes any leak traceable.
- True blocking needs a native Android shell (Android's FLAG_SECURE). Ask if you want that later.
- Export CSV / Print / Share are owner-only buttons in the app.
