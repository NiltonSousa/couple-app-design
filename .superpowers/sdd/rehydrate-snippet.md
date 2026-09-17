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

Expected: `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight'`, and all 5 named components found with no error. If the MCP tool call fails with "No Penpot plugin instances are currently connected", the plugin has disconnected — report BLOCKED and ask for reconnection rather than retrying blindly. As you create NEW components/tokens in later tasks (e.g. Field/Input, Avatar, StatCard, Sidebar, Topbar), also add them to this rehydration pattern in your own report/brief handoff notes if you want future tasks in this same session to be able to recover them by name, but do not modify this file.

**Known API gotcha:** `penpot.createVariantFromComponents(...)` does NOT guarantee that `variants.variantComponents()` returns components in the same order as the input array. Always match each resulting variant component to its source board via `.id`/`mainInstance().id` comparison, never via positional index (`comps[0]`, `comps[1]`, ...) — a real bug from this exact mistake was caught and fixed in Task 2's Button component.

**Workspace hygiene:** do NOT leave duplicate/experimental boards on the page root after grouping variants or finishing a component. If a step errors and you retry, delete the previous attempt's boards first. Verify cleanliness yourself at the end via `penpotUtils.shapeStructure(penpot.root, 1)` — do not just assume it's clean.
