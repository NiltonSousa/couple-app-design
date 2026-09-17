# Task 10 Fix Report — Regression Remediation

**Status:** COMPLETED — all identified corruption and layout bugs fixed and verified.

## Root Cause

Task 10's implementer incorrectly believed `penpot.createText()` requires no arguments to be "fail-safe." In reality
`penpot.createText()` requires a string argument (e.g. `penpot.createText('Button')`); calling it with zero
arguments or an empty string throws `[PENPOT PLUGIN] Value not valid. Code: :createText`. Instead of fixing the call,
the implementer worked around the (self-inflicted) error by repeatedly **cloning the Button library component's own
template text node** to fabricate new text elements for table cells. Because this cloning was performed directly on
`storage.buttonComponent`'s Primary variant main instance (rather than on a detached copy), the clone artifacts were
appended as siblings directly onto the shared library component itself, corrupting it for every consumer.

## Part 1 — Button Component Corruption (Fixed)

**Before fix:** `Button` component's **Primary** variant main instance had 11 children:
- 6 stray "DATA" text nodes (font size 14, ids prefixed `e2e09cb5-e94d-80d9-8008-4343...`)
- 4 duplicate "Button" text nodes (same `e2e09cb5-...` id family)
- 1 original "Button" text node (id `b53292d8-bd1c-80af-8008-4217bfecdcad`, matching the id-family pattern of
  Ghost's (`...4217cb8589cf`) and Secondary's (`...4217c3ec35d2`) untouched original text nodes)

Secondary and Ghost variants were confirmed independently clean (1 text child each) both before and after the fix.

**Fix applied:**
1. Rehydrated `storage` (tokens, all 13 components) — succeeded, `fontName: 'Inter Tight'`.
2. Identified the single legitimate text child on Primary by id-family/pattern matching against Ghost/Secondary's
   surviving originals.
3. Removed the other 10 stray/duplicate children via `.remove()`, verifying child count after each pass.
4. Final state: Primary variant main instance has exactly 1 text child, `characters === 'Button'`, positioned at
   `parentX: 38.5, parentY: 11.5` — identical to Ghost and Secondary (120×40 board, text width 43 → perfectly centered).
5. Exported all 3 variants (Primary, Ghost, Secondary) as PNG — each renders a single, clean, non-overlapping "Button" label.

## Part 2 — Propagation Check (No independent instance-level corruption found)

Checked every screen/instance that could plausibly have been separately corrupted (since the corruption could have
happened either at the component level or been separately duplicated onto specific instances):

- **Screen / Painel** → `btn-new-expense` (Topbar clone, Button/Primary instance): 1 child, "+ Novo gasto". Exported — clean, no garbled overlapping text (this instance was the one flagged as visibly broken in the review; it is now fully clean because it is a linked instance of the just-fixed Primary variant and had no independent duplication of its own).
- **Screen / LancarGasto**:
  - `btn-new-expense` (Topbar clone): 1 child, "+ Novo gasto" — clean.
  - "Salvar gasto" button (Primary variant, footer-buttons row): 1 child, "Salvar gasto" — clean.
  - "Cancelar" button (Secondary variant, footer-buttons row): 1 child, "Cancelar" — clean.
- **Screen / Historico** (this task's own table, built during the corruption event): all 4 action-cell buttons
  (Quitar × 2, Reabrir × 2, Secondary variant) checked directly — 1 child each, clean.

No instance anywhere had independently duplicated stray text nodes; all corruption was isolated to the shared
Primary variant's main instance, and fixing it there resolved every downstream consumer automatically.

## Part 3 — Table Layout Bugs (Fixed)

### Bug 1: Row/table overflow

**Before:** `colWidths = [90, 260, 150, 100, 120, 120, 100, 84]` (sum 1024px) plus `horizontalPadding: 20` per side
(40px total) required 1064px of content inside rows that were only 1016px wide (matching `filter-card`'s width and
the table-card's own width, positioned at x=264, ending flush at the screen's right edge x=1280). Measured overflow:
the last cell (action column, "Quitar"/"Reabrir" buttons) extended to x=1308, i.e. **28px past the row/table-card/screen edge**, clipping the buttons.

**Fix:** Reduced the DESPESA column width from 260px to 212px (−48px) across every row (header + 4 data rows).
Chosen because the widest DESPESA content, "Hotel Caraíva" (75px text width), fits comfortably in 212px, and this
was the specific column with the most slack per the review. New column sum = 976px; 976 + 40 (padding) = 1016px —
**exactly matches** the row/table-card width, eliminating overflow with zero slack wasted.

New `colWidths = [90, 212, 150, 100, 120, 120, 100, 84]` (table header/data rows only; total row uses its own
independent 500/120/300 cell widths, which were unaffected and already fit).

**Verification after fix:**
- Every row's last cell now ends at x=1260 (20px shy of the row/table-card/screen edge = exactly the right padding).
- `penpotUtils.isContainedIn(lastCell, row)` → true for header + all 4 data rows.
- `penpotUtils.isContainedIn(lastCell, tableCard)` → true for header + all 4 data rows.
- Action buttons (`isContainedIn(btn, cellBox)`) → true for all 4 data rows.
- Full-hierarchy sweep via `analyzeDescendants`-style checks (table-card vs. screen, every row vs. table-card, every
  cell vs. its row, every inner element — text/tag/badge/button — vs. its cell): **0 violations** across the entire
  table (this closes the "blind spot" from the original task, which only checked cell-vs-own-box and never verified
  cross-row/table/screen containment for the accumulated content width).

### Bug 2: Total row not bold

**Before:** "Total no filtro" and "R$ 1.252,00" text nodes had `fontWeight: '400'`.
**Fix:** Set `fontWeight = '600'` on both nodes directly (found via the total row's children). "Pendente: R$ 461,00"
was correctly left at regular weight per the brief's original design (only the label and the total figure are meant
to be bold).

## Final Visual Verification

Exported `Screen / Historico` in full: filter card with 3 selects, table with header row, 4 data rows, and total row
all render cleanly — no clipped or overlapping text anywhere, "Quitar"/"Reabrir" buttons fully visible with margin,
total row shows bold "Total no filtro" / "R$ 1.252,00", table-card does not overflow the screen, Sidebar and Topbar
fully visible and unobstructed.

Also re-exported `Screen / Painel` in full: "+ Novo gasto" topbar button renders as a single clean label (previously
garbled "DATAButtonButtor..." overlapping text), rest of the screen unaffected and correct.

## Shape Count Verification

`penpotUtils.shapeStructure(penpot.root, 1)` → **exactly 16 top-level shapes**, no debris:
Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select, Field / Textarea, RadioPill, Avatar, StatCard,
Sidebar, Topbar, Screen / Painel, Screen / LancarGasto, Screen / Historico.

## Summary

| Issue | Status |
|---|---|
| Button/Primary component corruption (11→1 children) | Fixed, verified via export (all 3 variants clean) |
| Propagation to Screen/Painel (`btn-new-expense`) | Auto-resolved by component fix; verified clean |
| Propagation to Screen/LancarGasto (Salvar/Cancelar) | Checked, no independent corruption found; verified clean |
| Screen/Historico's own action buttons (Quitar/Reabrir) | Checked, no independent corruption found; verified clean |
| Table row/action-column overflow (28px clip) | Fixed via DESPESA column 260→212px; 0 containment violations |
| Total row not bold | Fixed, both text nodes now `fontWeight: '600'` |
| Workspace hygiene | Confirmed exactly 16 top-level shapes, no debris |

All affected screens are now clean and consistent. No further action required.
