# Task 2 Brief — Button component (all variants)

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- Use `penpotUtils` helpers instead of hand-rolled traversal.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`) on the newly created top-level shape.
- Radius scale (px): radius.sm=12, radius.lg=20, radius.pill=999 (already created as tokens in Task 1).

## Prior state (from Task 1, already complete)

Task 1 created a Penpot token set "Nós Dois" and set these `storage` keys on the Penpot MCP server (server-side state, persists across tool calls — you do NOT need to recreate it, just reference it):
- `storage.fontName` = the chosen font family name (string) — use this for all text in this task.
- `storage.tokenSet` — the TokenSet object.
- `storage.colorTokens` — object mapping token names (e.g. `'color.accent'`) to Token objects.
- `storage.spacingTokens`, `storage.radiusTokens`, `storage.fontSizeTokens` — same pattern for other token types.

## Task 2: Button component (all variants)

**Files:** N/A (Penpot library component: `Button`)

**Interfaces:**
- Consumes: `storage.tokenSet`, `storage.colorTokens`, `storage.fontName` from Task 1.
- Produces: a Penpot `LibraryVariantComponent` group named `Button` with variants `Primary`, `Secondary`, `Ghost`. Each main instance is a `Board` named `Button/<Variant>` with flex layout (`dir: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, height fixed 40, horizontal padding 16, gap 8), containing one `Text` child (label). Later tasks instantiate via `component.instance()` and set `instance.children[0].characters` to the desired label.
- Store the final variant container on `storage.buttonComponent` — later tasks depend on this exact key name.

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
// Order corresponds to creation order: Primary, Secondary, Ghost
comps[0].setVariantProperty(0, 'Primary');
comps[1].setVariantProperty(0, 'Secondary');
comps[2].setVariantProperty(0, 'Ghost');
storage.buttonComponent = container;
return { variantContainer: container.name, variants: comps.map(c => c.variantProps) };
```

Expected: returns `{ Style: 'Primary' }`, `{ Style: 'Secondary' }`, `{ Style: 'Ghost' }`.

- [ ] **Step 4: Verify visually**

Use `mcp__penpot__export_shape` with `shapeId` set to `storage.buttonComponent.id` (read the id first via a small `execute_code` call: `return storage.buttonComponent.id;`), format `png`. Confirm the three buttons render with correct fills/labels (blue solid, white bordered, transparent muted-text).
