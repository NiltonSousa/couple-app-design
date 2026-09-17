# Task 9 Fix Report — Screen: Lançar gasto (post-review bug fixes)

This report documents fixes applied to the live `Screen / LancarGasto` board after an independent review
found real bugs that the implementer's `task-9-report.md` had (incorrectly) claimed were not present.

## Bug #1 (CRITICAL) — form-card mispositioned, covering Sidebar and Topbar

**Root cause:** The implementer's report claims "Form card positioned at (264, 104)" and the brief's Step 2
code explicitly sets `formCard.x = 232 + 32; formCard.y = 76 + 28;` (i.e. 264, 104) as the very last statement
before `appendChild`. However, the live document had `form-card` at `(0, 0)`. The most likely explanation:
`storage.lancarScreen.appendChild(formCard)` was called *before* the x/y assignment in the actual executed
code (ordering slip relative to the brief), or a later re-run/retry of Step 2 reset the position without
re-applying the offset, or the position assignment happened prior to the shape being attached to a board
with absolute page coordinates, causing it to be reset to the parent's origin on `appendChild`. Whatever the
precise mechanism, the effect was that `form-card` ended up sitting exactly at the screen's own origin,
fully overlapping both Sidebar (0,0–232,900) and Topbar (232,0–1280,76).

**Fix applied:**
```js
formCard.x = 264;
formCard.y = 104;
```

**Verification:**
- `formCard.bounds` → `{ x: 264, y: 104, width: 640, height: 616 }`
- Overlap check vs. Sidebar spec bounds (0,0,232,900): `false`
- Overlap check vs. Topbar spec bounds (232,0,1048,76): `false`
- Overlap check vs. actual Sidebar/Topbar instance bounds: `false` / `false`
- `penpotUtils.isContainedIn(formCard, screen)`: `true`
- Screen bounds remain `1280 x 900`, form card fits entirely within with margin to spare.

## Bug #2 — Despesa / Valor total / Observação fields not filling card width

**Root cause:** In the brief's Step 2 code, `layoutChild.horizontalSizing = 'fill'` was only ever set on
`catField` and `dateField` (the two fields inside `row-categoria-data`). The single-column fields (Despesa
`Field/Input`, Valor total `Field/Input`, Observação `Field/Textarea`) were appended to `formCard` with no
`layoutChild.horizontalSizing` override, so they defaulted to `'auto'`, sizing themselves to their own
component's default width (280px) instead of filling the 600px content area of the 640px card.

**Fix applied:**
1. Set `layoutChild.horizontalSizing = 'fill'` on all three field boards (Despesa, Valor total, Observação).
2. Per Task 8's documented lesson, the property write alone did not trigger relayout — bounds stayed at
   280px after the property change and even after a plain `resize(w, h)` (no-op resize to current size).
3. Had to additionally fix the **nested** `input-box` child inside each field: it also had
   `layoutChild.horizontalSizing = 'fix'` and stayed at 280px even after the outer field board itself
   correctly grew to 600px. Set `input-box.layoutChild.horizontalSizing = 'fill'` too.
4. The relayout only actually took effect after nudging the form card's size away from and back to its
   current value (`resize(w+1, h)` then `resize(w-1, h)`) followed by a short (~150ms) wait — a plain
   same-value `resize()` was insufficient in this case, one step further than Task 8's lesson anticipated.

**Verification (final):**
- Despesa field bounds: `{ x: 284, y: 124, width: 600, height: 62 }`
- Valor total field bounds: `{ x: 284, y: 288, width: 600, height: 62 }`
- Observação field bounds: `{ x: 284, y: 538, width: 600, height: 102 }`
- Each field's `input-box` bounds also now 600px wide, matching the 2-column row's per-column effective width sum.
- `isContainedIn(inputBox, field)` and `isContainedIn(innerText, inputBox)`: `true` for all three.
- `isContainedIn(field, formCard)`: `true` for all three.
- Form card height unchanged (616px) — the width fill did not affect vertical layout, so no screen resize was needed.

## Bug #3 — Placeholder-text copy/paste leftover

**Root cause:** Both the "Data" field (inside `row-categoria-data`) and the "Valor total" field had their
placeholder text left as the Field/Input component's default placeholder, `"Ex.: Hotel Caraíva"` — a
copy/paste leftover from when these instances were cloned/detached from the same source component without
updating the placeholder text child (only the field *label* text was updated, not the placeholder).

**Fix applied:**
- Data field placeholder → `"dd/mm/aaaa"`
- Valor total field placeholder → `"R$ 0,00"`

**Verification:**
- Both new placeholder texts confirmed via `characters` property.
- `isContainedIn(placeholderText, inputBox)`: `true` for both — no text overflow introduced.

## Bug #4 (documentation nit, no action needed) — Balance pill "removal"

Confirmed live: the `balance-pill` shape still exists in the Topbar instance's tree (`findShape` locates it),
but has `visible: false` / `hidden: true`. Calling `.remove()` on a descendant of a component-instance board
in Penpot does not delete the shape — per the Plugin API's documented behavior ("when the shape is a
descendant of a board that is a component (asset), the shape will not be removed but instead be made
invisible"), it only toggles visibility. This is functionally correct (the pill is invisible, "+ Novo gasto"
button stands alone in the topbar's right section, matching the brief's expectation) but should not be
described as "removed" in future reports — it is hidden, not deleted. No code changes made for this item.

## Final Verification Summary

- Bounds/overlap checks: form-card no longer overlaps Sidebar or Topbar; fully contained within the 1280x900 screen.
- Visual export (`export_shape`, PNG) confirms: Sidebar and Topbar fully visible and uncovered; Despesa,
  Valor total, and Observação fields now visually span the same width as the Categoria/Data row; "Data" shows
  "dd/mm/aaaa"; "Valor total" shows "R$ 0,00"; no clipped or overflowing text anywhere in the form.
- `penpotUtils.shapeStructure(penpot.root, 1)` confirms exactly **15** top-level shapes, unchanged, no debris
  introduced by this fix session: Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select,
  Field / Textarea, RadioPill, Avatar, StatCard, Sidebar, Topbar, Screen / Painel, Screen / LancarGasto.

All three actionable bugs (#1, #2, #3) are fixed and verified. Bug #4 required no action, documented for clarity.
