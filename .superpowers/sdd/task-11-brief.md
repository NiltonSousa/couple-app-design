# Task 11 Brief — Screen: Detalhe do saldo

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## CRITICAL — text creation rule (read this first)

`penpot.createText(text)` **requires a string argument**. The correct pattern, used successfully throughout this whole plan, is:
```js
const t = penpot.createText();
t.characters = 'some text';
```
If you ever see an error like `[PENPOT PLUGIN] Value not valid. Code: :createText`, it means a `penpot.createText()` call somewhere was missing a valid argument or was otherwise malformed — it is NOT a real API limitation. **Never work around a createText error by cloning an existing shape's text node from a shared library component** (e.g. `storage.buttonComponent`, `storage.cardComponent`, etc.) — a previous task (Task 10) did exactly this and corrupted the shared `Button` component (1 → 11 text children), which visually broke an already-approved screen (`Screen/Painel`) until it was fixed. If `penpot.createText()` genuinely errors for you, STOP and report BLOCKED with the exact error rather than improvising a workaround that touches shared components.

## Prior state (from Tasks 1-10, already complete) — REHYDRATE FIRST

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

// Sanity check: confirm Button is NOT corrupted (a prior task once corrupted this
// shared component; it was fixed, but re-verify here before building on top of it).
const buttonVariants = storage.buttonComponent.variants.variantComponents();
for (const v of buttonVariants) {
  const textChildren = v.mainInstance().children.filter(c => c.type === 'text');
  if (textChildren.length !== 1) {
    throw new Error(`Button variant ${JSON.stringify(v.variantProps)} has ${textChildren.length} text children, expected 1 — Button component appears corrupted, STOP and report BLOCKED`);
  }
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
  buttonComponentHealthy: true,
};
```

Expected: `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight', allComponentsFound: true, buttonComponentHealthy: true`. If the MCP tool call fails with "No Penpot plugin instances are currently connected", the plugin has disconnected — report BLOCKED and ask for reconnection rather than retrying blindly. If the Button health check throws, STOP immediately and report BLOCKED — do not attempt to fix a corrupted shared component yourself as part of this task; that requires a dedicated investigation.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 17 top-level shapes after this task (the 16 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar, Screen/Painel, Screen/LancarGasto, Screen/Historico [some may be named with spaces around the slash — don't worry about exact names, just count them], plus `Screen/DetalheSaldo` from this task).

## Task 11: Screen — Detalhe do saldo

**Files:** N/A (Penpot board: `Screen/DetalheSaldo`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.buttonComponent`.
- Produces: `Screen/DetalheSaldo` board with Sidebar + Topbar (title "Saldo entre vocês"), a summary `Card` at top showing the aggregate balance ("Damaris deve R$ 120,00" as a large stat, using the same visual pattern as StatCard but inline), and a list `Card` of individual pending items that compose the balance — each row shows description, value (the half or full amount that counts toward the balance), and a "Quitar" button (`Button` component, `Secondary` variant) — demonstrating that each item can be settled independently while others stay pending. This is a top-level board (not a library component) — do NOT wrap it in `createComponent`.

- [ ] **Step 1: Create screen, Sidebar, Topbar (title override), and summary card**

```js
const screen = penpot.createBoard();
screen.name = 'Screen/DetalheSaldo';
screen.resize(1280, 900);
screen.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }];

const sidebarInstance = storage.sidebarComponent.mainInstance().clone();
sidebarInstance.x = 0; sidebarInstance.y = 0;
const navPainel = penpotUtils.findShape(s => s.name === 'nav-Painel', sidebarInstance);
if (navPainel) { navPainel.fills = []; navPainel.children[0].fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }]; }
screen.appendChild(sidebarInstance);

const topbarInstance = storage.topbarComponent.mainInstance().clone();
topbarInstance.x = 232; topbarInstance.y = 0;
penpotUtils.findShape(s => s.name === 'eyebrow', topbarInstance).characters = 'SALDO';
penpotUtils.findShape(s => s.name === 'title', topbarInstance).characters = 'Saldo entre vocês';
const balancePill = penpotUtils.findShape(s => s.name === 'balance-pill', topbarInstance);
if (balancePill) balancePill.remove();
screen.appendChild(topbarInstance);

const summaryCard = storage.cardComponent.instance();
summaryCard.detach();
summaryCard.name = 'summary-card';
summaryCard.resize(1016, 100);
const summaryLabel = penpot.createText();
summaryLabel.characters = 'Saldo atual';
summaryLabel.fontFamily = storage.fontName;
summaryLabel.fontSize = 13;
summaryLabel.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
summaryLabel.growType = 'auto-width';
summaryCard.appendChild(summaryLabel);
const summaryValue = penpot.createText();
summaryValue.characters = 'Damaris deve R$ 120,00';
summaryValue.fontFamily = storage.fontName;
summaryValue.fontSize = 32;
summaryValue.fontWeight = '600';
summaryValue.fills = [{ fillColor: '#C1443A', fillOpacity: 1 }];
summaryValue.growType = 'auto-width';
summaryCard.appendChild(summaryValue);
summaryCard.x = 232 + 32; summaryCard.y = 76 + 28;
screen.appendChild(summaryCard);

storage.saldoScreen = screen;
storage.saldoSummaryCard = summaryCard;
return { created: 'summary-card' };
```

Expected: no error; large red-toned balance figure (since example shows Damaris owing — danger color) under a muted label. **Check containment**: `penpotUtils.isContainedIn(summaryLabel, summaryCard)` and `isContainedIn(summaryValue, summaryCard)` should both be true — "Damaris deve R$ 120,00" at 32px bold is a long string (this exact text overflowed a smaller container in Task 8, so verify here too even though this card is wider).

- [ ] **Step 2: Build the pending-items list card**

```js
const itemsCard = storage.cardComponent.instance();
itemsCard.detach();
itemsCard.name = 'items-card';
itemsCard.flex.rowGap = 0;
itemsCard.flex.horizontalPadding = 0;
itemsCard.flex.verticalPadding = 0;
itemsCard.resize(1016, 100);

function itemRow(desc, value, isLast) {
  const row = penpot.createBoard();
  row.resize(1016, 64);
  const rf = row.addFlexLayout();
  rf.dir = 'row';
  rf.alignItems = 'center';
  rf.justifyContent = 'space-between';
  rf.horizontalPadding = 20;
  rf.verticalPadding = 12;
  rf.horizontalSizing = 'fix';
  if (!isLast) row.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];

  const left = penpot.createText();
  left.characters = desc;
  left.fontFamily = storage.fontName;
  left.fontSize = 14;
  left.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
  left.growType = 'auto-width';
  row.appendChild(left);

  const rightGroup = penpot.createBoard();
  rightGroup.resize(200, 40);
  const rgFlex = rightGroup.addFlexLayout();
  rgFlex.dir = 'row';
  rgFlex.alignItems = 'center';
  rgFlex.columnGap = 12;
  rgFlex.horizontalSizing = 'auto';
  rgFlex.verticalSizing = 'auto';
  const valueText = penpot.createText();
  valueText.characters = value;
  valueText.fontFamily = storage.fontName;
  valueText.fontSize = 14;
  valueText.fontWeight = '600';
  valueText.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
  valueText.growType = 'auto-width';
  rightGroup.appendChild(valueText);
  const settleBtn = storage.buttonComponent.variants.variantComponents().find(c => c.variantProps.Style === 'Secondary').instance();
  settleBtn.detach();
  settleBtn.resize(80, 32);
  settleBtn.children[0].characters = 'Quitar';
  settleBtn.children[0].fontSize = 13;
  rightGroup.appendChild(settleBtn);
  row.appendChild(rightGroup);
  return row;
}

const pendingItems = [
  ['Hotel Caraíva (metade)', 'R$ 445,00'],
  ['Uber (metade)', 'R$ 16,00'],
  ['Empréstimo cartão (jantar)', 'R$ 59,00'],
];
pendingItems.forEach(([desc, value], i) => {
  itemsCard.appendChild(itemRow(desc, value, i === pendingItems.length - 1));
});

itemsCard.x = 232 + 32; itemsCard.y = storage.saldoSummaryCard.y + storage.saldoSummaryCard.height + 20;
storage.saldoScreen.appendChild(itemsCard);
storage.saldoItemsCard = itemsCard;
return { itemCount: pendingItems.length };
```

Expected: no error; 3 rows, each with a description on the left and a value + "Quitar" button on the right, demonstrating independent per-item settlement.

**After running Step 2, before moving on:** check containment for every row: `isContainedIn(row, itemsCard)`, `isContainedIn(left, row)` (the description text — "Empréstimo cartão (jantar)" is the longest, verify it doesn't collide with the rightGroup), `isContainedIn(rightGroup, row)`, `isContainedIn(valueText, rightGroup)`, `isContainedIn(settleBtn, rightGroup)`, and `isContainedIn(settleBtn.children[0], settleBtn)` (the "Quitar" button label). Also verify `isContainedIn(itemsCard, screen)` and `isContainedIn(summaryCard, screen)`. If anything overflows, fix by resizing/adjusting the specific shape (following the resize()-after-property-write pattern documented in Tasks 8-10's fix reports) rather than truncating text.

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.saldoScreen;
const bottom = storage.saldoItemsCard.y + storage.saldoItemsCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm: large balance figure at top, then a list of individually-settleable items below, each with its own "Quitar" button — this is the screen that most directly encodes the "quitar uma dívida e deixar outra em espera" decision from the spec. Confirm Sidebar and Topbar are both fully visible (not covered by the summary or items cards), no clipped/overlapping text anywhere.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 17 top-level shapes: the 16 from before plus `Screen/DetalheSaldo` from this task. Delete any extras — do not delete any of these 17.

## Report

Write your completion report to `.superpowers/sdd/task-11-report.md`: what you built, the Button-health sanity check result from rehydration, the containment-check results from Step 2, any deviations/fixes made, and the final `shapeStructure` output confirming exactly 17 top-level shapes.
