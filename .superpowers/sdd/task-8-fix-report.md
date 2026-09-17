# Task 8 Fix Report — Screen: Painel/Resumo (bug fixes from review)

Note: the board's actual name in the live file is `Screen / Painel` (with spaces around the
slash), not `Screen/Painel` as written in the brief/report. `penpotUtils.findShape(s => s.name
=== 'Screen/Painel')` fails; the shape had to be located via `shapeStructure(penpot.root, 1)`
and then addressed by ID (`e2e09cb5-e94d-80d9-8008-433db38414f3`).

An independent review found 3 real layout bugs in the live board. All three have been fixed by
direct manipulation of the live shapes (no recreation from scratch). Below: root cause, fix, and
verification for each.

## Bug 1 — Balance pill text overflow (Topbar instance, `balance-pill`)

**Root cause:** The `balance-pill` Pill instance (id `...433db3a73919`) had both its own
`flex.horizontalSizing`/`verticalSizing` and its `layoutChild.horizontalSizing`/`verticalSizing`
hard-set to `'fix'` at 80×28px — a leftover from the original short "Contas quitadas" text. When
the text was overridden to the longer "Damaris deve R$ 120,00" (128px wide, `growType:
'auto-width'`), the pill container could not grow, so the text rendered centered but clipped on
both sides.

**Fix:**
- Set `pill.flex.horizontalSizing = 'auto'` and `verticalSizing = 'auto'` (pill sizes to content).
- Set `pill.layoutChild.horizontalSizing = 'auto'` and `verticalSizing = 'auto'` (pill child of
  the Topbar's `right` row is no longer fixed-width).
- Set the inner text's `layoutChild.horizontalSizing = 'auto'` as well.
- Explicitly called `pill.resize(152, 28)` (128px text + 12px padding each side) to force Penpot
  to recompute the flex layout — property writes alone did not trigger an immediate relayout;
  bounds only updated after an explicit `resize()` call plus a short wait.
- Cascading fix: the Topbar's `right` row (parent of the pill and `btn-new-expense`) was itself
  fixed at 260px wide and no longer had room for the now-152px pill + 12px gap + 120px button
  (284px needed). Set `right.flex.horizontalSizing = 'auto'` / `verticalSizing = 'auto'` and
  called `right.resize(284, 40)` to match.

**Verification:**
- Pill bounds: `{x: 988, y: 25.5, width: 152, height: 25}`; text bounds fully inside
  (`isContainedIn(text, pill) === true`).
- Topbar `right` row bounds: `{x: 964, y: 18, width: 284, height: 40}`; pill and button both
  contained; `isContainedIn(rightRow, topbar) === true`.
- `analyzeDescendants(topbar, ...)` containment check: **0 violations**.

## Bug 2 — StatCard #2 ("Saldo entre vocês") value text overflow

**Root cause:** StatCard's own component definition uses `flex.horizontalSizing: 'auto'` (cards
are meant to grow to fit their content by design). But the Task 8 brief's `stats-row` instantiated
all 3 StatCards with `layoutChild.horizontalSizing = 'fill'`, capping each at an even 320px share
of the 1016px row regardless of content — contradicting the component's natural auto-grow
behavior. The value text "Damaris deve R$ 120,00" at 32px font-size measured 348px wide
(`growType: 'auto-width'` correctly grew the text itself), but the card's usable interior (320px −
40px padding = 280px) couldn't fit it, clipping the trailing ",00".

**Fix (widen card + row rather than shrink font, per review guidance):**
- Set card 2's `layoutChild.horizontalSizing = 'auto'` (opts this one card out of the even
  `'fill'` split, letting it size to its own content like the component intends) and its value
  text's `layoutChild.horizontalSizing = 'auto'`.
- Called `card2.resize(388, 99)` (348px text + 40px padding) to force relayout.
- The other two cards (`Total lançado este mês`, `Lançamentos pendentes`) remain
  `layoutChild.horizontalSizing = 'fill'`, so the flex layout redistributed the *remaining* row
  width evenly between them: `(1016 − 388 − 28 − 28) / 2 = 286px` each — still comfortably fits
  their longest label ("Lançamentos pendentes", 139px) and value.
- Total row width preserved: `286 + 28 + 388 + 28 + 286 = 1016`, unchanged from the brief's
  original stats-row width, so it still lines up with content-row below.

**Verification:**
- Card 2 bounds: `{x: 578, y: 104, width: 388, height: 99}`; value text bounds
  `{x: 598, width: 348}` fully inside card 2.
- Card 1 bounds: `{width: 286}`; card 3 bounds: `{width: 286}` — both `isContainedIn` their
  content true (longest label 139px fits well within 286 − 40 = 246px usable).
- `analyzeDescendants(statsRow, ...)` containment check: **0 violations**.
- `stats-row` overall bounds unchanged: `{x: 264, y: 104, width: 1016, height: 99}`.

## Bug 3 — `content-row` layout defect (empty gap on the right)

**Root cause:** Live state showed `contentRow.width = 340` (not the brief-specified 1016) and
both child cards (`card-ultimos-lancamentos`, `card-por-categoria`) had
`layoutChild.horizontalSizing = 'auto'` instead of `'fill'`. With the container's own
`flex.horizontalSizing` also `'auto'`, the row shrank to hug its children's auto-content widths
(182px + 130px + 28px gap = 340px) instead of the two cards stretching to fill 1016px, leaving a
large unstyled empty gap on the right of the board (not matching stats-row's full width above).

**Fix (matches brief step 3 intent exactly):**
- Called `contentRow.resize(1016, ...)`.
- Set `contentRow.flex.horizontalSizing = 'fix'` (container holds a definite 1016px width;
  `verticalSizing` left as `'auto'` so height still adapts to the taller of the two cards).
- Set both `card-ultimos-lancamentos.layoutChild.horizontalSizing = 'fill'` and
  `card-por-categoria.layoutChild.horizontalSizing = 'fill'` so each card stretches to share the
  row width evenly.
- As with the other two fixes, an explicit `resize()` call after setting the flex mode was needed
  to force Penpot to actually recompute layout (property writes alone left stale cached bounds
  until a resize + short wait).

**Verification:**
- `content-row` bounds: `{x: 264, y: 222, width: 1016, height: 190}`.
- `card-ultimos-lancamentos` bounds: `{x: 264, width: 494}`.
- `card-por-categoria` bounds: `{x: 786, width: 494}`.
- `494 + 28 (gap) + 494 = 1016` — matches expected ~494px each per the review's estimate.
- `analyzeDescendants(contentRow, ...)` containment check: **0 violations**.

## Overall screen verification

- `analyzeDescendants(screen, ...)` across the entire `Screen / Painel` board: **0 containment
  violations** (checked after all 3 fixes applied).
- `isContainedIn(statsRow, screen)`, `isContainedIn(contentRow, screen)`,
  `isContainedIn(topbar, screen)` all `true`.
- Screen bounds unchanged: `{x: 0, y: 0, width: 1280, height: 900}`.
- Visual export (`export_shape`, PNG) confirms: balance pill text fully visible with no clipping;
  "Saldo entre vocês" StatCard's value text ("Damaris deve R$ 120,00") fully visible with no
  clipping; content-row's two cards ("Últimos lançamentos", "Por categoria") now stretch evenly
  across the full width, matching the stats-row's width above, with no empty gap.
- `penpotUtils.shapeStructure(penpot.root, 1)`: **exactly 14 top-level shapes**, same names as
  before (Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select, Field / Textarea,
  RadioPill, Avatar, StatCard, Sidebar, Topbar, Screen / Painel) — no new debris introduced.

## Notes for future work

- Penpot's flex-layout bounds do not always recompute immediately after setting
  `flex.horizontalSizing`/`layoutChild.horizontalSizing` properties alone; in every one of the 3
  fixes, an explicit `shape.resize(w, h)` call (even to the shape's current height) was required
  to force the layout engine to recompute, followed by a short (~200-400ms) wait before re-reading
  `bounds`. Property-only writes silently left stale cached bounds in this session.
