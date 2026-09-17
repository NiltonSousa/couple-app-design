# Task 7 Completion Report — Topbar composite

## Summary
Task 7 has been completed successfully. The `Topbar` component was created as a reusable library component with the correct structure, layout, and content.

## What Was Built

**Component:** `Topbar` (stored in `storage.topbarComponent`)

**Structure:**
- Board: 1048px wide × 76px tall
- Flex layout: `dir: 'row'`, `space-between`, `center-aligned`
- Horizontal padding: 32px, Vertical padding: 18px
- Background fill: `#F4F6F8`

**Left section (eyebrow + title):**
- Flex column layout with 4px row gap
- Eyebrow: "PAINEL DE CUSTOS" (12px, gray `#7C8A97`, auto-width)
- Title: "Resumo do casal" (20px, bold, dark `#1F2933`, auto-width)

**Right section (pill + button):**
- Flex row layout with 12px column gap
- Balance Pill: "Contas quitadas" (Neutral tone instance)
- Primary Button: "+ Novo gasto" (Primary style instance)

## Deviations
None. The variant property names (`Tone` for Pill, `Style` for Button) were correct as initially assumed, so no adjustments were needed.

## Technical Notes

**Fix Applied:** The initial `penpot.createText()` calls failed with "Value not valid" error. Resolution: `createText()` requires an initial text string parameter (e.g., `penpot.createText('Text here')`), not called with no arguments.

**Component Creation:** After building the Topbar board, it was added to `penpot.root`, then passed to `penpot.library.local.createComponent([topbar])` to create the reusable component while keeping the board at root level as the component's main instance.

## Final Verification

**Top-level shape count:** 13 (correct)
- 12 original components: Button, Card, Pill, StatusBadge, Tag, Field/Input, Field/Select, Field/Textarea, RadioPill, Avatar, StatCard, Sidebar
- 1 new component: Topbar

**Final shapeStructure (penpot.root, depth 1):**
```
Root Frame (board)
├── Button (board, variant container)
├── Card (board)
├── Pill (board)
├── StatusBadge (board)
├── Tag (board)
├── Field / Input (board)
├── Field / Select (board)
├── Field / Textarea (board)
├── RadioPill (board)
├── Avatar (board)
├── StatCard (board)
├── Sidebar (board)
└── Topbar (board, flex: row, space-between, center)
    ├── left (board, flex: column, gap: 4)
    │   ├── eyebrow (text)
    │   └── title (text)
    └── right (board, flex: row, gap: 12)
        ├── balance-pill (Pill component instance)
        └── btn-new-expense (Button component instance)
```

## Ready for Next Tasks
The `storage.topbarComponent` is populated and ready for use in screen tasks. Screens can instantiate this component and override:
- Eyebrow text (e.g., different page context)
- Title text (e.g., "Despesas conjuntas", "Detalhes da transação")
- Pill tone/label (e.g., Accent for pending, Danger for alerts)
- Button label (if needed)

Component ID: `e2e09cb5-e94d-80d9-8008-4339f9a36107`
Main Instance ID: `e2e09cb5-e94d-80d9-8008-4339f945845b`
