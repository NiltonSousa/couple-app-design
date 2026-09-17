import { useState, type FormEvent } from 'react';
import { Button } from '../../../design-system/components/Button';
import { InputField, SelectField, TextareaField } from '../../../design-system/components/Field';
import { RadioPillGroup } from '../../../design-system/components/RadioPillGroup';
import { CATEGORIAS, DIVISOES, PESSOAS } from '../lib/types';
import type { Categoria, Divisao, NovoGasto, Pessoa } from '../lib/types';
import styles from './GastoForm.module.css';

interface GastoFormProps {
  onSubmit: (novo: NovoGasto) => Promise<void>;
  onCancel: () => void;
}

export function GastoForm({ onSubmit, onCancel }: GastoFormProps) {
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('outros');
  const [data, setData] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [pagoPor, setPagoPor] = useState<Pessoa>('nilton');
  const [divisao, setDivisao] = useState<Divisao>('50-50');
  const [abaterNoSaldo, setAbaterNoSaldo] = useState(true);
  const [parcelado, setParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState('2');
  const [parcelasPagas, setParcelasPagas] = useState('0');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valor = Number(valorTotal.replace(',', '.'));
    if (!descricao.trim() || !data || !(valor > 0)) return;

    setSubmitting(true);
    try {
      await onSubmit({
        descricao: descricao.trim(),
        categoria,
        data,
        valorTotal: valor,
        pagoPor,
        divisao,
        abaterNoSaldo: divisao === 'emprestimo' ? abaterNoSaldo : null,
        parcelado,
        totalParcelas: parcelado ? Number(totalParcelas) : null,
        parcelasPagas: parcelado ? Number(parcelasPagas) : null,
        valorParcela: parcelado ? valor / Number(totalParcelas || 1) : null,
        observacao: observacao.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
          onChange={(e) => setCategoria(e.target.value as Categoria)}
        >
          {CATEGORIAS.map((c) => (
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
        inputMode="decimal"
        placeholder="R$ 0,00"
        value={valorTotal}
        onChange={(e) => setValorTotal(e.target.value)}
        required
      />

      <RadioPillGroup
        legend="Quem pagou"
        name="pagoPor"
        options={PESSOAS}
        value={pagoPor}
        onChange={setPagoPor}
      />

      <RadioPillGroup
        legend="Divisão"
        name="divisao"
        options={DIVISOES}
        value={divisao}
        onChange={setDivisao}
      />

      {divisao === 'emprestimo' && (
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
