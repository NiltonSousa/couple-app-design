import { Link } from 'react-router-dom';
import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { Pill } from '../../../design-system/components/Pill';
import { StatCard } from '../../../design-system/components/StatCard';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { useCasal } from '../hooks/useCasal';
import { useGastos } from '../hooks/useGastos';
import { useSaldo } from '../hooks/useSaldo';
import { formatSaldoLabel, saldoTone } from '../lib/formatSaldo';
import { CATEGORIES } from '../lib/types';
import styles from './PainelPage.module.css';

export function PainelPage() {
  const { status, gastos, error, recarregar } = useGastos();
  const {
    status: saldoStatus,
    summary,
    error: saldoError,
    recarregar: recarregarSaldo,
  } = useSaldo();
  const { labelDe } = useCasal();

  // The two requests go out in parallel; the screen only renders once both
  // have answered, since the saldo pill sits alongside the totals.
  const recarregarTudo = () => {
    recarregar();
    recarregarSaldo();
  };

  if (status === 'loading' || saldoStatus === 'loading') {
    return (
      <AppShell topbar={<Topbar eyebrow="PAINEL DE CUSTOS" title="Resumo do casal" />}>
        <LoadingState label="Carregando resumo..." />
      </AppShell>
    );
  }

  if (status === 'error' || saldoStatus === 'error' || !summary) {
    return (
      <AppShell topbar={<Topbar eyebrow="PAINEL DE CUSTOS" title="Resumo do casal" />}>
        <ErrorState message={error ?? saldoError ?? 'Algo deu errado.'} onRetry={recarregarTudo} />
      </AppShell>
    );
  }

  const saldo = summary.balance;
  const totalDoMes = gastos.reduce((sum, g) => sum + g.totalAmount, 0);
  const pendentes = gastos.filter((g) => g.status === 'pending');
  const ultimosLancamentos = [...gastos]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const porCategoria = CATEGORIES.map((cat) => ({
    label: cat.label,
    total: gastos
      .filter((g) => g.category === cat.value)
      .reduce((sum, g) => sum + g.totalAmount, 0),
  })).filter((c) => c.total > 0);

  return (
    <AppShell
      topbar={
        <Topbar
          eyebrow="PAINEL DE CUSTOS"
          title="Resumo do casal"
          actions={
            <>
              <Link to="/saldo" className={styles.pillLink}>
                <Pill tone={saldoTone(saldo)}>{formatSaldoLabel(saldo, labelDe)}</Pill>
              </Link>
              <Link to="/lancar-gasto">
                <Button variant="primary">+ Novo gasto</Button>
              </Link>
            </>
          }
        />
      }
    >
      <div className={styles.statsRow}>
        <StatCard label="Total lançado este mês" value={formatCurrency(totalDoMes)} />
        <Link to="/saldo" className={styles.statLink}>
          <StatCard
            label="Saldo entre vocês"
            value={formatSaldoLabel(saldo, labelDe)}
            tone={saldoTone(saldo) === 'danger' ? 'danger' : 'default'}
          />
        </Link>
        <StatCard label="Lançamentos pendentes" value={String(pendentes.length)} />
      </div>

      <div className={styles.contentRow}>
        <Card>
          <h2 className={styles.cardTitle}>Últimos lançamentos</h2>
          {ultimosLancamentos.length === 0 ? (
            <EmptyState>Nenhum gasto lançado ainda.</EmptyState>
          ) : (
            ultimosLancamentos.map((g) => (
              <div key={g.id} className={styles.row}>
                <span>{g.description}</span>
                <span className={styles.rowValue}>{formatCurrency(g.totalAmount)}</span>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2 className={styles.cardTitle}>Por categoria</h2>
          {porCategoria.length === 0 ? (
            <EmptyState>Nenhum gasto lançado ainda.</EmptyState>
          ) : (
            porCategoria.map((c) => (
              <div key={c.label} className={styles.row}>
                <span>{c.label}</span>
                <span className={styles.rowValue}>{formatCurrency(c.total)}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </AppShell>
  );
}
