import { apiRequest } from '../../../shared/lib/apiClient';
import type { LoginResponse, Sessao } from '../lib/types';

/** POST /api/v1/auth/login — the only route that does not need a token. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

/**
 * GET /api/v1/auth/me — current user plus both couple members, with the
 * authoritative `paidBy` slugs. Called on boot to revalidate a stored token.
 */
export async function fetchSessao(signal?: AbortSignal): Promise<Sessao> {
  return apiRequest<Sessao>('/api/v1/auth/me', { signal });
}

/**
 * POST /api/v1/auth/google — trades the authorization code and PKCE
 * verifier from the redirect back from Google for a session, the same way
 * `login` trades an email/password pair.
 */
export async function loginWithGoogle(code: string, codeVerifier: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/v1/auth/google', {
    method: 'POST',
    body: { code, codeVerifier },
    auth: false,
  });
}
