import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from './firebase';

export async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth, provider); }
  catch (e: any) {
    if (e?.code === 'auth/popup-blocked') await signInWithRedirect(auth, provider);
    else throw e;
  }
}
