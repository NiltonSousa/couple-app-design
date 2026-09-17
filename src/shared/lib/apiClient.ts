/**
 * Single entry point for talking to the Nós Dois API.
 *
 * Two things every call site relies on:
 * - the bearer token is attached here, so no feature module handles it;
 * - a 401 is turned into `UnauthorizedError` AND broadcast via
 *   `onUnauthorized`, so an expired token ends in a redirect to the login
 *   screen instead of a generic error state in whichever screen happened to
 *   be mounted.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

/** Error body shape from the backend (`httpapi.ErrorBody`). */
interface ApiErrorBody {
  error: string;
  field?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error;
    this.field = body.field;
  }
}

/** Thrown whenever the API answers 401 — the token is missing, invalid or expired. */
export class UnauthorizedError extends ApiError {
  constructor(body: ApiErrorBody) {
    super(401, body);
    this.name = 'UnauthorizedError';
  }
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/**
 * Subscribe to 401s. The auth provider uses this to drop the session; keeping
 * it as a subscription (rather than importing the provider here) keeps the
 * transport layer free of React.
 */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

let tokenProvider: () => string | null = () => null;

/** Installed once by the auth provider; the client never stores the token itself. */
export function setTokenProvider(provider: () => string | null): void {
  tokenProvider = provider;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | undefined>;
  /** Login is the only unauthenticated route. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const parsed = (await response.json()) as Partial<ApiErrorBody>;
    if (parsed && typeof parsed.message === 'string') {
      return { error: parsed.error ?? 'unknown_error', message: parsed.message, field: parsed.field };
    }
  } catch {
    // Falls through to the generic body below.
  }
  return { error: 'unknown_error', message: `A requisição falhou (HTTP ${response.status}).` };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, signal } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, {
      error: 'network_error',
      message: 'Não foi possível falar com o servidor. Verifique sua conexão.',
    });
  }

  if (response.status === 401) {
    const errorBody = await parseErrorBody(response);
    for (const listener of unauthorizedListeners) listener();
    throw new UnauthorizedError(errorBody);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T;
  }

  return (await response.json()) as T;
}
