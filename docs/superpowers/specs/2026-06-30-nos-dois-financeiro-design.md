# Nós Dois — Módulo Financeiro (design)

## Contexto

App de organização do casal (Nilton & Damaris), cobrindo no longo prazo: financeiro, viagens, agenda compartilhada e metas. Esses são tratados como subprojetos independentes, cada um com seu próprio ciclo brainstorm → spec → plano. Este documento cobre **só o módulo Financeiro**, o primeiro a ser construído por ser a base dos demais (Metas depende dele).

Este redesenho começa do zero: não reaproveita o design HTML/CSS anterior ("Casal Finanças", em `open-design`), apenas usa o histórico como referência de que problema já existia.

## Nome e identidade

- **Nome do app:** Nós Dois.
- **Direção visual:** Calmo / Minimalista — fundo neutro suave, azul como cor de destaque (valores, ações primárias), cantos bem arredondados (16px+ em cards/inputs), respiro generoso entre elementos, tipografia sans-serif única. Tom acolhedor, não corporativo/utilitário.

## Uso e plataforma

- Uso equilibrado entre celular e desktop — design responsivo com peso igual às duas plataformas desde o início (não mobile-first).
- Registro de gasto é **completo no momento do lançamento** (formulário com categoria, parcelamento, observação etc.), não um atalho de 1-2 toques.

## Modelo de dado

Evolução do modelo anterior (`gasto`):

```
{
  id,
  descricao,
  categoria,          // viagem | presente | alimentacao | transporte | outros
  data,
  valorTotal,
  pagoPor,             // 'nilton' | 'damaris'
  divisao,              // '50-50' | 'individual' | 'emprestimo'
  abaterNoSaldo,        // boolean | null — só relevante quando divisao === 'emprestimo'
  status,                // 'pendente' | 'quitado' — por item, individualmente
  parcelado, totalParcelas, parcelasPagas, valorParcela,
  observacao
}
```

### Lógica de saldo

- O saldo entre vocês é **um único número agregado** (ex.: "Damaris deve R$ 120"), somando todos os lançamentos `divisao: '50-50'` pendentes (metade do valor) e `divisao: 'emprestimo'` pendentes com `abaterNoSaldo: true` (valor cheio).
- Cada lançamento que compõe esse saldo pode ser **quitado individualmente** — quitar um não afeta os demais. Isso permite deixar uma dívida pendente "em espera" enquanto outra é resolvida, sem forçar quitação total.
- `divisao: 'individual'` e `emprestimo` com `abaterNoSaldo: false` nunca entram no saldo agregado (ficam registrados, mas separados).

### Tipos de divisão

- **50/50** — divisão padrão do dia a dia (ex.: mercado, conta do restaurante).
- **Individual** — gasto de uma pessoa só, não entra no saldo.
- **Empréstimo** — tipo próprio para casos como "passei no cartão, depois a gente ajusta"; tem a opção extra `abaterNoSaldo` (sim = entra no saldo agregado; não = fica registrado separado, fora do saldo).

## Telas (v1)

1. **Painel/Resumo** — saldo agregado em destaque, total gasto no mês, breakdown por categoria, lista dos últimos lançamentos.
2. **Lançar gasto/dívida** — formulário: descrição, categoria, data, valor, quem pagou, tipo de divisão (50/50, individual, empréstimo — com sub-opção `abaterNoSaldo` quando aplicável), parcelamento opcional (total de parcelas, parcelas já pagas), observação opcional.
3. **Histórico/Extrato** — lista de todos os lançamentos, filtráveis por categoria/pessoa/status, com ação de quitar/reabrir por item.
4. **Detalhe do saldo** *(nova nesta versão)* — lista apenas dos lançamentos pendentes que compõem o saldo agregado (50/50 pendentes + empréstimos que abatem), permitindo quitar item a item nessa visão dedicada, sem precisar navegar pelo extrato completo.

## Fora de escopo (v1 deste módulo)

- Módulos de Viagens, Agenda e Metas — cada um vira seu próprio spec depois que o Financeiro estiver validado.
- Autenticação e backend multi-dispositivo — mantém persistência local (localStorage), mesma decisão do design anterior; sincronização entre dispositivos é pré-requisito de infraestrutura para os módulos futuros, não deste.
- Fluxo de registro rápido (1-2 toques) — descartado a favor do formulário completo.

## Entrega

Telas construídas diretamente no Penpot (nativamente, com as ferramentas de design), não importadas de HTML/CSS. Deve ser aberto um novo arquivo Penpot; a implementação em código (se/quando acontecer) vem depois, a partir do design aprovado — não o contrário.
