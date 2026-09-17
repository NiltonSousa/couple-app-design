# Task 11 Fix Report — Screen: Detalhe do saldo

## Status: FIXED

## Bug

The `summary-card` shape (the "Saldo atual" label + "Damaris deve R$ 120,00" value card at the top of
`Screen / DetalheSaldo`) had `flex.horizontalSizing === 'auto'`. Even though the brief's Step 1 code called
`summaryCard.resize(1016, 100)` right after creating the card, the `auto` horizontal sizing mode caused the
flex layout to immediately re-shrink the card to hug its text content instead of honoring the fixed 1016px
width — a plain `resize()` doesn't override a container's own `auto` sizing mode, it only sets a size that
the layout engine then overrides on the next layout pass.

**Confirmed pre-fix measurement:**
- `summary-card`: x=264, y=104, width=**388**, height=115, `flex.horizontalSizing = 'auto'`
- `items-card`: x=264, y=239, width=**1016**, height=192

This produced a narrow, misaligned summary card floating above a full-width items card, breaking the
consistent card-width pattern used on every other screen in this plan (Painel's stats-row, Historico's
filter-card/table-card, LancarGasto's form-card).

## Root cause

`summary-card` was a detached `Card` component instance. The `Card` component's flex layout apparently
defaults (or was left) to `horizontalSizing: 'auto'`, meaning the layout engine treats the card's width as
driven by its children's content width, not as a fixed dimension — so any `resize()` call is transient and
gets overwritten by the layout engine on the next relayout pass.

## Fix applied

```js
const summaryCard = storage.saldoSummaryCard;
summaryCard.flex.horizontalSizing = 'fix';
summaryCard.resize(1016, summaryCard.height);
```

This held immediately (`width` read back as exactly `1016` on the first attempt — no resize-away-then-back
workaround was needed this time, though it was prepared as a fallback per the Tasks 8-10 lesson).

## Final measurements (post-fix)

| Shape | x | y | width | height |
|---|---|---|---|---|
| `summary-card` | 264 | 104 | **1016** | 115 |
| `items-card` | 264 | 239 | **1016** | 192 |

Both cards now share identical `x` (264) and `width` (1016) — fully left-aligned and width-consistent, matching
the pattern from Painel/Historico/LancarGasto.

## Containment re-verification

- `isContainedIn(summaryLabel ["Saldo atual"], summaryCard)`: **true**
- `isContainedIn(summaryValue ["Damaris deve R$ 120,00"], summaryCard)`: **true**
- `isContainedIn(summaryCard, screen)`: **true**
- Card height unchanged (~115px) — still comfortably fits the 13px label + 32px bold value content; widening
  did not require a height change.

## Visual confirmation

Exported `Screen / DetalheSaldo` (shape id `e2e09cb5-e94d-80d9-8008-434758f95b45`) as PNG after the fix:
- Summary card ("Saldo atual" / "Damaris deve R$ 120,00") now spans the full 1016px width, precisely aligned
  with the items-card below it — both cards start and end at the same horizontal position.
- No clipped or overlapping text anywhere.
- Sidebar (Nós Dois branding, nav items, avatars) fully visible on the left.
- Topbar (SALDO / "Saldo entre vocês" title, "+ Novo gasto" button) fully visible at top.
- 3 pending items with descriptions, values, and "Quitar" buttons all render correctly, unaffected by the fix.

## Structure check

`penpotUtils.shapeStructure(penpot.root, 1)` confirms **exactly 17 top-level shapes** — no debris introduced
by this fix:
Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select, Field / Textarea, RadioPill, Avatar,
StatCard, Sidebar, Topbar, Screen / Painel, Screen / LancarGasto, Screen / Historico, Screen / DetalheSaldo.

## Correction to the original completion report

The original `task-11-report.md` states the `balance-pill` in the Topbar was "removed". This is **inaccurate**:
`balancePill.remove()` was called on a component-instance descendant of a library component clone (the Topbar
instance), and per the Penpot Plugin API semantics, calling `remove()` on a shape that is a descendant of a
board which is itself a component instance does **not** delete the shape — it makes it invisible instead.

Verified directly: the `balance-pill` shape still exists in the shape tree under the Topbar instance, with
`visible: false` / `hidden: true`. This has no visual or functional difference from true removal (the pill is
invisible either way), so **no code fix was needed** — this is purely a documentation correction for accuracy.
