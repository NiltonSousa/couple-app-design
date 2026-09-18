import { deriveCodeChallenge, generateCodeVerifier } from './pkce';
import { writeGoogleFlow } from '../data/googleFlowStorage';

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * Starts the Google Authorization Code + PKCE flow: stashes a fresh verifier
 * for the callback to redeem, then sends the browser to Google's consent
 * screen. There is no return from this function — it navigates away.
 */
export async function startGoogleLogin(returnTo: string): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID não está configurado.');
  }

  const verifier = generateCodeVerifier();
  const challenge = await deriveCodeChallenge(verifier);
  writeGoogleFlow(verifier, returnTo);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  window.location.assign(`${GOOGLE_AUTHORIZE_URL}?${params.toString()}`);
}
