# Task 5 Brief — Avatar and StatCard components

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-4, already complete) — REHYDRATE FIRST

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
// NOTE: Penpot strips "/"-prefixed grouping from component .name and moves it
// into .path instead — e.g. a component created with name 'Field/Input' ends
// up with .name === 'Input' and .path === 'Field'. Match on .path + .name together.
storage.fieldInputComponent = comps.find(c => c.path === 'Field' && c.name === 'Input');
storage.fieldSelectComponent = comps.find(c => c.path === 'Field' && c.name === 'Select');
storage.fieldTextareaComponent = comps.find(c => c.path === 'Field' && c.name === 'Textarea');
storage.radioPillComponent = comps.find(c => c.name === 'RadioPill');

for (const [key, val] of Object.entries({
  buttonComponent: storage.buttonComponent, cardComponent: storage.cardComponent,
  pillComponent: storage.pillComponent, statusBadgeComponent: storage.statusBadgeComponent,
  tagComponent: storage.tagComponent, fieldInputComponent: storage.fieldInputComponent,
  fieldSelectComponent: storage.fieldSelectComponent, fieldTextareaComponent: storage.fieldTextareaComponent,
  radioPillComponent: storage.radioPillComponent,
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

**Known API gotcha:** `penpot.createVariantFromComponents(...)` does NOT guarantee that `variants.variantComponents()` returns components in the same order as the input array. Always match each resulting variant component to its source board via `.id`/`mainInstance().id` comparison, never via positional index — this task's Avatar code already does this correctly, follow it exactly.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 11 top-level shapes after this task (the 9 from before + Avatar + StatCard).

## Task 5: Avatar and StatCard components

**Files:** N/A (Penpot library components: `Avatar`, `StatCard`)

**Interfaces:**
- Consumes: `storage.fontName`, `storage.colorTokens`, `storage.radiusTokens`.
- Produces: `Avatar` variant component (`Nilton`, `Damaris` — initials N/D), `StatCard` component (label + large number, built on top of the `Card` visual pattern but as its own standalone component since it has a fixed 2-row internal layout). Store as `storage.avatarComponent`, `storage.statCardComponent` — later tasks depend on these exact key names.

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

Expected: returns `{ Person: 'Nilton' }`, `{ Person: 'Damaris' }`. Verify by inspecting fills: Nilton's avatar board should be `#3F6FA8` (blue) with text "N", Damaris's should be `#A85C8F` (mauve) with text "D".

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

Expected: no error. `storage.statCardComponent.mainInstance()` should have exactly 2 Text children: index 0 is the muted 13px label, index 1 (named "value") is the bold 32px number — later tasks rely on this exact child order (`instance.children[0]` = label, `instance.children[1]` = value).

- [ ] **Step 3: Verify visually and clean up**

`export_shape` on `avatarComponent.id` and `statCardComponent.id` (fetch ids first via `execute_code`). Confirm avatar circles show initials on colored backgrounds, and the stat card shows a small muted label above a large bold number.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 11 top-level shapes: the 9 from before (Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill) plus `Avatar` and `StatCard` from this task. Delete any extras — do not delete any of these 11.
