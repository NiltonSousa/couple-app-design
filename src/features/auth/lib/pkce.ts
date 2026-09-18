/**
 * PKCE (RFC 7636) for the Google Authorization Code flow.
 *
 * The verifier is a random secret kept only in this browser tab; the
 * challenge (its SHA-256, base64url) is what Google sees in the authorize
 * request. Google requires the raw verifier back on the token exchange, so
 * whoever redeems the code must be the one who started the flow — even
 * though this exchange actually happens on our backend, not here.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
