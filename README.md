# Vitals Lab — Pathology Laboratory Management System

A premium, fully front-end pathology lab management dashboard built with
**plain HTML5, CSS3, and vanilla JavaScript** — no frameworks, no build step,
no external CDN dependencies. Data is generated and persisted in the
browser's `localStorage` for now, so the app is fully interactive out of the
box and ready to be wired to a real shared database (Supabase) next.

## Quick start

Open **`login.html`** or **`admin-login.html`** in a browser. No server,
build tools, or installation required. A local static server (`npx serve`)
also works fine if you prefer not to use `file://`.

## Demo credentials

These are **not shown anywhere in the app UI** — a login page displaying
its own password is a real security/professionalism issue, so it's kept out
of the product and documented here only, for whoever is testing it.

| Role  | Page               | Username | Password  |
|-------|--------------------|----------|-----------|
| Staff | `login.html`       | `staff`  | `staff123`|
| Admin | `admin-login.html` | `admin`  | `admin123`|

Staff accounts cannot see **Expenses**, and their **Analytics**/**Reports**
pages hide the financial panels — enforced both in the sidebar and on the
page itself, so navigating directly to `expenses.html` as staff shows a
"Restricted Section" message instead of the module.

## No external dependencies at runtime

Everything the UI needs is self-hosted inside this repo:

- **Icons** — a self-hosted inline SVG icon set (`assets/js/icons.js`),
  not an external icon font. This was a deliberate fix: icon fonts
  (e.g. Font Awesome via CDN) render as broken "tofu" boxes if the CDN is
  slow, blocked, or unreachable — inline SVG never has that failure mode.
- **Fonts** — Sora, Inter, and JetBrains Mono are bundled as `.woff2` files
  under `assets/vendor/fonts/`, loaded via local `@font-face` rules in
  `style.css` — no Google Fonts CDN call.
- **Charts** — Chart.js is still loaded from a CDN (`cdn.jsdelivr.net`) since
  self-hosting a charting library adds real weight for little benefit; this
  is the one external call the app makes, and only on pages with charts.

## What's inside

- **Dashboard** — 6 animated stat cards, 6 live Chart.js graphs, recent
  patients table.
- **Patients** — full CRUD (25+ fields), search + 5 filters, pagination,
  CSV export, print, read-only detail view.
- **Doctors**, **Area Management** — full CRUD, search, filters, pagination.
- **Payments / Billing** — receipt table, live collection stats, filters,
  CSV export.
- **Pending Payments** — call / reminder / mark-paid actions.
- **Expenses** *(admin only)* — CRUD, category/vendor tracking, trend and
  category charts.
- **Reports** — 7 report types generated live from stored data, CSV export,
  print.
- **Analytics** — revenue, doctor performance, area-wise collection, patient
  growth, popular tests, income-vs-expenses (admin only).
- **Settings** — lab profile, logo upload (demo), profile name, password
  change, dark mode.

## Design language

Clinical, trustworthy palette (deep blue + teal on white), Sora for
headings, Inter for body text, JetBrains Mono for IDs/receipt numbers.
Status pills are color-coded after real **blood-collection tube caps**
(lavender = collected, blue = processing, green = reviewed, gold = report
released, red = cancelled) — one consistent visual language for "where is
this sample in its journey," used across dashboard, patients, payments, and
reports.

## Folder structure

```
Pathology-Lab/
├── index.html            Dashboard
├── login.html            Staff login
├── admin-login.html      Admin login
├── patients.html / doctors.html / areas.html
├── payments.html / pending-payments.html / expenses.html
├── reports.html / analytics.html / settings.html
├── vercel.json           Static hosting config (security + cache headers)
└── assets/
    ├── css/style.css, responsive.css
    ├── js/
    │   ├── icons.js       Self-hosted inline SVG icon system
    │   ├── app.js         Core: data seeding, storage, auth, shared UI
    │   ├── dashboard.js, patients.js, doctors.js, areas.js
    │   ├── payments.js, pending-payments.js, expenses.js
    │   ├── reports.js, analytics.js, settings.js, login.js
    └── vendor/fonts/      Self-hosted Sora/Inter/JetBrains Mono .woff2 files
```

## Data & persistence

On first load, `app.js` seeds `localStorage` with 15 areas, 20 doctors, 50
tests, 100 patients, 300 payments, 50 pending payments, and 30 expenses —
randomly generated but internally consistent (every patient references a
real doctor and area that exist in their respective lists, etc. — verified
programmatically). All CRUD operations read from and write back to
`localStorage`, so changes persist across reloads on that browser/device.
Clearing site data resets the demo.

**Known current limitation:** data lives per-browser, not in a shared
database — two different people opening the live link will each get their
own separate copy of the data. This is expected for the current stage and
is the next thing to fix before real day-to-day use (see below).

## Connecting a real backend next

Every module funnels its reads/writes through the `store` helper in
`app.js` (`VLAB.store.get/set`). To move to Supabase (or any real backend),
swap those calls for real database calls — the rest of each page
(rendering, filters, pagination, modals) needs no changes.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses CSS Grid,
`localStorage`, and ES6 — no polyfills included.
