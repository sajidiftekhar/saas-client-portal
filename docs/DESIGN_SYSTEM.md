# Design System

**Philosophy:** Warm & Editorial — the feel of Notion meets Craft. Generous breathing room,
a subtle warm-neutral palette, a slate-blue accent for interactive elements, and sharply
hierarchical typography. The result is a dashboard that feels considered and premium without
being cold or over-designed.

---

## Typography

**Font family:** [Inter](https://fonts.google.com/specimen/Inter)
Loaded via `next/font/google` with weights 400, 500, 600, 700.
CSS variable: `--font-inter` → mapped to Tailwind's `--font-sans`.

### Type Scale

| Name       | Size (rem) | Size (px) | Line-Height | Weight | Usage                              |
|------------|-----------|-----------|-------------|--------|------------------------------------|
| `display`  | 2.25rem   | 36px      | 2.75rem     | 700    | Hero / marketing headings          |
| `h1`       | 1.875rem  | 30px      | 2.375rem    | 700    | Page titles (`text-3xl font-bold`) |
| `h2`       | 1.375rem  | 22px      | 1.875rem    | 600    | Section headings                   |
| `h3`       | 1.125rem  | 18px      | 1.625rem    | 600    | Card / panel headings              |
| `h4`       | 1rem      | 16px      | 1.5rem      | 600    | Sub-section labels                 |
| `body-lg`  | 1rem      | 16px      | 1.75rem     | 400    | Lead / intro text                  |
| `body`     | 0.875rem  | 14px      | 1.5rem      | 400    | Default paragraph text             |
| `body-sm`  | 0.8125rem | 13px      | 1.375rem    | 400    | Supporting / secondary text        |
| `label`    | 0.75rem   | 12px      | 1rem        | 500    | Form labels, tags — `tracking-wide`|
| `caption`  | 0.6875rem | 11px      | 1rem        | 400    | Timestamps, metadata, footnotes    |

### Typography Rules

- **Page title:** always `text-3xl font-bold tracking-tight` + a subtitle `text-sm text-muted-foreground mt-1`
- **Section heading:** `text-base font-semibold` or `text-lg font-semibold`
- **Never** use raw `font-bold` without a matching `tracking-tight` on headings ≥ `text-xl`
- **Line-length:** prose content capped at `max-w-2xl`; settings pages at `max-w-2xl`; full-width for grids
- **Anti-aliasing:** `antialiased` is set globally on `<body>`

---

## Colour Palette

### Design Decisions
- **Warm neutrals** — a whisper of warmth (hue ~80–85°) in backgrounds to avoid the sterile
  pure-white look. Foreground text carries a faint blue-grey tone for depth.
- **Slate blue primary** — `oklch(0.44 0.12 250)` in light mode. Not vivid indigo, not corporate
  navy — a restrained, sophisticated blue that reads as "active / interactive".
- **Zero arbitrary colours** — all colour usage flows through CSS variables. Hardcoded Tailwind
  colour utilities (`bg-emerald-100` etc.) are only permitted for status badges, which have
  their own semantic variable set.

### Light Mode (`:root`)

| Token                    | Value                    | Description                        |
|--------------------------|--------------------------|------------------------------------|
| `--background`           | `oklch(0.99 0.003 85)`   | Subtly warm white page background  |
| `--foreground`           | `oklch(0.14 0.008 265)`  | Near-black with faint blue tone    |
| `--card`                 | `oklch(1 0.002 85)`      | Warm white card surface            |
| `--card-foreground`      | same as `--foreground`   |                                    |
| `--popover`              | same as `--card`         |                                    |
| `--primary`              | `oklch(0.44 0.12 250)`   | Slate blue — CTAs, active states   |
| `--primary-foreground`   | `oklch(0.985 0 0)`       | White text on primary              |
| `--secondary`            | `oklch(0.965 0.006 80)`  | Warm off-white surface             |
| `--secondary-foreground` | `oklch(0.25 0.01 265)`   | Dark text on secondary             |
| `--muted`                | `oklch(0.965 0.006 80)`  | Muted backgrounds                  |
| `--muted-foreground`     | `oklch(0.52 0.012 260)`  | Slate-tinted secondary text        |
| `--accent`               | `oklch(0.94 0.025 250)`  | Light slate tint for hover bg      |
| `--accent-foreground`    | `oklch(0.25 0.01 265)`   | Text on accent                     |
| `--border`               | `oklch(0.905 0.008 80)`  | Warm light grey border             |
| `--input`                | `oklch(0.905 0.008 80)`  | Input borders                      |
| `--ring`                 | `oklch(0.44 0.12 250)`   | Focus ring matches primary         |
| `--destructive`          | `oklch(0.577 0.245 27)`  | Red for errors/delete              |
| `--sidebar`              | `oklch(0.28 0.09 250)`   | Deep slate-blue sidebar background |
| `--radius`               | `0.75rem` (12px)         | Base border-radius                 |

### Dark Mode (`.dark`)

| Token               | Value                       | Description                   |
|---------------------|-----------------------------|-------------------------------|
| `--background`      | `oklch(0.13 0.012 265)`     | Deep warm-grey, almost black  |
| `--foreground`      | `oklch(0.97 0.004 80)`      | Warm off-white text           |
| `--card`            | `oklch(0.185 0.012 265)`    | Slightly lighter than bg      |
| `--primary`         | `oklch(0.58 0.14 250)`      | Lightened slate blue          |
| `--muted`           | `oklch(0.24 0.012 265)`     | Dark muted surface            |
| `--muted-foreground`| `oklch(0.62 0.015 260)`     | Readable secondary text       |
| `--accent`          | `oklch(0.26 0.04 250)`      | Dark slate-tint hover         |
| `--border`          | `oklch(0.25 0.012 265)`     | Subtle dark border            |
| `--sidebar`         | `oklch(0.19 0.09 250)`      | Deeper slate-blue in dark mode |

### Status Colours

Status badge colours are defined as semantic CSS custom properties in `globals.css` so they
invert correctly in dark mode. **Do not** hardcode Tailwind colour utilities for status states
outside of the `PROJECT_STATUS_CONFIG` mapping, and ensure any new statuses are added to both
`:root` and `.dark` blocks.

| Status      | Light bg / text                | Dark bg / text                 |
|-------------|--------------------------------|--------------------------------|
| `active`    | emerald-100 / emerald-800      | emerald-950 / emerald-400      |
| `review`    | amber-100 / amber-800          | amber-950 / amber-400          |
| `completed` | sky-100 / sky-800              | sky-950 / sky-400              |
| `on_hold`   | orange-100 / orange-800        | orange-950 / orange-400        |
| `archived`  | muted / muted-foreground       | muted / muted-foreground       |

---

## Spacing Scale

Tailwind's default spacing scale is used throughout. Named tiers map to specific use-cases:

| Tier  | Tailwind | px  | Usage                                                |
|-------|----------|-----|------------------------------------------------------|
| `xs`  | `1`      | 4px | Icon gaps, inline micro-spacing                      |
| `sm`  | `2`      | 8px | Between label and input, tight inline groupings      |
| `md`  | `4`      | 16px| Between form fields, avatar stacks, card element gaps|
| `lg`  | `6`      | 24px| Card internal padding, sub-section dividers          |
| `xl`  | `8`      | 32px| **Standard page padding** (`p-8`), between sections  |
| `2xl` | `12`     | 48px| Between major content blocks (`space-y-10`)          |
| `3xl` | `16`     | 64px| Page-level breathing room on marketing pages         |

### Spacing Rules

- **Page main padding:** `p-8` (was `p-6`)
- **Section gaps:** `space-y-8` between major sections (was `space-y-6`)
- **Card grids:** `gap-6` (was `gap-4`)
- **Within cards:** `CardHeader` uses `p-6`, `CardContent` uses `px-6 pb-6 pt-0`
- **Form field groups:** `space-y-5`, within each field `space-y-1.5`
- **Inline icon + label:** `gap-2`

---

## Elevation & Shadows

Three named shadow levels are defined as CSS custom properties and available via Tailwind utility
classes (`shadow-card`, `shadow-dropdown`, `shadow-modal`):

| Name            | Property           | Usage                              |
|-----------------|--------------------|------------------------------------|
| `--shadow-sm`   | subtle 2-layer     | Input focus, minor lift            |
| `--shadow-card` | 2-layer, 12px blur | Cards — default state              |
| `--shadow-lg`   | 2-layer, 32px blur | Modals, sheets, popovers           |

```css
--shadow-sm:   0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);
--shadow-card: 0 4px 12px oklch(0 0 0 / 0.07), 0 2px 4px oklch(0 0 0 / 0.04);
--shadow-lg:   0 12px 32px oklch(0 0 0 / 0.10), 0 4px 8px oklch(0 0 0 / 0.06);
```

In dark mode, shadow opacity is reduced by ~40% to avoid harsh halos.

---

## Border Radius

Base: `--radius: 0.75rem` (12px) — rounded enough to feel modern and warm, not so rounded as to
look like a consumer/mobile app.

| Token         | Calc                    | px   | Usage                     |
|---------------|-------------------------|------|---------------------------|
| `--radius-sm` | `calc(var(--radius) * 0.5)` | 6px  | Badges, tags, chips       |
| `--radius-md` | `calc(var(--radius) * 0.75)`| 9px  | Inputs, buttons           |
| `--radius-lg` | `var(--radius)`         | 12px | Cards, dropdowns          |
| `--radius-xl` | `calc(var(--radius) * 1.5)` | 18px | Modals, sheets            |
| `--radius-2xl`| `calc(var(--radius) * 2)`   | 24px | Feature cards (marketing) |
| `full`        | `9999px`                | —    | Avatars, pills, toggles   |

---

## Layout Conventions

### Dashboard Shell

| Element              | Class / Value             | Note                              |
|----------------------|---------------------------|-----------------------------------|
| Header height        | `h-16`                    | Up from h-14 for more presence    |
| Header padding       | `px-6`                    |                                   |
| Sidebar width        | Default shadcn sidebar    |                                   |
| Main content padding | `p-8`                     | Generous breathing room           |
| Max-width (content)  | `max-w-5xl` where needed  | For single-stream content         |
| Max-width (forms)    | `max-w-2xl`               | Settings, single-column pages     |

### Grid Systems

| Context       | Class                                      |
|---------------|--------------------------------------------|
| Stat cards    | `grid gap-6 sm:grid-cols-2 lg:grid-cols-4` |
| Project cards | `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` |
| Form fields   | `grid gap-4 sm:grid-cols-2` (2-col forms)  |

---

## Component Patterns

### Page Header
Every page's top section follows a consistent structure:
```tsx
<div>
  <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
  <p className="mt-1 text-sm text-muted-foreground">Supporting subtitle text.</p>
</div>
```

### Cards
- Default: `rounded-xl border shadow-[var(--shadow-card)]`
- Interactive (links): add `transition-shadow hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5`
- **Never** use `shadow-md` or `shadow-lg` directly — use the custom shadow variables for consistency

### Buttons
Four semantic variants — do not create custom colours outside this set:

| Variant       | When to use                                 |
|---------------|---------------------------------------------|
| `default`     | Primary CTA — filled slate blue             |
| `secondary`   | Secondary actions on the same surface       |
| `ghost`       | Tertiary / navigation; toolbar actions      |
| `destructive` | Irreversible delete / remove actions        |
| `outline`     | Alternative to secondary when border helps  |

### Form Fields
- Input height: `h-10` default, `h-11` for prominent/hero forms
- Label: `text-sm font-medium` (maps to the `label` type token)
- Helper / error text: `text-xs text-muted-foreground` / `text-xs text-destructive`
- Field gap: `space-y-1.5` within each field, `space-y-5` between fields

### Sidebar Active State
- Active item: `bg-accent text-accent-foreground font-medium`
- Active indicator: left border `border-l-2 border-primary` (inside the item)
- Hover: `hover:bg-accent/60`
- The sidebar uses a **deep slate-blue** background (same hue as `--primary`) in both light and dark modes — it is intentionally distinct from the main content area
- All sidebar text uses `text-sidebar-foreground` tokens; never use `text-muted-foreground` inside the sidebar as it references the global muted scale which will be unreadable against the dark blue background. Use `text-sidebar-foreground/50` for de-emphasised labels instead.

### Sheets (Slide-over Panels)

Sheets replace full-page modals for create/edit flows. They share a consistent layout structure:

- `SheetContent` always has `p-0 gap-0` — all padding is managed explicitly by its children, not the primitive
- **Header:** `px-6 pt-6 pb-5 border-b` with `SheetTitle` at `text-xl font-semibold` and `SheetDescription` at `text-sm text-muted-foreground`
- **Body:** a scrollable `flex-1 overflow-y-auto` container with `px-6 py-6` and `space-y-5` between fields
- **Footer (actions):** sticky at the bottom with `border-t px-6 py-4 bg-background`; always `flex justify-end gap-2`
- **Width:** `sm:max-w-[580px]` for standard forms
- **Two short fields** (e.g. Status + Due Date) should be placed side-by-side in a `grid grid-cols-2 gap-4` rather than stacked

```tsx
<SheetContent className="data-[side=right]:sm:max-w-[580px] flex flex-col gap-0 p-0">
  <SheetHeader className="px-6 pt-6 pb-5 border-b gap-1">
    <SheetTitle className="text-xl font-semibold">…</SheetTitle>
    <SheetDescription>…</SheetDescription>
  </SheetHeader>
  <div className="flex-1 overflow-y-auto">
    <form className="flex flex-col h-full">
      <div className="px-6 py-6 space-y-5 flex-1">
        {/* fields */}
      </div>
      <div className="flex justify-end gap-2 border-t px-6 py-4 bg-background">
        <Button variant="outline">Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  </div>
</SheetContent>
```

### Badges / Status Pills
- Base: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium`
- Use status-specific CSS variable classes from `globals.css` — reference `PROJECT_STATUS_CONFIG`
- Status dot: `h-1.5 w-1.5 rounded-full` coloured per status

---

## Dark Mode

Dark mode is toggled via the `class` strategy (`next-themes` with `attribute="class"`).
A sun/moon toggle lives in the dashboard header (right side).

- Default theme: `system` (inherits OS preference)
- All colour tokens have `.dark` overrides in `globals.css`
- Status badge colours have `.dark` overrides
- Shadow opacity is reduced in dark mode via `--shadow-card` / `--shadow-lg` overrides in `.dark`
- **Never** use `bg-white` or `text-black` directly — always use semantic tokens

---

## File Locations

| Concern               | File                                      |
|-----------------------|-------------------------------------------|
| CSS variables/tokens  | `src/app/globals.css`                     |
| Font loading          | `src/app/layout.tsx`                      |
| Theme provider        | `src/app/layout.tsx`                      |
| Dark mode toggle      | `src/components/shared/dashboard-header.tsx` |
| Status colour config  | `src/types/index.ts`                      |
| UI primitives         | `src/components/ui/`                      |
| Domain components     | `src/components/shared/`                  |
