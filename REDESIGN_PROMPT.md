# C3 Esports — Redesign System Prompt

Paste this at the start of any redesign task. It gives Claude the full design system, code standards, and quality checks needed to produce consistent, high-quality output.

---

## Who You Are Working For

C3 Esports is a collegiate Rocket League league for students across North Carolina and South Carolina. The audience is **18–22-year-old gamers** — they expect a sleek, modern, dark-themed interface that feels competitive and polished, not corporate. Think clean esports product, not SaaS dashboard.

---

## Tech Stack (never deviate from this)

- **Framework:** Next.js 14 App Router (TypeScript)
- **Styling:** Tailwind CSS v4 + CSS variables (no inline `style=` unless absolutely necessary for dynamic values)
- **Component library:** shadcn/ui primitives (`src/components/ui/`)
- **Fonts:** `font-display` (Rajdhani — headings), `font-sans` (Inter — body), `font-serif` (Playfair Display — editorial accents only)
- **Icons:** `lucide-react` only — no other icon libraries
- **Animation:** `framer-motion` for page-level transitions; CSS transitions for micro-interactions
- **State:** React `useState` / `useTransition` — no external state library

---

## Design Tokens (use these, never hardcode colors)

### Dark theme (default — `html` has `class="dark"`)
```
Background:       oklch(0.04 0 0)   →  bg-background
Card surface:     oklch(0.08 0 0)   →  bg-card
Subtle surface:   oklch(0.11 0 0)   →  bg-muted / bg-secondary
Border:           oklch(0.16 0 0)   →  border-border
Primary text:     oklch(0.97 0 0)   →  text-foreground
Muted text:       oklch(0.48 0 0)   →  text-muted-foreground
Brand (crimson):  oklch(0.50 0.20 15) → text-brand / bg-brand
Ring / focus:     oklch(0.50 0.20 15) → ring-ring
```

### Accent palette (use sparingly for highlights, badges, status)
```
Violet:  rgba(124,58,237,…)   — links, active states, glow effects
Cyan:    rgba(6,182,212,…)    — decorative gradients only
Emerald: rgba(52,211,153,…)   — success / verified states
Red:     rgba(220,38,38,…)    — destructive / error states
```

### Typography scale
```
Page title:      font-display text-2xl–3xl font-bold uppercase tracking-wider
Section heading: font-display text-lg–xl font-semibold uppercase tracking-widest
Card label:      font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground
Body:            font-sans text-sm leading-relaxed text-foreground / text-muted-foreground
Code / ID:       font-mono text-sm
```

---

## Visual Design Rules

1. **Dark, near-black backgrounds.** Base is `bg-background` (`oklch(0.04 0 0)`). Cards sit on `bg-card` (`oklch(0.08 0 0)`). Never use pure `#000000` or white backgrounds.

2. **Subtle borders only.** Use `border-border` (`oklch(0.16 0 0)`). Never use `border-white` or high-contrast borders — everything should feel slightly recessed.

3. **Glow / ambient effects for hero sections only.** Use `radial-gradient` blobs with `filter: blur(80px)` and low opacity (`opacity-15` to `opacity-25`). Never on interactive elements.

4. **Rounded corners are generous.** Use `rounded-xl` (cards), `rounded-lg` (inputs, smaller cards), `rounded-full` (badges, pills, avatars). Never sharp `rounded-none` unless it's a full-bleed divider.

5. **Spacing is breathable.** Prefer `p-6` on cards, `gap-6` between sections, `py-16` for page padding. Don't cram content.

6. **Brand crimson is for primary actions only** — submit buttons, CTAs. Violet (`rgba(124,58,237,…)`) is for links, focus rings, and active states. Never use both on the same element.

7. **Uppercase tracking for labels and nav items.** Section labels and nav items use `uppercase tracking-widest` or `tracking-[0.28em]`. Body copy never has tracking applied.

8. **No decorative shadows on text.** Box shadows on cards are subtle (`shadow-sm`). Never `text-shadow`.

9. **Hierarchy through opacity, not color.** Primary content is `text-foreground`. Secondary is `text-muted-foreground`. Disabled / decorative is `text-muted-foreground/40`. Don't introduce new hues for hierarchy.

10. **Transitions on every interactive element.** Always add `transition-colors duration-150` or `transition-all duration-150`. No instant color changes on hover.

---

## Component Patterns

### Cards
```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
  {/* content */}
</div>
```

### Section header inside a card
```tsx
<div className="flex items-center gap-2 px-6 py-4 border-b border-border">
  <Icon className="h-4 w-4 text-muted-foreground" />
  <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
    Section Title
  </h2>
</div>
```

### Page-level header
```tsx
<div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-violet-400/60">
  Breadcrumb / Category
</div>
<h1 className="font-display text-3xl font-bold tracking-tight text-foreground/92">
  Page Title
</h1>
```

### Primary button
```tsx
<button className="rounded-xl px-4 py-2.5 font-sans text-sm font-semibold
  bg-brand/18 border border-brand/30 text-brand-foreground/90
  hover:bg-brand/28 hover:border-brand/50
  transition-all duration-150 disabled:opacity-50">
  Action
</button>
```

### Text input
```tsx
<input className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none
  bg-muted border border-border text-foreground
  focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/12
  transition-all duration-150" />
```

### Status badge
```tsx
{/* success */}
<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
  <CheckCircle2 className="h-3 w-3" /> Verified
</span>
{/* warning */}
<span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
  Pending
</span>
{/* error */}
<span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
  Rejected
</span>
```

### Error message
```tsx
<p className="text-xs rounded-lg px-3 py-2
  bg-destructive/8 border border-destructive/20 text-red-300/90">
  {error}
</p>
```

### Decorative gradient rule (hero / footer of cards)
```tsx
<div className="h-px w-20"
  style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)" }}
/>
```

---

## Code Quality Rules

### Structure
- **Server components by default.** Only add `"use client"` when you need browser APIs, event handlers, or hooks. Data fetching happens in server components with `prisma` directly — no `fetch()` for internal routes from server components.
- **Co-locate client wrappers.** If a page is a server component but needs one interactive piece, extract a `*Wrapper.tsx` or `*Client.tsx` client component for just that piece — don't make the whole page a client component.
- **`useSearchParams()` always needs `<Suspense>`** wrapping the component that calls it in the parent server component.

### Naming & organization
- Page files: `page.tsx`, `layout.tsx`, `loading.tsx` — never named anything else
- Client wrappers: `FooWrapper.tsx` or `FooClient.tsx` next to the page
- Shared components: `src/components/{domain}/ComponentName.tsx`

### Data fetching
- Use `prisma` directly in server components — never build internal API calls from server components
- Parallel fetches: `const [a, b] = await Promise.all([prisma.foo.findUnique(…), prisma.bar.findMany(…)])`
- Always handle the `null` case — redirect or show empty state, never crash

### Forms
- Client components with controlled inputs and `useTransition` for async submission
- Disable the submit button while `isPending` / `loading`; show a spinner or loading label
- Show inline error messages below the form — never `alert()`
- Always validate on the server too — client validation is UX, not security

### Accessibility
- Every `<input>` has a `<label>` with matching `htmlFor` / `id`
- Every icon-only button has `aria-label`
- Interactive elements have visible focus styles (`focus-visible:ring-2 focus-visible:ring-ring`)
- Color is never the *only* indicator of state — pair with an icon or text

### Performance
- Images always use `next/image` with explicit `width` and `height`
- Dynamic data pages must be `ƒ` (dynamic) — don't accidentally cache pages with user-specific content
- Avoid `useEffect` for data fetching — use server components or `useTransition`

---

## Quality Checklist — Run on Every Page Before Marking Done

### Visual
- [ ] Background is `bg-background` (near-black), not white or grey
- [ ] Cards use `bg-card` + `border-border` + `rounded-xl`
- [ ] All text uses semantic tokens (`text-foreground`, `text-muted-foreground`) — no raw hex
- [ ] Hover / focus states exist on every interactive element
- [ ] Page has breathing room — at least `py-10 px-4` at the page level
- [ ] Mobile layout tested at 375 px — nothing overflows or gets cut off
- [ ] No jarring color jumps — transitions on all interactive elements

### Code
- [ ] No `"use client"` on the page itself unless the entire page is interactive
- [ ] `useSearchParams()` is inside a component wrapped in `<Suspense>`
- [ ] All images use `next/image`
- [ ] No hardcoded color values (no `#fff`, `rgb(…)`, or raw `oklch(…)` outside `globals.css`)
- [ ] TypeScript has no errors (`npx tsc --noEmit` is clean)
- [ ] Build passes (`npx next build`)

### UX
- [ ] Loading state shown for every async action (spinner, disabled button, skeleton)
- [ ] Error state shown for every async action (inline message, not silent failure)
- [ ] Empty state shown when a list/table has no data
- [ ] Every form field has a visible label
- [ ] Destructive actions (delete, ban) have a confirmation step
- [ ] Back navigation exists on detail pages

---

## What NOT to Do

- **Don't use `style=` for static values** — use Tailwind classes. Only use `style=` for truly dynamic runtime values (e.g. a progress bar width from a variable).
- **Don't add `framer-motion` to every element** — reserve it for page-level enter animations and meaningful transitions. Overuse kills performance.
- **Don't introduce new dependencies** without a strong reason — the stack is intentionally minimal.
- **Don't make the whole page a client component** just because one button needs `onClick`.
- **Don't use `alert()`, `console.log()`, or `TODO` comments** in committed code.
- **Don't skip empty and error states** — a blank page or silent failure is never acceptable.
- **Don't hardcode copy** like team names, season numbers, or dates — always pull from the database.
