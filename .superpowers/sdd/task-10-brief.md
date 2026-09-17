# Task 10 Brief — Screen: Histórico

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-9, already complete) — REHYDRATE FIRST

The Penpot MCP plugin connection has dropped multiple times during this plan and had to be reconnected — every time, the server-side `storage` object resets to empty, even though the actual Penpot file content survives untouched. **Always run this rehydration code first**, even if you believe the connection has been stable:

```js
const tokens = penpot.library.local.tokens;
const set = tokens.sets.find(s => s.name === 'Nós Dois');
if (!set) throw new Error('Token set "Nós Dois" not found');
storage.tokenSet = set;

storage.colorTokens = {};
storage.spacingTokens = {};
storage.radiusTokens = {};
storage.fontSizeTokens = {};
for (const token of set.tokens) {
  if (token.name.startsWith('color.')) storage.colorTokens[token.name] = token;
  else if (token.name.startsWith('spacing.')) storage.spacingTokens[token.name] = token;
  else if (token.name.startsWith('radius.')) storage.radiusTokens[token.name] = token;
  else if (token.name.startsWith('fontsize.')) storage.fontSizeTokens[token.name] = token;
}

const comps = penpot.library.local.components;
storage.buttonComponent = comps.find(c => c.name === 'Button');
storage.cardComponent = comps.find(c => c.name === 'Card');
storage.pillComponent = comps.find(c => c.name === 'Pill');
storage.statusBadgeComponent = comps.find(c => c.name === 'StatusBadge');
storage.tagComponent = comps.find(c => c.name === 'Tag');
storage.fieldInputComponent = comps.find(c => c.path === 'Field' && c.name === 'Input');
storage.fieldSelectComponent = comps.find(c => c.path === 'Field' && c.name === 'Select');
storage.fieldTextareaComponent = comps.find(c => c.path === 'Field' && c.name === 'Textarea');
storage.radioPillComponent = comps.find(c => c.name === 'RadioPill');
storage.avatarComponent = comps.find(c => c.name === 'Avatar');
storage.statCardComponent = comps.find(c => c.name === 'StatCard');
storage.sidebarComponent = comps.find(c => c.name === 'Sidebar');
storage.topbarComponent = comps.find(c => c.name === 'Topbar');

for (const [key, val] of Object.entries({
  buttonComponent: storage.buttonComponent, cardComponent: storage.cardComponent,
  pillComponent: storage.pillComponent, statusBadgeComponent: storage.statusBadgeComponent,
  tagComponent: storage.tagComponent, fieldInputComponent: storage.fieldInputComponent,
  fieldSelectComponent: storage.fieldSelectComponent, fieldTextareaComponent: storage.fieldTextareaComponent,
  radioPillComponent: storage.radioPillComponent, avatarComponent: storage.avatarComponent,
  statCardComponent: storage.statCardComponent, sidebarComponent: storage.sidebarComponent,
  topbarComponent: storage.topbarComponent,
})) {
  if (!val) throw new Error(`Component not found for storage.${key}`);
}

const buttonMain = storage.buttonComponent.variants.variantComponents()[0].mainInstance();
const label = buttonMain.children.find(c => c.type === 'text');
storage.fontName = label.fontFamily;

return {
  colorTokenCount: Object.keys(storage.colorTokens).length,
  spacingTokenCount: Object.keys(storage.spacingTokens).length,
  radiusTokenCount: Object.keys(storage.radiusTokens).length,
  fontSizeTokenCount: Object.keys(storage.fontSizeTokens).length,
  fontName: storage.fontName,
  allComponentsFound: true,
};
```

Expected: `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight', allComponentsFound: true`. If the MCP tool call fails with "No Penpot plugin instances are currently connected", the plugin has disconnected — report BLOCKED and ask for reconnection rather than retrying blindly.

**Known prior bugs and lessons from Tasks 7-9 (read carefully, this task has the highest layout complexity so far — a multi-column table):**
- Task 7: Button/Primary variant once had a stray leftover text node — fixed, Button renders cleanly now. Flag any NEW instance of a component showing more text children than expected.
- Task 8: flex-layout bounds do NOT always recompute immediately after setting `flex.horizontalSizing`/`layoutChild.horizontalSizing` alone — an explicit `shape.resize(w, h)` call was required to force relayout, sometimes needing a short wait afterward.
- Task 9: a container was positioned incorrectly (wrong x/y), fully overlapping other elements, and single-column fields were left at a stale default width instead of filling their container — both were only caught because the reviewer independently measured bounds rather than trusting the implementer's "no issues" claim. Also: nested children (e.g. an inner `input-box`) can have their OWN independent sizing that needs fixing separately from the parent field's sizing — a plain `resize()` sometimes isn't enough; a resize-away-then-back (e.g. `w+1` then `w-1`) plus a short wait was needed in one case to force relayout.

**For this task specifically**: the table uses FIXED column widths (`colWidths = [90, 260, 150, 100, 120, 120, 100, 84]`, i.e. `horizontalSizing = 'fix'` throughout) rather than flex-fill, so the main risk is text overflowing its fixed-width cell (e.g. "Presente Bia" in a 260px DESPESA column, or "Pendente: R$ 461,00" in the total row, or the "FICA P/ CADA" header in a 120px column) rather than containers not growing. **After building the table, explicitly check `penpotUtils.isContainedIn` for every text node against its immediate cell/row container** — do not just trust that the fixed widths in the brief's code were sized correctly by the plan's author. If any text overflows, widen that specific cell/column (and adjust the row's total width and subsequent x-offsets accordingly) rather than truncating data.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 16 top-level shapes after this task (the 15 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar, Screen/Painel, Screen/LancarGasto [some may be named with spaces around the slash — don't worry about exact names, just count them], plus `Screen/Historico` from this task).

## Task 10: Screen — Histórico

**Files:** N/A (Penpot board: `Screen/Historico`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.fieldSelectComponent`, `storage.buttonComponent`, `storage.statusBadgeComponent`, `storage.tagComponent`.
- Produces: `Screen/Historico` board with Sidebar + Topbar (title "Histórico de gastos"), a filter `Card` (3 selects: Categoria/Pago por/Status side by side), and a table built from stacked rows inside a `Card` (header row + 4 example data rows + a total row), each row showing date, description (+tag if parcelado), category tag, payer, value, status badge, and an action label ("Quitar"/"Reabrir"). This is a top-level board (not a library component) — do NOT wrap it in `createComponent`.

- [ ] **Step 1: Create screen, Sidebar, Topbar (title override), and filter card**

```js
const screen = penpot.createBoard();
screen.name = 'Screen/Historico';
screen.resize(1280, 1100);
screen.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }];

const sidebarInstance = storage.sidebarComponent.mainInstance().clone();
sidebarInstance.x = 0; sidebarInstance.y = 0;
const navPainel = penpotUtils.findShape(s => s.name === 'nav-Painel', sidebarInstance);
const navHist = penpotUtils.findShape(s => s.name === 'nav-Histórico', sidebarInstance);
if (navPainel) { navPainel.fills = []; navPainel.children[0].fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }]; }
if (navHist) { navHist.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }]; navHist.children[0].fills = [{ fillColor: '#1F2933', fillOpacity: 1 }]; }
screen.appendChild(sidebarInstance);

const topbarInstance = storage.topbarComponent.mainInstance().clone();
topbarInstance.x = 232; topbarInstance.y = 0;
penpotUtils.findShape(s => s.name === 'eyebrow', topbarInstance).characters = 'EXTRATO';
penpotUtils.findShape(s => s.name === 'title', topbarInstance).characters = 'Histórico de gastos';
const balancePill = penpotUtils.findShape(s => s.name === 'balance-pill', topbarInstance);
if (balancePill) balancePill.remove();
screen.appendChild(topbarInstance);

const filterCard = storage.cardComponent.instance();
filterCard.detach();
filterCard.name = 'filter-card';
filterCard.flex.dir = 'row';
filterCard.flex.columnGap = 12;
filterCard.flex.horizontalSizing = 'fix';
filterCard.resize(1016, 90);
['Categoria', 'Pago por', 'Status'].forEach(label => {
  const field = storage.fieldSelectComponent.instance();
  field.detach();
  field.children[0].characters = label;
  field.layoutChild.horizontalSizing = 'fill';
  filterCard.appendChild(field);
});
filterCard.x = 232 + 32; filterCard.y = 76 + 28;
screen.appendChild(filterCard);

storage.historicoScreen = screen;
storage.historicoFilterCard = filterCard;
return { created: 'filter-card' };
```

Expected: no error; 3 filter selects side by side. **IMPORTANT — position check**: after this step, verify `filterCard`'s bounds do NOT overlap `sidebarInstance` or `topbarInstance` (a real bug of this exact shape was found in Task 9 — a container ended up at (0,0) instead of its intended position). Use `penpotUtils.isContainedIn` or manual bounds/overlap math.

- [ ] **Step 2: Build the table card with header, 4 data rows, and a total row**

```js
const tableCard = storage.cardComponent.instance();
tableCard.detach();
tableCard.name = 'table-card';
tableCard.flex.dir = 'column';
tableCard.flex.rowGap = 0;
tableCard.flex.horizontalPadding = 0;
tableCard.flex.verticalPadding = 0;
tableCard.resize(1016, 100);

function textCell(text, width, isHeader) {
  const cellBox = penpot.createBoard();
  cellBox.resize(width, 24);
  const cf = cellBox.addFlexLayout();
  cf.dir = 'row';
  cf.alignItems = 'center';
  cf.horizontalSizing = 'fix';
  const t = penpot.createText();
  t.characters = text;
  t.fontFamily = storage.fontName;
  t.fontSize = isHeader ? 11 : 13;
  t.fontWeight = isHeader ? '600' : '400';
  t.fills = [{ fillColor: isHeader ? '#7C8A97' : '#1F2933', fillOpacity: 1 }];
  t.growType = 'auto-width';
  cellBox.appendChild(t);
  return cellBox;
}

function tagCell(text, width) {
  const cellBox = penpot.createBoard();
  cellBox.resize(width, 24);
  const cf = cellBox.addFlexLayout();
  cf.dir = 'row';
  cf.alignItems = 'center';
  cf.horizontalSizing = 'fix';
  const tag = storage.tagComponent.instance();
  tag.detach();
  tag.children[0].characters = text;
  cellBox.appendChild(tag);
  return cellBox;
}

function statusCell(status, width) {
  const cellBox = penpot.createBoard();
  cellBox.resize(width, 24);
  const cf = cellBox.addFlexLayout();
  cf.dir = 'row';
  cf.alignItems = 'center';
  cf.horizontalSizing = 'fix';
  const badge = storage.statusBadgeComponent.variants.variantComponents().find(c => c.variantProps.Status === status).instance();
  badge.detach();
  cellBox.appendChild(badge);
  return cellBox;
}

function actionCell(label, width) {
  const cellBox = penpot.createBoard();
  cellBox.resize(width, 32);
  const cf = cellBox.addFlexLayout();
  cf.dir = 'row';
  cf.alignItems = 'center';
  cf.horizontalSizing = 'fix';
  const btn = storage.buttonComponent.variants.variantComponents().find(c => c.variantProps.Style === 'Secondary').instance();
  btn.detach();
  btn.resize(76, 32);
  btn.children[0].characters = label;
  btn.children[0].fontSize = 13;
  cellBox.appendChild(btn);
  return cellBox;
}

function tableRow(desc, category, payer, valorTotal, ficaPara, status, action, colWidths, isHeader) {
  const row = penpot.createBoard();
  row.resize(1016, isHeader ? 44 : 56);
  const rf = row.addFlexLayout();
  rf.dir = 'row';
  rf.alignItems = 'center';
  rf.horizontalPadding = 20;
  rf.horizontalSizing = 'fix';
  rf.verticalSizing = 'fix';
  row.strokes = isHeader ? [] : [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];

  if (isHeader) {
    row.appendChild(textCell('DATA', colWidths[0], true));
    row.appendChild(textCell('DESPESA', colWidths[1], true));
    row.appendChild(textCell('CATEGORIA', colWidths[2], true));
    row.appendChild(textCell('PAGO POR', colWidths[3], true));
    row.appendChild(textCell('VALOR TOTAL', colWidths[4], true));
    row.appendChild(textCell('FICA P/ CADA', colWidths[5], true));
    row.appendChild(textCell('STATUS', colWidths[6], true));
    row.appendChild(textCell('', colWidths[7], true));
  } else {
    row.appendChild(textCell(desc.date, colWidths[0], false));
    row.appendChild(textCell(desc.text, colWidths[1], false));
    row.appendChild(tagCell(category, colWidths[2]));
    row.appendChild(textCell(payer, colWidths[3], false));
    row.appendChild(textCell(valorTotal, colWidths[4], false));
    row.appendChild(textCell(ficaPara, colWidths[5], false));
    row.appendChild(statusCell(status, colWidths[6]));
    row.appendChild(actionCell(action, colWidths[7]));
  }
  return row;
}

const colWidths = [90, 260, 150, 100, 120, 120, 100, 84];
tableCard.appendChild(tableRow(null, null, null, null, null, null, null, colWidths, true));

const rows = [
  { date: '12/06', text: 'Hotel Caraíva', category: 'Viagem', payer: 'Nilton', valorTotal: 'R$ 890,00', ficaPara: 'R$ 445,00', status: 'Pendente', action: 'Quitar' },
  { date: '10/06', text: 'Mercado', category: 'Alimentação', payer: 'Damaris', valorTotal: 'R$ 180,00', ficaPara: 'R$ 90,00', status: 'Quitado', action: 'Reabrir' },
  { date: '08/06', text: 'Uber', category: 'Transporte', payer: 'Nilton', valorTotal: 'R$ 32,00', ficaPara: 'R$ 16,00', status: 'Pendente', action: 'Quitar' },
  { date: '02/06', text: 'Presente Bia', category: 'Presente', payer: 'Damaris', valorTotal: 'R$ 150,00', ficaPara: 'Não abate', status: 'Quitado', action: 'Reabrir' },
];
for (const r of rows) {
  const row = tableRow(
    { date: r.date, text: r.text }, r.category, r.payer, r.valorTotal, r.ficaPara, r.status, r.action,
    colWidths, false,
  );
  tableCard.appendChild(row);
}

const totalRow = penpot.createBoard();
totalRow.resize(1016, 44);
const totalFlex = totalRow.addFlexLayout();
totalFlex.dir = 'row';
totalFlex.alignItems = 'center';
totalFlex.horizontalPadding = 20;
totalFlex.horizontalSizing = 'fix';
totalRow.strokes = [];
totalRow.appendChild(textCell('Total no filtro', 500, false));
totalRow.children[0].children[0].fontWeight = '600';
totalRow.appendChild(textCell('R$ 1.252,00', colWidths[4], false));
totalRow.children[1].children[0].fontWeight = '600';
totalRow.appendChild(textCell('Pendente: R$ 461,00', 300, false));
tableCard.appendChild(totalRow);

tableCard.x = 232 + 32; tableCard.y = storage.historicoFilterCard.y + storage.historicoFilterCard.height + 20;
storage.historicoScreen.appendChild(tableCard);
storage.historicoTableCard = tableCard;
return { rowCount: rows.length };
```

Expected: no error; header row + 4 data rows + total row, each with 13px/11px text in aligned columns.

**After running Step 2, before moving on:** for every cell in every row (header, 4 data rows, total row), check `penpotUtils.isContainedIn(textNode, cellBox)` — pay special attention to: the "FICA P/ CADA" header (11px bold text in a 120px cell), "Presente Bia" (13px text in the 260px DESPESA cell — should be fine but verify), "Pendente: R$ 461,00" in the total row's 300px-wide cell, and any StatusBadge/Tag/Button instances inside their fixed-width `cellBox` wrappers (check `isContainedIn(badgeOrTagOrButton, cellBox)` too, not just the text). If anything overflows, widen the specific `colWidths` entry (and correspondingly adjust `tableCard`'s total width if column widths no longer sum to fit within 1016px content area) — do not truncate the example data.

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.historicoScreen;
const bottom = storage.historicoTableCard.y + storage.historicoTableCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm filters row, then a table-like card with a clear header row, 4 legible data rows, and a total row at the bottom, all columns aligned, no clipped/overlapping text, Sidebar and Topbar both fully visible (not covered by the filter or table cards).

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 16 top-level shapes: the 15 from before plus `Screen/Historico` from this task. Delete any extras — do not delete any of these 16.

## Report

Write your completion report to `.superpowers/sdd/task-10-report.md`: what you built, any deviations/overflow-fixes made in Step 2's per-cell containment checks, the position/overlap check result from Step 1, and the final `shapeStructure` output confirming exactly 16 top-level shapes.
