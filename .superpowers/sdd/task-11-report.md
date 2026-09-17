# Task 11 Completion Report — Screen: Detalhe do saldo

## Status: COMPLETE

## Note on the previous BLOCKED report — root cause found

The previous implementer's report claimed `penpot.createText()` (zero args) and `penpot.createText('')`
(empty string) both threw `[PENPOT PLUGIN] Value not valid. Code: :createText`, and treated this as a
genuine API-level blocker. **That diagnosis was correct as far as it went, but the conclusion was wrong.**

In this live session I re-tested all three variants explicitly, one at a time:

| Call                          | Result                                                                 |
|--------------------------------|-------------------------------------------------------------------------|
| `penpot.createText()`          | **Fails** — `[PENPOT PLUGIN] Value not valid. Code: :createText`       |
| `penpot.createText('')`        | **Fails** — `[PENPOT PLUGIN] Value not valid: . Code: :createText`     |
| `penpot.createText('test')`    | **Succeeds** — returns a valid Text shape immediately                  |

Setting `.characters = 'some text'` on the shape returned by `penpot.createText('test')` afterward works
and holds correctly (verified: `t.characters` reads back `'some text'`).

**Working pattern for this (and presumably all future) sessions:**
```js
const t = penpot.createText('placeholder'); // any non-empty string argument
t.characters = 'actual desired text';       // then overwrite
```

`penpot.createText()` with zero arguments — the pattern documented in the task brief as "used successfully
throughout this whole plan" — does **not** work in this session. It's unclear whether this is new session-specific
behavior, a Penpot API change, or the brief's documented pattern was never actually correct and earlier tasks
got lucky in some other way — but empirically, right now, only the non-empty-string form works. **This is
important for future tasks: always call `penpot.createText('placeholder')` (or any non-empty string) and then
set `.characters`, never `penpot.createText()` with zero or empty-string arguments.**

The previous BLOCKED report was reasonable given the instruction to stop rather than improvise around shared
components, but it stopped one diagnostic step too early — it never tried a non-empty string argument.

### Debris cleanup
The previous blocked attempt had already created a partial `Screen / DetalheSaldo` board (with Sidebar clone,
Topbar clone — topbar title/eyebrow NOT overridden, balance-pill NOT removed — and an empty `summary-card`
board) before failing on text creation. This debris was found and deleted before rebuilding cleanly from
scratch in this session.

### Rehydration
- Ran full rehydration code from the brief — succeeded.
- `colorTokenCount: 11, spacingTokenCount: 5, radiusTokenCount: 3, fontSizeTokenCount: 6, fontName: 'Inter Tight'` — all match expected values exactly.
- All components found: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar.
- Button component health check: **passed** — all 3 variants (Primary, Ghost, Secondary) have exactly 1 text child each. Not corrupted by the prior blocked attempt.

### What was built
`Screen/DetalheSaldo` board (1280x900), containing:
- Sidebar clone (nav-Painel de-highlighted since this isn't the Painel screen)
- Topbar clone with eyebrow "SALDO", title "Saldo entre vocês", balance-pill removed
- `summary-card`: a detached Card instance containing "Saldo atual" label (13px, muted gray) and "Damaris deve R$ 120,00" value (32px bold, danger red `#C1443A`)
- `items-card`: a detached Card instance (padding/gap zeroed out) containing 3 flex-row items, each with:
  - Left: description text (14px)
  - Right: value text (14px, bold) + Secondary-variant "Quitar" button (detached, resized to 80x32, label at 13px)
  - Rows: Hotel Caraíva (metade) / R$ 445,00; Uber (metade) / R$ 16,00; Empréstimo cartão (jantar) / R$ 59,00 (last row has no divider stroke)
- Screen resized to final height 900 (content fit within default height, so no expansion was needed)

### Containment check results (Step 1 — summary card)
- `isContainedIn(summaryLabel, summaryCard)`: **true**
- `isContainedIn(summaryValue, summaryCard)`: **true**
- Card auto-sized to width 388 (auto-width flex sizing based on content), height ~115 — no overflow for the long "Damaris deve R$ 120,00" string at 32px bold.

### Containment check results (Step 2 — items card, all 3 rows)
All checks passed for all 3 rows, including the longest description ("Empréstimo cartão (jantar)") and longest value:

| Row | row⊂itemsCard | left⊂row | rightGroup⊂row | value⊂rightGroup | button⊂rightGroup | "Quitar" label⊂button |
|---|---|---|---|---|---|---|
| Hotel Caraíva (metade) | true | true | true | true | true | true |
| Uber (metade) | true | true | true | true | true | true |
| Empréstimo cartão (jantar) | true | true | true | true | true | true |

Also: `isContainedIn(itemsCard, screen)`: **true**, `isContainedIn(summaryCard, screen)`: **true**.

### Visual verification (export_shape, PNG)
Exported the final `Screen/DetalheSaldo` board. Confirmed:
- Large red balance figure ("Damaris deve R$ 120,00") prominently at top under "Saldo atual" label.
- 3 pending items listed below, each with description, value, and a "Quitar" secondary button, clearly demonstrating independent per-item settlement.
- Sidebar (Nós Dois branding, nav items, avatars) fully visible on the left, not covered.
- Topbar (SALDO / Saldo entre vocês title, + Novo gasto button) fully visible at top, not covered.
- No clipped or overlapping text anywhere.

### Final shape count
`penpotUtils.shapeStructure(penpot.root, 1)` confirms **exactly 17 top-level shapes**:
Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select, Field / Textarea, RadioPill, Avatar,
StatCard, Sidebar, Topbar, Screen / Painel, Screen / LancarGasto, Screen / Historico, Screen / DetalheSaldo.

No debris left behind. Button component re-verified healthy (1 text child per variant) after task completion.
