import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '../../../design-system/components/Button';
import { ApiError } from '../../../shared/lib/apiClient';
import { InputField, SelectField, TextareaField } from '../../../design-system/components/Field';
import { RadioPillGroup } from '../../../design-system/components/RadioPillGroup';
import { centsFromDigits, centsToReais, formatCurrency, removeLastDigit } from '../../../shared/lib/currency';
import { CATEGORIES, SPLITS } from '../lib/types';
import type { Category, NewExpense, Person, Split } from '../lib/types';
import type { MembroCasal } from '../hooks/useCasal';
import styles from './GastoForm.module.css';

interface GastoFormProps {
  /** Couple members from the session — the options for "quem pagou". */
  membros: MembroCasal[];
  /** Slug of the logged-in user, used as the default payer. */
  euSlug: Person;
  onSubmit: (novo: NewExpense) => Promise<void>;
  onCancel: () => void;
}

export function GastoForm({ membros, euSlug, onSubmit, onCancel }: GastoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<Category>('others');
  const [data, setData] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [pagoPor, setPagoPor] = useState<Person>(euSlug);
  const [divisao, setDivisao] = useState<Split>('50-50');
  const [abaterNoSaldo, setAbaterNoSaldo] = useState(true);
  const [parcelado, setParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState('2');
  const [parcelasPagas, setParcelasPagas] = useState('0');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function handleValorKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      setValorCentavos((cents) => centsFromDigits(cents, e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setValorCentavos(removeLastDigit);
    } else if (
      !['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(e.key) &&
      !(e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valor = centsToReais(valorCentavos);
    if (!descricao.trim() || !data || !(valor > 0)) {
      setErro('Preencha descrição, data e um valor maior que zero.');
      return;
    }

    setErro(null);
    setSubmitting(true);
    try {
      await onSubmit({
        description: descricao.trim(),
        category: categoria,
        date: data,
        totalAmount: valor,
        paidBy: pagoPor,
        split: divisao,
        countsTowardBalance: divisao === 'loan' ? abaterNoSaldo : null,
        isInstallment: parcelado,
        totalInstallments: parcelado ? Number(totalParcelas) : null,
        paidInstallments: parcelado ? Number(parcelasPagas) : null,
        installmentAmount: parcelado ? valor / Number(totalParcelas || 1) : null,
        partialAmountPaid: null,
        observation: observacao.trim(),
      });
    } catch (cause) {
      setErro(
        cause instanceof ApiError ? cause.message : 'Não foi possível salvar o gasto.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.errorSlot} role="alert" aria-live="assertive">
        {erro && <span className={styles.errorText}>{erro}</span>}
      </div>

      <InputField
        label="Despesa"
        id="descricao"
        placeholder="Ex.: Hotel Caraíva"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />

      <div className={styles.row2col}>
        <SelectField
          label="Categoria"
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Category)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Data"
          id="data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </div>

      <InputField
        label="Valor total"
        id="valorTotal"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={valorCentavos === 0 ? '' : formatCurrency(centsToReais(valorCentavos))}
        onChange={() => {}}
        onKeyDown={handleValorKeyDown}
        required
      />

      <RadioPillGroup
        legend="Quem pagou"
        name="pagoPor"
        options={membros}
        value={pagoPor}
        onChange={setPagoPor}
      />

      <RadioPillGroup
        legend="Divisão"
        name="divisao"
        options={SPLITS}
        value={divisao}
        onChange={setDivisao}
      />

      {divisao === 'loan' && (
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={abaterNoSaldo}
            onChange={(e) => setAbaterNoSaldo(e.target.checked)}
          />
          Abater no saldo agregado
        </label>
      )}

      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={parcelado} onChange={(e) => setParcelado(e.target.checked)} />
        Parcelado
      </label>

      {parcelado && (
        <div className={styles.row2col}>
          <InputField
            label="Total de parcelas"
            id="totalParcelas"
            type="number"
            min={2}
            value={totalParcelas}
            onChange={(e) => setTotalParcelas(e.target.value)}
          />
          <InputField
            label="Parcelas já pagas"
            id="parcelasPagas"
            type="number"
            min={0}
            value={parcelasPagas}
            onChange={(e) => setParcelasPagas(e.target.value)}
          />
        </div>
      )}

      <TextareaField
        label="Observação (opcional)"
        id="observacao"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
      />

      <div className={styles.footerButtons}>
        <Button type="submit" variant="primary" disabled={submitting}>
          Salvar gasto
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
