# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Homwok Coffee POS — a coffee-shop point-of-sale whose defining feature is **automatic FIFO-based COGS ("HPP") calculation** on every sale. It's a Turborepo + pnpm monorepo: a **Laravel** API (`apps/api`) and a **Next.js 14 App Router** web app (`apps/web`), sharing TypeScript packages.

**Read the two design docs first — they are the blueprint, not the current code:**
- `homwok-coffee-pos.md` — full system: FIFO/HPP algorithm, DB schema, Laravel services/controllers/routes, setup, known issues.
- `homwok-coffee-frontend.md` — the intended UI: neo-brutalist black/white design system, shadcn setup, POS components, page composition.

**The repo is currently an early scaffold.** Models, the migration, seeder, shared types/utils, and dependencies exist, but most business logic described in the docs is **not yet implemented** (see [Current state](#current-state--gotchas)). Treat the docs as the target to build toward; verify against actual files before assuming something exists.

## Commands

Run from the repo root unless noted. Package manager is **pnpm** (`packageManager: pnpm@9`).

```bash
pnpm install                 # install all workspaces
pnpm dev                     # turbo dev — runs web + api dev tasks in parallel
pnpm build                   # turbo build
pnpm lint                    # turbo lint
pnpm format                  # prettier over **/*.{ts,tsx,php,json,md}
pnpm db:migrate              # cd apps/api && php artisan migrate
pnpm db:seed                 # cd apps/api && php artisan db:seed
pnpm db:fresh                # php artisan migrate:fresh --seed
```

**Web** (`apps/web`, run there): `pnpm dev` · `pnpm build` · `pnpm lint` (next lint).

**API** (`apps/api`, run there):
```bash
composer dev                 # concurrently: artisan serve + queue + pail logs + vite
composer test                # config:clear then artisan test
php artisan test             # run the PHPUnit suite
php artisan test --filter=SomeTest   # single test / method
./vendor/bin/pint            # PHP formatter (Laravel Pint)
php artisan migrate --seed   # DB defaults to sqlite (apps/api/.env.example)
```

Seeded logins (password is `password` for both): `barista` (role barista), `manager` (role manager).

## Monorepo architecture

Workspaces are `apps/*` and `packages/*` (`pnpm-workspace.yaml`). Turbo (`turbo.json`) orchestrates `build`/`dev`/`lint`; `build` depends on `^build` so shared packages build before apps.

Shared packages (consumed as `workspace:*`, source-only — `main`/`types` point straight at `src/index.ts`, no build step):
- **`@homwok/types`** — all shared domain interfaces (`Menu`, `Penjualan`, `DetailPembelian`, `Pegawai`, …). These mirror the API's snake_case field names exactly.
- **`@homwok/lib`** — formatting helpers (`formatRupiah`, `formatDate`, `formatDateTime`).
- **`@homwok/ui`** — shared UI library. Currently exports only `cn()`; shadcn primitives + custom POS components (`MenuCard`, `CartItem`, `Receipt`, `POSButton`) are documented but not yet built.

`apps/web/next.config.js` sets `transpilePackages: ['@homwok/ui','@homwok/lib','@homwok/types']` — required since these ship raw TS. Web-internal imports use the `@/*` → `./src/*` alias.

**Layering rule (from the frontend doc):** `packages/ui` components must stay presentational and prop-driven — no API/route/business knowledge. Business-aware components (data fetching, hooks, routes) live in `apps/web/src/components`.

## Backend domain model (Laravel)

The entire schema lives in one migration: `apps/api/database/migrations/2024_01_01_000000_create_all_tables.php`. Nine domain tables in Indonesian:

- **Master:** `pegawai` (staff/users), `menu`, `bahan_baku` (raw materials), `resep` (recipe — links a menu to its materials + quantities).
- **Purchasing:** `pembelian` (purchase header) → `detail_pembelian` (**each row is a FIFO lot**: `qty_awal`, `sisa_qty`, `harga_beli`).
- **Sales:** `penjualan` (sale header, incl. `total_hpp` and `laba_kotor`) → `detail_penjualan` (per-menu line, incl. `hpp_menu`).
- **Audit:** `pemakaian_bahan` — logs which lot(s) each sale line consumed and at what cost (the HPP audit trail).

**FIFO/HPP is the core algorithm.** On a sale, for each menu's recipe, consume the oldest available lots (`sisa_qty > 0`, ordered by purchase date then id) until the required quantity is met; each draw's `qty × harga_beli` accumulates into that line's HPP. This must run inside a DB transaction with `lockForUpdate()` on lots to avoid race conditions between concurrent cashiers. Full worked example and reference `FifoCostCalculator` service are in `homwok-coffee-pos.md` §2, §5.3 — **this service does not exist in the code yet.**

### Eloquent conventions (important, non-obvious)

Every model overrides Laravel's defaults — follow this when adding models or relations:
- **Custom primary keys**, not `id`: `id_menu`, `id_pegawai`, `id_bahan`, etc. Always set `protected $primaryKey`.
- **Explicit table names**: `protected $table = 'menu'` (singular Indonesian names; no pluralization).
- **Relations pass explicit keys**, e.g. `hasMany(Resep::class, 'id_menu', 'id_menu')` — Laravel's key inference won't work with these PKs.
- **Auth:** `Pegawai` is the authenticatable (Sanctum `HasApiTokens`). Its password column is `kata_sandi`, exposed via `getAuthPassword()` and listed in `$hidden`. `peran` is the role (`barista` | `manager`).

## Frontend architecture (Next.js)

Target structure (`homwok-coffee-frontend.md` §4, §7): App Router with route groups `(auth)/login` and `(dashboard)/*` (kasir, master/{menu,bahan,pegawai}, pembelian, laporan/*). The dashboard layout is a **client-side auth guard** (`AuthProvider` + `redirect`), pairing with a Sanctum token in `localStorage` and an axios client (`lib/api.ts`) that attaches `Authorization: Bearer`. Server state = TanStack Query; cart = a `useCart` hook persisted to localStorage; session = React Context.

**Auth: pick ONE strategy.** The design uses `localStorage` token + client guard. Do **not** also add a `middleware.ts` that reads the token from cookies — middleware runs on the edge and can't see localStorage, which causes redirect loops. (See known-issues table in the POS doc.)

The neo-brutalist theme (pure black/white, `border-2 border-black`, hard shadows `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`, sharp `--radius: 0.25rem`, Inter + JetBrains Mono) is documented but not yet applied to the scaffold.

## Current state & gotchas

The scaffold diverges from the docs in ways that will bite if assumed working:

- **`turbo.json` uses the `pipeline` key**, but Turbo is `^2.0.0` where that key was renamed to **`tasks`** — `turbo dev`/`turbo build` will error until this is fixed (the POS doc flags this as issue #3).
- **API business layer is unbuilt:** no `routes/api.php`, no `Http/Controllers/Api/*`, no `Services/FifoCostCalculator`, no `RoleMiddleware`. `bootstrap/app.php` registers only web routing and no `role` middleware alias. Building the sale flow means adding all of these.
- **`apps/web` is still `create-next-app` default:** `layout.tsx` uses Geist fonts + "Create Next App" metadata, `page.tsx` is the starter page, Tailwind config is empty (no design tokens), and only a lone `src/components/ui/button.tsx` + a local `src/lib/utils.ts` exist. Two Next configs coexist — `next.config.js` (real: transpilePackages + env) and an empty `next.config.ts` stub.
- **`@homwok/ui` exports only `cn`** — the documented `styles.css`, `tailwind.config.ts`, and component files aren't there yet.
- **`tanggal_beli` is `date`** in the migration; the doc recommends `dateTime` so same-day lots order correctly for FIFO. Consider this when implementing lot ordering.
- **Tests are PHPUnit**, not Pest (composer has `phpunit/phpunit`, no `pestphp/pest`) — the Pest-style example in the doc is illustrative only.
- **Versions:** `composer.json` pins Laravel `^13.8` / PHP `^8.3` (docs say "Laravel 11"). Default DB is **sqlite**.
- `pnpm dev:docker` references a `docker-compose.yml` that does not exist; the `packages/eslint-config` and `packages/typescript-config` mentioned in the docs also don't exist.

## Next.js version note

`apps/web/AGENTS.md` (imported by `apps/web/CLAUDE.md`) warns that this Next.js may differ from training data — read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.
