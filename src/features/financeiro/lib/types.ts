export type Pessoa = 'nilton' | 'damaris';

export type Categoria =
  | 'viagem'
  | 'presente'
  | 'alimentacao'
  | 'transporte'
  | 'outros';

export type Divisao = '50-50' | 'individual' | 'emprestimo';

export type StatusGasto = 'pendente' | 'quitado';

export interface Gasto {
  id: string;
  descricao: string;
  categoria: Categoria;
  data: string; // ISO 8601 (yyyy-mm-dd)
  valorTotal: number;
  pagoPor: Pessoa;
  divisao: Divisao;
  /** Only meaningful when divisao === 'emprestimo'. */
  abaterNoSaldo: boolean | null;
  status: StatusGasto;
  parcelado: boolean;
  totalParcelas: number | null;
  parcelasPagas: number | null;
  valorParcela: number | null;
  observacao: string;
}

export type NovoGasto = Omit<Gasto, 'id' | 'status'>;

export const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'viagem', label: 'Viagem' },
  { value: 'presente', label: 'Presente' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'outros', label: 'Outros' },
];

export const PESSOAS: { value: Pessoa; label: string }[] = [
  { value: 'nilton', label: 'Nilton' },
  { value: 'damaris', label: 'Damaris' },
];

export const DIVISOES: { value: Divisao; label: string }[] = [
  { value: '50-50', label: 'Dividir 50/50' },
  { value: 'individual', label: 'Individual' },
  { value: 'emprestimo', label: 'Empréstimo' },
];
