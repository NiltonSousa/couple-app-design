# Task 4 Brief — Form field components

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-3, already complete) — REHYDRATE FIRST

The Penpot MCP plugin connection has dropped multiple times during this plan (both plugin-only and full-server disconnects) and had to be reconnected. Every time that happens, the server-side `storage` object resets to empty, even though the actual Penpot file content (tokens, components) survives untouched. **Do not assume any `storage.xxx` value is already populated — always run this rehydration code first**, even if you believe the connection has been stable:

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

if (!storage.buttonComponent) throw new Error('Button component not found');
if (!storage.cardComponent) throw new Error('Card component not found');
if (!storage.pillComponent) throw new Error('Pill component not found');
if (!storage.statusBadgeComponent) throw new Error('StatusBadge component not found');
if (!storage.tagComponent) throw new Error('Tag component not found');

const buttonMain = storage.buttonComponent.variants.variantComponents()[0].mainInstance();
const label = buttonMain.children.find(c => c.type === 'text');
storage.fontName = label.fontFamily;

return {
  colorTokenCount: Object.keys(storage.colorTokens).length,
  spacingTokenCount: Object.keys(storage.spacingTokens).length,
  radiusTokenCount: Object.keys(storage.radiusTokens).length,
  fontSizeTokenCount: Object.keys(storage.fontSizeTokens).length,
  fontName: storage.fontName,
  componentsFound: ['Button', 'Card', 'Pill', 'StatusBadge', 'Tag'],
};
```

Expected: `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight'`, and all 5 named components found with no error. If the MCP tool call fails with "No Penpot plugin instances are currently connected", the plugin has disconnected — report BLOCKED and ask for reconnection rather than retrying blindly.

**Known API gotcha:** `penpot.createVariantFromComponents(...)` does NOT guarantee that `variants.variantComponents()` returns components in the same order as the input array. Always match each resulting variant component to its source board via `.id`/`mainInstance().id` comparison, never via positional index (`comps[0]`, `comps[1]`, ...) — a real bug from this exact mistake was caught and fixed in Task 2's Button component. This task's RadioPill code already does this correctly — follow it exactly.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root after grouping variants or finishing a component. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 9 top-level shapes after this task (Button, Card, Pill, StatusBadge, Tag from before + Field/Input, Field/Select, Field/Textarea, RadioPill from this task).

## Task 4: Form field components

**Files:** N/A (Penpot library components: `Field/Input`, `Field/Select`, `Field/Textarea`, `RadioPill`)

**Interfaces:**
- Consumes: `storage.colorTokens`, `storage.radiusTokens`, `storage.fontName`.
- Produces: `Field/Input`, `Field/Select`, `Field/Textarea` boards (each: label `Text` above a bordered input rectangle, flex `dir: 'column'`, `rowGap: 6`), and a `RadioPill` variant component (`Unselected`, `Selected`) — a bordered pill that later screens duplicate and relabel per option (e.g. "Nilton", "Damaris", "Dividir 50/50"). Store as `storage.fieldInputComponent`, `storage.fieldSelectComponent`, `storage.fieldTextareaComponent`, `storage.radioPillComponent` — later tasks depend on these exact key names.

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

Expected: returns the two `State` variant labels, each matched to its source board by id (not position). Verify by inspecting fills: Selected should have `#EDEFF1` fill and dark `#1F2933` stroke, Unselected should have `#FFFFFF` fill and light `#E1E7EC` stroke.

- [ ] **Step 3: Verify visually and clean up**

`export_shape` on the ids of `fieldInputComponent`, `fieldSelectComponent`, `fieldTextareaComponent`, and `radioPillComponent` (fetch ids first via `execute_code`). Confirm inputs show a label above a bordered rounded box, and radio pills show the visual difference between selected/unselected.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 9 top-level shapes: `Button`, `Card`, `Pill`, `StatusBadge`, `Tag` (from before) plus `Field/Input`, `Field/Select`, `Field/Textarea`, `RadioPill` (from this task). Delete any extras — do not delete any of these 9.
