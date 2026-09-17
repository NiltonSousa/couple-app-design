# Task 7 Bug Fix Report: Corrupted Button Component

## Summary

The `Button` library component (created in Task 2) had a corrupted **Primary** variant main
instance containing two overlapping text children instead of one, causing garbled/overlapping
text on every Button instance throughout the file, including the "+ Novo gasto" button inside
the Topbar component (Task 7).

## What was corrupted

Investigation of `storage.buttonComponent.variants.variantComponents()` showed:

| Variant   | Text children | Detail |
|-----------|---------------|--------|
| Primary   | **2**         | `"Pill"` (id prefix `4755d8f9-...`, parentX 29.5) + `"Button"` (id prefix `b53292d8-...`, parentX 47.5) |
| Secondary | 1             | `"Button"` only — clean |
| Ghost     | 1             | `"Button"` only — clean |

Only the **Primary** variant was affected. The stray node's `characters` was literally `"Pill"`,
not `"Button"` as the task brief speculated — a more specific clue to the root cause.

## Root cause

The stray text node's id (`4755d8f9-5847-8098-8008-421bd37c6dac`) shares the exact same UUID
prefix (`4755d8f9-5847-8098-8008-...`) as every shape belonging to the separately-built `Pill`
component (e.g. its own placeholder text nodes `4755d8f9-...-421ca3a1f779`,
`...-421ca3b10a61`, `...-421ca3bda48a`). The Button component's own native shapes (main board
and its correct "Button" text) share a different prefix, `b53292d8-...`, matching the
`Button` component's own id.

This strongly indicates that during Task 2's variant-creation step, a text node was
accidentally copy-pasted (or left behind via a copy/duplicate/reparent operation) from the
Pill component's source board into the Button/Primary main instance, rather than being
purpose-authored for Button. It landed at parentX 29.5, directly overlapping the real
"Button" label (parentX 47.5, later corrected to 38.5), producing visually garbled/overlapping
text ("PButitlolon"-style overlap) in every place a Primary Button was rendered or instanced.

## What was changed

1. **Removed the stray node**: Located the Primary variant's main instance, found the text
   child with `characters === 'Pill'` (the node sharing the Pill component's id prefix), and
   called `strayNode.remove()`.
2. **Re-centered the remaining label**: After removal, the real "Button" text was left at
   parentX 47.5 (an artifact of when the stray node's presence had it renderer at an offset).
   Comparing against the clean Secondary/Ghost variants — both center their 43×17 text label
   within a 120-wide board at parentX 38.5 — the Primary label was repositioned to parentX
   38.5 via `penpotUtils.setParentXY(text, 38.5, 11.5)` to match the established pattern.
3. **Checked the Topbar's `btn-new-expense` instance**: It had only one text child (no stray
   node propagated to the instance), confirming the corruption lived solely in the source
   component's main instance and did not independently duplicate onto the instance. However,
   its text still read the untouched placeholder `"Button"` rather than the intended
   `"+ Novo gasto"` label (all of Topbar's other text layers — eyebrow "PAINEL DE CUSTOS",
   title "Resumo do casal", balance pill "Contas quitadas" — had proper overridden copy, so
   this was an incomplete override, not part of the two-text-node corruption). Set
   `text.characters = '+ Novo gasto'`; the button uses a flex layout with
   `justifyContent: center, alignItems: center`, so the new (wider) auto-width text
   re-centers automatically without manual repositioning.
4. **Checked Sidebar**: Confirmed it contains no Button component instances at all (only two
   `Avatar` instances in its footer, each with a single clean text child) — no fix needed
   there.
5. **Checked for other Button instances file-wide**: Searched all boards/components for
   shapes whose `component()` matches one of the three Button variant ids. Only the three
   variant main instances themselves and the one Topbar instance (`btn-new-expense`) exist —
   no other screens/composites reference Button yet, consistent with only Sidebar, Topbar,
   and the base component boards existing so far.

## Verification

**Visual (export_shape, PNG):**
- Button variant container (all 3 variants side by side): Primary (blue, "Button"),
  Secondary (outlined, "Button"), Ghost (text-only, "Button") — all show a single, clean,
  centered, non-overlapping label.
- Topbar: renders "PAINEL DE CUSTOS" / "Resumo do casal" on the left, "Contas quitadas" pill
  and a clean "+ Novo gasto" button on the right — no overlapping/garbled text.

**Structural (`penpotUtils.shapeStructure(penpot.root, 1)`):**
Confirmed exactly 13 top-level shapes, matching expectations and indicating no stray shapes
were introduced or lost during the fix:
Button, Card, Pill, StatusBadge, Tag, Field / Input, Field / Select, Field / Textarea,
RadioPill, Avatar, StatCard, Sidebar, Topbar.

## Outcome

Button component (all variants) and the Topbar component's nested Button instance now render
clean, single-label, non-overlapping text. No other existing screens/composites (Sidebar) were
affected by or exhibited the corruption.
