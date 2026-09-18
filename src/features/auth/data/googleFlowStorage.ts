/**
 * Holds the PKCE verifier between the redirect to Google and the return to
 * /auth/google/callback. sessionStorage, not localStorage: this value is
 * only meaningful for the single in-flight login attempt in this tab, and
 * should not outlive it.
 */
const VERIFIER_KEY = 'nosDois.auth.google.verifier.v1';
const RETURN_TO_KEY = 'nosDois.auth.google.returnTo.v1';

export function writeGoogleFlow(verifier: string, returnTo: string): void {
  try {
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  } catch {
    // Storage unavailable: the callback will fail with a clear error instead
    // of silently losing the verifier.
  }
}

export function readAndClearGoogleFlow(): { verifier: string; returnTo: string } | null {
  try {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    const returnTo = sessionStorage.getItem(RETURN_TO_KEY) ?? '/';
    sessionStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return verifier ? { verifier, returnTo } : null;
  } catch {
    return null;
  }
}
