import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  // signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Persist auth state in local storage so session survives hard refreshes
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // ignore persistence errors in environments that do not support it
  });
} catch (e) {
  // ignore
}

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
// Request explicit consent and include granted scopes so Drive permissions are granted.
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
  include_granted_scopes: 'true',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Process redirect result if present (for signInWithRedirect flow)
  getRedirectResult(auth)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result as any);
      const token = credential?.accessToken;
      if (token) {
        cachedAccessToken = token;
        try {
          localStorage.setItem('google_sheets_token', token);
        } catch (e) {}
        // If a pending_connect was saved before redirect, process it
        try {
          const pending = localStorage.getItem('pending_connect');
          if (pending) {
            const p = JSON.parse(pending);
            // store a flag so the app can pick this up and call the connector
            localStorage.setItem('pending_connect_processed', JSON.stringify({ ...p, token }));
            localStorage.removeItem('pending_connect');
          }
        } catch (e) {}
        if (result?.user && onAuthSuccess) {
          onAuthSuccess(result.user as User, token);
        }
      }
    })
    .catch(() => {
      // ignore redirect result errors here; onAuthStateChanged will handle auth state
    });

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      // Log for diagnostics
      try {
        // eslint-disable-next-line no-console
        console.info('initAuth: onAuthStateChanged: user present', { uid: user.uid });
      } catch (e) {}
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      } else {
        // If user exists but we don't have OAuth access token yet, try to extract redirect result again
        try {
          getRedirectResult(auth)
            .then((result) => {
              const credential = GoogleAuthProvider.credentialFromResult(result as any);
              const token = credential?.accessToken;
              if (token) {
                cachedAccessToken = token;
                try {
                  localStorage.setItem('google_sheets_token', token);
                } catch (e) {}
                if (onAuthSuccess) onAuthSuccess(user, token);
              }
            })
            .catch(() => {
              // ignore
            });
        } catch (e) {}
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
    // Use redirect flow to avoid popup/COOP issues in some browsers / deployments
    await signInWithRedirect(auth, provider);
    // The redirect will leave the page; result will be processed on app load via getRedirectResult
    return null;
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
    // Google returns access_denied when OAuth consent verification blocks the app
    if (error?.message && String(error.message).includes('access_denied')) {
      throw new Error('Google verification required: this app has not completed OAuth verification. Please contact the site administrator.');
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
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const stored = localStorage.getItem('google_sheets_token');
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export const setAccessTokenManual = (token: string): void => {
  cachedAccessToken = token;
  try {
    localStorage.setItem('google_sheets_token', token);
  } catch (e) {}
};
