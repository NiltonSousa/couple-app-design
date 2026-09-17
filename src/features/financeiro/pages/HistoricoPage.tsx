import { useMemo, useState } from 'react';
import { AppShell } from '../../../app/AppShell';
import { Topbar } from '../../../app/Topbar';
import { Card } from '../../../design-system/components/Card';
import { SelectField } from '../../../design-system/components/Field';
import { LoadingState, ErrorState, EmptyState } from '../../../shared/components/AsyncState';
import { formatCurrency } from '../../../shared/lib/currency';
import { GastoRow } from '../components/GastoRow';
import { useGastos } from '../hooks/useGastos';
import { CATEGORIAS, PESSOAS } from '../lib/types';
import type { Categoria, Pessoa, StatusGasto } from '../lib/types';
import styles from './HistoricoPage.module.css';

const ALL = 'todos';

export function HistoricoPage() {
  const { status, gastos, error, quitar, reabrir } = useGastos();
  const [categoria, setCategoria] = useState<Categoria | typeof ALL>(ALL);
  const [pagoPor, setPagoPor] = useState<Pessoa | typeof ALL>(ALL);
  const [statusFiltro, setStatusFiltro] = useState<StatusGasto | typeof ALL>(ALL);

  const filtrados = useMemo(() => {
    return gastos
      .filter((g) => categoria === ALL || g.categoria === categoria)
      .filter((g) => pagoPor === ALL || g.pagoPor === pagoPor)
      .filter((g) => statusFiltro === ALL || g.status === statusFiltro)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [gastos, categoria, pagoPor, statusFiltro]);

  const totalFiltro = filtrados.reduce((sum, g) => sum + g.valorTotal, 0);
  const pendenteFiltro = filtrados
    .filter((g) => g.status === 'pendente')
    .reduce((sum, g) => sum + g.valorTotal, 0);

  return (
    <AppShell topbar={<Topbar eyebrow="EXTRATO" title="Histórico de gastos" />}>
      <Card className={styles.filters}>
        <SelectField
          label="Categoria"
          id="filtro-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria | typeof ALL)}
        >
          <option value={ALL}>Todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Pago por"
          id="filtro-pagopor"
          value={pagoPor}
          onChange={(e) => setPagoPor(e.target.value as Pessoa | typeof ALL)}
        >
          <option value={ALL}>Todos</option>
          {PESSOAS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          id="filtro-status"
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusGasto | typeof ALL)}
        >
          <option value={ALL}>Todos</option>
          <option value="pendente">Pendente</option>
          <option value="quitado">Quitado</option>
        </SelectField>
      </Card>

      <Card className={styles.tableCard}>
        {status === 'loading' && <LoadingState label="Carregando histórico..." />}
        {status === 'error' && <ErrorState message={error ?? 'Algo deu errado.'} />}
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
              <span>STATUS</span>
              <span></span>
            </div>
            {filtrados.map((g) => (
              <GastoRow key={g.id} gasto={g} onQuitar={quitar} onReabrir={reabrir} />
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
