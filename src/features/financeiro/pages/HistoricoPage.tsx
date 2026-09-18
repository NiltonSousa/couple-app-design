import { useMemo, useState } from 'react';
import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Card } from '../../../design-system/components/Card';
import { SelectField } from '../../../design-system/components/Field';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { GastoRow } from '../components/GastoRow';
import { useCasal } from '../hooks/useCasal';
import { useGastos } from '../hooks/useGastos';
import { CATEGORIES, FILTER_ALL } from '../lib/types';
import type { Category, ExpenseStatus, Person } from '../lib/types';
import styles from './HistoricoPage.module.css';

/**
 * Read-only record of every expense. Acting on one (quitar, pagar parcela,
 * pagar parte, reabrir) lives on the Pendências screen instead — this page
 * only lists and filters.
 */
export function HistoricoPage() {
  const { status, gastos, error, recarregar } = useGastos();
  const { membros, labelDe } = useCasal();
  const [categoria, setCategoria] = useState<Category | typeof FILTER_ALL>(FILTER_ALL);
  const [pagoPor, setPagoPor] = useState<Person | typeof FILTER_ALL>(FILTER_ALL);
  const [statusFiltro, setStatusFiltro] = useState<ExpenseStatus | typeof FILTER_ALL>(FILTER_ALL);

  const filtrados = useMemo(() => {
    return gastos
      .filter((g) => categoria === FILTER_ALL || g.category === categoria)
      .filter((g) => pagoPor === FILTER_ALL || g.paidBy === pagoPor)
      .filter((g) => statusFiltro === FILTER_ALL || g.status === statusFiltro)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [gastos, categoria, pagoPor, statusFiltro]);

  const totalFiltro = filtrados.reduce((sum, g) => sum + g.totalAmount, 0);
  const pendenteFiltro = filtrados
    .filter((g) => g.status === 'pending' || g.status === 'partial_paid')
    .reduce((sum, g) => sum + g.totalAmount, 0);

  return (
    <AppShell topbar={<Topbar eyebrow="EXTRATO" title="Histórico de gastos" />}>
      <Card className={styles.filters}>
        <SelectField
          label="Categoria"
          id="filtro-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Category | typeof FILTER_ALL)}
        >
          <option value={FILTER_ALL}>Todas</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Pago por"
          id="filtro-pagopor"
          value={pagoPor}
          onChange={(e) => setPagoPor(e.target.value as Person | typeof FILTER_ALL)}
        >
          <option value={FILTER_ALL}>Todos</option>
          {membros.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          id="filtro-status"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as ExpenseStatus | typeof FILTER_ALL)}
        >
          <option value={FILTER_ALL}>Todos</option>
          <option value="pending">Pendente</option>
          <option value="partial_paid">Parcial</option>
          <option value="settled">Quitado</option>
        </SelectField>
      </Card>

      <Card className={styles.tableCard}>
        {status === 'loading' && <LoadingState label="Carregando histórico..." />}
        {status === 'error' && (
          <ErrorState message={error ?? 'Algo deu errado.'} onRetry={recarregar} />
        )}
        {status === 'empty' && (
          <EmptyState>Nenhum gasto lançado ainda. Comece em "Lançar gasto".</EmptyState>
        )}
        {status === 'ready' && filtrados.length === 0 && (
          <EmptyState>Nenhum gasto encontrado para esses filtros.</EmptyState>
        )}
        {status === 'ready' && filtrados.length > 0 && (
          <>
            <div className={styles.headerRow}>
              <span>DATA</span>
              <span>DESPESA</span>
              <span>CATEGORIA</span>
              <span>PAGO POR</span>
              <span>VALOR TOTAL</span>
              <span>FICA P/ CADA</span>
              <span>PARCELA</span>
              <span>STATUS</span>
            </div>
            {filtrados.map((g) => (
              <GastoRow key={g.id} gasto={g} labelDe={labelDe} />
            ))}
            <div className={styles.totalRow}>
              <span>Total no filtro</span>
              <span className={styles.totalValue}>{formatCurrency(totalFiltro)}</span>
              <span>Pendente: {formatCurrency(pendenteFiltro)}</span>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}
