# Task 1 Brief — Design tokens

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Visual direction: Calmo / Minimalista — soft neutral background, blue accent, generous rounding (12-20px), generous spacing. No monospace font — single sans family throughout.
- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- Use `penpotUtils` helpers instead of hand-rolled traversal.
- Font family: use whatever default sans font is available in the Penpot instance's font list (check via `penpot.fonts`) — record the exact name used in `storage.fontName`. All subsequent tasks reuse that same font.
- Colors (hex, all caps): bg=#F4F6F8, surface=#FFFFFF, fg=#1F2933, muted=#7C8A97, border=#E1E7EC, accent=#2563A8, accent-soft=#E3F0FF, danger=#C1443A, danger-soft=#FBE7E4, warn=#C98A1F, warn-soft=#FBEED9
- Spacing scale (px): xs=8, sm=12, md=20, lg=28, xl=40
- Radius scale (px): radius.sm=12, radius.lg=20, radius.pill=999
- Font sizes (px): h1=28, h2=20, h3=15, body=14, meta=12, stat=32

## Task 1: Design tokens

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
const currentPage = penpotUtils.getPages()[0];
const pg = penpotUtils.getPageById(currentPage.id);
pg.name = 'Nós Dois — Financeiro (Desktop)';
return { renamed: pg.name };
```

Expected: page renamed with no error.
