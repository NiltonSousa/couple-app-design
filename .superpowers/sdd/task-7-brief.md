# Task 7 Brief — Topbar composite

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-6, already complete) — REHYDRATE FIRST

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

for (const [key, val] of Object.entries({
  buttonComponent: storage.buttonComponent, cardComponent: storage.cardComponent,
  pillComponent: storage.pillComponent, statusBadgeComponent: storage.statusBadgeComponent,
  tagComponent: storage.tagComponent, fieldInputComponent: storage.fieldInputComponent,
  fieldSelectComponent: storage.fieldSelectComponent, fieldTextareaComponent: storage.fieldTextareaComponent,
  radioPillComponent: storage.radioPillComponent, avatarComponent: storage.avatarComponent,
  statCardComponent: storage.statCardComponent, sidebarComponent: storage.sidebarComponent,
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

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 13 top-level shapes after this task (the 12 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, plus `Topbar` from this task).

## Task 7: Topbar composite

**Files:** N/A (Penpot library component: `Topbar`)

**Interfaces:**
- Consumes: `storage.buttonComponent` (Task 2), `storage.pillComponent` (Task 3), `storage.fontName`.
- Produces: `Topbar` component — a `Board` 1048px wide (1280 board width − 232 sidebar), flex `dir: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`, containing a left text stack (eyebrow label + `h2` title) and a right-side row (balance `Pill` instance + primary `Button` instance labeled "+ Novo gasto"). Store as `storage.topbarComponent` — later screen tasks depend on this exact key name. Screens append this at `x=232, y=0`, and each screen overrides the eyebrow/title text and the pill's tone/label per its own content.

- [ ] **Step 1: Build the Topbar board**

```js
const topbar = penpot.createBoard();
topbar.name = 'Topbar';
topbar.resize(1048, 76);
const flex = topbar.addFlexLayout();
flex.dir = 'row';
flex.alignItems = 'center';
flex.justifyContent = 'space-between';
flex.horizontalPadding = 32;
flex.verticalPadding = 18;
topbar.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }];

const left = penpot.createBoard();
left.name = 'left';
left.resize(300, 40);
const leftFlex = left.addFlexLayout();
leftFlex.dir = 'column';
leftFlex.rowGap = 4;
const eyebrow = penpot.createText();
eyebrow.name = 'eyebrow';
eyebrow.characters = 'PAINEL DE CUSTOS';
eyebrow.fontFamily = storage.fontName;
eyebrow.fontSize = 12;
eyebrow.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
eyebrow.growType = 'auto-width';
left.appendChild(eyebrow);
const title = penpot.createText();
title.name = 'title';
title.characters = 'Resumo do casal';
title.fontFamily = storage.fontName;
title.fontSize = 20;
title.fontWeight = '600';
title.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
title.growType = 'auto-width';
left.appendChild(title);
topbar.appendChild(left);

const right = penpot.createBoard();
right.name = 'right';
right.resize(260, 40);
const rightFlex = right.addFlexLayout();
rightFlex.dir = 'row';
rightFlex.alignItems = 'center';
rightFlex.columnGap = 12;

const balancePillInstance = storage.pillComponent.variants.variantComponents().find(c => c.variantProps.Tone === 'Neutral').instance();
balancePillInstance.name = 'balance-pill';
balancePillInstance.children[0].characters = 'Contas quitadas';
right.appendChild(balancePillInstance);

const newExpenseBtn = storage.buttonComponent.variants.variantComponents().find(c => c.variantProps.Style === 'Primary').instance();
newExpenseBtn.name = 'btn-new-expense';
newExpenseBtn.children[0].characters = '+ Novo gasto';
right.appendChild(newExpenseBtn);

topbar.appendChild(right);
topbar.x = 232; topbar.y = 700;

storage.topbarComponent = penpot.library.local.createComponent([topbar]);
storage.topbarComponent.name = 'Topbar';
return { created: 'Topbar' };
```

Expected: no error. Note: check the actual `variantProps` key names on `storage.pillComponent` and `storage.buttonComponent` before assuming `Tone`/`Style` are correct — if `.find(...)` returns `undefined`, inspect `storage.pillComponent.variants.variantComponents().map(c => c.variantProps)` and `storage.buttonComponent.variants.variantComponents().map(c => c.variantProps)` to find the correct property name/value, then adjust the `.find()` predicate accordingly. Note this adjustment in your report if you had to make one.

- [ ] **Step 2: Verify visually and clean up**

`export_shape` on `topbarComponent.id` (fetch id first via `execute_code`). Confirm left-aligned eyebrow+title, right-aligned pill+button, spaced apart.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 13 top-level shapes: the 12 from before (Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar) plus `Topbar` from this task. Delete any extras — do not delete any of these 13.

## Report

Write your completion report to `.superpowers/sdd/task-7-report.md`: what you built, any deviations from the brief (e.g. adjusted variant property names), and the final `shapeStructure` output confirming exactly 13 top-level shapes.
