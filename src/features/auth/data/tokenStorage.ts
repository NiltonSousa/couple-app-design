/**
 * Token persistence.
 *
 * localStorage, deliberately: this is a two-person app with no third-party
 * scripts and no ad/analytics surface, so the XSS exposure that usually rules
 * localStorage out is small, while the practical gain is real — the session
 * survives a reload and a closed tab, and the backend issues no refresh token,
 * so an in-memory token would mean logging in again on every page load.
 *
 * If third-party scripts are ever added, move to an httpOnly cookie issued by
 * the backend; that is a backend change, not a frontend one.
 */
const TOKEN_KEY = 'nosDois.auth.token.v1';

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode / quota): the session still works for
    // this tab through the in-memory copy held by the auth provider.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to do — see writeToken.
  }
}
