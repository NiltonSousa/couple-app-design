# Task 3 Brief — Card, Pill/Badge, and Tag components

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).
- Radius scale (px): radius.sm=12, radius.lg=20, radius.pill=999 (tokens already created in Task 1).
- **Known API gotcha (found during Task 2's review):** `penpot.createVariantFromComponents(...)` does NOT guarantee that `variants.variantComponents()` returns components in the same order as the input array. Assigning variant property values positionally (`comps[0]`, `comps[1]`, ...) can silently produce mislabeled variants (this bug was caught and fixed in Task 2's Button component). The code below already accounts for this by matching each `comp` to its source board via `comp.mainInstance().id` — do not simplify this back to positional assignment.
- **Workspace hygiene:** this task involves staging boards off to the side (e.g. `x=0,y=60`) before grouping them into variant components. After grouping, the staging boards become the variant components' main instances — do NOT leave extra duplicate/experimental boards on the page root. If you re-run a step after an error, delete the previous attempt's boards first so you don't accumulate debris (Task 2 left 19 stray boards on the page root after repeated staging attempts — avoid repeating this).

## Prior state (from Tasks 1-2, already complete) — REHYDRATE FIRST

The Penpot MCP plugin connection dropped once already during this plan and had to be reconnected — when that happens, the server-side `storage` object resets to empty, even though the actual Penpot file content (tokens, components) survives untouched. **Do not assume `storage.fontName`, `storage.colorTokens`, etc. are already populated.** Before Step 1, run this rehydration code first to (re)populate `storage` from live Penpot state — it's safe to run even if `storage` already has these values (it just re-derives them):

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

const buttonComp = penpot.library.local.components.find(c => c.name === 'Button');
if (!buttonComp) throw new Error('Button component not found');
storage.buttonComponent = buttonComp;

const buttonMain = buttonComp.variants.variantComponents()[0].mainInstance();
const label = buttonMain.children.find(c => c.type === 'text');
storage.fontName = label.fontFamily;

return {
  colorTokenCount: Object.keys(storage.colorTokens).length,
  spacingTokenCount: Object.keys(storage.spacingTokens).length,
  radiusTokenCount: Object.keys(storage.radiusTokens).length,
  fontSizeTokenCount: Object.keys(storage.fontSizeTokens).length,
  fontName: storage.fontName,
  buttonComponentName: storage.buttonComponent.name,
};
```

Expected: `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight', buttonComponentName: 'Button'`. If the MCP tool call fails with "No Penpot plugin instances are currently connected", the plugin has disconnected again — report BLOCKED and ask for reconnection rather than retrying blindly.

- The page currently has exactly 1 top-level shape: the `Button` variant container.

## Task 3: Card, Pill/Badge, and Tag components

**Files:** N/A (Penpot library components: `Card`, `Pill`, `StatusBadge`, `Tag`)

**Interfaces:**
- Consumes: `storage.colorTokens`, `storage.radiusTokens`, `storage.fontName` from Task 1.
- Produces:
  - `Card` component: a `Board` named `Card`, flex layout `dir: 'column'`, `rowGap: 20`, padding 20, white surface, `radius-lg` corners, `horizontalSizing`/`verticalSizing` = `'auto'`. Consumers append children directly via `instance.appendChild(...)`. Store as `storage.cardComponent`.
  - `Pill` variant component (`Accent`, `Danger`, `Neutral`) — small rounded label used for balance/status summaries. Text is `instance.children[0].characters`. Store as `storage.pillComponent`.
  - `StatusBadge` variant component (`Pendente`, `Quitado`) — pill with a leading dot (small `Ellipse`) + text. Store as `storage.statusBadgeComponent`.
  - `Tag` component — bordered rounded label, transparent background. Store as `storage.tagComponent`.
- Later tasks depend on these exact `storage` key names.

- [ ] **Step 1: Build Card**

```js
const card = penpot.createBoard();
card.name = 'Card';
card.resize(320, 100);
const flex = card.addFlexLayout();
flex.dir = 'column';
flex.rowGap = 20;
flex.horizontalPadding = 20;
flex.verticalPadding = 20;
flex.horizontalSizing = 'auto';
flex.verticalSizing = 'auto';
card.applyToken(storage.colorTokens['color.surface'], ['fill']);
card.applyToken(storage.colorTokens['color.border'], ['strokeColor']);
card.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];
card.applyToken(storage.radiusTokens['radius.lg'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);
storage.cardComponent = penpot.library.local.createComponent([card]);
storage.cardComponent.name = 'Card';
return { created: 'Card' };
```

Expected: no error; `storage.cardComponent` is a `LibraryComponent`.

- [ ] **Step 2: Build Pill variants (Accent, Danger, Neutral)**

```js
function makePill(name, bgToken, fgHex) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(80, 28);
  const flex = penpotUtils.addFlexLayout(board, 'row');
  flex.alignItems = 'center';
  flex.justifyContent = 'center';
  flex.horizontalPadding = 12;
  flex.verticalPadding = 5;
  const label = penpot.createText();
  label.characters = 'Pill';
  label.fontFamily = storage.fontName;
  label.fontSize = 12;
  label.fontWeight = '500';
  label.fills = [{ fillColor: fgHex, fillOpacity: 1 }];
  label.growType = 'auto-width';
  board.appendChild(label);
  board.applyToken(bgToken, ['fill']);
  board.applyToken(storage.radiusTokens['radius.pill'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);
  return board;
}

const t = storage.colorTokens;
const pillAccent = makePill('Pill/Accent', t['color.accent-soft'], '#1E4E82');
const pillDanger = makePill('Pill/Danger', t['color.danger-soft'], '#C1443A');
const pillNeutral = makePill('Pill/Neutral', t['color.border'], '#7C8A97');
pillAccent.x = 0; pillAccent.y = 60;
pillDanger.x = 100; pillDanger.y = 60;
pillNeutral.x = 200; pillNeutral.y = 60;

const container = penpot.createVariantFromComponents([pillAccent, pillDanger, pillNeutral]);
container.name = 'Pill';
container.variants.renameProperty(0, 'Tone');
const comps = container.variants.variantComponents();
// createVariantFromComponents does not guarantee variantComponents() order
// matches input array order — match each comp to its source board by id.
const idToTone = {
  [pillAccent.id]: 'Accent',
  [pillDanger.id]: 'Danger',
  [pillNeutral.id]: 'Neutral',
};
for (const comp of comps) {
  const tone = idToTone[comp.mainInstance().id];
  if (!tone) throw new Error('Could not match variant component to source board id=' + comp.mainInstance().id);
  comp.setVariantProperty(0, tone);
}
storage.pillComponent = container;
return { variants: comps.map(c => c.variantProps) };
```

Expected: returns the three `Tone` variant labels, each matched to its source board by id (not position). Verify by also checking fills: Accent should resolve to the accent-soft background, Danger to danger-soft, Neutral to the border-gray background.

- [ ] **Step 3: Build StatusBadge variants (Pendente, Quitado)**

```js
function makeBadge(name, bgToken, dotHex, fgHex, label) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(90, 24);
  const flex = penpotUtils.addFlexLayout(board, 'row');
  flex.alignItems = 'center';
  flex.justifyContent = 'center';
  flex.columnGap = 5;
  flex.horizontalPadding = 9;
  flex.verticalPadding = 3;

  const dot = penpot.createEllipse();
  dot.resize(6, 6);
  dot.fills = [{ fillColor: dotHex, fillOpacity: 1 }];
  board.appendChild(dot);

  const text = penpot.createText();
  text.characters = label;
  text.fontFamily = storage.fontName;
  text.fontSize = 12;
  text.fontWeight = '500';
  text.fills = [{ fillColor: fgHex, fillOpacity: 1 }];
  text.growType = 'auto-width';
  board.appendChild(text);

  board.applyToken(bgToken, ['fill']);
  board.applyToken(storage.radiusTokens['radius.pill'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);
  return board;
}

const t = storage.colorTokens;
const badgePendente = makeBadge('StatusBadge/Pendente', t['color.warn-soft'], '#C98A1F', '#8A6416', 'Pendente');
const badgeQuitado = makeBadge('StatusBadge/Quitado', t['color.accent-soft'], '#2563A8', '#1E4E82', 'Quitado');
badgePendente.x = 0; badgePendente.y = 120;
badgeQuitado.x = 120; badgeQuitado.y = 120;

const container = penpot.createVariantFromComponents([badgePendente, badgeQuitado]);
container.name = 'StatusBadge';
container.variants.renameProperty(0, 'Status');
const comps = container.variants.variantComponents();
// Match by source board id, not array position.
const idToStatus = {
  [badgePendente.id]: 'Pendente',
  [badgeQuitado.id]: 'Quitado',
};
for (const comp of comps) {
  const status = idToStatus[comp.mainInstance().id];
  if (!status) throw new Error('Could not match variant component to source board id=' + comp.mainInstance().id);
  comp.setVariantProperty(0, status);
}
storage.statusBadgeComponent = container;
return { variants: comps.map(c => c.variantProps) };
```

Expected: returns the two `Status` variant labels, each matched to its source board by id (not position). Verify: Pendente = warn-soft background with amber dot, Quitado = accent-soft background with blue dot.

- [ ] **Step 4: Build Tag**

```js
const tag = penpot.createBoard();
tag.name = 'Tag';
tag.resize(70, 22);
const flex = penpotUtils.addFlexLayout(tag, 'row');
flex.alignItems = 'center';
flex.justifyContent = 'center';
flex.horizontalPadding = 9;
flex.verticalPadding = 3;
const text = penpot.createText();
text.characters = 'Tag';
text.fontFamily = storage.fontName;
text.fontSize = 12;
text.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
text.growType = 'auto-width';
tag.appendChild(text);
tag.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];
tag.fills = [];
tag.applyToken(storage.colorTokens['color.border'], ['strokeColor']);
tag.applyToken(storage.radiusTokens['radius.pill'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);
tag.x = 0; tag.y = 150;
storage.tagComponent = penpot.library.local.createComponent([tag]);
storage.tagComponent.name = 'Tag';
return { created: 'Tag' };
```

Expected: no error.

- [ ] **Step 5: Verify visually and clean up**

`export_shape` on `storage.pillComponent.id` and `storage.statusBadgeComponent.id` (fetch ids via a small `execute_code` call first). Confirm pill/badge colors match the soft-tone palette and text is legible.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 5 top-level shapes: the `Button` variant container (from Task 2), `Card`, `Pill`, `StatusBadge`, and `Tag`. If there are more (leftover staging boards), delete the extras — do not delete `Button`, `Card`, `Pill`, `StatusBadge`, or `Tag` themselves.
