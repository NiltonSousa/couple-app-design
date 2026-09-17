# Task 9 Brief — Screen: Lançar gasto

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-8, already complete) — REHYDRATE FIRST

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

**Known prior bugs (fixed, awareness only):**
- Task 2's Button/Primary variant once had a stray leftover text node from a copy/paste error — fixed during Task 7's review. Button now renders cleanly everywhere; if you see any Button instance with more than one text child, that's a NEW regression worth flagging.
- Task 8's review found that **Penpot's flex-layout bounds do not always recompute immediately after setting `flex.horizontalSizing`/`layoutChild.horizontalSizing` properties alone** — an explicit `shape.resize(w, h)` call (even to a shape's current height) was required in that session to force the layout engine to recompute, sometimes needing a short wait afterward before re-reading `bounds`. **For this task**: after building the form card and its rows, do NOT just trust the property assignments — after Step 2, explicitly check bounds/containment (e.g. `penpotUtils.isContainedIn` for each field/row against `formCard`, and text against its container) and call `resize()` where needed if anything doesn't fit, rather than assuming the flex properties alone produced correct final bounds.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 15 top-level shapes after this task (the 14 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar, Screen/Painel [likely named "Screen / Painel" with spaces — do not worry about matching its exact name, just count it], plus `Screen/LancarGasto` from this task).

## Task 9: Screen — Lançar gasto

**Files:** N/A (Penpot board: `Screen/LancarGasto`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.fieldInputComponent`, `storage.fieldSelectComponent`, `storage.fieldTextareaComponent`, `storage.radioPillComponent`, `storage.buttonComponent`.
- Produces: `Screen/LancarGasto` board, 1280px wide, with Sidebar + Topbar (title "Lançar gasto"), and a form `Card` (max-width 640) containing: Description input, a 2-column row (Category select + Date input), Value input, "Quem pagou" radio group (Nilton/Damaris), "Divisão" radio group (50/50, Individual, Empréstimo), Observação textarea, and a footer row with Primary button ("Salvar gasto") + Secondary button ("Cancelar"). This is a top-level board (not a library component) — do NOT wrap it in `createComponent`.

- [ ] **Step 1: Create screen, Sidebar, Topbar (title override)**

```js
const screen = penpot.createBoard();
screen.name = 'Screen/LancarGasto';
screen.resize(1280, 900);
screen.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }];

const sidebarInstance = storage.sidebarComponent.mainInstance().clone();
sidebarInstance.x = 0; sidebarInstance.y = 0;
screen.appendChild(sidebarInstance);
// Update nav highlight: clear Painel highlight, highlight "Lançar gasto"
const navPainel = penpotUtils.findShape(s => s.name === 'nav-Painel', sidebarInstance);
const navLancar = penpotUtils.findShape(s => s.name === 'nav-Lançar gasto', sidebarInstance);
if (navPainel) { navPainel.fills = []; navPainel.children[0].fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }]; }
if (navLancar) { navLancar.fills = [{ fillColor: '#F4F6F8', fillOpacity: 1 }]; navLancar.children[0].fills = [{ fillColor: '#1F2933', fillOpacity: 1 }]; }

const topbarInstance = storage.topbarComponent.mainInstance().clone();
topbarInstance.x = 232; topbarInstance.y = 0;
const eyebrow = penpotUtils.findShape(s => s.name === 'eyebrow', topbarInstance);
const title = penpotUtils.findShape(s => s.name === 'title', topbarInstance);
eyebrow.characters = 'NOVO LANÇAMENTO';
title.characters = 'Lançar gasto';
const rightGroup = penpotUtils.findShape(s => s.name === 'right', topbarInstance);
const balancePill = penpotUtils.findShape(s => s.name === 'balance-pill', topbarInstance);
if (balancePill) balancePill.remove();
screen.appendChild(topbarInstance);

storage.lancarScreen = screen;
return { created: 'Screen/LancarGasto' };
```

Expected: no error. Note: removing the balance pill leaves the "+ Novo gasto" button alone in the topbar's right side — acceptable, since this screen IS the "new expense" flow.

- [ ] **Step 2: Build the form card**

```js
const formCard = storage.cardComponent.instance();
formCard.detach();
formCard.name = 'form-card';
formCard.resize(640, 100);
formCard.flex.horizontalSizing = 'fix';
formCard.flex.verticalSizing = 'auto';
formCard.flex.rowGap = 20;

const descField = storage.fieldInputComponent.instance();
descField.detach();
penpotUtils.findShape(s => s.type === 'text', descField).characters = 'Despesa';
formCard.appendChild(descField);

const twoColRow = penpot.createBoard();
twoColRow.name = 'row-categoria-data';
twoColRow.resize(600, 66);
const rowFlex = twoColRow.addFlexLayout();
rowFlex.dir = 'row';
rowFlex.columnGap = 20;
rowFlex.horizontalSizing = 'auto';
rowFlex.verticalSizing = 'auto';
const catField = storage.fieldSelectComponent.instance();
catField.detach();
catField.children[0].characters = 'Categoria';
catField.layoutChild.horizontalSizing = 'fill';
twoColRow.appendChild(catField);
const dateField = storage.fieldInputComponent.instance();
dateField.detach();
dateField.children[0].characters = 'Data';
dateField.layoutChild.horizontalSizing = 'fill';
twoColRow.appendChild(dateField);
formCard.appendChild(twoColRow);

const valueField = storage.fieldInputComponent.instance();
valueField.detach();
valueField.children[0].characters = 'Valor total';
formCard.appendChild(valueField);

function radioGroup(groupLabel, options, selectedIndex) {
  const wrap = penpot.createBoard();
  wrap.name = `group-${groupLabel}`;
  wrap.resize(600, 70);
  const wrapFlex = wrap.addFlexLayout();
  wrapFlex.dir = 'column';
  wrapFlex.rowGap = 8;
  wrapFlex.horizontalSizing = 'auto';
  wrapFlex.verticalSizing = 'auto';
  const label = penpot.createText();
  label.characters = groupLabel;
  label.fontFamily = storage.fontName;
  label.fontSize = 13;
  label.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
  label.growType = 'auto-width';
  wrap.appendChild(label);
  const optionsRow = penpot.createBoard();
  optionsRow.name = 'options';
  optionsRow.resize(600, 40);
  const optFlex = optionsRow.addFlexLayout();
  optFlex.dir = 'row';
  optFlex.columnGap = 10;
  optFlex.horizontalSizing = 'auto';
  optFlex.verticalSizing = 'auto';
  options.forEach((opt, i) => {
    const variant = i === selectedIndex ? 'Selected' : 'Unselected';
    const pill = storage.radioPillComponent.variants.variantComponents().find(c => c.variantProps.State === variant).instance();
    pill.detach();
    pill.children[0].characters = opt;
    optionsRow.appendChild(pill);
  });
  wrap.appendChild(optionsRow);
  return wrap;
}

formCard.appendChild(radioGroup('Quem pagou', ['Nilton', 'Damaris'], 0));
formCard.appendChild(radioGroup('Divisão', ['Dividir 50/50', 'Individual', 'Empréstimo'], 0));

const obsField = storage.fieldTextareaComponent.instance();
obsField.detach();
obsField.children[0].characters = 'Observação (opcional)';
formCard.appendChild(obsField);

const footerRow = penpot.createBoard();
footerRow.name = 'footer-buttons';
footerRow.resize(300, 40);
const footerFlex = footerRow.addFlexLayout();
footerFlex.dir = 'row';
footerFlex.columnGap = 12;
footerFlex.horizontalSizing = 'auto';
footerFlex.verticalSizing = 'auto';
const saveBtn = storage.buttonComponent.variants.variantComponents().find(c => c.variantProps.Style === 'Primary').instance();
saveBtn.detach();
saveBtn.children[0].characters = 'Salvar gasto';
footerRow.appendChild(saveBtn);
const cancelBtn = storage.buttonComponent.variants.variantComponents().find(c => c.variantProps.Style === 'Secondary').instance();
cancelBtn.detach();
cancelBtn.children[0].characters = 'Cancelar';
footerRow.appendChild(cancelBtn);
formCard.appendChild(footerRow);

formCard.x = 232 + 32; formCard.y = 76 + 28;
storage.lancarScreen.appendChild(formCard);
storage.lancarFormCard = formCard;
return { created: 'form-card' };
```

Expected: no error; form card with all fields stacked vertically.

**After running Step 2, before moving on:** verify bounds actually settled correctly (per the Task 8 lesson above). At minimum check `penpotUtils.isContainedIn(twoColRow, formCard)`, `isContainedIn(catField, twoColRow)`, `isContainedIn(dateField, twoColRow)`, and that both radio groups' option pills are contained within their `optionsRow`/`wrap` boards, and the footer buttons are contained within `footerRow`. If any check returns false, call the appropriate `resize()` on the offending shape/container and re-check, following the pattern documented in Task 8's fix report.

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.lancarScreen;
const bottom = storage.lancarFormCard.y + storage.lancarFormCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm the form reads top-to-bottom: description, category/date row, value, quem-pagou pills, divisão pills, observação, then Salvar/Cancelar buttons — no overlapping fields, all within the card's bounds, no clipped/overflowing text (check each radio pill's text is fully inside its pill, same class of bug as Task 8's overflow issues).

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 15 top-level shapes: the 14 from before plus `Screen/LancarGasto` from this task. Delete any extras — do not delete any of these 15.

## Report

Write your completion report to `.superpowers/sdd/task-9-report.md`: what you built, any deviations from the brief, the containment-check results from Step 2, and the final `shapeStructure` output confirming exactly 15 top-level shapes.
