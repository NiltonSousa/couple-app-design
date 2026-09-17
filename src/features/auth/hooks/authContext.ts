import { createContext, useContext } from 'react';
import type { Sessao } from '../lib/types';

/**
 * 'checking' — a stored token is being revalidated against /auth/me on boot.
 * 'anonymous' — no valid session; the app shows the login screen.
 * 'authenticated' — `sessao` is populated.
 */
export type AuthStatus = 'checking' | 'anonymous' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  sessao: Sessao | null;
  /** Set when the boot revalidation failed for a reason other than 401. */
  error: string | null;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
  /** Retries the boot revalidation after a network failure. */
  revalidar: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return value;
}
