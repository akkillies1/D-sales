import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  connectAuthEmulator,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Connect to the Firebase Auth emulator when running locally during development.
// Control via VITE_USE_FIREBASE_EMULATOR=true in your .env for explicit opt-in.
try {
  const useEmulator = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_USE_FIREBASE_EMULATOR === 'true')
    || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

  if (useEmulator) {
    // Emulator URL is the default for the Firebase CLI: http://localhost:9099
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    // eslint-disable-next-line no-console
    console.info('Connected Firebase Auth to emulator at http://localhost:9099');
  }
} catch (e) {
  // ignore if connectAuthEmulator is not available or fails
}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn && onAuthFailure) {
        cachedAccessToken = null;
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Failed to get access token from Google sign-in. Please ensure third-party popups are allowed.'
      );
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
      throw new Error('Sign-in popup was closed before completing authentication. Please click "Sign in with Google" to try again.');
    }
    if (error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked')) {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups and try again.');
    }
    if (error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in request was cancelled.');
    }
    if (error?.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase. You can paste an OAuth token manually below.');
    }
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessTokenManual = (token: string): void => {
  cachedAccessToken = token;
};
