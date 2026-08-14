import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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
// Request basic OpenID/email scopes so we can verify which Google account
// the access token belongs to. This ensures the OAuth token is explicitly
// tied to a Google account email that we can compare against Firebase email.
provider.addScope('openid');
provider.addScope('email');
provider.addScope('profile');
// Request explicit consent and include granted scopes so the Drive browse UI works when required.
provider.setCustomParameters({
  prompt: 'select_account',
  include_granted_scopes: 'true',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedAccessTokenUid: string | null = null;
let cachedGoogleUser: { email?: string; sub?: string } | null = null;

// Development-safe cleanup: remove legacy persisted token key if present
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem('google_sheets_token');
    } catch (e) {
      // ignore
    }
  }
} catch (e) {}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Ensure getRedirectResult is processed exactly once and avoid race with onAuthStateChanged.
  let redirectProcessing = true;
  let pendingUser: User | null = null;
  let authStateFired = false;

  getRedirectResult(auth)
    .then(async (result) => {
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
        // Attempt to verify token ownership via Google userinfo before binding.
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.ok ? r.json() : null).catch(() => null);

          if (info && info.email && result.user && result.user.email && info.email.toLowerCase() === String(result.user.email).toLowerCase()) {
            cachedAccessToken = token;
            cachedAccessTokenUid = result.user?.uid ?? null;
            cachedGoogleUser = { email: info.email, sub: info.sub };
            // Do NOT persist the token to localStorage. The app will be notified via onAuthSuccess.
          } else {
            // Token does not belong to the same Google account as the Firebase user.
            cachedAccessToken = null;
            cachedAccessTokenUid = null;
            cachedGoogleUser = null;
            try {
              // eslint-disable-next-line no-console
              console.info('Google auth redirect result: token owner mismatch', {
                firebaseUid: result.user?.uid,
                firebaseEmail: result.user?.email,
                tokenGoogleEmail: info?.email ?? null,
              });
            } catch (e) {}
          }
        } catch (e) {
          // If verification fails, do not bind the token.
          cachedAccessToken = null;
          cachedAccessTokenUid = null;
          cachedGoogleUser = null;
        }
      }

      // Notify success if we have both a Firebase user in the result and an access token
      if (result.user && onAuthSuccess) {
        try {
          // Diagnostics (do not log tokens)
          // eslint-disable-next-line no-console
          console.info('Google auth redirect result', {
            firebaseUid: result.user.uid,
            firebaseEmail: result.user.email,
            providerId: 'google.com',
            hasGoogleAccessToken: Boolean(cachedAccessToken),
            tokenOwnerUid: cachedAccessTokenUid,
            tokenGoogleEmail: cachedGoogleUser?.email ?? null,
          });
        } catch (e) {}
        onAuthSuccess(result.user, cachedAccessToken ?? '');
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
      if (authStateFired) {
        if (pendingUser) {
          if (cachedAccessToken && onAuthSuccess) {
            try {
              // Diagnostics (do not log tokens)
              // eslint-disable-next-line no-console
              console.info('Google auth state', {
                firebaseUid: pendingUser.uid,
                firebaseEmail: pendingUser.email,
                providerId: 'google.com',
                hasGoogleAccessToken: Boolean(cachedAccessToken),
                tokenOwnerUid: cachedAccessTokenUid,
              });
            } catch (e) {}
            onAuthSuccess(pendingUser, cachedAccessToken);
          } else if (onAuthSuccess) {
            onAuthSuccess(pendingUser, '');
          }
        } else {
          cachedAccessToken = null;
          cachedAccessTokenUid = null;
          if (onAuthFailure) {
            onAuthFailure();
          }
        }
      }
    });

  return onAuthStateChanged(auth, (user: User | null) => {
    authStateFired = true;
    pendingUser = user;

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
      // The user IS Firebase-authenticated, but Google API authorization is pending.
      // Report success with an empty token so the app knows the user is signed in
      // and can show the Google connect/reauthorize flow as needed.
      if (onAuthSuccess) {
        onAuthSuccess(user, '');
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
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken ?? '';

    // Verify the token belongs to the same Google account as the Firebase user
    try {
      const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.ok ? r.json() : null).catch(() => null);

      if (info && info.email && result.user && result.user.email && info.email.toLowerCase() === String(result.user.email).toLowerCase()) {
        cachedAccessToken = token;
        cachedAccessTokenUid = result.user?.uid ?? null;
        cachedGoogleUser = { email: info.email, sub: info.sub };
        return { user: result.user, accessToken: token };
      }

      // Ownership mismatch; do not bind token for this session
      cachedAccessToken = null;
      cachedAccessTokenUid = null;
      cachedGoogleUser = null;
      throw new Error(`Google account mismatch: OAuth token belongs to ${info?.email ?? 'an unknown account'}, which does not match Firebase user ${result.user?.email}`);
    } catch (e) {
      if (e instanceof Error) throw e;
      throw new Error('Failed to verify Google account ownership for the OAuth token.');
    }
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
  cachedAccessTokenUid = null;
  cachedGoogleUser = null;
  // Clear any pending redirect connection markers
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('pending_connect');
      } catch (e) {}
    }
  } catch (e) {}
};

export const getAccessToken = (): string | null => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    return null;
  }

  if (!cachedAccessToken || cachedAccessTokenUid !== currentUser.uid) {
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    return null;
  }

  // Ensure the Google OAuth token actually belongs to the same Google account
  // as the currently signed-in Firebase user. If we do not have a verified
  // Google user object, or the emails do not match, clear the cache.
  if (!cachedGoogleUser || !cachedGoogleUser.email || String(cachedGoogleUser.email).toLowerCase() !== String(currentUser.email).toLowerCase()) {
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    cachedGoogleUser = null;
    return null;
  }

  return cachedAccessToken;
};

export const setAccessTokenManual = (token: string): void => {
  cachedAccessToken = token;
  cachedAccessTokenUid = auth.currentUser?.uid ?? null;
};

export const getGoogleUser = (): { email?: string; sub?: string } | null => cachedGoogleUser;

export const clearGoogleAuthState = (): void => {
  cachedAccessToken = null;
  cachedAccessTokenUid = null;
  cachedGoogleUser = null;
};

export const verifyAndSetAccessToken = async (token: string): Promise<void> => {
  // For manual tokens: verify userinfo and only bind if email matches Firebase user
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No signed-in Firebase user to bind token to');

  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.ok ? r.json() : null).catch(() => null);

  if (!info || !info.email) throw new Error('Unable to verify token: Google userinfo not available for this token');

  if (String(info.email).toLowerCase() !== String(currentUser.email).toLowerCase()) {
    // Do not bind token and provide clear error
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    cachedGoogleUser = null;
    throw new Error(`Google account mismatch. You are signed into Dcode Sales as ${currentUser.email}, but Google access was authorised for ${info.email}. Please sign out and reconnect using the same Google account.`);
  }

  // Bind token in-memory
  cachedAccessToken = token;
  cachedAccessTokenUid = currentUser.uid;
  cachedGoogleUser = { email: info.email, sub: info.sub };
};

/**
 * Assert that the currently cached OAuth token belongs to the current Firebase user.
 * Throws on any mismatch. Returns the verified token and Google userinfo.
 */
export const assertGoogleAccountOwnership = async (): Promise<{ token: string; googleUser: { email: string; sub: string } }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No signed-in Firebase user');

  const token = getAccessToken();
  if (!token) throw new Error('No verified Google OAuth token available for the current user');

  // Verify token via userinfo endpoint
  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.ok ? r.json() : null).catch(() => null);

  if (!info || !info.email || !info.sub) {
    // token invalid or unable to verify
    // clear cached token to avoid further misuse
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    cachedGoogleUser = null;
    throw new Error('Failed to verify Google OAuth token with userinfo');
  }

  if (String(info.email).toLowerCase() !== String(currentUser.email).toLowerCase()) {
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    cachedGoogleUser = null;
    throw new Error('Google account email does not match signed-in Firebase user');
  }

  if (cachedAccessTokenUid !== currentUser.uid) {
    cachedAccessToken = null;
    cachedAccessTokenUid = null;
    cachedGoogleUser = null;
    throw new Error('OAuth token is not bound to the current Firebase user');
  }

  // Update cachedGoogleUser with verified info
  cachedGoogleUser = { email: info.email, sub: info.sub };

  return { token, googleUser: { email: info.email, sub: info.sub } };
};
