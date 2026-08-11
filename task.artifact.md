# Tasks - UI Consistency & Build Stabilization 🎨🛡️

## Phase 1: Analytics & Logic Fixes
- [ ] Fix Analytics `chartData` timezone/date matching.
- [ ] Refine Analytics X-Axis labels (collision fix).
- [ ] Include `Paid`/`Dispatched` orders in revenue chart.

## Phase 2: Access & Navigation
- [ ] Update `AuthForm` Admin link to `/admin/login`.
- [ ] Verify Staff Login visibility.

## Phase 3: Theme Harmonization (Light Mode)
- [ ] Standardize Staff Hub cards.
- [ ] Lighten Broadcast Hub "Audience Intel" card.
- [ ] Sync Vault Hub icons and theme.

## Phase 4: Build Stability (Lint & Types)
- [ ] Resolve `profileRes` redeclaration in Customer Details.
- [ ] Fix missing `Input` in Rider Login.
- [ ] Fix `Rider` type mismatch in Dispatch.
- [ ] Clean up unused variables (`cn`, `loading`, etc.).

## Phase 5: Verification
- [ ] Run `npm run build`.
- [ ] Final UI sanity check.
