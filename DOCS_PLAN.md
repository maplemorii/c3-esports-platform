# C3 Esports Platform — Documentation Site Plan

A comprehensive plan for building a player-facing, staff-facing, and admin-facing documentation site.

---

## Technology Recommendation: Mintlify

**Why Mintlify:**
- Zero-config MDX docs with built-in search, versioning, and dark mode
- Role-based navigation groups (collapse staff/admin sections for regular users)
- OpenAPI tab for auto-generated API reference from your route types
- Deploys as a standalone subdomain (`docs.c3esports.com`) — no changes to the main app
- Free tier covers this scale

**Alternatives if Mintlify doesn't fit:**
- **Nextra** — if you want docs inside the Next.js monorepo (`/docs` subfolder, same repo)
- **Starlight (Astro)** — fastest static output, Markdown-first, great for large sites
- **GitBook** — hosted, collaborative editing for non-technical staff writers

**Recommended location:** Separate repo `c3-esports-docs`, deployed to `docs.c3esports.com` via Mintlify/Vercel/Netlify.

---

## Site Structure

```
docs.c3esports.com/
│
├── Getting Started
│   ├── Welcome to C3 Esports
│   ├── Creating Your Account
│   ├── Linking Discord
│   └── Setting Up Your Player Profile
│
├── Players
│   ├── Overview (what players can do)
│   ├── Joining a Team
│   ├── Leaving a Team
│   ├── Viewing Your Match Schedule
│   ├── Checking In to a Match
│   ├── Submitting a Match Result
│   ├── Uploading a Replay
│   ├── Filing a Dispute
│   └── Viewing Standings & Stats
│
├── Team Managers
│   ├── Overview (what managers can do)
│   ├── Creating a Team
│   ├── Managing Your Roster
│   │   ├── Adding Players
│   │   ├── Removing Players
│   │   └── Player Roles (Player, Sub, Coach)
│   ├── Registering for a Season
│   ├── Managing Match Results
│   │   ├── Check-In Process
│   │   ├── Submitting Scores
│   │   ├── Confirming Opponent Scores
│   │   └── Forfeits & No-Shows
│   ├── Filing a Dispute
│   ├── Team Settings & Branding
│   └── Roster Eligibility Rules
│
├── Staff
│   ├── Overview & Responsibilities
│   ├── Season Management
│   │   ├── Creating a Season
│   │   ├── Season Status Lifecycle
│   │   ├── Configuring Divisions
│   │   └── Generating League Weeks
│   ├── Registration Management
│   │   ├── Reviewing Pending Registrations
│   │   ├── Approving / Rejecting / Waitlisting
│   │   └── Bulk Actions
│   ├── Match Management
│   │   ├── Scheduling Matches
│   │   ├── Check-In Overrides
│   │   ├── Overriding Match Results
│   │   └── Forfeiting a Match
│   ├── Dispute Resolution
│   │   ├── Reviewing Open Disputes
│   │   ├── Resolving vs. Dismissing
│   │   └── Escalation Policy
│   ├── Standings Management
│   │   ├── Manual Standings Edits
│   │   └── Recalculating Standings
│   └── Replay Reparsing
│
├── Admins
│   ├── Overview & Access Levels
│   ├── User Management
│   │   ├── Searching & Viewing Users
│   │   ├── Changing User Roles
│   │   ├── .edu Verification Override
│   │   └── Suspending / Deleting Accounts
│   ├── Season & Division Config (advanced)
│   ├── Bracket Management
│   ├── Audit Log
│   ├── Platform Announcements
│   └── Cron Job Reference
│
├── League Rules & Policies
│   ├── Eligibility Requirements
│   ├── Roster Rules
│   ├── Match Rules & Format
│   ├── Check-In Policy
│   ├── Result Submission Deadlines
│   ├── Replay Requirements
│   ├── Dispute Policy
│   ├── Code of Conduct
│   └── Anti-Smurfing & Multiple Accounts Policy
│
└── Reference
    ├── Season Lifecycle (status diagram)
    ├── Match Status Lifecycle (status diagram)
    ├── Division Tiers Explained
    ├── Points System
    ├── Standings Tiebreakers
    ├── Match Formats (BO1 / BO3 / BO5 / BO7)
    ├── Replay Parsing (how ballchasing.com works)
    └── Glossary
```

---

## Implementation Plan

### Phase 1 — Setup (done)
- [x] Scaffold `docs/` folder with Mintlify config (`mint.json`)
- [x] Full navigation structure in `mint.json`
- [x] All pages created (Getting Started fully written; all others stubbed)
- [ ] Deploy to `docs.c3esports.com` (connect Mintlify to GitHub repo)
- [ ] Add link to docs in main site nav/footer

### Phase 2 — Core Player & Manager Docs
- [ ] Players section (all 9 pages)
- [ ] Team Managers section (all 8 pages)
- [ ] Add screenshots once platform is live

### Phase 3 — Staff & Admin Docs
- [ ] Staff section (all 7 pages)
- [ ] Admins section (all 6 pages)
- [ ] Cron job reference table

### Phase 4 — Rules & Reference
- [ ] League Rules pages (written by league leadership — templates provided)
- [ ] Reference pages (lifecycle diagrams, glossary, formats)

### Phase 5 — Polish
- [ ] Add docs link to main site nav and footer
- [ ] Add docs link to `/unauthorized` and 404 error pages
- [ ] Review all pages for accuracy against live platform
- [ ] Capture and embed screenshots

---

## Screenshots to Capture (once platform is live)

| Page | What to Screenshot |
|---|---|
| `/profile/setup` | Profile setup form |
| `/profile/edit` | Connected accounts section |
| `/team/create` | Team creation form |
| `/team/[id]/roster` | Roster management table |
| `/team/[id]/register` | Season registration form |
| `/dashboard/matches` | Match schedule list |
| `/matches/[id]` | Match detail page (pre-match, check-in, post-match states) |
| `/matches/[id]/report` | Score submission form |
| `/admin/registrations` | Registration approval table |
| `/admin/disputes` | Dispute list |
| `/admin/disputes/[id]` | Dispute resolution view |
| `/admin/audit` | Audit log table |

---

## Notes

- **Rule pages are intentionally left as templates** — league leadership must write the actual rules.
- **Keep docs in sync with code** — update docs in the same PR or immediately after shipping a feature.
- **API Reference is optional** — only needed if external tools will consume the API.
