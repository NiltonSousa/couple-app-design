import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../design-system/components/Card';
import { Button } from '../../../design-system/components/Button';
import { LoadingState } from '../../../shared/components/AsyncState';
import { ApiError } from '../../../shared/lib/apiClient';
import { loginWithGoogle } from '../data/authRepository';
import { readAndClearGoogleFlow } from '../data/googleFlowStorage';
import { useAuth } from '../hooks/authContext';
import styles from './LoginPage.module.css';

/**
 * Landing point for Google's redirect. Reads the authorization code from
 * the query string, pairs it with the verifier stashed before the redirect,
 * and hands both to the backend — which is the only party that ever sees
 * the client secret. Runs once per mount; StrictMode's double-invoke is
 * guarded by a ref since redeeming a code twice would fail the second time.
 */
export function GoogleCallbackPage() {
  const { entrarComSessao } = useAuth();
  const [searchParams] = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);
  const [destino, setDestino] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get('code');
    const googleError = searchParams.get('error');
    const flow = readAndClearGoogleFlow();

    if (googleError) {
      setErro('Login com Google cancelado.');
      return;
    }
    if (!code || !flow) {
      setErro('Não foi possível completar o login com Google. Tente novamente.');
      return;
    }

    loginWithGoogle(code, flow.verifier)
      .then(({ token, ...dados }) => {
        entrarComSessao(token, { user: dados.user, couple: dados.couple });
        setDestino(flow.returnTo);
      })
      .catch((cause: unknown) => {
        setErro(
          cause instanceof ApiError ? cause.message : 'Não foi possível entrar com Google.',
        );
      });
  }, [searchParams, entrarComSessao]);

  if (destino) {
    return <Navigate to={destino} replace />;
  }

  if (erro) {
    return (
      <main className={styles.page}>
        <Card className={styles.card}>
          <div className={styles.errorSlot} role="alert" aria-live="assertive">
            <span className={styles.errorText}>{erro}</span>
          </div>
          <Button variant="primary" onClick={() => window.location.assign('/login')}>
            Voltar para o login
          </Button>
        </Card>
      </main>
    );
  }

  return <LoadingState label="Entrando com Google..." />;
}
