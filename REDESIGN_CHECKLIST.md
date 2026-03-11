# C3 Esports Platform — Website Redesign Checklist

Track every file that needs a visual update for a full redesign. Check off each item as it's done.

---

## Shared / Global (do these first — they cascade everywhere)

- [x] **Design tokens** — C3 red + navy blue palette applied; `src/app/globals.css` updated, typography scale, spacing, and border-radius; update `src/app/globals.css` and Tailwind config
- [x] **Root layout** — `src/app/layout.tsx` — SessionProvider added, fonts intact
- [x] **Navbar** — `src/components/layout/navbar.tsx` + `src/components/layout/navbar-client.tsx` — logo, links, mobile menu
- [x] **User menu** — `src/components/layout/user-menu.tsx` — avatar, dropdown items
- [x] **Footer** — `src/components/layout/footer.tsx` — columns, colors, bottom bar
- [x] **Dashboard shell** — `src/components/layout/DashboardShell.tsx` — sidebar wrapper, content area
- [x] **Sidebar** — `src/components/layout/Sidebar.tsx` — nav items, active state, icons
- [x] **Admin sidebar** — `src/components/layout/AdminSidebar.tsx`

---

## UI Primitives (update once, used everywhere)

- [x] `src/components/ui/button.tsx` + `src/components/ui/button-variants.ts`
- [x] `src/components/ui/avatar.tsx`
- [x] `src/components/ui/dropdown-menu.tsx`
- [x] `src/components/ui/sheet.tsx` (mobile drawer)
- [x] `src/components/ui/skeleton.tsx`

---

## Public Pages

- [x] **Home / Landing** — `src/app/page.tsx` → `/` (+ all `src/components/home/*.tsx` section components)
- [x] **Seasons list** — `src/app/(public)/seasons/page.tsx` → `/seasons`
- [x] **Season detail** — `src/app/(public)/seasons/[seasonSlug]/page.tsx` → `/seasons/[slug]`
- [ ] **Season standings** — `src/app/(public)/seasons/[seasonSlug]/standings/page.tsx`
- [ ] **Season matches** — `src/app/(public)/seasons/[seasonSlug]/matches/page.tsx`
- [ ] **Teams list** — `src/app/(public)/teams/page.tsx` → `/teams`
- [ ] **Team public profile** — `src/app/(public)/teams/[teamSlug]/page.tsx` → `/teams/[slug]`
- [ ] **Public matches** — `src/app/(public)/matches/page.tsx` → `/matches`
- [ ] **Rules** — `src/app/(public)/rules/page.tsx` → `/rules`
- [ ] **Credits** — `src/app/(public)/credits/page.tsx` → `/credits`
- [ ] **Terms of Service** — `src/app/(public)/legal/terms/page.tsx` → `/legal/terms`
- [ ] **Privacy Policy** — `src/app/(public)/legal/privacy/page.tsx` → `/legal/privacy`

---

## Auth Pages

- [ ] **Sign in** — `src/app/auth/signin/page.tsx` → `/auth/signin`
- [ ] **Register** — `src/app/auth/register/page.tsx` → `/auth/register`
- [ ] **Auth error** — `src/app/auth/error/page.tsx` → `/auth/error`
- [ ] **Unauthorized** — `src/app/unauthorized/page.tsx` → `/unauthorized`

---

## Dashboard Pages (authenticated)

- [ ] **Dashboard home** — `src/app/(dashboard)/dashboard/page.tsx` → `/dashboard`
- [ ] **Dashboard matches** — `src/app/(dashboard)/dashboard/matches/page.tsx` → `/dashboard/matches`
- [ ] **Standings** — `src/app/(dashboard)/standings/page.tsx` → `/standings`
- [ ] **My profile** — `src/app/(dashboard)/profile/page.tsx` → `/profile`
- [ ] **Edit profile** — `src/app/(dashboard)/profile/edit/page.tsx` → `/profile/edit`
- [ ] **Profile setup** — `src/app/(dashboard)/profile/setup/page.tsx` → `/profile/setup`

---

## Profile Components

- [ ] `src/components/profile/AvatarUpload.tsx`
- [ ] `src/components/profile/EduVerificationCard.tsx`
- [ ] `src/components/profile/NotificationPrefs.tsx`
- [ ] `src/components/player/PlayerProfileForm.tsx`
- [ ] `src/components/player/EpicLinkButton.tsx`
- [ ] `src/components/player/SteamLinkButton.tsx`

---

## Team Pages

- [ ] **My team** — `src/app/(dashboard)/team/page.tsx` → `/team`
- [ ] **Create team** — `src/app/(dashboard)/team/create/page.tsx` → `/team/create`
- [ ] **Team detail** — `src/app/(dashboard)/team/[teamId]/page.tsx` → `/team/[id]`
- [ ] **Team roster** — `src/app/(dashboard)/team/[teamId]/roster/page.tsx`
- [ ] **Team settings** — `src/app/(dashboard)/team/[teamId]/settings/page.tsx`
- [ ] **Team registration** — `src/app/(dashboard)/team/[teamId]/register/page.tsx`

---

## Match Pages

- [ ] **Match detail** — `src/app/(dashboard)/matches/[matchId]/page.tsx` → `/matches/[id]`
- [ ] **Match report / score submission** — `src/app/(dashboard)/matches/[matchId]/report/page.tsx`

---

## Admin Pages

- [ ] **Admin dashboard** — `src/app/admin/page.tsx` → `/admin`
- [ ] **Admin layout** — `src/app/admin/layout.tsx`
- [ ] **Users** — `src/app/admin/users/page.tsx`
- [ ] **Teams list** — `src/app/admin/teams/page.tsx`
- [ ] **Team detail** — `src/app/admin/teams/[teamId]/page.tsx`
- [ ] **Seasons list** — `src/app/admin/seasons/page.tsx`
- [ ] **Create season** — `src/app/admin/seasons/create/page.tsx`
- [ ] **Season detail** — `src/app/admin/seasons/[seasonId]/page.tsx`
- [ ] **Season settings** — `src/app/admin/seasons/[seasonId]/settings/page.tsx`
- [ ] **Registrations (per season)** — `src/app/admin/seasons/[seasonId]/registrations/page.tsx`
- [ ] **Matches list** — `src/app/admin/matches/page.tsx`
- [ ] **Create match** — `src/app/admin/matches/create/page.tsx`
- [ ] **Match detail** — `src/app/admin/matches/[matchId]/page.tsx`
- [ ] **Registrations (global)** — `src/app/admin/registrations/page.tsx`
- [ ] **Standings** — `src/app/admin/standings/page.tsx`
- [ ] **Disputes list** — `src/app/admin/disputes/page.tsx`
- [ ] **Dispute detail** — `src/app/admin/disputes/[disputeId]/page.tsx`
- [ ] **Audit log** — `src/app/admin/audit/page.tsx`

---

## Layouts

- [ ] `src/app/(dashboard)/layout.tsx` — dashboard shell, auth gate
- [ ] `src/app/(public)/layout.tsx` — public wrapper
- [ ] `src/app/admin/layout.tsx` — admin shell, role gate

---

## Loading / Error States

- [ ] `src/app/(dashboard)/profile/loading.tsx` — profile skeleton
- [ ] Add/update any other `loading.tsx` or `error.tsx` files to match new design

