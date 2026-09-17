import { Link } from 'react-router-dom';
import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { Pill } from '../../../design-system/components/Pill';
import { StatCard } from '../../../design-system/components/StatCard';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { useGastos } from '../hooks/useGastos';
import { computeSaldo } from '../lib/saldo';
import { formatSaldoLabel, saldoTone } from '../lib/formatSaldo';
import { CATEGORIAS } from '../lib/types';
import styles from './PainelPage.module.css';

export function PainelPage() {
  const { status, gastos, error } = useGastos();

  if (status === 'loading') {
    return (
      <AppShell topbar={<Topbar eyebrow="PAINEL DE CUSTOS" title="Resumo do casal" />}>
        <LoadingState label="Carregando resumo..." />
      </AppShell>
    );
  }

  if (status === 'error') {
    return (
      <AppShell topbar={<Topbar eyebrow="PAINEL DE CUSTOS" title="Resumo do casal" />}>
        <ErrorState message={error ?? 'Algo deu errado.'} />
      </AppShell>
    );
  }

  const saldo = computeSaldo(gastos);
  const totalDoMes = gastos.reduce((sum, g) => sum + g.valorTotal, 0);
  const pendentes = gastos.filter((g) => g.status === 'pendente');
  const ultimosLancamentos = [...gastos]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  const porCategoria = CATEGORIAS.map((cat) => ({
    label: cat.label,
    total: gastos
      .filter((g) => g.categoria === cat.value)
      .reduce((sum, g) => sum + g.valorTotal, 0),
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
                <Pill tone={saldoTone(saldo)}>{formatSaldoLabel(saldo)}</Pill>
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
            value={formatSaldoLabel(saldo)}
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
                <span>{g.descricao}</span>
                <span className={styles.rowValue}>{formatCurrency(g.valorTotal)}</span>
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
