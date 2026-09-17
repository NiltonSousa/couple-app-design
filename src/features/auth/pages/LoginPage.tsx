import { useId, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { InputField } from '../../../design-system/components/Field';
import { ApiError } from '../../../shared/lib/apiClient';
import { useAuth } from '../hooks/authContext';
import styles from './LoginPage.module.css';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { status, entrar } = useAuth();
  const location = useLocation();
  const errorId = useId();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (status === 'authenticated') {
    const destino = (location.state as LocationState | null)?.from ?? '/';
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviando) return;

    setErro(null);
    setEnviando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (cause) {
      setErro(
        cause instanceof ApiError ? cause.message : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            ND
          </span>
          <span className={styles.brandName}>Nós Dois</span>
        </div>

        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.subtitle}>Use seu email e senha para acessar o painel do casal.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/*
            The error lives in an aria-live region rather than being signalled
            by colour alone, and the inputs point at it via aria-describedby so
            a screen reader reaches it from the field that failed.
          */}
          <div className={styles.errorSlot} role="alert" aria-live="assertive" id={errorId}>
            {erro && <span className={styles.errorText}>{erro}</span>}
          </div>

          <InputField
            label="Email"
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? errorId : undefined}
            required
            autoFocus
          />

          <InputField
            label="Senha"
            id="login-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? errorId : undefined}
            required
          />

          <Button type="submit" variant="primary" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
