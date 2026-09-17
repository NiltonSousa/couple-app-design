# Task 6 Brief — Sidebar composite

Source plan: docs/superpowers/plans/2026-06-30-nos-dois-financeiro-desktop.md

## Global Constraints (apply to this task)

- Every shape/component must be created via the Penpot Plugin API (`mcp__penpot__execute_code`), never manually in the UI.
- After the task, verify visually with `mcp__penpot__export_shape` (mode: `shape`, format: `png`).

## Prior state (from Tasks 1-5, already complete) — REHYDRATE FIRST

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

for (const [key, val] of Object.entries({
  buttonComponent: storage.buttonComponent, cardComponent: storage.cardComponent,
  pillComponent: storage.pillComponent, statusBadgeComponent: storage.statusBadgeComponent,
  tagComponent: storage.tagComponent, fieldInputComponent: storage.fieldInputComponent,
  fieldSelectComponent: storage.fieldSelectComponent, fieldTextareaComponent: storage.fieldTextareaComponent,
  radioPillComponent: storage.radioPillComponent, avatarComponent: storage.avatarComponent,
  statCardComponent: storage.statCardComponent,
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

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — expect exactly 12 top-level shapes after this task (the 11 from before: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, plus `Sidebar` from this task).

## Task 6: Sidebar composite

**Files:** N/A (Penpot library component: `Sidebar`)

**Interfaces:**
- Consumes: `storage.avatarComponent` (Task 5), `storage.fontName`, `storage.colorTokens`.
- Produces: `Sidebar` component — a `Board` 232px wide, full content height (900px for design purposes), flex `dir: 'column'`, containing: brand row (small mark + "Nós Dois" wordmark), 3 nav links (`Painel`, `Lançar gasto`, `Histórico` — plain text rows, no icons in this pass since icon assets are out of scope), and a footer row with both avatars + "Nilton & Damaris" text. Store as `storage.sidebarComponent` — later screen tasks depend on this exact key name. Screens append this via `component.instance()` at `x=0, y=0`.

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

// Footer (avatars + names)
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

Expected: no error. If `footer.layoutChild.marginTop = 'auto'` throws (property may not accept the string `'auto'` — check via `penpot_api_info` for `LayoutChildProperties` if it fails), drop that line; the footer will simply sit directly below the nav links instead of being pinned to the bottom. This is a cosmetic detail, not a blocker — note it in your report either way.

- [ ] **Step 2: Verify visually and clean up**

`export_shape` on `sidebarComponent.id` (fetch id first via `execute_code`). Confirm: brand mark + "Nós Dois" at top, 3 nav rows with "Painel" highlighted, avatars + names near the bottom.

Then call `penpotUtils.shapeStructure(penpot.root, 1)` and confirm the page root contains exactly 12 top-level shapes: the 11 from before (Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard) plus `Sidebar` from this task. Delete any extras — do not delete any of these 12.

## Report

Write your completion report to `.superpowers/sdd/task-6-report.md`: what you built, any deviations from the brief (e.g. the `marginTop` fallback), and the final `shapeStructure` output confirming exactly 12 top-level shapes.
