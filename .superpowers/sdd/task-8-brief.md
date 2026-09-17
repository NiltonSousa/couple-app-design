# Task 8 Brief — Screen: Painel/Resumo

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-7, already complete) — REHYDRATE FIRST

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

**Known prior bug (fixed):** Task 2's Button/Primary variant once had a stray leftover text node from a copy/paste error, corrupting rendered text. This was found and fixed during Task 7's review — Button now renders cleanly everywhere. No action needed here, just be aware: if you see any Button instance with more than one text child anywhere in this task, that would be a NEW regression worth flagging, not an old known issue.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 14 top-level shapes after this task (the 13 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar, plus `Screen/Painel` from this task).

## Task 8: Screen — Painel/Resumo

**Files:** N/A (Penpot board: `Screen/Painel`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent` (whose cloned instance already contains a `balance-pill`-named `Pill` instance from Task 7 — edited in place, not re-instantiated), `storage.statCardComponent`, `storage.cardComponent`, `storage.colorTokens`, `storage.fontName`.
- Produces: a top-level `Board` named `Screen/Painel`, 1280px wide, auto height, containing a `Sidebar` instance at (0,0), a `Topbar` instance at (232,0) with title "Resumo do casal", and a content area below with: 3 `StatCard` instances in a row (Total do mês, Saldo, Pendentes), a 2-column row below (Últimos lançamentos card + Por categoria card) with example data as plain text rows. This is a top-level board (not a library component) — do NOT wrap it in `createComponent`.

- [ ] **Step 1: Create the screen board and place Sidebar + Topbar**

```js
const screen = penpot.createBoard();
screen.name = 'Screen/Painel';
screen.resize(1280, 900);
screen.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }];

const sidebarInstance = storage.sidebarComponent.mainInstance().clone();
sidebarInstance.x = 0; sidebarInstance.y = 0;
screen.appendChild(sidebarInstance);

const topbarInstance = storage.topbarComponent.mainInstance().clone();
topbarInstance.x = 232; topbarInstance.y = 0;
// The balance pill defaults to "Contas quitadas" (Neutral tone) from Task 7.
// This screen's example data shows Damaris owing money, so update the pill
// to match — otherwise the Topbar and the "Saldo entre vocês" StatCard below
// would contradict each other.
const balancePill = penpotUtils.findShape(s => s.name === 'balance-pill', topbarInstance);
if (balancePill) {
  balancePill.children[0].characters = 'Damaris deve R$ 120,00';
  balancePill.applyToken(storage.colorTokens['color.danger-soft'], ['fill']);
  balancePill.children[0].fills = [{ fillColor: '#C1443A', fillOpacity: 1 }];
}
screen.appendChild(topbarInstance);

storage.painelScreen = screen;
storage.painelSidebar = sidebarInstance;
storage.painelTopbar = topbarInstance;
return { created: 'Screen/Painel' };
```

Expected: no error. (Using `.mainInstance().clone()` rather than `.instance()` keeps the placed shapes as detachable clones so per-screen text edits don't require detaching from a live component link; if `.instance()` is preferred instead for library consistency, call `.detach()` immediately after appending before editing text.)

- [ ] **Step 2: Add 3 StatCards in a row**

```js
const statDefs = [
  { label: 'Total lançado este mês', value: 'R$ 2.480,00' },
  { label: 'Saldo entre vocês', value: 'Damaris deve R$ 120,00' },
  { label: 'Lançamentos pendentes', value: '3' },
];
const statsRow = penpot.createBoard();
statsRow.name = 'stats-row';
statsRow.resize(1016, 90);
const statsFlex = statsRow.addFlexLayout();
statsFlex.dir = 'row';
statsFlex.columnGap = 28;
statsFlex.horizontalSizing = 'auto';
statsFlex.verticalSizing = 'auto';
for (const def of statDefs) {
  const instance = storage.statCardComponent.instance();
  instance.detach();
  instance.children[0].characters = def.label;
  instance.children[1].characters = def.value;
  instance.layoutChild.horizontalSizing = 'fill';
  statsRow.appendChild(instance);
}
statsRow.x = 232 + 32; statsRow.y = 76 + 28;
screen.appendChild(statsRow);
storage.painelStatsRow = statsRow;
return { statCount: statDefs.length };
```

Expected: no error; 3 stat cards laid out horizontally below the topbar.

- [ ] **Step 3: Add "Últimos lançamentos" and "Por categoria" cards**

```js
const contentRow = penpot.createBoard();
contentRow.name = 'content-row';
contentRow.resize(1016, 260);
const rowFlex = contentRow.addFlexLayout();
rowFlex.dir = 'row';
rowFlex.columnGap = 28;
rowFlex.horizontalSizing = 'auto';
rowFlex.verticalSizing = 'auto';

function textRow(parentBoard, leftLabel, rightValue) {
  const row = penpot.createBoard();
  row.resize(300, 24);
  const rf = row.addFlexLayout();
  rf.dir = 'row';
  rf.justifyContent = 'space-between';
  rf.horizontalSizing = 'fill';
  const l = penpot.createText();
  l.characters = leftLabel;
  l.fontFamily = storage.fontName;
  l.fontSize = 14;
  l.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
  l.growType = 'auto-width';
  row.appendChild(l);
  const r = penpot.createText();
  r.characters = rightValue;
  r.fontFamily = storage.fontName;
  r.fontSize = 14;
  r.fontWeight = '600';
  r.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
  r.growType = 'auto-width';
  row.appendChild(r);
  parentBoard.appendChild(row);
  return row;
}

const lastEntriesCard = storage.cardComponent.instance();
lastEntriesCard.detach();
lastEntriesCard.name = 'card-ultimos-lancamentos';
const lastTitle = penpot.createText();
lastTitle.characters = 'Últimos lançamentos';
lastTitle.fontFamily = storage.fontName;
lastTitle.fontSize = 15;
lastTitle.fontWeight = '600';
lastTitle.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
lastTitle.growType = 'auto-width';
lastEntriesCard.appendChild(lastTitle);
textRow(lastEntriesCard, 'Hotel Caraíva', 'R$ 890,00');
textRow(lastEntriesCard, 'Mercado', 'R$ 180,00');
textRow(lastEntriesCard, 'Uber', 'R$ 32,00');
lastEntriesCard.layoutChild.horizontalSizing = 'fill';
contentRow.appendChild(lastEntriesCard);

const categoryCard = storage.cardComponent.instance();
categoryCard.detach();
categoryCard.name = 'card-por-categoria';
const catTitle = penpot.createText();
catTitle.characters = 'Por categoria';
catTitle.fontFamily = storage.fontName;
catTitle.fontSize = 15;
catTitle.fontWeight = '600';
catTitle.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
catTitle.growType = 'auto-width';
categoryCard.appendChild(catTitle);
textRow(categoryCard, 'Viagem', 'R$ 890,00');
textRow(categoryCard, 'Alimentação', 'R$ 180,00');
textRow(categoryCard, 'Transporte', 'R$ 32,00');
categoryCard.layoutChild.horizontalSizing = 'fill';
contentRow.appendChild(categoryCard);

contentRow.x = 232 + 32; contentRow.y = 76 + 28 + 90 + 28;
screen.appendChild(contentRow);
storage.painelContentRow = contentRow;
return { created: 'content-row' };
```

Expected: no error; two cards side by side, each with a title and 3 label/value rows.

- [ ] **Step 4: Resize screen to fit content and verify visually**

```js
const bottom = storage.painelContentRow.y + storage.painelContentRow.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id` (`storage.painelScreen.id`). Confirm: sidebar left, topbar top-right area, 3 stat cards, then 2 content cards below, all within the 1280px board, no overlapping shapes, no content overflowing the board bounds (cross-check with `penpotUtils.isContainedIn` for `statsRow` and `contentRow` against `screen`).

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 14 top-level shapes: the 13 from before (Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar) plus `Screen/Painel` from this task. Delete any extras — do not delete any of these 14.

## Report

Write your completion report to `.superpowers/sdd/task-8-report.md`: what you built, any deviations from the brief, and the final `shapeStructure` + containment-check output confirming exactly 14 top-level shapes and no overflow.
