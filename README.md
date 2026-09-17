# Nós Dois — Financeiro

App de organização financeira do casal (Nilton & Damaris). v1 cobre o
módulo de custos: painel/resumo, lançamento de gastos, histórico e
detalhe do saldo agregado. Sem backend — persistência em `localStorage`.

Design de origem: `docs/superpowers/specs/2026-06-30-nos-dois-financeiro-design.md`
e `docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md`
(construído no Penpot; este README documenta a implementação em código).

## Stack

- React 19 + TypeScript + Vite
- react-router-dom (client-side routing)
- CSS Modules (sem biblioteca de componentes externa)
- Responsivo (mobile via drawer de navegação, sem app nativo)

## Estrutura

```
src/
  app/                    # shell da aplicação: roteamento, Sidebar, Topbar, AppShell
  design-system/          # componentes visuais reutilizáveis, sem conhecimento de domínio
    tokens/                 tokens.css — espelha o token set "Nós Dois" do Penpot
    components/              Button, Card, Pill, StatusBadge, Tag, Field, Avatar, StatCard...
  features/
    financeiro/            # único domínio da v1; próximos módulos (viagens, agenda,
      pages/                 metas) entram como novas pastas em features/, sem tocar aqui
      components/           componentes específicos do domínio (GastoForm, GastoRow...)
      hooks/                 useGastos — estado assíncrono (loading/error/ready)
      data/                  gastosRepository — persistência (localStorage por ora)
      lib/                   tipos, cálculo de saldo, formatação
  shared/                 # utilitários e componentes sem dono de domínio nem de estilo
                            específico (AsyncState, formatCurrency)
```

**Por que separar `design-system/` de `features/financeiro/`:** os
componentes visuais não sabem o que é um "gasto" ou uma "divisão 50/50" —
recebem props genéricas (`label`, `value`, `tone`). Isso deixa claro o
que pode ser reaproveitado quando os módulos de Viagens/Agenda/Metas
forem construídos (backlog em `backlog.md`).

## Modelo de dado

Ver `src/features/financeiro/lib/types.ts`. Segue o modelo documentado
no spec: `divisao` pode ser `'50-50' | 'individual' | 'emprestimo'`,
e `abaterNoSaldo` só é relevante para empréstimos.

## Regra de saldo

`src/features/financeiro/lib/saldo.ts` (`computeSaldo`) e
`src/features/financeiro/lib/saldoItems.ts` (`saldoItems`, usada na
tela "Detalhe do saldo"). `computeSaldo` está com a agregação como TODO
proposital — ver comentário no arquivo.

## Rodando localmente

```bash
pnpm install
pnpm dev
```

## Backend futuro

`backend-tasks.md` no projeto de design anterior
(`open-design/.od/projects/2e1f65fa-e376-4e78-89eb-8022d9e4b7ec/backend-tasks.md`)
documenta o plano de migração para um backend real — os casos de uso e
o modelo normalizado lá ainda se aplicam, mesmo com o modelo de dado
atual tendo evoluído (campo `emprestimo`/`abaterNoSaldo` a mais). A camada
`data/gastosRepository.ts` já usa as mesmas assinaturas de função
(`loadGastos`, `addGasto`, `quitarGasto`, `reabrirGasto`) previstas
nesse plano, para que a troca de `localStorage` por `fetch` não exija
mudanças nos componentes que a consomem.
