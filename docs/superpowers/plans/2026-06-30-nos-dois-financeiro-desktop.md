# Nós Dois — Módulo Financeiro (Desktop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the desktop version of the "Nós Dois" Financeiro module (4 screens) as an editable, component-based design directly inside Penpot, using the Penpot MCP `execute_code` tool.

**Architecture:** Bottom-up build inside a single Penpot file/page: (1) design tokens for color/spacing/radius/typography, (2) base library components (buttons, cards, badges, form fields, avatars), (3) composite components (sidebar, topbar) built from the base components, (4) 4 screen boards (1280px wide) assembled from the composites using Penpot flex layout. No code/HTML is generated — output lives entirely in the connected Penpot file.

**Tech Stack:** Penpot (self-hosted, `localhost:9001`) via the Penpot MCP plugin (`mcp__penpot__execute_code`, `mcp__penpot__export_shape`, `mcp__penpot__penpot_api_info`). No git repo in this project directory — "commit" steps are replaced with a checkpoint note in Penpot (renaming/organizing is enough; there is no VCS to commit to).

## Global Constraints

- Visual direction: **Calmo / Minimalista** — soft neutral background, blue accent, generous rounding (12–20px), generous spacing. No monospace font (unlike the discarded "tech" direction) — single sans family throughout.
- Desktop only in this plan (1280px board width). Mobile variants are a separate follow-up plan.
- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI, so the design stays reproducible and inspectable.
- Use `penpotUtils` helpers (`findShape`, `findShapes`, `shapeStructure`, `addFlexLayout`) instead of hand-rolled traversal, per the Penpot MCP overview.
- After each task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`) on the newly created top-level shape — do not just trust that `execute_code` returned without error.
- All monetary example values use Brazilian Real formatting (`R$ 1.234,56`) as plain text — no live formatting logic is needed since this is a static design, not the app itself.
- Colors (hex, all caps, from the approved "calm" mockup):
  - `bg` = `#F4F6F8` (page background)
  - `surface` = `#FFFFFF` (card/board background)
  - `fg` = `#1F2933` (primary text)
  - `muted` = `#7C8A97` (secondary text)
  - `border` = `#E1E7EC`
  - `accent` = `#2563A8` (primary blue: CTAs, positive values)
  - `accent-soft` = `#E3F0FF` (accent background tint)
  - `danger` = `#C1443A` (owed-to-partner / negative)
  - `danger-soft` = `#FBE7E4`
  - `warn` = `#C98A1F` (pendente status)
  - `warn-soft` = `#FBEED9`
- Spacing scale (px): `xs`=8, `sm`=12, `md`=20, `lg`=28, `xl`=40
- Radius scale (px): `radius`=12 (inputs/buttons), `radius-lg`=20 (cards), `pill`=999 (badges/pills)
- Font sizes (px): `h1`=28, `h2`=20, `h3`=15, `body`=14, `meta`=12, `stat`=32
- Font family: use whatever default sans font is available in the Penpot instance's font list (check via `penpot.fonts` in Task 1 and record the exact name used — all subsequent tasks must reuse that same font).

---

### Task 1: Design tokens

**Files:** N/A (Penpot file: token set `Nós Dois` in `penpot.library.local.tokens`)

**Interfaces:**
- Produces: a token set named `Nós Dois` containing color tokens (`color.bg`, `color.surface`, `color.fg`, `color.muted`, `color.border`, `color.accent`, `color.accent-soft`, `color.danger`, `color.danger-soft`, `color.warn`, `color.warn-soft`), spacing tokens (`spacing.xs`, `spacing.sm`, `spacing.md`, `spacing.lg`, `spacing.xl`), border-radius tokens (`radius.sm`, `radius.lg`, `radius.pill`), and dimension tokens for font size (`fontsize.h1`, `fontsize.h2`, `fontsize.h3`, `fontsize.body`, `fontsize.meta`, `fontsize.stat`). All later tasks apply these tokens to shapes via `shape.applyToken(token, properties)` instead of hardcoding hex/px values.
- Also produces: `storage.fontName` — the exact font family name (string) used for all text in this plan, discovered from `penpot.fonts`.

- [ ] **Step 1: Discover available font and pick one**

Run via `mcp__penpot__execute_code`:

```js
const fonts = penpot.fonts.all ? penpot.fonts.all() : [];
// Fallback: try common names if `.all()` isn't available
const candidates = ['Inter', 'Work Sans', 'Roboto', 'Source Sans Pro'];
let chosen = null;
for (const name of candidates) {
  const f = penpot.fonts.findByName(name);
  if (f) { chosen = f; break; }
}
if (!chosen && fonts.length > 0) chosen = fonts[0];
if (!chosen) throw new Error('No fonts available in this Penpot instance');
storage.fontName = chosen.name;
storage.font = chosen;
return { fontName: chosen.name, variants: chosen.variants.map(v => v.fontWeight) };
```

Expected: returns a font name and a list of available weights (must include at least a regular ~400 and a semibold/bold ~600-700 weight; if not, pick the closest available and note it in `storage.fontWeightRegular` / `storage.fontWeightBold`).

- [ ] **Step 2: Create the token set and color tokens**

```js
const tokens = penpot.library.local.tokens;
const set = tokens.addSet({ name: 'Nós Dois' });
if (!set.active) set.toggleActive();

const colors = {
  'color.bg': '#F4F6F8',
  'color.surface': '#FFFFFF',
  'color.fg': '#1F2933',
  'color.muted': '#7C8A97',
  'color.border': '#E1E7EC',
  'color.accent': '#2563A8',
  'color.accent-soft': '#E3F0FF',
  'color.danger': '#C1443A',
  'color.danger-soft': '#FBE7E4',
  'color.warn': '#C98A1F',
  'color.warn-soft': '#FBEED9',
};
storage.colorTokens = {};
for (const [name, value] of Object.entries(colors)) {
  storage.colorTokens[name] = set.addToken({ type: 'color', name, value });
}
storage.tokenSet = set;
return { created: Object.keys(colors) };
```

Expected: returns the 11 color token names with no error.

- [ ] **Step 3: Create spacing, radius, and font-size tokens**

```js
const set = storage.tokenSet;
const spacing = { 'spacing.xs': 8, 'spacing.sm': 12, 'spacing.md': 20, 'spacing.lg': 28, 'spacing.xl': 40 };
const radius = { 'radius.sm': 12, 'radius.lg': 20, 'radius.pill': 999 };
const fontsize = { 'fontsize.h1': 28, 'fontsize.h2': 20, 'fontsize.h3': 15, 'fontsize.body': 14, 'fontsize.meta': 12, 'fontsize.stat': 32 };

storage.spacingTokens = {};
for (const [name, value] of Object.entries(spacing)) {
  storage.spacingTokens[name] = set.addToken({ type: 'spacing', name, value: String(value) });
}
storage.radiusTokens = {};
for (const [name, value] of Object.entries(radius)) {
  storage.radiusTokens[name] = set.addToken({ type: 'borderRadius', name, value: String(value) });
}
storage.fontSizeTokens = {};
for (const [name, value] of Object.entries(fontsize)) {
  storage.fontSizeTokens[name] = set.addToken({ type: 'fontSizes', name, value: String(value) });
}
return { spacing: Object.keys(spacing), radius: Object.keys(radius), fontsize: Object.keys(fontsize) };
```

Expected: returns all created token names with no error.

- [ ] **Step 4: Verify token set**

```js
return penpotUtils.tokenOverview();
```

Expected: shows `Nós Dois` set containing `color` (11), `spacing` (5), `borderRadius` (3), `fontSizes` (6) token type buckets.

- [ ] **Step 5: Checkpoint**

No git commit (no VCS in this project). Rename the current Penpot page from "Page 1" to "Nós Dois — Financeiro (Desktop)" for orientation:

```js
const page = penpotUtils.getPageByName('Page 1') || penpot.root.parent;
const p = penpotUtils.getPageById(penpot.root.id) || penpot.currentFile?.pages?.[0];
// Use the page that currently owns penpot.root
const currentPage = penpotUtils.getPages()[0];
const pg = penpotUtils.getPageById(currentPage.id);
pg.name = 'Nós Dois — Financeiro (Desktop)';
return { renamed: pg.name };
```

Expected: page renamed with no error.

---

### Task 2: Button component (all variants)

**Files:** N/A (Penpot library component: `Button`)

**Interfaces:**
- Consumes: `storage.tokenSet`, `storage.colorTokens`, `storage.fontName` from Task 1.
- Produces: a Penpot `LibraryVariantComponent` group named `Button` with variants `Primary`, `Secondary`, `Ghost`. Each main instance is a `Board` named `Button/<Variant>` with flex layout (`dir: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, height fixed 40, horizontal padding 16, gap 8), containing one `Text` child (label). Later tasks instantiate via `component.instance()` and set `instance.children[0].characters` to the desired label.

- [ ] **Step 1: Build the three button boards**

```js
function makeButton(name, bg, fg, border) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(120, 40);
  board.fills = [{ fillColor: bg, fillOpacity: 1 }];
  board.borderRadius = 12;
  if (border) board.strokes = [{ strokeColor: border, strokeWidth: 1, strokeAlignment: 'inner' }];
  else board.strokes = [];

  const label = penpot.createText();
  label.characters = 'Button';
  label.fontFamily = storage.fontName;
  label.fontSize = 14;
  label.fontWeight = '600';
  label.fills = [{ fillColor: fg, fillOpacity: 1 }];
  label.growType = 'auto-width';
  board.appendChild(label);

  const flex = penpotUtils.addFlexLayout(board, 'row');
  flex.alignItems = 'center';
  flex.justifyContent = 'center';
  flex.horizontalPadding = 16;
  flex.verticalPadding = 10;
  board.resize(board.width, 40);
  return board;
}

storage.buttonPrimary = makeButton('Button/Primary', '#2563A8', '#FFFFFF', null);
storage.buttonSecondary = makeButton('Button/Secondary', '#FFFFFF', '#1F2933', '#E1E7EC');
storage.buttonGhost = makeButton('Button/Ghost', '#00000000', '#7C8A97', null);
// Position them in a row so they don't overlap, off to the side as a staging area
storage.buttonPrimary.x = 0; storage.buttonPrimary.y = 0;
storage.buttonSecondary.x = 160; storage.buttonSecondary.y = 0;
storage.buttonGhost.x = 320; storage.buttonGhost.y = 0;
return { created: ['Button/Primary', 'Button/Secondary', 'Button/Ghost'] };
```

Expected: three boards created with no error.

- [ ] **Step 2: Apply color/radius tokens instead of raw hex**

```js
const t = storage.colorTokens;
const r = storage.radiusTokens;
storage.buttonPrimary.applyToken(t['color.accent'], ['fill']);
storage.buttonPrimary.children[0].applyToken(t['color.surface'], ['fill']);
storage.buttonPrimary.applyToken(r['radius.sm'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);

storage.buttonSecondary.applyToken(t['color.surface'], ['fill']);
storage.buttonSecondary.applyToken(t['color.border'], ['strokeColor']);
storage.buttonSecondary.children[0].applyToken(t['color.fg'], ['fill']);
storage.buttonSecondary.applyToken(r['radius.sm'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);

storage.buttonGhost.children[0].applyToken(t['color.muted'], ['fill']);
return { applied: true };
```

Expected: no error; token application is async, so a follow-up read (next step) should reflect resolved colors.

- [ ] **Step 3: Group into a variant component and rename variants**

```js
const container = penpot.createVariantFromComponents([storage.buttonPrimary, storage.buttonSecondary, storage.buttonGhost]);
container.name = 'Button';
const variants = container.variants;
variants.renameProperty(0, 'Style');
const comps = variants.variantComponents();
// IMPORTANT: createVariantFromComponents does NOT guarantee variantComponents()
// order matches the input array order — match each comp to its source board by
// id instead of assuming position (confirmed bug: positional assignment silently
// swapped Secondary/Ghost in an earlier build of this component).
const idToStyle = {
  [storage.buttonPrimary.id]: 'Primary',
  [storage.buttonSecondary.id]: 'Secondary',
  [storage.buttonGhost.id]: 'Ghost',
};
for (const comp of comps) {
  const style = idToStyle[comp.mainInstance().id];
  if (!style) throw new Error('Could not match variant component to source board id=' + comp.mainInstance().id);
  comp.setVariantProperty(0, style);
}
storage.buttonComponent = container;
return { variantContainer: container.name, variants: comps.map(c => c.variantProps) };
```

Expected: returns `{ Style: 'Primary' }`, `{ Style: 'Secondary' }`, `{ Style: 'Ghost' }` — verify by also checking each variant's `mainInstance()` fill color matches its label (Primary=blue, Secondary=white+border, Ghost=transparent+muted), not just the label string.

- [ ] **Step 4: Verify visually**

Use `mcp__penpot__export_shape` with `shapeId` set to `storage.buttonComponent.id` (read the id first via a small `execute_code` call: `return storage.buttonComponent.id;`), format `png`. Confirm the three buttons render with correct fills/labels (blue solid, white bordered, transparent muted-text).

---

### Task 3: Card, Pill/Badge, and Tag components

**Files:** N/A (Penpot library components: `Card`, `Pill`, `StatusBadge`, `Tag`)

**Interfaces:**
- Consumes: `storage.colorTokens`, `storage.radiusTokens`, `storage.fontName` from Task 1.
- Produces:
  - `Card` component: a `Board` named `Card`, flex layout `dir: 'column'`, `rowGap: 20`, padding 20, white surface, `radius-lg` corners, `horizontalSizing`/`verticalSizing` = `'auto'`. Consumers append children directly via `instance.appendChild(...)`.
  - `Pill` variant component (`Accent`, `Danger`, `Neutral`) — small rounded label used for balance/status summaries. Text is `instance.children[0].characters`.
  - `StatusBadge` variant component (`Pendente`, `Quitado`) — pill with a leading dot (small `Ellipse`) + text.
  - `Tag` component — bordered rounded label, transparent background.

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

Expected: returns the three `Tone` variant labels, each matched to its source board by id (not position).

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
// Match by source board id, not array position (see Task 2 note).
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

Expected: returns the two `Status` variant labels, each matched to its source board by id (not position).

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

- [ ] **Step 5: Verify visually**

`export_shape` on `storage.pillComponent.id` and `storage.statusBadgeComponent.id` (fetch ids via a small `execute_code` call first). Confirm pill/badge colors match the soft-tone palette and text is legible.

---

### Task 4: Form field components

**Files:** N/A (Penpot library components: `Field/Input`, `Field/Select`, `Field/Textarea`, `RadioPill`)

**Interfaces:**
- Consumes: `storage.colorTokens`, `storage.radiusTokens`, `storage.fontName`.
- Produces: `Field/Input`, `Field/Select`, `Field/Textarea` boards (each: label `Text` above a bordered input rectangle, flex `dir: 'column'`, `rowGap: 6`), and a `RadioPill` variant component (`Unselected`, `Selected`) — a bordered pill that later screens duplicate and relabel per option (e.g. "Nilton", "Damaris", "Dividir 50/50").

- [ ] **Step 1: Build Field/Input (also used as the visual base for Select — same look, different affordance noted only via layer name)**

```js
function makeField(name, height, placeholder) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(280, height + 42);
  const flex = board.addFlexLayout();
  flex.dir = 'column';
  flex.rowGap = 6;
  flex.horizontalSizing = 'auto';
  flex.verticalSizing = 'auto';

  const label = penpot.createText();
  label.characters = 'Campo';
  label.fontFamily = storage.fontName;
  label.fontSize = 13;
  label.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
  label.growType = 'auto-width';
  board.appendChild(label);

  const input = penpot.createBoard();
  input.name = 'input-box';
  input.resize(280, height);
  const inputFlex = input.addFlexLayout();
  inputFlex.dir = 'row';
  inputFlex.alignItems = 'center';
  inputFlex.horizontalPadding = 12;
  input.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];
  input.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
  input.applyToken(storage.radiusTokens['radius.sm'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);

  const placeholderText = penpot.createText();
  placeholderText.characters = placeholder;
  placeholderText.fontFamily = storage.fontName;
  placeholderText.fontSize = 14;
  placeholderText.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
  placeholderText.growType = 'auto-width';
  input.appendChild(placeholderText);

  board.appendChild(input);
  label.applyToken(storage.colorTokens['color.muted'], ['fill']);
  input.applyToken(storage.colorTokens['color.surface'], ['fill']);
  input.applyToken(storage.colorTokens['color.border'], ['strokeColor']);
  return board;
}

storage.fieldInput = makeField('Field/Input', 40, 'Ex.: Hotel Caraíva');
storage.fieldSelect = makeField('Field/Select', 40, 'Selecione');
storage.fieldTextarea = makeField('Field/Textarea', 80, 'Observação (opcional)');
storage.fieldInput.x = 0; storage.fieldInput.y = 200;
storage.fieldSelect.x = 320; storage.fieldSelect.y = 200;
storage.fieldTextarea.x = 640; storage.fieldTextarea.y = 200;

storage.fieldInputComponent = penpot.library.local.createComponent([storage.fieldInput]);
storage.fieldInputComponent.name = 'Field/Input';
storage.fieldSelectComponent = penpot.library.local.createComponent([storage.fieldSelect]);
storage.fieldSelectComponent.name = 'Field/Select';
storage.fieldTextareaComponent = penpot.library.local.createComponent([storage.fieldTextarea]);
storage.fieldTextareaComponent.name = 'Field/Textarea';
return { created: ['Field/Input', 'Field/Select', 'Field/Textarea'] };
```

Expected: no error; three separate field components created.

- [ ] **Step 2: Build RadioPill variants (Unselected, Selected)**

```js
function makeRadioPill(name, selected) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(140, 40);
  const flex = board.addFlexLayout();
  flex.dir = 'row';
  flex.alignItems = 'center';
  flex.horizontalPadding = 14;
  flex.horizontalSizing = 'auto';
  flex.verticalSizing = 'fix';
  board.strokes = [{ strokeColor: selected ? '#1F2933' : '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];
  board.fills = [{ fillColor: selected ? '#EDEFF1' : '#FFFFFF', fillOpacity: 1 }];
  board.applyToken(storage.radiusTokens['radius.sm'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);

  const label = penpot.createText();
  label.characters = 'Opção';
  label.fontFamily = storage.fontName;
  label.fontSize = 14;
  label.fontWeight = selected ? '600' : '400';
  label.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
  label.growType = 'auto-width';
  board.appendChild(label);
  return board;
}

const unselected = makeRadioPill('RadioPill/Unselected', false);
const selected = makeRadioPill('RadioPill/Selected', true);
unselected.x = 0; unselected.y = 400;
selected.x = 160; selected.y = 400;

const container = penpot.createVariantFromComponents([unselected, selected]);
container.name = 'RadioPill';
container.variants.renameProperty(0, 'State');
const comps = container.variants.variantComponents();
// Match by source board id, not array position (see Task 2 note).
const idToState = {
  [unselected.id]: 'Unselected',
  [selected.id]: 'Selected',
};
for (const comp of comps) {
  const state = idToState[comp.mainInstance().id];
  if (!state) throw new Error('Could not match variant component to source board id=' + comp.mainInstance().id);
  comp.setVariantProperty(0, state);
}
storage.radioPillComponent = container;
return { variants: comps.map(c => c.variantProps) };
```

Expected: returns the two `State` variant labels, each matched to its source board by id (not position).

- [ ] **Step 3: Verify visually**

`export_shape` on the ids of `fieldInputComponent`, `fieldSelectComponent`, `fieldTextareaComponent`, and `radioPillComponent` (fetch ids first). Confirm inputs show a label above a bordered rounded box, and radio pills show the visual difference between selected/unselected.

---

### Task 5: Avatar and StatCard components

**Files:** N/A (Penpot library components: `Avatar`, `StatCard`)

**Interfaces:**
- Consumes: `storage.fontName`, `storage.colorTokens`, `storage.radiusTokens`.
- Produces: `Avatar` variant component (`N`, `D` — initials for Nilton/Damaris), `StatCard` component (label + large number, built on top of the `Card` visual pattern but as its own standalone component since it has a fixed 2-row internal layout).

- [ ] **Step 1: Build Avatar variants**

```js
function makeAvatar(name, initial, bgHex) {
  const board = penpot.createBoard();
  board.name = name;
  board.resize(32, 32);
  const flex = board.addFlexLayout();
  flex.dir = 'row';
  flex.alignItems = 'center';
  flex.justifyContent = 'center';
  board.fills = [{ fillColor: bgHex, fillOpacity: 1 }];
  board.borderRadius = 999;

  const text = penpot.createText();
  text.characters = initial;
  text.fontFamily = storage.fontName;
  text.fontSize = 13;
  text.fontWeight = '600';
  text.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
  text.growType = 'auto-width';
  board.appendChild(text);
  return board;
}

const avatarN = makeAvatar('Avatar/N', 'N', '#3F6FA8');
const avatarD = makeAvatar('Avatar/D', 'D', '#A85C8F');
avatarN.x = 0; avatarN.y = 500;
avatarD.x = 60; avatarD.y = 500;

const container = penpot.createVariantFromComponents([avatarN, avatarD]);
container.name = 'Avatar';
container.variants.renameProperty(0, 'Person');
const comps = container.variants.variantComponents();
// Match by source board id, not array position (see Task 2 note).
const idToPerson = {
  [avatarN.id]: 'Nilton',
  [avatarD.id]: 'Damaris',
};
for (const comp of comps) {
  const person = idToPerson[comp.mainInstance().id];
  if (!person) throw new Error('Could not match variant component to source board id=' + comp.mainInstance().id);
  comp.setVariantProperty(0, person);
}
storage.avatarComponent = container;
return { variants: comps.map(c => c.variantProps) };
```

Expected: returns `{ Person: 'Nilton' }`, `{ Person: 'Damaris' }`.

- [ ] **Step 2: Build StatCard**

```js
const stat = penpot.createBoard();
stat.name = 'StatCard';
stat.resize(220, 90);
const flex = stat.addFlexLayout();
flex.dir = 'column';
flex.rowGap = 4;
flex.horizontalPadding = 20;
flex.verticalPadding = 20;
flex.horizontalSizing = 'auto';
flex.verticalSizing = 'auto';
stat.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
stat.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];
stat.applyToken(storage.radiusTokens['radius.lg'], ['borderRadiusTopLeft', 'borderRadiusTopRight', 'borderRadiusBottomRight', 'borderRadiusBottomLeft']);

const label = penpot.createText();
label.characters = 'Total lançado este mês';
label.fontFamily = storage.fontName;
label.fontSize = 13;
label.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
label.growType = 'auto-width';
stat.appendChild(label);

const value = penpot.createText();
value.name = 'value';
value.characters = 'R$ 2.480,00';
value.fontFamily = storage.fontName;
value.fontSize = 32;
value.fontWeight = '600';
value.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
value.growType = 'auto-width';
stat.appendChild(value);

stat.x = 300; stat.y = 500;
storage.statCardComponent = penpot.library.local.createComponent([stat]);
storage.statCardComponent.name = 'StatCard';
return { created: 'StatCard' };
```

Expected: no error.

- [ ] **Step 3: Verify visually**

`export_shape` on `avatarComponent.id` and `statCardComponent.id`. Confirm avatar circles show initials on colored backgrounds, and the stat card shows a small muted label above a large bold number.

---

### Task 6: Sidebar composite

**Files:** N/A (Penpot library component: `Sidebar`)

**Interfaces:**
- Consumes: `storage.avatarComponent` (Task 5), `storage.fontName`, `storage.colorTokens`.
- Produces: `Sidebar` component — a `Board` 232px wide, full content height (900px for design purposes), flex `dir: 'column'`, containing: brand row (small mark + "Nós Dois" wordmark), 3 nav links (`Painel`, `Lançar gasto`, `Histórico` — plain text rows, no icons in this pass since icon assets are out of scope), and a footer row with both avatars + "Nilton & Damaris" text. Screens append this via `component.instance()` at `x=0, y=0`.

- [ ] **Step 1: Build the Sidebar board**

```js
const sidebar = penpot.createBoard();
sidebar.name = 'Sidebar';
sidebar.resize(232, 900);
const flex = sidebar.addFlexLayout();
flex.dir = 'column';
flex.rowGap = 24;
flex.horizontalPadding = 16;
flex.verticalPadding = 24;
sidebar.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
sidebar.strokes = [{ strokeColor: '#E1E7EC', strokeWidth: 1, strokeAlignment: 'inner' }];

// Brand row
const brand = penpot.createBoard();
brand.name = 'brand';
brand.resize(200, 32);
const brandFlex = brand.addFlexLayout();
brandFlex.dir = 'row';
brandFlex.alignItems = 'center';
brandFlex.columnGap = 10;
const mark = penpot.createBoard();
mark.name = 'mark';
mark.resize(28, 28);
mark.fills = [{ fillColor: '#2563A8', fillOpacity: 1 }];
mark.borderRadius = 8;
const markText = penpot.createText();
markText.characters = 'ND';
markText.fontFamily = storage.fontName;
markText.fontSize = 12;
markText.fontWeight = '600';
markText.fills = [{ fillColor: '#FFFFFF', fillOpacity: 1 }];
markText.growType = 'auto-width';
mark.appendChild(markText);
penpotUtils.addFlexLayout(mark, 'row').alignItems = 'center';
mark.flex.justifyContent = 'center';
brand.appendChild(mark);
const brandName = penpot.createText();
brandName.characters = 'Nós Dois';
brandName.fontFamily = storage.fontName;
brandName.fontSize = 14;
brandName.fontWeight = '600';
brandName.fills = [{ fillColor: '#1F2933', fillOpacity: 1 }];
brandName.growType = 'auto-width';
brand.appendChild(brandName);
sidebar.appendChild(brand);

// Nav links
const navLabels = ['Painel', 'Lançar gasto', 'Histórico'];
for (const label of navLabels) {
  const link = penpot.createBoard();
  link.name = `nav-${label}`;
  link.resize(200, 40);
  const linkFlex = link.addFlexLayout();
  linkFlex.dir = 'row';
  linkFlex.alignItems = 'center';
  linkFlex.horizontalPadding = 12;
  linkFlex.horizontalSizing = 'fill';
  link.fills = label === 'Painel' ? [{ fillColor: '#F4F6F8', fillOpacity: 1 }] : [];
  link.borderRadius = 12;
  const text = penpot.createText();
  text.characters = label;
  text.fontFamily = storage.fontName;
  text.fontSize = 14;
  text.fontWeight = '500';
  text.fills = [{ fillColor: label === 'Painel' ? '#1F2933' : '#7C8A97', fillOpacity: 1 }];
  text.growType = 'auto-width';
  link.appendChild(text);
  sidebar.appendChild(link);
}

// Footer (avatars + names) — placed via a spacer trick: fill-sizing on nav area not needed since board itself has fixed height
const footer = penpot.createBoard();
footer.name = 'footer';
footer.resize(200, 32);
const footerFlex = footer.addFlexLayout();
footerFlex.dir = 'row';
footerFlex.alignItems = 'center';
footerFlex.columnGap = 8;
const avatarNInstance = storage.avatarComponent.variants.variantComponents().find(c => c.variantProps.Person === 'Nilton').instance();
const avatarDInstance = storage.avatarComponent.variants.variantComponents().find(c => c.variantProps.Person === 'Damaris').instance();
footer.appendChild(avatarNInstance);
footer.appendChild(avatarDInstance);
const footerText = penpot.createText();
footerText.characters = 'Nilton & Damaris';
footerText.fontFamily = storage.fontName;
footerText.fontSize = 13;
footerText.fills = [{ fillColor: '#7C8A97', fillOpacity: 1 }];
footerText.growType = 'auto-width';
footer.appendChild(footerText);
sidebar.appendChild(footer);
footer.layoutChild.marginTop = 'auto'; // push to bottom if supported; otherwise leave in flow

sidebar.applyToken(storage.colorTokens['color.surface'], ['fill']);
sidebar.applyToken(storage.colorTokens['color.border'], ['strokeColor']);
sidebar.x = 0; sidebar.y = 700;

storage.sidebarComponent = penpot.library.local.createComponent([sidebar]);
storage.sidebarComponent.name = 'Sidebar';
return { created: 'Sidebar' };
```

Expected: no error. If `footer.layoutChild.marginTop = 'auto'` throws (property may not accept the string `'auto'` — check via `penpot_api_info` for `LayoutChildProperties` if it fails), drop that line; the footer will simply sit directly below the nav links instead of being pinned to the bottom. This is a cosmetic detail, not a blocker — note it in the task's completion notes either way.

- [ ] **Step 2: Verify visually**

`export_shape` on `sidebarComponent.id`. Confirm: brand mark + "Nós Dois" at top, 3 nav rows with "Painel" highlighted, avatars + names near the bottom.

---

### Task 7: Topbar composite

**Files:** N/A (Penpot library component: `Topbar`)

**Interfaces:**
- Consumes: `storage.buttonComponent` (Task 2), `storage.pillComponent` (Task 3), `storage.fontName`.
- Produces: `Topbar` component — a `Board` 1048px wide (1280 board width − 232 sidebar), flex `dir: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`, containing a left text stack (eyebrow label + `h2` title) and a right-side row (balance `Pill` instance + primary `Button` instance labeled "+ Novo gasto"). Screens append this at `x=232, y=0`, and each screen overrides the eyebrow/title text and the pill's tone/label per its own content.

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

Expected: no error.

- [ ] **Step 2: Verify visually**

`export_shape` on `topbarComponent.id`. Confirm left-aligned eyebrow+title, right-aligned pill+button, spaced apart.

---

### Task 8: Screen — Painel/Resumo

**Files:** N/A (Penpot board: `Screen/Painel`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent` (whose cloned instance already contains a `balance-pill`-named `Pill` instance from Task 7 — edited in place, not re-instantiated), `storage.statCardComponent`, `storage.cardComponent`, `storage.colorTokens`, `storage.fontName`.
- Produces: a top-level `Board` named `Screen/Painel`, 1280px wide, auto height, containing a `Sidebar` instance at (0,0), a `Topbar` instance at (232,0) with title "Resumo do casal", and a content area below with: 3 `StatCard` instances in a row (Total do mês, Saldo, Pendentes), a 2-column row below (Últimos lançamentos card + Por categoria card) with example data as plain text rows.

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

---

### Task 9: Screen — Lançar gasto

**Files:** N/A (Penpot board: `Screen/LancarGasto`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.fieldInputComponent`, `storage.fieldSelectComponent`, `storage.fieldTextareaComponent`, `storage.radioPillComponent`, `storage.buttonComponent`.
- Produces: `Screen/LancarGasto` board, 1280px wide, with Sidebar + Topbar (title "Lançar gasto"), and a form `Card` (max-width 640) containing: Description input, a 2-column row (Category select + Date input), Value input, "Quem pagou" radio group (Nilton/Damaris), "Divisão" radio group (50/50, Individual, Empréstimo), Observação textarea, and a footer row with Primary button ("Salvar gasto") + Secondary button ("Cancelar").

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

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.lancarScreen;
const bottom = storage.lancarFormCard.y + storage.lancarFormCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm the form reads top-to-bottom: description, category/date row, value, quem-pagou pills, divisão pills, observação, then Salvar/Cancelar buttons — no overlapping fields, all within the card's bounds.

---

### Task 10: Screen — Histórico

**Files:** N/A (Penpot board: `Screen/Historico`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.fieldSelectComponent`, `storage.buttonComponent`, `storage.statusBadgeComponent`, `storage.tagComponent`.
- Produces: `Screen/Historico` board with Sidebar + Topbar (title "Histórico de gastos"), a filter `Card` (3 selects: Categoria/Pago por/Status side by side), and a table built from stacked rows inside a `Card` (header row + 4 example data rows + a total row), each row showing date, description (+tag if parcelado), category tag, payer, value, status badge, and an action label ("Quitar"/"Reabrir").

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

Expected: no error; 3 filter selects side by side.

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

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.historicoScreen;
const bottom = storage.historicoTableCard.y + storage.historicoTableCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm filters row, then a table-like card with a clear header row, 4 legible data rows, and a total row at the bottom.

---

### Task 11: Screen — Detalhe do saldo

**Files:** N/A (Penpot board: `Screen/DetalheSaldo`)

**Interfaces:**
- Consumes: `storage.sidebarComponent`, `storage.topbarComponent`, `storage.cardComponent`, `storage.buttonComponent`.
- Produces: `Screen/DetalheSaldo` board with Sidebar + Topbar (title "Saldo entre vocês"), a summary `Card` at top showing the aggregate balance ("Damaris deve R$ 120,00" as a large stat, using the same visual pattern as StatCard but inline), and a list `Card` of individual pending items that compose the balance — each row shows description, value (the half or full amount that counts toward the balance), and a "Quitar" button (`Button` component, `Secondary` variant) — demonstrating that each item can be settled independently while others stay pending.

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

Expected: no error; large red-toned balance figure (since example shows Damaris owing — danger color) under a muted label.

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

- [ ] **Step 3: Resize screen and verify visually**

```js
const screen = storage.saldoScreen;
const bottom = storage.saldoItemsCard.y + storage.saldoItemsCard.height + 40;
screen.resize(1280, Math.max(bottom, 900));
return { finalHeight: screen.height };
```

Then `export_shape` on `screen.id`. Confirm: large balance figure at top, then a list of individually-settleable items below, each with its own "Quitar" button — this is the screen that most directly encodes the "quitar uma dívida e deixar outra em espera" decision from the spec.

---

## Final Review Checklist

- [ ] All 4 screens (`Screen/Painel`, `Screen/LancarGasto`, `Screen/Historico`, `Screen/DetalheSaldo`) exist as top-level boards on the "Nós Dois — Financeiro (Desktop)" page.
- [ ] `penpotUtils.shapeStructure(penpot.root, 3)` shows all 4 screens with no stray/duplicate shapes at the page root.
- [ ] Run `penpotUtils.analyzeDescendants` against each screen board to confirm no child overflows its intended container:
  ```js
  const screens = [storage.painelScreen, storage.lancarScreen, storage.historicoScreen, storage.saldoScreen];
  const results = screens.map(s => ({
    name: s.name,
    violations: penpotUtils.analyzeDescendants(s, (root, shape) => !penpotUtils.isContainedIn(shape, root) ? shape.name : null),
  }));
  return results;
  ```
  Expected: `violations` arrays are empty (or contain only expected edge cases like intentionally-overflowing shadows, which don't apply here).
- [ ] Export a final `png` of each of the 4 screens and visually confirm they match the "calm/minimalist" direction approved earlier (soft neutral background, blue accent, generous rounding) and reflect all spec requirements: aggregate balance display, 3 division types on the form (50/50, individual, empréstimo), per-item settlement UI on both Histórico and Detalhe do saldo screens.
