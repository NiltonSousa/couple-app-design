# Nós Dois — Financeiro

App de organização financeira do casal (Nilton & Damaris). v1 cobre o
módulo de custos: painel/resumo, lançamento de gastos, histórico e
detalhe do saldo agregado. Persistência via API (`couple-app-backend`),
autenticação por email + senha.

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
      hooks/                 useGastos (loading/error/empty/ready), useCasal
      data/                  gastosRepository — chamadas à API de gastos
      lib/                   tipos, cálculo de saldo, formatação
    auth/                  # login, sessão e slugs do casal
      components/            AuthProvider, RequireAuth
      pages/                 LoginPage
      data/                  authRepository, tokenStorage
      hooks/                 authContext (useAuth)
  shared/                 # utilitários e componentes sem dono de domínio nem de estilo
                            específico (AsyncState, formatCurrency, apiClient)
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
tela "Detalhe do saldo"). `computeSaldo(gastos, membroA, membroB)` recebe
os slugs do casal vindos da sessão — o cálculo é escrito em termos de
"quem pagou" e "o outro", sem nome fixo no código.

## Rodando localmente

Suba o backend (`couple-app-backend`) primeiro — ele escuta em
`:8080` e já libera CORS para `http://localhost:5173`, a porta padrão
do Vite, então nenhuma configuração extra é necessária no caso comum.

```bash
pnpm install
pnpm dev
```

Para apontar para outra URL, copie `.env.example` para `.env` e ajuste
`VITE_API_URL` (sem a variável, o default é `http://localhost:8080`).

Login com o seed de desenvolvimento do backend:
`nilton@example.com` / `dev12345`.

## Autenticação

- `features/auth/` — `AuthProvider` (único estado global do app: quem
  está logado), `LoginPage`, `RequireAuth`.
- O token vai para `localStorage` e é revalidado contra `/auth/me` a
  cada boot. Qualquer 401 derruba a sessão e leva de volta ao login.
- **Os slugs do casal (`pagoPor`) vêm de `/auth/me`, não de constante no
  frontend** — o backend os deriva do nome do usuário. Use `useCasal()`
  (`features/financeiro/hooks/useCasal.ts`) para obter membros, o slug
  do usuário logado e o label de cada slug.

## Integração com a API

`shared/lib/apiClient.ts` é o único ponto que fala com a rede: monta a
base URL, anexa o `Authorization: Bearer`, e converte erro do backend
(`{error, field?, message}`) em `ApiError` / `UnauthorizedError`.

`data/gastosRepository.ts` manteve as assinaturas
(`loadGastos`, `addGasto`, `quitarGasto`, `reabrirGasto`), então a troca
de `localStorage` por `fetch` não exigiu mudança nos componentes que a
consomem. `valorTotal` trafega em **reais** (ex.: `19.99`); a conversão
para centavos é interna ao servidor.

Cache/invalidação: cada mutação refaz o GET da lista inteira (sem
optimistic update) — o servidor é dono dos campos derivados e as listas
são pequenas.

### Não implementado (deliberadamente)

- **Refresh de token**: o backend não emite refresh token. O token vale
  24h (`expiresIn: 86400`); expirado, o próximo 401 leva ao login.
- **SSO (Google)**: decisão explícita — o backend só suporta
  email + senha por ora.
- **Filtros server-side**: `GET /gastos` aceita `categoria`, `pagoPor`,
  `status`, `de`, `ate`, e `loadGastos` já aceita esses parâmetros, mas
  a `HistoricoPage` continua filtrando no client (o volume não
  justifica um round trip por mudança de filtro).
- **`GET /resumo`**: não usado — `computeSaldo`/`saldoItems` no client
  já cobrem as telas com os dados de `/gastos`.
