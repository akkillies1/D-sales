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
// Request explicit consent and include granted scopes using least-privilege:
// - spreadsheets: required for reading/writing Google Sheets via Sheets API
// - drive.metadata.readonly: required only for listing spreadsheet files in the user's Drive (browse UI)
// We avoid broader drive scopes (drive.file, drive.readonly) unless the app later needs them.
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
// Request explicit consent and include granted scopes so the Drive browse UI works when required.
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
  // Ensure getRedirectResult is processed exactly once and avoid race with onAuthStateChanged.
  let redirectProcessing = true;

  getRedirectResult(auth)
    .then((result) => {
      // result is null if this is not a redirect from Google auth (e.g., normal page load or returning from logout)
      if (!result) {
        try {
          // eslint-disable-next-line no-console
          console.info('initAuth: getRedirectResult returned null (not a redirect)');
        } catch (e) {}
        return;
      }

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken ?? null;
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
      }

      // Notify success if we have both a Firebase user in the result and an access token
      if (result.user && token && onAuthSuccess) {
        onAuthSuccess(result.user, token);
      }
    })
    .catch((err) => {
      // Log redirect result errors for debugging in dev only
      try {
        // eslint-disable-next-line no-console
        console.info('initAuth: getRedirectResult error', err && err.message ? err.message : err);
      } catch (e) {}
    })
    .finally(() => {
      redirectProcessing = false;
    });

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      // Log for diagnostics (do not print tokens)
      try {
        // eslint-disable-next-line no-console
        console.info('initAuth: onAuthStateChanged: user present', { uid: user.uid });
      } catch (e) {}

      // If we already have a cached access token, report success immediately
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
        return;
      }

      // If redirect processing is still in-flight, wait for it to finish instead of
      // assuming the user is unauthenticated. This avoids a race where onAuthStateChanged
      // fires before getRedirectResult has populated the OAuth access token.
      if (redirectProcessing) {
        // still waiting for redirect result; do nothing now
        return;
      }

      // Redirect processing finished and we do not have an OAuth access token.
      // Call onAuthFailure so the app can show the connector flow, but this does
      // NOT mean the Firebase user is signed out.
      if (onAuthFailure) {
        onAuthFailure();
      }
    } else {
      // No Firebase user -> fully unauthenticated
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
    // Google returns access_denied when the user denies consent or when
    // the OAuth consent/verification prevents scopes from being granted.
    if (error?.message && String(error.message).includes('access_denied')) {
      throw new Error('OAuth access denied: the user or Google blocked requested permissions. Ensure the OAuth consent screen includes this user (test user) or that the app has been verified for requested scopes.');
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
