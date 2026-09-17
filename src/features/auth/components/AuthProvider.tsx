import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, onUnauthorized, setTokenProvider, UnauthorizedError } from '../../../shared/lib/apiClient';
import { fetchSessao, login } from '../data/authRepository';
import { clearToken, readToken, writeToken } from '../data/tokenStorage';
import { AuthContext, type AuthStatus, type AuthContextValue } from '../hooks/authContext';
import type { Sessao } from '../lib/types';

/**
 * Holds the only globally shared state in the app: who is logged in.
 *
 * Everything else (gastos, filters, form state) stays local to the screen that
 * uses it — this is lifted to the root only because the token is needed by
 * every request and the couple's slugs are needed by more than one screen.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (readToken() ? 'checking' : 'anonymous'));
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revalidacao, setRevalidacao] = useState(0);

  // The token lives in a ref so apiClient can read the current value
  // synchronously without re-installing the provider on every render.
  const tokenRef = useRef<string | null>(readToken());

  useEffect(() => {
    setTokenProvider(() => tokenRef.current);
  }, []);

  const sair = useCallback(() => {
    tokenRef.current = null;
    clearToken();
    setSessao(null);
    setError(null);
    setStatus('anonymous');
  }, []);

  // A 401 from any request (expired or revoked token) drops the session, which
  // makes RequireAuth send the user back to the login screen instead of
  // leaving the current screen stuck on a generic error.
  useEffect(() => onUnauthorized(sair), [sair]);

  // Boot: revalidate a stored token against /auth/me. This is also what
  // refreshes the couple slugs, so they are never stale from a previous login.
  useEffect(() => {
    if (!tokenRef.current) return;

    const controller = new AbortController();
    let active = true;

    setStatus('checking');
    setError(null);

    fetchSessao(controller.signal)
      .then((data) => {
        if (!active) return;
        setSessao(data);
        setStatus('authenticated');
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        // 401 already cleared the session through the onUnauthorized listener.
        if (cause instanceof UnauthorizedError) return;
        setError(
          cause instanceof ApiError ? cause.message : 'Não foi possível validar sua sessão.',
        );
        setStatus('anonymous');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [revalidacao]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { token, ...dados } = await login(email, senha);
    tokenRef.current = token;
    writeToken(token);
    setSessao({ user: dados.user, couple: dados.couple });
    setError(null);
    setStatus('authenticated');
  }, []);

  const revalidar = useCallback(() => {
    if (!tokenRef.current) {
      setStatus('anonymous');
      return;
    }
    setRevalidacao((n) => n + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, sessao, error, entrar, sair, revalidar }),
    [status, sessao, error, entrar, sair, revalidar],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
